import { NextResponse } from "next/server";
import { postgrest } from "@/lib/postgrest";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: pages_list, error } = await postgrest
      .from("page_list")
      .select("pagelist_id, page_name, page_link, role_json");

    if (error) throw error;

    const filteredPages = pages_list.filter((page) =>
      page?.role_json?.some((role: string) =>
        session.user.roles_json?.includes(role)
      )
    );

    return NextResponse.json(filteredPages);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
