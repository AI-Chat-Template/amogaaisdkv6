import { NextResponse } from "next/server";

let data: {
  chartData: unknown[];
  leaderboardsData?: unknown[];
  rapportData?: unknown[];
  apiKeys?: unknown[];
};
export async function POST(req: Request) {
  const body = await req.json();
  const { chartData, leaderboardsData, rapportData, apiKeys } = body ?? [];

  try {
    data = { chartData };
    if (leaderboardsData !== undefined) {
      data.leaderboardsData = leaderboardsData;
    }
    if (rapportData !== undefined) {
      data.rapportData = rapportData;
    }
    if (apiKeys !== undefined) {
      data.apiKeys = apiKeys;
    }
    return NextResponse.json({ success: true, message: "Board Data Saved" });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error,
      message: "Saving Board Data Failed",
    });
  }
}

export async function GET() {
  return NextResponse.json({ data });
}
