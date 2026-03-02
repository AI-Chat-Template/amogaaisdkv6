"use server";

import { auth } from "@/auth";
import { postgrest } from "@/lib/postgrest";

export async function createChat(payload: any) {
  const session = await auth();
  try {
    // check if chat already exists
    const { data: existingChat } = await postgrest
      .from("chat")
      .select("id")
      .eq("id", payload.id)
      .maybeSingle();

    if (existingChat) {
      // chat already exists, just return success
      return { data: existingChat, success: true, message: "Chat already exists" };
    }

    // otherwise, insert new chat
    const { data, error } = await postgrest.from("chat").insert({
      ...payload,
      business_number: session?.user?.business_number,
      created_user_id: session?.user?.user_catalog_id,
      business_name: session?.user?.business_name,
      created_user_name: session?.user?.user_name,
      user_email: session?.user?.user_email,
      for_business_number: session?.user?.for_business_number,
      for_business_name: session?.user?.for_business_name,
    });

    if (error) throw error;
    return { data, success: true };
  } catch (error) {
    console.error("❌ createChat error:", error);
    throw error;
  }
}

export async function createMessage(payload: any) {
  try {
    const { data, error } = await postgrest.from("message").insert(payload);
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("❌ createMessage error:", error);
    throw error;
  }
}

export async function fetchMessages(chatId: string) {
  try {
    const { data, error } = await postgrest
      .from("message")
      .select("*")
      .eq("chatId", chatId);
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("❌ fetchMessages error:", error);
    throw error;
  }
}

export async function getChatHistory() {
  const session = await auth();
  const userId = session?.user?.user_catalog_id;
  try {
    const { data, error } = await postgrest
      .from("chat")
      .select("*")
      .eq("user_id", userId)
      .eq("chat_group", "Chat with Analytic Agent");
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("❌ getChatHistory error:", error);
    return error;
  }
}

export async function getChatFavorites() {
  const session = await auth();
  const userId = session?.user?.user_catalog_id;
  try {
    const { data, error } = await postgrest
      .from("message")
      .select("*")
      .eq("user_id", userId)
      .eq("favorite", true);
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("❌ getChatFavorites error:", error);
    return error;
  }
}


export async function addFavorite(id: string,isFavorite: boolean) {
  try {
    const { data, error } = await postgrest
      .from("message")
      .update({favorite: isFavorite })
      .eq("id", id);
    if (error) throw error;
    return { data, success: true };
  } catch (error) {
    console.error("❌ addFavorite error:", error);
    throw error;
  }
}

export async function addFeedback(id: string, isLike: boolean | null) {
  try {
    const { data, error } = await postgrest
      .from("message")
      .update({ isLike })
      .eq("id", id);
    if (error) throw error;
    return { data, success: true };
  } catch (error) {
    console.error("❌ addFeedback error:", error);
    throw error;
  }
}
