"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface Call {
  id: string;"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface Call {
  id: string;
  callerName: string;
  phone: string;
  issue: string;
  vehicle: string | null;
  duration: number;
  timestamp: Date;
  status: string;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  new: { bg: "#fffbeb", text: "#92400e", dot: "#f59e0b" },
  "in-progress": { bg: "#eff6ff", text: "#1e40af", dot: "#3b82f6" },
  resolved: { bg: "#f0fdf4", text: "#065f46", dot: "#10b981" },
};

// ─── Status Update Modal ──────────────────────────────────────────────────────
function StatusUpdateModal({
  call,
  onClose,
}: {
  call: Call;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const name = call.callerName !== "Unknown Caller" ? call.callerName : "there";
  const vehicle = call.vehicle ?? "your vehicle";
  const defaultMsg = `Hi ${name}, this is the auto shop following up about ${vehicle}. `;

  useEffect(() => {
    setMessage(defaultMsg);
  }, [defaultMsg]);

  const handleSend = async () => {
    if (!call.phone || call.phone === "—") {
      setError("No phone number on file for this caller.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: call.phone,
          message: message + "\n\nReply STOP to opt out.",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setSent(true);
      setTimeout(onClose, 1500);
    } catch {
      setError("Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{ background: "white", borderRadius: 16, padding: 28, width: 480, maxWidth: "90vw" }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 600, color: "#1a1a2e" }}>Send Status Update</h2>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#888" }}>
          Sending to {call.callerName} · {call.phone}
        </p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 8,
            border: "1.5px solid #e0deff", fontSize: 13, lineHeight: 1.5,
            resize: "vertical", fontFamily: "inherit", boxSizing: "border-box",
          }}
        />
        <p style={{ margin: "6px 0 16px", fontSize: 11, color: "#aaa" }}>
          "Reply STOP to opt out." will be appended automatically.
        </p>
        {error && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</p>}
        {sent && <p style={{ color: "#059669", fontSize: 13, marginBottom: 12 }}>✅ Message sent!</p>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            background: "white", color: "#666", border: "1.5px solid #e5e7eb",
            borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer",
          }}>Cancel</button>
          <button onClick={handleSend} disabled={sending || sent} style={{
            background: sending || sent ? "#a78bfa" : "#6c63ff",
            color: "white", border: "none", borderRadius: 8,
            padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            {sending ? "Sending..." : sent ? "Sent!" : "Send SMS"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardClient({ calls }: { calls: Call[] }) {
  const [filter, setFilter] = useState<"all" | "new" | "in-progress" | "resolved">("all");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [statusModalCall, setStatusModalCall] = useState<Call | null>(null);
  const [reviewSending, setReviewSending] = useState<string | null>(null);
  const [reviewSent, setReviewSent] = useState<Set<string>>(new Set());
  const router = useRouter();

  const refresh = useCallback(() => {
    setRefreshing(true);
    router.refresh();
    setLastRefresh(new Date());
    setTimeout(() => setRefreshing(false), 800);
  }, [router]);

  useEffect(() => {
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleRequestReview = async (call: Call) => {
    if (!call.phone || call.phone === "—") {
      alert("No phone number on file for this caller.");
      return;
    }
    setReviewSending(call.id);
    const name = call.callerName !== "Unknown Caller" ? call.callerName : "there";
    const message = `Hi ${name}, thanks for choosing our auto shop! We'd love your feedback — it helps us serve you better. Please leave us a quick review: https://g.page/r/YOUR_GOOGLE_REVIEW_LINK\n\nReply STOP to opt out.`;
    try {
      const res = await fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: call.phone, message }),
      });
      if (!res.ok) throw new Error("Failed");
      setReviewSent((prev) => new Set(prev).add(call.id));
    } catch {
      alert("Failed to send review request. Please try again.");
    } finally {
      setReviewSending(null);
    }
  };

  const counts = {
    new: calls.filter((c) => c.status === "new").length,
    "in-progress": calls.filter((c) => c.status === "in-progress").length,
    resolved: calls.filter((c) => c.status === "resolved").length,
  };

  const filtered = filter === "all" ? calls : calls.filter((c) => c.status === filter);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#f5f4f0" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display&display=swap" rel="stylesheet" />

      {statusModalCall && (
        <StatusUpdateModal call={statusModalCall} onClose={() => setStatusModalCall(null)} />
      )}

      <div style={{ background: "#1a1a2e", color: "white", padding: "24px 32px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #6c63ff, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              📞
            </div>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, letterSpacing: "-0.3px" }}>Sarah AI</div>
              <div style={{ fontSize: 12, color: "#a0a0c0", marginTop: 1 }}>Front Desk Dashboard</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 12, color: "#a0a0c0" }}>Updated {formatDate(lastRefresh)}</div>
            <button onClick={refresh} style={{
              background: "#2a2a4e", color: refreshing ? "#6c63ff" : "white",
              border: "1px solid #3a3a5e", borderRadius: 8,
              padding: "6px 14px", fontSize: 12, cursor: "pointer",
            }}>
              {refreshing ? "↻ Refreshing..." : "↻ Refresh"}
            </button>
            <div style={{ fontSize: 13, color: "#a0a0c0" }}>{today}</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { label: "All Calls", value: calls.length, key: "all" },
            { label: "New", value: counts.new, key: "new" },
            { label: "In Progress", value: counts["in-progress"], key: "in-progress" },
            { label: "Resolved", value: counts.resolved, key: "resolved" },
          ].map((stat) => (
            <button key={stat.key} onClick={() => setFilter(stat.key as typeof filter)} style={{
              background: filter === stat.key ? "#1a1a2e" : "white",
              color: filter === stat.key ? "white" : "#1a1a2e",
              border: "none", borderRadius: 12, padding: "16px 20px",
              cursor: "pointer", textAlign: "left",
              boxShadow: filter === stat.key ? "0 4px 14px rgba(26,26,46,0.2)" : "0 1px 3px rgba(0,0,0,0.06)",
              transition: "all 0.15s ease",
            }}>
              <div style={{ fontSize: 28, fontWeight: 600, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 12, marginTop: 4, opacity: filter === stat.key ? 0.7 : 0.5, fontWeight: 500 }}>{stat.label.toUpperCase()}</div>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#999", fontSize: 15 }}>No calls yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((call) => {
              const sc = STATUS_COLORS[call.status] ?? STATUS_COLORS.new;
              return (
                <div key={call.id} style={{ background: "white", borderRadius: 14, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", borderLeft: "4px solid #6c63ff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #e0deff, #c4b5fd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 600, color: "#4c1d95" }}>
                        {call.callerName === "Unknown Caller" ? "?" : call.callerName[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15, color: "#1a1a2e" }}>{call.callerName}</div>
                        <div style={{ fontSize: 12, color: "#888", marginTop: 1 }}>
                          {call.phone || "No phone"}{call.vehicle ? ` · ${call.vehicle}` : ""}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.text }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, display: "inline-block" }} />
                        {call.status.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 12, color: "#aaa" }}>{formatDate(call.timestamp)}</span>
                    </div>
                  </div>
                  <div style={{ background: "#f8f7ff", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#444", marginBottom: 14, lineHeight: 1.5 }}>
                    {call.issue}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 12, color: "#999" }}>⏱ {formatDuration(call.duration)}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => setStatusModalCall(call)}
                        style={{ background: "#6c63ff", color: "white", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        📩 Send Status Update
                      </button>
                      <button
                        onClick={() => handleRequestReview(call)}
                        disabled={reviewSending === call.id || reviewSent.has(call.id)}
                        style={{
                          background: reviewSent.has(call.id) ? "#f0fdf4" : "white",
                          color: reviewSent.has(call.id) ? "#059669" : "#6c63ff",
                          border: `1.5px solid ${reviewSent.has(call.id) ? "#10b981" : "#e0deff"}`,
                          borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        {reviewSending === call.id ? "Sending..." : reviewSent.has(call.id) ? "✅ Sent!" : "⭐ Request Review"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 28, fontSize: 11, color: "#bbb" }}>
          Auto-refreshes every 30 seconds · Live data from Supabase
        </div>
      </div>
    </div>
  );
}

  callerName: string;
  phone: string;
  issue: string;
  duration: number;
  timestamp: Date;
  status: string;
  vehicle: string | null;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  new: { bg: "#fffbeb", text: "#92400e", dot: "#f59e0b" },
  "in-progress": { bg: "#eff6ff", text: "#1e40af", dot: "#3b82f6" },
  resolved: { bg: "#f0fdf4", text: "#065f46", dot: "#10b981" },
};

export default function DashboardClient({ calls }: { calls: Call[] }) {
  const [filter, setFilter] = useState<"all" | "new" | "in-progress" | "resolved">("all");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const refresh = useCallback(() => {
    setRefreshing(true);
    router.refresh();
    setLastRefresh(new Date());
    setTimeout(() => setRefreshing(false), 800);
  }, [router]);

  useEffect(() => {
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const counts = {
    new: calls.filter((c) => c.status === "new").length,
    "in-progress": calls.filter((c) => c.status === "in-progress").length,
    resolved: calls.filter((c) => c.status === "resolved").length,
  };

  const filtered = filter === "all" ? calls : calls.filter((c) => c.status === filter);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#f5f4f0" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display&display=swap" rel="stylesheet" />

      <div style={{ background: "#1a1a2e", color: "white", padding: "24px 32px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #6c63ff, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              📞
            </div>
            <div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, letterSpacing: "-0.3px" }}>Sarah AI</div>
              <div style={{ fontSize: 12, color: "#a0a0c0", marginTop: 1 }}>Front Desk Dashboard</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 12, color: "#a0a0c0" }}>Updated {formatDate(lastRefresh)}</div>
            <button
              onClick={refresh}
              style={{
                background: "#2a2a4e", color: refreshing ? "#6c63ff" : "white",
                border: "1px solid #3a3a5e", borderRadius: 8,
                padding: "6px 14px", fontSize: 12, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {refreshing ? "↻ Refreshing..." : "↻ Refresh"}
            </button>
            <div style={{ fontSize: 13, color: "#a0a0c0" }}>{today}</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { label: "All Calls", value: calls.length, key: "all" },
            { label: "New", value: counts.new, key: "new" },
            { label: "In Progress", value: counts["in-progress"], key: "in-progress" },
            { label: "Resolved", value: counts.resolved, key: "resolved" },
          ].map((stat) => (
            <button
              key={stat.key}
              onClick={() => setFilter(stat.key as typeof filter)}
              style={{
                background: filter === stat.key ? "#1a1a2e" : "white",
                color: filter === stat.key ? "white" : "#1a1a2e",
                border: "none", borderRadius: 12, padding: "16px 20px",
                cursor: "pointer", textAlign: "left",
                boxShadow: filter === stat.key ? "0 4px 14px rgba(26,26,46,0.2)" : "0 1px 3px rgba(0,0,0,0.06)",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 600, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 12, marginTop: 4, opacity: filter === stat.key ? 0.7 : 0.5, fontWeight: 500 }}>{stat.label.toUpperCase()}</div>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#999", fontSize: 15 }}>No calls yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((call) => {
              const sc = STATUS_COLORS[call.status] ?? STATUS_COLORS.new;
              return (
                <div key={call.id} style={{ background: "white", borderRadius: 14, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", borderLeft: "4px solid #6c63ff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #e0deff, #c4b5fd)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 600, color: "#4c1d95" }}>
                        {call.callerName === "Unknown Caller" ? "?" : call.callerName[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15, color: "#1a1a2e" }}>{call.callerName}</div>
                        <div style={{ fontSize: 12, color: "#888", marginTop: 1 }}>{call.phone || "No phone"}{call.vehicle ? ` · ${call.vehicle}` : ""}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.text }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, display: "inline-block" }} />
                        {call.status.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 12, color: "#aaa" }}>{formatDate(call.timestamp)}</span>
                    </div>
                  </div>
                  <div style={{ background: "#f8f7ff", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#444", marginBottom: 14, lineHeight: 1.5 }}>
                    {call.issue}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 12, color: "#999" }}>⏱ {formatDuration(call.duration)}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={{ background: "#6c63ff", color: "white", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        📩 Send Status Update
                      </button>
                      <button style={{ background: "white", color: "#6c63ff", border: "1.5px solid #e0deff", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        ⭐ Request Review
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 28, fontSize: 11, color: "#bbb" }}>
          Auto-refreshes every 30 seconds · Live data from Supabase
        </div>
      </div>
    </div>
  );
}
