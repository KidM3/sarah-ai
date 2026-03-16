import { createClient } from "@supabase/supabase-js";

export interface CallRecord {
  call_id: string;
  caller_name: string | null;
  caller_phone: string | null;
  issue: string | null;
  duration_seconds: number | null;
  transcript: string | null;
}

export interface CallRow extends CallRecord {
  id: string;
  created_at: string;
  status: "new" | "in-progress" | "resolved";
}

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set");
  }

  return createClient(url, key);
}

export async function saveCall(record: CallRecord): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from("calls").insert(record);

  if (error) {
    throw new Error(`Failed to save call to Supabase: ${error.message}`);
  }
}

export async function getCalls(): Promise<CallRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("calls")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`Failed to fetch calls from Supabase: ${error.message}`);
  }

  return (data ?? []) as CallRow[];
}
