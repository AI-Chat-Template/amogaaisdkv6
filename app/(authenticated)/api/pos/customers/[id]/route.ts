import { NextResponse } from "next/server";
import { getCustomerById } from "@/app/(authenticated)/pointOfSale/actions";

type RouteParams = {
  params: { id: string };
};

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const customerId = Number(params.id);
    if (isNaN(customerId)) {
      return NextResponse.json(
        { success: false, error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    const result = await getCustomerById(customerId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error fetching customer" },
      { status: 500 }
    );
  }
}
