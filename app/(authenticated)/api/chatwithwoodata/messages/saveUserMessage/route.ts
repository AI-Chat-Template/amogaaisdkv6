import { NextResponse } from "next/server";
import { saveUserMessage } from "@/app/(authenticated)/chatwithwoodata/actions"; // adjust path if needed

export async function POST(req: Request) {
  try {
    const { chatId, content } = await req.json();

    if (!chatId || !content) {
      return NextResponse.json(
        { error: "chatId and content are required" },
        { status: 400 }
      );
    }

    const result = await saveUserMessage(chatId, content);

    return NextResponse.json({
      success: true,
      prompt_uuid: result.prompt_uuid,
      data: result.data,
    });
  } catch (error: any) {
    console.error("❌ saveUserMessage error:", error);

    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
