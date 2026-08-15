import { supabase } from "@/app/lib/supabase";

export async function getJobs() {
  return await supabase
    .from("jobs")
    .select("*")
    .order("created_at", {
      ascending: false,
    });
}

export async function getJob(id: string) {
  return await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();
}

export async function updateJob(
  id: string,
  values: Record<string, unknown>
) {
  return await supabase
    .from("jobs")
    .update(values)
    .eq("id", id);
}

export async function deleteJob(id: string) {
  return await supabase
    .from("jobs")
    .delete()
    .eq("id", id);
}