import { NextResponse } from "next/server";
import { saveChatTitle } from "@/app/(authenticated)/chatwithwoodata/actions";

export async function POST(req: Request) {
  try {
    const { chatUuid, title, chat_share_url } = await req.json();
    if (!chatUuid)
      return NextResponse.json({ success: false, error: "Missing chatUuid" }, { status: 400 });

    const result = await saveChatTitle(chatUuid, title || "Untitled", chat_share_url);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error in /save route:", err);
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
