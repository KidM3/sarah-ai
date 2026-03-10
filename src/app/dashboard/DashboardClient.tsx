"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Call {
  id: string;
  callerName: string;
  phone: string;
  issue: string;
  duration: number; // seconds
  timestamp: Date;
  status: "new" | "in-progress" | "resolved";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function statusLabel(s: Call["status"]): string {
  if (s === "new") return "New";
  if (s === "in-progress") return "In Progress";
  return "Resolved";
}

function statusColors(s: Call["status"]): { bg: string; color: string } {
  if (s === "new") return { bg: "#fef3c7", color: "#92400e" };
  if (s === "in-progress") return { bg: "#dbeafe", color: "#1e40af" };
  return { bg: "#d1fae5", color: "#065f46" };
}

// ─── CallCard ─────────────────────────────────────────────────────────────────

function CallCard({ call }: { call: Call }) {
  const [statusSent, setStatusSent] = useState(false);
  const [reviewSent, setReviewSent] = useState(false);
  const [sending, setSending] = useState<"status" | "review" | null>(null);

  const sc = statusColors(call.status);

  async function handleAction(type: "status" | "review") {
    setSending(type);
    await new Promise((r) => setTimeout(r, 900)); // simulate network
    if (type === "status") setStatusSent(true);
    else setReviewSent(true);
    setSending(null);
  }

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* Top row: name + badge + time */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Avatar */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#e0e7ff",
              color: "#4338ca",
              fontWeight: 700,
              fontSize: 17,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {call.callerName.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: "#111827", fontFamily: "system-ui, sans-serif" }}>
              {call.callerName}
            </div>
            <div style={{ fontSize: 14, color: "#6b7280", fontFamily: "system-ui, sans-serif", marginTop: 1 }}>
              {call.phone}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <span
            style={{
              background: sc.bg,
              color: sc.color,
              fontSize: 12,
              fontWeight: 600,
              padding: "3px 10px",
              borderRadius: 99,
              fontFamily: "system-ui, sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            {statusLabel(call.status)}
          </span>
          <span style={{ fontSize: 13, color: "#9ca3af", fontFamily: "system-ui, sans-serif" }}>
            {formatTimestamp(call.timestamp)}
          </span>
        </div>
      </div>

      {/* Issue */}
      <div
        style={{
          background: "#f9fafb",
          borderRadius: 10,
          padding: "12px 14px",
          fontSize: 15,
          color: "#374151",
          lineHeight: 1.55,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {call.issue}
      </div>

      {/* Duration */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span style={{ fontSize: 13, color: "#6b7280", fontFamily: "system-ui, sans-serif" }}>
          Call duration: <strong>{formatDuration(call.duration)}</strong>
        </span>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={() => handleAction("status")}
          disabled={statusSent || sending === "status"}
          style={{
            flex: 1,
            minWidth: 140,
            padding: "11px 16px",
            borderRadius: 10,
            border: "none",
            background: statusSent ? "#d1fae5" : "#4f46e5",
            color: statusSent ? "#065f46" : "#fff",
            fontWeight: 600,
            fontSize: 14,
            cursor: statusSent ? "default" : "pointer",
            fontFamily: "system-ui, sans-serif",
            transition: "background 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          {sending === "status" ? "Sending…" : statusSent ? "✓ Update Sent" : "📤 Send Status Update"}
        </button>

        <button
          onClick={() => handleAction("review")}
          disabled={reviewSent || sending === "review"}
          style={{
            flex: 1,
            minWidth: 140,
            padding: "11px 16px",
            borderRadius: 10,
            border: "2px solid #e5e7eb",
            background: reviewSent ? "#d1fae5" : "#fff",
            color: reviewSent ? "#065f46" : "#374151",
            fontWeight: 600,
            fontSize: 14,
            cursor: reviewSent ? "default" : "pointer",
            fontFamily: "system-ui, sans-serif",
            transition: "background 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          {sending === "review" ? "Sending…" : reviewSent ? "✓ Request Sent" : "⭐ Request Review"}
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard Client ─────────────────────────────────────────────────────────

export default function DashboardClient({ calls }: { calls: Call[] }) {
  const [filter, setFilter] = useState<"all" | "new" | "in-progress" | "resolved">("all");

  const filtered = filter === "all" ? calls : calls.filter((c) => c.status === filter);

  const counts = {
    new: calls.filter((c) => c.status === "new").length,
    inProgress: calls.filter((c) => c.status === "in-progress").length,
    resolved: calls.filter((c) => c.status === "resolved").length,
  };

  return (
    <div style={{ background: "#f3f4f6", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div
        style={{
          background: "#4f46e5",
          padding: "24px 20px 20px",
          color: "#fff",
        }}
      >
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <span style={{ fontSize: 28 }}>🔧</span>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.3px" }}>
                Sarah&apos;s Auto Shop
              </h1>
              <p style={{ margin: 0, fontSize: 13, opacity: 0.8, marginTop: 2 }}>
                Call Dashboard — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        <div
          style={{
            maxWidth: 680,
            margin: "0 auto",
            display: "flex",
            padding: "0 20px",
          }}
        >
          {(
            [
              { label: "New", value: counts.new, key: "new", color: "#d97706" },
              { label: "In Progress", value: counts.inProgress, key: "in-progress", color: "#2563eb" },
              { label: "Resolved", value: counts.resolved, key: "resolved", color: "#059669" },
              { label: "All Calls", value: calls.length, key: "all", color: "#6b7280" },
            ] as const
          ).map((stat) => (
            <button
              key={stat.key}
              onClick={() => setFilter(stat.key)}
              style={{
                flex: 1,
                background: "none",
                border: "none",
                borderBottom: filter === stat.key ? `3px solid ${stat.color}` : "3px solid transparent",
                padding: "14px 4px",
                cursor: "pointer",
                textAlign: "center",
                transition: "border-color 0.15s",
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginTop: 2, letterSpacing: "0.3px" }}>
                {stat.label.toUpperCase()}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Call list */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px 40px" }}>
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#9ca3af",
              fontSize: 15,
            }}
          >
            No calls to show here yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {filtered.map((call) => (
              <CallCard key={call.id} call={call} />
            ))}
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: 12, color: "#d1d5db", marginTop: 32 }}>
          Live data from Supabase
        </p>
      </div>
    </div>
  );
}
