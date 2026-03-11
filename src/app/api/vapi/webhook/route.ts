import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import type {
  VapiWebhookPayload,
  VapiCallStartedMessage,
  VapiCallEndedMessage,
  VapiEndOfCallReportMessage,
  VapiTranscriptEvent,
} from "@/types/vapi";
import { sendSms } from "@/lib/twilio";
import { extractCallInfo, formatSmsBody } from "@/lib/extractCallInfo";
import { saveCall } from "@/lib/supabase";

// ─── Signature verification ───────────────────────────────────────────────────

async function verifyVapiSignature(
  rawBody: string,
  request: NextRequest
): Promise<boolean> {
  const secret = process.env.VAPI_WEBHOOK_SECRET;

  if (!secret) {
    console.warn(
      "[vapi/webhook] VAPI_WEBHOOK_SECRET is not set — skipping signature verification"
    );
    return true;
  }

  const signatureHeader = request.headers.get("x-vapi-signature");
  if (!signatureHeader) {
    console.error("[vapi/webhook] Missing x-vapi-signature header");
    return false;
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const expected = Buffer.from(expectedSignature, "utf8");
  const received = Buffer.from(signatureHeader, "utf8");

  if (expected.length !== received.length) {
    return false;
  }

  return timingSafeEqual(expected, received);
}

// ─── Event handlers ───────────────────────────────────────────────────────────

function handleCallStarted(message: VapiCallStartedMessage): void {
  const { call } = message;
  console.log("[vapi/webhook] call-started", {
    callId: call.id,
    type: call.type,
    assistantId: call.assistantId,
    startedAt: call.startedAt ?? message.timestamp,
  });
}

async function handleCallEnded(message: VapiCallEndedMessage | VapiEndOfCallReportMessage): Promise<void> {
  const { call } = message;

  const durationSeconds =
    call.startedAt && call.endedAt
      ? (
          (new Date(call.endedAt).getTime() -
            new Date(call.startedAt).getTime()) /
          1000
        ).toFixed(1)
      : undefined;

  console.log("[vapi/webhook] call-ended", {
    callId: call.id,
    type: call.type,
    endedReason: call.endedReason,
    durationSeconds,
    cost: call.cost,
    transcriptLength: call.transcript?.length ?? 0,
  });

  const ownerPhone = process.env.SHOP_OWNER_PHONE;
  if (!ownerPhone) {
    console.warn("[vapi/webhook] SHOP_OWNER_PHONE not set — skipping SMS");
    return;
  }

  let transcript = call.transcript ?? "";
  let messages = call.messages;

  if (!transcript) {
    console.log("[vapi/webhook] Transcript missing in webhook payload — fetching from Vapi API:", call.id);
    try {
      const vapiKey = process.env.VAPI_API_KEY;
      if (!vapiKey) throw new Error("VAPI_API_KEY is not set");

      const res = await fetch(`https://api.vapi.ai/call/${call.id}`, {
        headers: { Authorization: `Bearer ${vapiKey}` },
      });

      if (!res.ok) throw new Error(`Vapi API returned ${res.status}`);

      const fullCall = await res.json() as { transcript?: string; messages?: typeof messages };
      transcript = fullCall.transcript ?? "";
      messages = fullCall.messages ?? messages;
      console.log("[vapi/webhook] Fetched transcript from Vapi API, length:", transcript.length);
    } catch (err) {
      console.error("[vapi/webhook] Failed to fetch call from Vapi API:", err);
    }
  }

  const info = extractCallInfo(transcript, messages);
  console.log("[vapi/webhook] extractCallInfo result:", info);

  // Save call to Supabase
  console.log("[vapi/webhook] Attempting to save call to Supabase:", call.id);
  try {
    await saveCall({
      call_id: call.id,
      caller_name: info.name,
      caller_phone: info.callbackNumber,
      issue: info.issue,
      duration_seconds: durationSeconds ? parseFloat(durationSeconds) : null,
      transcript: transcript || null,
    });
    console.log("[vapi/webhook] Call saved to Supabase:", call.id);
  } catch (err) {
    console.error("[vapi/webhook] Failed to save call to Supabase:", err);
  }

  const smsBody = formatSmsBody(info, call.id, durationSeconds, transcript);

  try {
    await sendSms(ownerPhone, smsBody);
  } catch (err) {
    // Log but don't fail the webhook — Vapi must receive a 200
    console.error("[vapi/webhook] Failed to send SMS:", err);
  }
}


function handleTranscript(message: VapiTranscriptEvent): void {
  console.log("[vapi/webhook] transcript", {
    callId: message.call.id,
    role: message.role,
    transcriptType: message.transcriptType,
    transcript: message.transcript,
  });
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Failed to read request body" }, { status: 400 });
  }

  const isValid = await verifyVapiSignature(rawBody, request);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: VapiWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as VapiWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message } = payload;

  if (!message?.type) {
    return NextResponse.json({ error: "Missing message.type" }, { status: 400 });
  }

  console.log(`[vapi/webhook] received event: ${message.type}`);

  switch (message.type) {
    case "call-started":
      handleCallStarted(message);
      break;

    case "call-ended":
    case "end-of-call-report":
      await handleCallEnded(message);
      break;

    case "transcript":
      handleTranscript(message);
      break;

    case "speech-update":
      console.log("[vapi/webhook] speech-update", {
        callId: message.call.id,
        role: message.role,
        status: message.status,
      });
      break;

    case "status-update":
      console.log("[vapi/webhook] status-update", {
        callId: message.call.id,
        status: message.status,
      });
      break;

    case "function-call":
      console.log("[vapi/webhook] function-call", {
        callId: message.call.id,
        functionName: message.functionCall.name,
        parameters: message.functionCall.parameters,
      });
      break;

    case "hang":
      console.log("[vapi/webhook] hang", { callId: message.call.id });
      break;

    case "assistant-request":
      console.log("[vapi/webhook] assistant-request", { callId: message.call.id });
      break;

    default: {
      console.warn("[vapi/webhook] unhandled event type:", (message as { type: string }).type);
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
