import { NextRequest, NextResponse } from "next/server";
import { sendSms } from "@/lib/twilio";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { to, message } = await request.json();

    if (!to || !message) {
      return NextResponse.json({ error: "Missing 'to' or 'message'" }, { status: 400 });
    }

    await sendSms(to, message);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[send-sms] Failed to send SMS:", err);
    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
  }
}
