"use client";

import { useState } from "react";

export interface Call {
  id: string;
  callerName: string;
  phone: string;
  issue: string;
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
  new: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  "in-progress": { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  resolved: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
};

export default function DashboardClient({ calls }: { calls: Call[] }) {
  const [filter, setFilter] = useState<"all" | "new" | "in-progress" | "resolved">("all");

  const counts = {
    new: calls.filter((c) => c.status === "new").length,
    "in-progress": calls.filter((c) => c.status === "in-progress").length,
    resolved: calls.filter((c) => c.status === "resolved").length,
  };

  const filtered = filter === "all" ? calls : calls.filter((c) => c.status === filter);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#f5f4f0" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display&display=swap" rel="stylesheet" />

      {/* Header */}
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
          <div style={{ fontSize: 13, color: "#a0a0c0" }}>{today}</div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 32px" }}>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { label: "All Calls", value: calls.length, key: "all", color: "#1a1a2e" },
            { label: "New", value: counts.new, key: "new", color: "#d97706" },
            { label: "In Progress", value: counts["in-progress"], key: "in-progress", color: "#2563eb" },
            { label: "Resolved", value: counts.resolved, key: "resolved", color: "#059669" },
          ].map((stat) => (
            <button
              key={stat.key}
              onClick={() => setFilter(stat.key as typeof filter)}
              style={{
                background: filter === stat.key ? "#1a1a2e" : "white",
                color: filter === stat.key ? "white" : "#1a1a2e",
                border: "none",
                borderRadius: 12,
                padding: "16px 20px",
                cursor: "pointer",
                textAlign: "left",
                boxShadow: filter === stat.key ? "0 4px 14px rgba(26,26,46,0.2)" : "0 1px 3px rgba(0,0,0,0.06)",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 600, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 12, marginTop: 4, opacity: filter === stat.key ? 0.7 : 0.5, fontWeight: 500 }}>{stat.label.toUpperCase()}</div>
            </button>
          ))}
        </div>

        {/* Call Cards */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#999", fontSize: 15 }}>
            No calls yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((call) => {
              const sc = STATUS_COLORS[call.status] ?? STATUS_COLORS.new;
              return (
                <div
                  key={call.id}
                  style={{
                    background: "white",
                    borderRadius: 14,
                    padding: "20px 24px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    borderLeft: "4px solid #6c63ff",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: "50%",
                        background: "linear-gradient(135deg, #e0deff, #c4b5fd)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 15, fontWeight: 600, color: "#4c1d95"
                      }}>
                        {call.callerName === "Unknown Caller" ? "?" : call.callerName[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 15, color: "#1a1a2e" }}>{call.callerName}</div>
                        <div style={{ fontSize: 12, color: "#888", marginTop: 1 }}>{call.phone || "No phone"}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: sc.bg, color: sc.text
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, display: "inline-block" }} />
                        {call.status.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 12, color: "#aaa" }}>{formatDate(call.timestamp)}</span>
                    </div>
                  </div>

                  <div style={{
                    background: "#f8f7ff", borderRadius: 8, padding: "10px 14px",
                    fontSize: 13, color: "#444", marginBottom: 14, lineHeight: 1.5
                  }}>
                    {call.issue}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 12, color: "#999", display: "flex", alignItems: "center", gap: 4 }}>
                      ⏱ {formatDuration(call.duration)}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={{
                        background: "#6c63ff", color: "white", border: "none",
                        borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 5
                      }}>
                        📩 Send Status Update
                      </button>
                      <button style={{
                        background: "white", color: "#6c63ff", border: "1.5px solid #e0deff",
                        borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 5
                      }}>
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
          Live data from Supabase
        </div>
      </div>
    </div>
  );
}
