import { createClient } from "@supabase/supabase-js";

export const logsDB = createClient(
  `${process.env.LOGS_SUPABASE_URL}`,
  process.env.LOGS_SUPABASE_SERVICE_ROLE_KEY!,
  { db: { schema: "public" } }
);
