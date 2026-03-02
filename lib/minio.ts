"use server";
import { auth } from "@/auth";
import * as Minio from "minio";

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_S3_URL ?? "",
  port: process.env.MINIO_S3_PORT
    ? Number(process.env.MINIO_S3_PORT)
    : undefined,
  useSSL: true,
  accessKey: process.env.MINIO_S3_ACCESS_KEY ?? "",
  secretKey: process.env.MINIO_S3_SECRET_KEY ?? "",
});

interface UploadParams {
  file: File;
  fileName: string;
  folderName?: string;
}

interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export const UploadAttachment = async ({
  file,
  fileName,
  folderName = "",
}: UploadParams): Promise<UploadResponse> => {
  const session = await auth();
  const saveDir =
    session?.user?.business_number ||
    session?.user?.for_business_number ||
    "no_bn";

  const bucket = process.env.MINIO_S3_BUCKET;
  if (!bucket) {
    return { success: false, error: "Bucket name is not configured." };
  }

  try {
    if (!file || !fileName) {
      return { success: false, error: "Invalid file or missing filename." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = `${saveDir}/${
      folderName ? `${folderName}/` : ""
    }${Date.now()}-${fileName}`;

    await minioClient.putObject(bucket, filePath, buffer);

    return {
      success: true,
      url: `https://${process.env.MINIO_S3_URL}/${bucket}/${filePath}`,
    };
  } catch (e) {
    console.error("Error uploading to MinIO:", e);
    return { success: false, error: "Attachment upload failed." };
  }
};
