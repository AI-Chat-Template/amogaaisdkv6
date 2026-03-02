"use server";

import { auth } from "@/auth";
import { postgrest } from "@/lib/postgrest";
import { v4 as uuidv4 } from "uuid";

export async function getApiKey() {
  const session = await auth();
  try {
    const { data, error } = await postgrest
      .from("user_catalog" as any)
      .select("aiapi_connection_json")
      .eq("user_catalog_id", session?.user?.user_catalog_id);
    if (error) throw error;

    // Return only 'model' from each AI API entry within the JSON
    return data?.[0]?.aiapi_connection_json.map((item: any) => ({
      model: item.model,
    })) || [];
  } catch (error) {
    throw error;
  }
}


export async function getApis() {
  const session = await auth();
  try {
    const { data, error } = await postgrest
      .from("user_catalog" as any)
      .select("api_connection_json")
      .eq("user_catalog_id", session?.user?.user_catalog_id);
    if (error) throw error;

    // Return only 'site_url' from each API entry within the JSON
    return data?.[0]?.api_connection_json.map((item: any) => ({
      site_url: item.site_url,
    })) || [];
  } catch (error) {
    throw error;
  }
} 
export async function saveChatTitle(chatUuid: string, title: string,chat_share_url?: string) {
  const session = await auth();
  const userId = session?.user?.user_catalog_id;
  const userEmail = session?.user?.user_email;
  const businessname =session?.user?.business_name;
//   console.log("hellpo chat  : "+ chat_share_url)
  try {
    const { data, error } = await postgrest
      .from("chat" as any)
      .upsert([
        {
          id: chatUuid, // ✅ store frontend UUID here
          title,
          user_id: userId,
          user_email: userEmail,
          business_name:businessname,
          chat_group: "Chat With Shopify",
          status:"active",
          visibility:"yes",
          bookmark:"false",
          chat_share_url: chat_share_url ?? null, // ✅ store session user ID (string)
        },
      ])
      .select("*");

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("Error saving chat:", err);
    return { success: false, error: (err as Error).message };
  }
}

/* ---------------------- UPDATE CHAT TITLE ---------------------- */
export async function updateChatTitle(chatUuid: string, title: string, chat_share_url?: string) {
  const session = await auth();
  const userId = session?.user?.user_catalog_id;

  if (!userId) throw new Error("Unauthorized");

  const updateData: Record<string, any> = { title };
  if (chat_share_url) updateData.chat_share_url = chat_share_url;

  try {
    // 1️⃣ Update chat record
    const { data, error } = await postgrest
      .from("chat")
      .update(updateData)
      .eq("id", chatUuid)
      .eq("user_id", userId)
      .select("*");

    if (error) throw error;
    if (!data || !data.length) return { success: false, error: "Chat not found" };

    const newTitle = data[0].title;

    // 2️⃣ Update ALL child messages using ref_chat_uuid (correct column!)
    const { error: msgErr } = await postgrest
      .from("message")
      .update({ ref_chat_title: newTitle })
      .eq("ref_chat_uuid", chatUuid);    // 🔥 correct column

    if (msgErr) throw msgErr;

    return { success: true, data };
  } catch (err) {
    console.error("❌ updateChatTitle failed:", err);
    return { success: false, error: (err as Error).message };
  }
}



/* =======================================================
   SAVE MESSAGE TO message TABLE  (Chat With Page)
========================================================= */


export async function saveUserMessage(chatId: string, content: string) {
  const session = await auth();
  const userId = session?.user?.user_catalog_id;

  if (!userId) throw new Error("Unauthorized");

  const promptUuid = uuidv4();

  // 🔥 Get chat info directly (NO getChatTitle)
  const { data: chat } = await postgrest
    .from("chat")
    .select("title")
    .eq("id", chatId)
    .single();

  const chatTitle = chat?.title ?? null;

  const { data, error } = await postgrest
    .from("message")
    .insert([
      {
        chatId,
        ref_chat_uuid: chatId,
        ref_chat_title: chatTitle,     // ✔ Same title used in updateChatTitle
        user_id: userId,
        role: "user",
        content,
        prompt_uuid: promptUuid,
        ref_prompt_uuid: promptUuid,
        response_json: null,
        prompt_tiitle: content,
      },
    ])
    .select("*")
    .single();

  if (error) throw error;

  return { success: true, prompt_uuid: promptUuid, data };
}


