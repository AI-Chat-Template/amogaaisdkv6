import { Session } from "@shopify/shopify-api";
import { postgrest } from "./postgrest";
import { SessionStorage } from "@shopify/shopify-app-session-storage";

export class PostgrestSessionStorage implements SessionStorage {
  async storeSession(session: Session) {
    console.log("triggred store session", session);
    const {
      shop,
      id: session_id,
      shop_data,
      business_number,
      installed_user,
      installed_user_id,
      ...data
    } = session;

    const upsertData = {
      shop,
      session_id,
      data,
    };
    if (shop_data !== undefined && shop_data !== null)
      upsertData.shop_data = shop_data;
    if (business_number !== undefined && business_number !== null)
      upsertData.business_number = business_number;
    if (installed_user !== undefined && installed_user !== null)
      upsertData.installed_user = installed_user;
    if (installed_user_id !== undefined && installed_user_id !== null)
      upsertData.installed_user_id = installed_user_id;

    const result = await postgrest
      .asAdmin()
      .from("shopify_sessions")
      .upsert(upsertData, { onConflict: "session_id" })
      .select();

    // const result = await postgrest
    //   .asAdmin()
    //   .from("shopify_sessions")
    //   .upsert(
    //     {
    //       shop,
    //       session_id,
    //       data,
    //       ...(shop_data ? shop_data : {}),
    //       ...(business_number ? business_number : {}),
    //       ...(installed_user ? installed_user : {}),
    //       ...(installed_user_id ? installed_user_id : {}),
    //     },
    //     { onConflict: "session_id" }
    //   )
    //   .select();

    if (result?.error)
      console.log("shopify storeSession error", session, result);
    return result.error ? false : true;
  }

  async loadSession(id: string) {
    console.log("triggred load session", id);
    const { data, error } = await postgrest
      .asAdmin()
      .from("shopify_sessions")
      .select("*")
      .eq("session_id", id)
      .single();

    if (error) console.log("shopify loadSession error ", id, error);
    return error
      ? undefined
      : ({ ...data.data, id: data.session_id, shop: data.shop } as Session);
  }

  async deleteSession(id: string) {
    const { error } = await postgrest
      .asAdmin()
      .from("shopify_sessions")
      .delete()
      .eq("session_id", id);
    return !error;
  }

  async deleteSessions(ids: string[]): Promise<boolean> {
    const { error } = await postgrest
      .asAdmin()
      .from("shopify_sessions")
      .delete()
      .in("session_id", ids);
    return !error;
  }

  async findSessionsByShop(shop: string) {
    const { data, error } = await postgrest
      .asAdmin()
      .from("shopify_sessions")
      .select("*")
      .eq("shop", shop);

    if (error || !data) return undefined;
    return data.map((row) => ({
      ...row.data,
      id: row.session_id,
      shop: row.shop,
      installed_user_id: row.installed_user_id,
      installed_user: row.installed_user,
    }));
  }

  async updateShopifySessionBusinessNumber(
    shop: string,
    business_number: string
  ) {
    if (!shop || !business_number) return false;
    const { error } = await postgrest
      .asAdmin()
      .from("shopify_sessions")
      .update({ business_number })
      .eq("shop", shop);
    return !error;
  }

  async getShopifySessionByBusinessNumber(
    business_number: string
  ): Promise<Session | undefined> {
    if (!business_number) return undefined;
    const { data, error } = await postgrest
      .asAdmin()
      .from("shopify_sessions")
      .select("*")
      .eq("business_number", business_number)
      .single();
    if (error || !data) return undefined;
    return {
      ...data.data,
      id: data.session_id,
      shop: data.shop,
    } as Session;
  }
}