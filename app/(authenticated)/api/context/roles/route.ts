import { NextResponse } from "next/server";
import { getRecords } from "@/app/(authenticated)/roles/_lib/queries";

/**
 * POST /api/context/roles
 * This API is used to provide Roles data for AI chat context.
 * It reuses the same `getRecords` function as the roles table.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // You can pass pagination and filters if available from frontend
    const result = await getRecords({
      ...body,
      page: body.page || 1,
      perPage: body.perPage || 50,
      sort: body.sort || [{ id: "created_date", desc: true }],
      flags: body.flags || ["advancedTable"],
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      pageCount: result.pageCount,
    });
  } catch (error) {
    console.error("❌ Error in /api/context/roles:", error);
    return NextResponse.json({
      success: false,
      error: String(error),
      data: [],
    });
  }
}