/* =======================================================
   SAVE ASSISTANT MESSAGE
   - role: "assistant"
   - response_json saved fully
   - content = null (assistant text lives inside JSON)
======================================================= */
export async function saveAssistantMessage(
  chatId: string,
  promptUuid: string,
  responseJson: any
) {
  const session = await auth();
  const userId = session?.user?.user_catalog_id;

  if (!userId) throw new Error("Unauthorized");

  const { data, error } = await postgrest
    .from("message")
    .insert([
      {
        chatId,
        ref_chat_uuid: chatId,
        user_id: userId,
        role: "assistant",
        content: null,
        response_json: responseJson,
        message_group: responseJson,
        createdAt: new Date().toISOString(),

      },
    ])
    .select("*")
    .single();

  if (error) throw error;

  return { 
    success: true, 
    messageId: data.id,
    data 
  };
}


// function mapDbMessageToUI(msg: any) {
//   if (msg.role === "user") {
//     return {
//       role: "user",
//       content: msg.content || "",
//     };
//   }

//   if (msg.role === "assistant") {
//     const r = msg.response_json;
//     if (!r) return null;

//     const results: any[] = [];

//     // 1️⃣ Assistant chart
//     if (r.chart) {
//       results.push({
//         role: "assistant",
//         content: {
//           type: "chart",
//           data: r.chart.data,
//         },
//       });
//     }

//     // 2️⃣ Assistant table
//     if (r.table) {
//       results.push({
//         role: "assistant",
//         content: {
//           type: "table",
//           data: r.table.data,
//         },
//       });
//     }

//     // 3️⃣ Assistant story / explanation text
//     if (r.story && typeof r.story.content === "string") {
//       results.push({
//         role: "assistant",
//         content: r.story.content,
//       });
//     }

//     // If nothing matched
//     if (results.length === 0) return null;

//     return results; // IMPORTANT: return ARRAY because 1 assistant message can contain chart + table + story
//   }

//   return null;
// }
function mapDbMessageToUI(msg: any) {

  // USER MESSAGE
  if (msg.role === "user") {
    return {
      role: "user",
      content: msg.content ?? "",
    };
  }

  // ASSISTANT MESSAGE
  if (msg.role === "assistant") {

    const results: any[] = [];

    // 1️⃣ If plain text assistant message
    if (msg.content && typeof msg.content === "string") {
      results.push({
        role: "assistant",
        content: msg.content,
      });
    }

    const r = msg.response_json;

    if (r) {

      // CARD
      if (r.card?.data) {
        results.push({
          role: "assistant",
          content: { type: "card", data: r.card.data },
        });
      }

      // CHART
      if (r.chart?.data) {
        results.push({
          role: "assistant",
          content: { type: "chart", data: r.chart.data },
        });
      }

      // TABLE
      if (r.table?.data) {
        results.push({
          role: "assistant",
          content: { type: "table", data: r.table.data },
        });
      }

      // MAP
      if (r.map?.data) {
        results.push({
          role: "assistant",
          content: { type: "map", data: r.map.data },
        });
      }

      // STORY
      if (r.story?.content) {
        results.push({
          role: "assistant",
          content: r.story.content,
        });
      }
    }

    return results.length ? results : null;
  }

  return null;
}


export async function loadChat(chatId: string) {
  const session = await auth();
  const userId = session?.user?.user_catalog_id;
  if (!userId) throw new Error("Unauthorized");

  const { data: chat, error: chatError } = await postgrest
    .from("chat")
    .select("*")
    .eq("id", chatId)
    .eq("user_id", userId)
    .eq("chat_group", "Chat With Shopify")
    .single();

  if (chatError || !chat) throw new Error("Chat not found or unauthorized.");

  const { data: rows, error: messageError } = await postgrest
    .from("message")
    .select("*")
    .eq("chatId", chatId)
    .order("created_at", { ascending: true });

  if (messageError) throw new Error("Could not load messages");

  const messages: any[] = [];

  for (const row of rows) {
    const mapped = mapDbMessageToUI(row);

    if (!mapped) continue;

    // If mapper returns multiple messages
    if (Array.isArray(mapped)) {
      messages.push(...mapped);
    } else {
      messages.push(mapped);
    }
  }

  return { chat, messages };
}
/* =======================================================
   UPDATE MESSAGE FIELDS (ROLE-BASED)
   user  → favorite, flag
   assistant → isLike, favorite, flag
======================================================= */

// export async function updateMessageFields({
//   messageId,
//   isLike,
//   favorite,
//   flag,
// }: {
//   messageId: string;
//   isLike?: boolean | null;   // assistant only
//   favorite?: boolean;        // both
//   flag?: boolean;            // both
// }) {
//   const session = await auth();
//   const userId = session?.user?.user_catalog_id;

//   if (!userId) throw new Error("Unauthorized");

//   try {
//     /* -------------------------------
//        1️⃣ Fetch message with role + chatId
//     --------------------------------*/
//     const { data: msg, error: msgError } = await postgrest
//       .from("message")
//       .select("id, role, chatId")
//       .eq("id", messageId)
//       .single();

//     if (msgError || !msg) throw new Error("Message not found");

