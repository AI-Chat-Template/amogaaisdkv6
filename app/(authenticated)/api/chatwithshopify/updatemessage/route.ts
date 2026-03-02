import { NextResponse } from "next/server";
import { updateMessageFields } from "@/app/(authenticated)/chatwithwoodata/actions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messageId, favorite, action_item, isLike } = body;

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: "messageId is required" },
        { status: 400 }
      );
    }

    const result = await updateMessageFields({
      messageId,
      favorite,
      action_item,
      isLike,
    });

    return NextResponse.json(result);

  } catch (err: any) {
    console.error("❌ update-message route error:", err);
    return NextResponse.json(
      { success: false, error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
