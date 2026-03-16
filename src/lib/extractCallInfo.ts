export interface CallInfo {
  name: string | null;
  callbackNumber: string | null;
  issue: string | null;
}

export function extractCallInfo(
  transcript: string,
  messages?: { role: string; message?: string; content?: string }[]
): CallInfo {
  // Only look at user/caller turns, not assistant turns
  const userText = messages
    ? messages
        .filter((m) => m.role === "user")
        .map((m) => m.content ?? m.message ?? "")
        .join(" ")
    : transcript;

  const fullText = transcript || userText || "";

  // Name: only match when caller says it, exclude "Sarah" (the AI name)
  const nameMatch = userText.match(
    /(?:my name is|i'm|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i
  );
  const name = nameMatch?.[1] && nameMatch[1].toLowerCase() !== "sarah"
    ? nameMatch[1]
    : null;

  // Phone: match any 10-digit number pattern
  const phoneMatch = userText.match(/(\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4})/);

  // Issue: broader match from full transcript
  const issueMatch = fullText.match(
    /(?:my car|the car|vehicle|it's|problem is|issue is|need|having|brakes|engine|oil|transmission|tire|battery|check engine|leak|noise|won't start)[^.?!]{5,100}/i
  );

  return {
    name: name ?? null,
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
