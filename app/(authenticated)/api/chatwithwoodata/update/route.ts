import { NextResponse } from "next/server";
import { updateChatTitle } from "@/app/(authenticated)/chatwithwoodata/actions";

export async function PUT(req: Request) {
  try {
    const { chatUuid, title, chat_share_url } = await req.json();
    if (!chatUuid)
      return NextResponse.json({ success: false, error: "Missing chatUuid" }, { status: 400 });

    const result = await updateChatTitle(chatUuid, title || "Untitled", chat_share_url);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error in /update route:", err);
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 });
  }
}
