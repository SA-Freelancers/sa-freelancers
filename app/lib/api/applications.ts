import { supabase } from "@/app/lib/supabase";

export async function getApplications() {
  return await supabase
    .from("applications")
    .select("*")
    .order("created_at", {
      ascending: false,
    });
}

export async function getApplicationsForJob(
  jobId: string
) {
  return await supabase
    .from("applications")
    .select("*")
    .eq("job_id", jobId);
}