//     /* -------------------------------
//        2️⃣ Validate chat ownership
//     --------------------------------*/
//     const { data: chat, error: chatError } = await postgrest
//       .from("chat")
//       .select("user_id")
//       .eq("id", msg.chatId)
//       .single();

//     if (chatError || !chat) throw new Error("Chat not found");

//     if (chat.user_id !== userId) {
//       throw new Error("Unauthorized: You do not own this chat");
//     }

//     /* -------------------------------
//        3️⃣ ROLE-BASED PERMISSION LOGIC
//     --------------------------------*/
//     const updateData: Record<string, any> = {};

//     if (msg.role === "assistant") {
//       // Allowed: like, dislike, favorite, flag
//       if (typeof isLike !== "undefined") updateData.isLike = isLike;
//       if (typeof favorite !== "undefined") updateData.favorite = favorite;
//       if (typeof flag !== "undefined") updateData.flag = flag;
//     }

//     else if (msg.role === "user") {
//       // Allowed: favorite, flag only
//       if (typeof favorite !== "undefined") updateData.favorite = favorite;
//       if (typeof flag !== "undefined") updateData.flag = flag;

//       // ❌ Not allowed for user:
//       if (typeof isLike !== "undefined") {
//         throw new Error("User messages cannot be liked or disliked.");
//       }
//     }

//     if (Object.keys(updateData).length === 0) {
//       throw new Error("No valid fields provided for this message role.");
//     }

//     /* -------------------------------
//        4️⃣ Perform update
//     --------------------------------*/
//     const { data, error } = await postgrest
//       .from("message")
//       .update(updateData)
//       .eq("id", messageId)
//       .select("*")
//       .single();

//     if (error) throw error;

//     return { success: true, data };

//   } catch (err) {
//     console.error("updateMessageFields error:", err);
//     return { success: false, error: (err as Error).message };
//   }
// }


const CHAT_GROUP = "Chat With Shopify";

