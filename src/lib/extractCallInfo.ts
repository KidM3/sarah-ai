export interface CallInfo {
  name: string | null;
  callbackNumber: string | null;
  issue: string | null;
}

export function extractCallInfo(
  transcript: string,
  messages?: { role: string; content: string }[]
): CallInfo {
  const text = transcript || messages?.map((m) => m.content).join(" ") || "";

  const nameMatch = text.match(/(?:my name is|this is|i'm|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  const phoneMatch = text.match(/(\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4})/);
  const issueMatch = text.match(/(?:my car|the car|vehicle|it's|problem is|issue is|need|having)[^.?!]{5,80}/i);

  return {
    name: nameMatch?.[1] ?? null,
    callbackNumber: phoneMatch?.[1] ?? null,
    issue: issueMatch?.[0] ?? null,
  };
}
export function formatSmsBody(
  info: CallInfo,
  callId: string,
  durationSeconds: string | undefined,
  transcript: string
): string {
  const name = info.name ?? "Unknown";
  const phone = info.callbackNumber ?? "Unknown";
  const issue = info.issue ?? "Not captured";
  const duration = durationSeconds ? `${durationSeconds}s` : "Unknown";

  return `📞 New Call — Sarah AI\nCaller: ${name}\nPhone: ${phone}\nIssue: ${issue}\nDuration: ${duration}\nCall ID: ${callId}`;
}
