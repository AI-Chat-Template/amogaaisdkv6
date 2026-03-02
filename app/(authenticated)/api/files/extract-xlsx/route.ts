import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch XLSX file.");
    }

    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    // Read the workbook
    const workbook = XLSX.read(data, { type: "array" });

    // Get the first sheet name
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON
    const sheetData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    return NextResponse.json(sheetData);
  } catch (error) {
    console.error("XLSX extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract XLSX content" },
      { status: 500 }
    );
  }
}
