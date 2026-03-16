/**
 * Vapi Webhook Event Types
 *
 * Reference: https://docs.vapi.ai/server-url/events
 */

// ─── Shared sub-types ────────────────────────────────────────────────────────

export interface VapiCall {
  id: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
  type: "inboundPhoneCall" | "outboundPhoneCall" | "webCall";
  status: "queued" | "ringing" | "in-progress" | "forwarding" | "ended";
  assistantId?: string;
  squadId?: string;
  phoneNumberId?: string;
  customerId?: string;
  /** ISO 8601 timestamp when the call was answered */
  startedAt?: string;
  /** ISO 8601 timestamp when the call ended */
  endedAt?: string;
  /** Reason the call ended */
  endedReason?: string;
  /** Full transcript as a single string (available on call-end) */
  transcript?: string;
  /** Structured transcript with per-turn entries */
  messages?: VapiTranscriptMessage[];
  recordingUrl?: string;
  stereoRecordingUrl?: string;
  summary?: string;
  cost?: number;
  costBreakdown?: Record<string, unknown>;
  analysis?: Record<string, unknown>;
  artifact?: Record<string, unknown>;
}

export interface VapiTranscriptMessage {
  role: "assistant" | "user" | "tool" | "system";
  message: string;
  /** Seconds from call start */
  time?: number;
  endTime?: number;
  secondsFromStart?: number;
  duration?: number;
}

// ─── Event message shapes ─────────────────────────────────────────────────────

export interface VapiCallStartedMessage {
  type: "call-started";
  call: VapiCall;
  timestamp?: string;
}

export interface VapiCallEndedMessage {
  type: "call-ended";
  call: VapiCall;
  timestamp?: string;
}

export interface VapiEndOfCallReportMessage {
  type: "end-of-call-report";
  call: VapiCall;
  timestamp?: string;
}

export interface VapiTranscriptEvent {
  type: "transcript";
  call: VapiCall;
  role: "assistant" | "user";
  transcriptType: "partial" | "final";
  transcript: string;
  timestamp?: string;
}

export interface VapiSpeechUpdateMessage {
  type: "speech-update";
  call: VapiCall;
  role: "assistant" | "user";
  status: "started" | "stopped";
  timestamp?: string;
}

export interface VapiStatusUpdateMessage {
  type: "status-update";
  call: VapiCall;
  status: VapiCall["status"];
  timestamp?: string;
}

export interface VapiFunctionCallMessage {
  type: "function-call";
  call: VapiCall;
  functionCall: {
    name: string;
    parameters: Record<string, unknown>;
  };
  timestamp?: string;
}

export interface VapiHangMessage {
  type: "hang";
  call: VapiCall;
  timestamp?: string;
}

export interface VapiAssistantRequestMessage {
  type: "assistant-request";
  call: VapiCall;
  timestamp?: string;
}

// ─── Union type of all inbound webhook messages ───────────────────────────────

export type VapiWebhookMessage =
  | VapiCallStartedMessage
  | VapiCallEndedMessage
  | VapiEndOfCallReportMessage
  | VapiTranscriptEvent
  | VapiSpeechUpdateMessage
  | VapiStatusUpdateMessage
  | VapiFunctionCallMessage
  | VapiHangMessage
  | VapiAssistantRequestMessage;

// ─── Webhook request body ─────────────────────────────────────────────────────

export interface VapiWebhookPayload {
  message: VapiWebhookMessage;
}
