import { NextResponse } from "next/server";
import { loadChat } from "@/app/(authenticated)/ChatwithRestAPI/actions";

// ----------------------------------------------------
// GET — Load chat history
// ----------------------------------------------------
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const chatUuid = searchParams.get("chatUuid");

  if (!chatUuid) {
    return NextResponse.json(
      { success: false, error: "chatUuid is required" },
      { status: 400 }
    );
  }

  try {
    const result = await loadChat(chatUuid);
console.log("result: ", result.messages.map((m: any) => ({
    content: m.content.data,
  })))

    return NextResponse.json(
      {
        success: true,
        chat: result.chat ?? null,
        messages: result.messages ?? [],
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.warn("⚠️ No existing chat found. Returning empty chat.");

    // ⭐ NEW CHAT CASE: return empty history instead of error
    return NextResponse.json(
      {
        success: true,
        chat: null,
        messages: [],
      },
      { status: 200 }
    );
  }
}

// ----------------------------------------------------
// POST — fallback support
// ----------------------------------------------------
export async function POST(req: Request) {
  const { chatId } = await req.json();

  if (!chatId) {
    return NextResponse.json(
      { error: "chatId is required" },
      { status: 400 }
    );
  }

  try {
    const result = await loadChat(chatId);

    return NextResponse.json({
      success: true,
      chat: result.chat ?? null,
      messages: result.messages ?? [],
    });
  } catch (err: any) {
    console.warn("⚠️ No existing chat found. Returning empty chat.");

    return NextResponse.json(
      {
        success: true,
        chat: null,
        messages: [],
      },
      { status: 200 }
    );
  }
}
