import { NextRequest, NextResponse } from "next/server";
import { postgrest } from "@/lib/postgrest";
import { auth } from "@/auth";
import { createRecord } from "@/app/(authenticated)/dataupload/_lib/actions";
import { Tables } from "@/types/database";
import { DataUploadStatus } from "@/app/(authenticated)/dataupload/type";
import Papa from "papaparse";
import { ungzip } from "pako";
import { v4 as uuidv4 } from "uuid";

const CHUNK_SIZE = 1000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 200;
const MAX_CONCURRENT_CHUNKS = 8;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function retryOperation<T>(
  operation: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    if (retries <= 0) throw error;
    await wait(delay);
    return retryOperation(operation, retries - 1, delay);
  }
}

function parseCSV(csvData: string): Record<string, unknown>[] {
  const { data } = Papa.parse<Record<string, unknown>>(csvData, {
    header: true,
    skipEmptyLines: true,
  });
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const datauploadUuid = uuidv4();

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type");
    if (!contentType?.includes("multipart/form-data")) {
      return NextResponse.json(
        { success: false, error: "Invalid content type" },
        { status: 400 }
      );
    }

    const boundary = contentType.split("boundary=")[1];
    if (!boundary) {
      return NextResponse.json(
        { success: false, error: "Missing boundary in content type" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const templateId = Number(formData.get("templateId"));
    const dataUploadGroup = formData.get("dataUploadGroup") as string;
    const fileName = formData.get("fileName") as string;

    if (!file || !templateId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields or file" },
        { status: 400 }
      );
    }

    if (!dataUploadGroup) {
      return NextResponse.json(
        { success: false, error: "Missing data upload group" },
        { status: 400 }
      );
    }

    let decompressedData: string;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      decompressedData = ungzip(uint8Array, { to: "string" });
    } catch (error) {
      console.error("Decompression error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to decompress CSV data" },
        { status: 400 }
      );
    }

    if (!decompressedData || !decompressedData.trim()) {
      return NextResponse.json(
        { success: false, error: "Decompressed data is empty or invalid" },
        { status: 400 }
      );
    }

    const data = parseCSV(decompressedData);
    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: "Parsed CSV data is empty or invalid" },
        { status: 400 }
      );
    }

    const templateData = await getTemplateData(templateId);
    if (!templateData) {
      return NextResponse.json({ success: false, error: "Template not found" });
    }

    if (!templateData.data_table_name) {
      return NextResponse.json({
        success: false,
        error: "No table name specified in the template to save data",
      });
    }

    const fieldMappings = templateData.template_file_fields_json || {};
    const errors: Array<{
      row: number;
      error: string;
      data: Record<string, unknown>;
    }> = [];
    let processedCount = 0;

    // Optimize data transformation with pre-allocation
    const transformedData = new Array(data.length);
    for (let i = 0; i < data.length; i++) {
      try {
        transformedData[i] = transformRow(
          data[i],
          fieldMappings as Record<string, { field_name: string }>,
          String(session.user.user_catalog_id)
        );
      } catch {
        errors.push({
          row: i + 1,
          error: "Field mapping error",
          data: data[i],
        });
        transformedData[i] = null;
      }
    }

    // Process chunks in parallel with controlled concurrency
    for (
      let i = 0;
      i < transformedData.length;
      i += CHUNK_SIZE * MAX_CONCURRENT_CHUNKS
    ) {
      const chunkPromises = [];

      for (let j = 0; j < MAX_CONCURRENT_CHUNKS; j++) {
        const startIdx = i + j * CHUNK_SIZE;
        const chunk = transformedData
          .slice(startIdx, startIdx + CHUNK_SIZE)
          .filter(Boolean);

        if (chunk.length > 0) {
          chunkPromises.push(
            processChunk(
              chunk,
              startIdx,
              data.slice(startIdx, startIdx + CHUNK_SIZE),
              errors,
              templateData.data_table_name,
              datauploadUuid
            )
          );
        }
      }

      const results = await Promise.all(chunkPromises);
      processedCount += results.reduce((sum, count) => sum + (count || 0), 0);
    }

    let uploadRecordID = null;
    // Create data upload record only if needed
    if (processedCount > 0) {
      uploadRecordID = await createUploadRecord(
        templateData,
        formData.get("status") as string,
        decompressedData,
        datauploadUuid,
        dataUploadGroup,
        fileName
      );
    }

    return NextResponse.json({
      success: errors.length === 0,
      totalProcessed: processedCount,
      totalRows: data.length,
      errors,
      data: {
        upload_record_id: uploadRecordID,
        data_upload_uuid: datauploadUuid,
      },
    });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
        totalProcessed: 0,
        totalRows: 0,
        errors: [],
      },
      { status: 500 }
    );
  }
}

