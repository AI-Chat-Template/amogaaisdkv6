// app/api/files/extract-csv/route.ts
import { NextResponse } from "next/server";
import Papa from "papaparse";

export const runtime = "nodejs"; // Ensure this runs in full Node.js

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Failed to fetch CSV file.");
    }

    const text = await response.text();

    // Parse CSV content
    const parsed = Papa.parse(text, {
      header: true, // if CSV has header row
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      console.error("CSV Parse errors:", parsed.errors);
      return NextResponse.json(
        { error: "CSV parse errors", details: parsed.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(parsed.data); // Return as JSON
  } catch (error) {
    console.error("CSV extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract CSV content" },
      { status: 500 }
    );
  }
}
