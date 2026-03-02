import { NextResponse } from "next/server";
import { postgrest } from "@/lib/postgrest";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await postgrest
      .asAdmin()
      .from("user_catalog")
      .select("user_catalog_id")
      .eq("user_email", normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error("CHECK USER ERROR:", error);
      return NextResponse.json(
        { success: false, message: "Database error" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      exists: Boolean(data),
    });
  } catch (err) {
    console.error("CHECK USER ROUTE ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Invalid request" },
      { status: 500 }
    );
  }
}
