import { NextResponse } from "next/server";
import { BoardAPI } from "../../boards/types/types";

let data: BoardAPI;
export async function POST(req: Request) {
  const body = await req.json();
  try {
    data = body;
    return NextResponse.json({ success: true, message: "Board Data Saved" });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error,
      message: "Saving Board Data Failed",
    });
  }
}

export async function GET() {
  return NextResponse.json({ mode: "Chat with Board", result: data });
}
