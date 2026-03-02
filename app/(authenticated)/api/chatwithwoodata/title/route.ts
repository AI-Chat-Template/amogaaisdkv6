import { NextResponse } from "next/server";
import { saveChatTitle, updateChatTitle } from "@/app/(authenticated)/chatwithwoodata/actions";
import { auth } from "@/auth";
import { postgrest } from "@/lib/postgrest";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const chatUuid = searchParams.get("chatId"); // frontend still calls it chatId

  if (!chatUuid) return NextResponse.json({ error: "Missing chatId" }, { status: 400 });

  const session = await auth();
  const userId = session?.user?.user_catalog_id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data, error } = await postgrest
      .from("chat" as any)
      .select("title")
      .eq("id", chatUuid) // ✅ use uuid field
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;

    if (data?.title) {
      return NextResponse.json({ success: true, title: data.title });
    } else {
      const defaultTitle = "Analytic Assistant";
      await saveChatTitle(chatUuid, defaultTitle);
      return NextResponse.json({ success: true, title: defaultTitle, created: true });
    }
  } catch (err) {
    console.error("Error fetching chat title:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch or create chat title" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { chatId, title, chat_share_url } = await req.json();

    if (!chatId)
      return NextResponse.json({ error: "Missing chatId" }, { status: 400 });

    // ✅ Try updating first
    let result = await updateChatTitle(chatId, title || "Untitled", chat_share_url);

    // ✅ If not found, create a new one
    if (!result.success) {
      result = await saveChatTitle(chatId, title || "Untitled", chat_share_url);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating chat title:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update or save chat title" },
      { status: 500 }
    );
  }
}