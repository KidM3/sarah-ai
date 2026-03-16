import { getCalls } from "@/lib/supabase";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const calls = await getCalls();
  return NextResponse.json({ count: calls.length, calls });
}
