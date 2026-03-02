import { PostgrestClient } from "@supabase/postgrest-js";
import { Database } from "@/types/database";
import { auth } from "@/auth";
// @ts-expect-error Could not find a declaration file for module '@supabase/node-fetch'
import { Headers as NodeFetchHeaders } from "@supabase/node-fetch";

type Fetch = typeof fetch;

const REST_URL = process.env.POSTGREST_URL as string;
const AUTH_KEY = process.env.POSTGRES_AUTH_KEY as string;

export interface DatabaseConfig {
  [key: string]: {
    url: string;
    key: string;
  };
}

// Add your database configurations
const DB_CONFIGS: DatabaseConfig = {
  default: {
    url: REST_URL,
    key: AUTH_KEY,
  },
  chat_db: {
    url: process.env.CHAT_POSTGREST_URL as string,
    key: process.env.CHAT_POSTGRES_AUTH_KEY as string,
  },
};

const resolveHeadersConstructor = () => {
  if (typeof Headers === "undefined") {
    return NodeFetchHeaders;
  }
  return Headers;
};

export const customFetch = (
  getSession: () => Promise<{
    id: number | null;
    user_name: string | null;
    business_number: string | null;
    for_business_number: string | null;
  }>
): Fetch => {
  const HeadersConstructor = resolveHeadersConstructor();

  return async (input, init) => {
    const headers = new HeadersConstructor(init?.headers);
    const session = (await getSession()) ?? "";
    
    if (!headers.has("business_number")) {
      headers.set("user_role", "regular");
      headers.set("business_number", session?.business_number);
      headers.set("user_id", session?.id);
    }

    let body =
      typeof init?.body === "string" ? JSON.parse(init?.body) : undefined;

    if (
      body &&
      init?.method === "POST" &&
      headers.get("user_role") === "regular" &&
      !String(input).includes("rpc")
    ) {
      body = Array.isArray(body)
        ? body.map((item) => ({
            ...item,
            created_user_id: item.created_user_id ?? session.id,
            created_user_name: item.user_name ?? session.user_name,
            business_number: item.business_number ?? session.business_number,
            for_business_number:
              item.for_business_number ?? session.for_business_number,
          }))
        : {
            ...body,
            created_user_id: body.created_user_id ?? session.id,
            created_user_name: body.user_name ?? session.user_name,
            business_number: body.business_number ?? session.business_number,
            for_business_number:
              body.for_business_number ?? session.for_business_number,
          };

      const bodyKeys = Array.isArray(body)
        ? [...new Set(body.flatMap((item) => Object.keys(item)))]
        : Object.keys(body);

      if (bodyKeys.length) {
        const url = new URL(input.toString());
        url.searchParams.set(
          "columns",
          bodyKeys.map((col) => `"${col}"`).join(",")
        );
        input = url.toString();
      }
    }

    return fetch(input, { ...init, body: JSON.stringify(body), headers });
  };
};

export class postgrest {
  private client: PostgrestClient<Database, "public">;

  // Private constructor for controlled instantiation.
  private constructor(
    headers: Record<string, string> = {},
    dbName: keyof DatabaseConfig = "default"
  ) {
    const config = DB_CONFIGS[dbName] || DB_CONFIGS.default;

    this.client = new PostgrestClient<Database, "public">(config.url, {
      headers: {
        Authorization: `Bearer ${config.key}`,
        apikey: `${config.key}`,
        ...headers,
      },
      fetch: customFetch(this._getSession.bind(this)),
    });
  }

  /**
   * Default client.
   */
  static from<T extends keyof Database["public"]["Tables"]>(
    table: T,
    dbName: keyof DatabaseConfig = "default"
  ) {
    return new postgrest({}, dbName).client.from(table);
  }

  /**
   * Default RPC client.
   */
  static rpc<T extends keyof Database["public"]["Functions"]>(
    fn: T,
    args?: Database["public"]["Functions"][T]["Args"],
    dbName: keyof DatabaseConfig = "default"
  ) {
    return new postgrest({}, dbName).client.rpc(fn, args);
  }

  /**
   * Returns a client instance configured with admin privileges.
   */
  static asAdmin(dbName: keyof DatabaseConfig = "default"): postgrest {
    return new postgrest(
      {
        user_role: "admin",
        business_number: "",
      },
      dbName
    );
  }

  /**
   * Returns a client instance configured for a specific business number.
   */
  static asBusiness(
    business_number: string,
    dbName: keyof DatabaseConfig = "default"
  ): postgrest {
    return new postgrest(
      {
        user_role: "regular",
        business_number,
      },
      dbName
    );
  }

  /**
   * Instance method that proxies to the underlying client's from() method.
   */
  from<T extends keyof Database["public"]["Tables"]>(table: T) {
    return this.client.from(table);
  }

  /**
   * Instance method that proxies to the underlying client's rpc() method.
   */
  rpc<T extends keyof Database["public"]["Functions"]>(
    fn: T,
    args?: Database["public"]["Functions"][T]["Args"]
  ) {
    return this.client.rpc(fn, args);
  }

  private async _getSession() {
    const session = await auth();
    return {
      id: session?.user?.user_catalog_id ?? null,
      user_name: session?.user?.user_name ?? null,
      business_number: session?.user?.business_number ?? null,
      for_business_number: session?.user?.for_business_number ?? null,
    };
  }
}