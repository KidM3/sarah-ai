import { getCalls } from "@/lib/supabase";
import DashboardClient, { type Call } from "./dashboard/DashboardClient";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  let calls: Call[] = [];

  try {
    const rows = await getCalls();
    calls = rows.map((row) => ({
      id: String(row.id),
      callerName: row.caller_name ?? "Unknown Caller",
      phone: row.caller_phone ?? "—",
      issue: row.issue ?? "No issue recorded",
      duration: Math.round(row.duration_seconds ?? 0),
      timestamp: new Date(row.created_at),
      status: row.status ?? "new",
    }));
  } catch (err) {
    console.error("[dashboard] Failed to fetch calls:", err);
  }

  return <DashboardClient calls={calls} />;
}