async function getTemplateData(templateId: number) {
  const { data, error: _error } = await postgrest
    .from("data_upload_setup")
    .select("*")
    .eq("data_upload_setup_id", templateId)
    .single();
  return _error ? null : data;
}

function transformRow(
  row: Record<string, unknown>,
  fieldMappings: Record<string, { field_name: string }>,
  userCatalogId: string
): Record<string, unknown> {
  const mappedRow: Record<string, unknown> = {
    created_user_id: userCatalogId,
  };

  Object.entries(fieldMappings).forEach(([targetField, sourceConfig]) => {
    mappedRow[sourceConfig.field_name] = row[targetField];
  });

  return mappedRow;
}

async function processChunk(
  chunk: Array<Record<string, unknown>>,
  startIndex: number,
  originalData: Array<Record<string, unknown>>,
  errors: Array<{ row: number; error: string; data: Record<string, unknown> }>,
  tableName: string,
  datauploadUuid: string
): Promise<number> {
  try {
    const dataWithUuid = chunk.map((row) => {
      // Remove fields with value ""
      const cleanedRow = Object.fromEntries(
      Object.entries(row).filter(([, value]) => value !== "")
      );
      return {
      ...cleanedRow,
      data_upload_uuid: datauploadUuid,
      };
    });
    

    const { error } = await retryOperation<{ error?: unknown }>(() =>
      // @ts-expect-error - We are using a custom table name
      postgrest.asAdmin().from(tableName).insert(dataWithUuid)
    );
    if (error) {
      if (error?.message) throw error?.message;
      throw error;
    }

    return chunk.length;
  } catch (error: unknown) {
    console.log("error failed data upload insert !!!!", error);
    errors.push(
      ...originalData.map((row, idx) => ({
        row: startIndex + idx + 1,
        error:
          typeof error === "string"
            ? error
            : `Failed after ${MAX_RETRIES} retries: ${
                error instanceof Error ? error.message : "Insert failed"
              }`,
        data: row,
      }))
    );
    return 0;
  }
}

async function createUploadRecord(
  templateData: Tables<"data_upload_setup">,
  status: string,
  csvData: string,
  datauploadUuid: string,
  dataUploadGroup: string,
  fileName: string
) {
  try {
    const csvFile = new File([csvData], "data-uploaded.csv", {
      type: "text/csv",
    });

    const { data, error } = await createRecord({
      template_name: templateData.template_name ?? undefined,
      template_id: templateData.data_upload_setup_id ?? null,
      data_table_name: templateData.data_table_name ?? undefined,
      status: (status as DataUploadStatus) ?? "active",
      file: csvFile,
      data_upload_uuid: datauploadUuid,
      data_upload_group: dataUploadGroup,
      file_name: fileName,
    });

    if (error || !data || !data.data_upload_id) {
      console.error("Error creating data_upload record:", error);
      throw error;
    }
    return data?.data_upload_id;
  } catch (error: unknown) {
    console.error("Error creating data_upload record:", error);
  }
}
