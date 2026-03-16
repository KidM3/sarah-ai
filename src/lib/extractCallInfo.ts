export interface CallInfo {
  name: string | null;
  callbackNumber: string | null;
  issue: string | null;
}

function spokenNumbersToDigits(text: string): string {
  const words: Record<string, string> = {
    zero: "0", one: "1", two: "2", three: "3", four: "4",
    five: "5", six: "6", seven: "7", eight: "8", nine: "9",
  };
  return text.replace(
    /\b(zero|one|two|three|four|five|six|seven|eight|nine)(\s+(zero|one|two|three|four|five|six|seven|eight|nine)){6,}\b/gi,
    (match) => match.toLowerCase().split(/\s+/).map((w) => words[w] ?? w).join("")
  );
}

export function extractCallInfo(
  transcript: string,
  messages?: { role: string; message?: string; content?: string }[]
): CallInfo {
  const userText = messages
    ? messages.filter((m) => m.role === "user").map((m) => m.content ?? m.message ?? "").join(" ")
    : transcript.split("\n").filter((l) => l.startsWith("User:")).map((l) => l.replace("User:", "")).join(" ");

  const fullText = transcript || userText || "";
  const convertedText = spokenNumbersToDigits(fullText);
  const convertedUserText = spokenNumbersToDigits(userText);

  // Name from caller only, exclude "Sarah"
  const nameMatch = convertedUserText.match(/(?:my name is|i'm|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  const name = nameMatch?.[1] && nameMatch[1].toLowerCase() !== "sarah" ? nameMatch[1] : null;

  // Phone from converted text
  const phoneMatch = convertedText.match(/(\d{10}|\(?\d{3}\)?[\s\-]\d{3}[\s\-]\d{4})/);

  // Issue — grab car details + problem
  const carMatch = fullText.match(/(?:have a|driving a|got a)\s+([^.?!\n]{5,60})/i);
  const problemMatch = fullText.match(/(?:check engine|won't start|not starting|overheating|brakes|transmission|oil|battery|flat tire|leak|noise|warning light|flashing)[^.?!\n]{0,80}/i);
  const issue = problemMatch?.[0] ?? carMatch?.[0] ?? null;

  return {
    name: name ?? null,
    callbackNumber: phoneMatch?.[1] ?? null,
    issue: issue ?? null,
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
