import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import type {
  VapiWebhookPayload,
  VapiCallStartedMessage,
  VapiCallEndedMessage,
  VapiTranscriptEvent,
} from "@/types/vapi";

// ─── Signature verification ───────────────────────────────────────────────────

/**
 * Verifies the HMAC-SHA256 signature that Vapi attaches to every webhook
 * request. Returns false if the secret is not configured (dev convenience)
 * or the signature does not match.
 */
async function verifyVapiSignature(
  rawBody: string,
  request: NextRequest
): Promise<boolean> {
  const secret = process.env.VAPI_WEBHOOK_SECRET;

  // Skip verification in development if no secret is configured
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

function handleCallEnded(message: VapiCallEndedMessage): void {
  const { call } = message;
  console.log("[vapi/webhook] call-ended", {
    callId: call.id,
    type: call.type,
    endedReason: call.endedReason,
    durationSeconds:
      call.startedAt && call.endedAt
        ? (
            (new Date(call.endedAt).getTime() -
              new Date(call.startedAt).getTime()) /
            1000
          ).toFixed(1)
        : undefined,
    cost: call.cost,
    transcriptLength: call.transcript?.length ?? 0,
  });
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

  // Verify the request genuinely came from Vapi
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
      handleCallEnded(message);
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
      // Exhaustiveness check — TypeScript will warn if a case is missing
      const _unhandled = message satisfies never;
      console.warn("[vapi/webhook] unhandled event type:", (_unhandled as { type: string }).type);
    }
  }

  // Vapi expects a 200 OK to acknowledge receipt
  return NextResponse.json({ received: true }, { status: 200 });
}

// Reject non-POST methods explicitly
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
