// app/api/apis/route.ts
import { NextResponse } from 'next/server';
import { getApis } from '@/app/(authenticated)/chatwithwoodata/actions';

export async function GET() {
  const data = await getApis();
  return NextResponse.json(data);
}
