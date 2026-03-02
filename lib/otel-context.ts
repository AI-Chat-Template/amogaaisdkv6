import { cookies } from "next/headers";
import { auth } from "@/auth";

export async function getOtelContext(pathname?: string) {
  const cookieStore = await cookies();

  const session = await auth();
    //   console.log("log"+ session?.user?.user_catalog_id);  // FIXED

  return {
    
    user_id: session?.user?.user_catalog_id ?? null,
    roles_json: session?.user?.roles_json ?? null,      // FIXED
    page: pathname ?? ""
  };

}