// -------------------------------------------------------
// ✅ 1. Get Chat History (only for chatwithpage)
// -------------------------------------------------------
export async function getChatHistory() {
  const session = await auth();
  const userId = session?.user?.user_catalog_id;

  if (!userId) return [];

  try {
    const { data, error } = await postgrest
      .from("chat")
      .select("*")
      .eq("user_id", userId)
      .eq("chat_group", CHAT_GROUP) 
      .order("createdAt", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((chat) => ({
      id: chat.id,
      title: chat.title,
      bookmark: chat.bookmark,
      status: chat.status,

      // Normalize timestamps
      createdAt: chat.createdAt,

      // Normalize tokens
      promptTokens: chat.prompt_tokens ?? 0,
      completionTokens: chat.completion_tokens ?? 0,
      totalTokens: chat.total_tokens ?? 0,
      cost: chat.token_cost ?? 0,
    }));
  } catch (error) {
    console.error("❌ getChatHistory error:", error);
    return [];
  }
}


// -------------------------------------------------------
// ✅ 2. Delete Chat (only delete if chat_group = chatwithpage)
// -------------------------------------------------------
export async function deleteChat(id: string) {
  try {
    const { error } = await postgrest
      .from("chat")
      .delete()
      .eq("id", id)
      .eq("chat_group", CHAT_GROUP);  // 🔥 ensure only this group is deleted

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("❌ Error deleting chat:", error);
    return { success: false };
  }
}

// -------------------------------------------------------
// ✅ 3. Toggle Bookmark (only for chatwithpage chats)
// -------------------------------------------------------
export async function toggleBookmark(id: string, bookmark: boolean) {
  try {
    const { error } = await postgrest
      .from("chat")
      .update({ bookmark })
      .eq("id", id)
      .eq("chat_group", CHAT_GROUP);  // 🔥 safe update

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("❌ toggleBookmark error:", error);
    return { success: false };
  }
}



export async function saveMessageTokenUsage({
  messageId,
  promptTokens,
  completionTokens,
  totalTokens,
  tokenCost,
}: {
  messageId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  tokenCost: number;
}) {
  try {
    const { error } = await postgrest
      .from("message")
      .update({
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
        token_cost: tokenCost,
      })
      .eq("id", messageId);

    if (error) throw error;
    return { success: true };

  } catch (err) {
    console.error("❌ Failed to save message token usage:", err);
    return { success: false };
  }
}




export async function updateChatTotals({
  chatId,
  promptTokens,
  completionTokens,
  totalTokens,
  cost,
}: {
  chatId: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}) {
  try {
    const { error } = await (postgrest as any).rpc(
      "increment_chat_totals",
      {
        chat_id_input: chatId,
        prompt_add: promptTokens,
        completion_add: completionTokens,
        total_add: totalTokens,
        cost_add: cost,
      }
    );

    if (error) throw error;

    return { success: true };
  } catch (err) {
    console.error("❌ Failed to update chat totals:", err);
    return { success: false };
  }
}

export async function getPromptHistory() {
  const session = await auth();
  const userId = session?.user?.user_catalog_id;

  if (!userId) return [];

  try {
    // STEP 1 — get all chat IDs + titles
    const { data: chats, error: chatError } = await postgrest
      .from("chat")
      .select("id, title")
      .eq("user_id", userId)
      .eq("chat_group", "Chat With Shopify");

    if (chatError) throw chatError;

    const chatIds = (chats ?? []).map((c) => c.id);
    if (chatIds.length === 0) return [];

    // Build map for fallback chat titles
    const chatTitleMap: Record<string, string> = {};
    for (const c of chats ?? []) {
      chatTitleMap[c.id] = c.title ?? "Untitled Chat";
    }

    // STEP 2 — SELECT user messages including chatId (NEEDED)
    const { data: messages, error } = await postgrest
      .from("message")
      .select(`
        chatId,
        prompt_uuid,
        prompt_tiitle,
        ref_chat_title,
        created_at,
        favorite,
        important,
        action_item,
        archive_status,
        prompt_tokens,
        completion_tokens,
        total_tokens,
        token_cost
      `)
      .eq("user_id", userId)
      .eq("role", "user")   // ← YOU ASKED FOR THIS (KEPT EXACTLY)
      .in("chatId", chatIds)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // STEP 3 — Unique by prompt UUID
    const unique = new Map();

    for (const item of messages ?? []) {
      if (!item.prompt_uuid) continue;

      if (!unique.has(item.prompt_uuid)) {
        const fallbackTitle =
          item.ref_chat_title || chatTitleMap[item.chatId] || "Untitled Chat";

        unique.set(item.prompt_uuid, {
          promptUuid: item.prompt_uuid,
          title: item.prompt_tiitle,
          chatTitle: fallbackTitle,
          createdAt: item.created_at,

          favorite: item.favorite,
          important: item.important,
          action_item: item.action_item,
          archive_status: item.archive_status,

          promptTokens: item.prompt_tokens ?? 0,
          completionTokens: item.completion_tokens ?? 0,
          totalTokens: item.total_tokens ?? 0,
          cost: item.token_cost ?? 0,
        });
      }
    }

    return Array.from(unique.values());
  } catch (err) {
    console.error("❌ getPromptHistory error:", err);
    return [];
  }
}



export async function deletePrompt(promptUuid: string) {
  try {
    const { error } = await postgrest
      .from("message")
      .delete()
      .eq("prompt_uuid", promptUuid);

    if (error) throw error;

    return { success: true };
  } catch (err) {
    console.error("❌ deletePrompt error:", err);
    return { success: false };
  }
}



export async function updateMessageFields({
  messageId,
  favorite,
  action_item,   // flag
  isLike,        // like / dislike (assistant only)
}: {
  messageId: string;
  favorite?: boolean;
  action_item?: boolean;
  isLike?: boolean | null;
}) {
  const session = await auth();
  const userId = session?.user?.user_catalog_id;

  if (!userId) throw new Error("Unauthorized");

  try {
    // 1️⃣ Fetch message to get role + chatId
    const { data: msg, error: msgError } = await postgrest
      .from("message")
      .select("id, role, content, favorite, action_item, isLike, chatId")
      .eq("id", messageId)
      .single();

    if (msgError || !msg) throw new Error("Message not found");

    // 2️⃣ Ensure user owns the chat
    const { data: chat, error: chatError } = await postgrest
      .from("chat")
      .select("user_id")
      .eq("id", msg.chatId)
      .single();

    if (chatError || !chat) throw new Error("Chat not found");
    if (chat.user_id !== userId) throw new Error("Access denied");

    // 3️⃣ Role-based update rules
    const updateData: Record<string, any> = {};

    if (msg.role === "assistant") {
      // assistant can use all 3
      if (typeof isLike !== "undefined") updateData.isLike = isLike;
      if (typeof favorite !== "undefined") updateData.favorite = favorite;
      if (typeof action_item !== "undefined") updateData.action_item = action_item;
    }

    if (msg.role === "user") {
      // user CANNOT be liked/disliked
      if (typeof isLike !== "undefined") {
        throw new Error("User messages cannot be liked or disliked.");
      }
      if (typeof favorite !== "undefined") updateData.favorite = favorite;
      if (typeof action_item !== "undefined") updateData.action_item = action_item;
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("No valid fields provided.");
    }

    // 4️⃣ Update DB
    const { data, error } = await postgrest
      .from("message")
      .update(updateData)
      .eq("id", messageId)
      .select("*")
      .single();

    if (error) throw error;

    return { success: true, data };

  } catch (err) {
    console.error("updateMessageFields error:", err);
    return { success: false, error: (err as Error).message };
  }
}
