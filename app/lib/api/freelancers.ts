import { supabase } from "@/app/lib/supabase";

export async function getFreelancers() {
  return await supabase
    .from("profiles")
    .select("*")
    .eq("role", "freelancer")
    .order("created_at", {
      ascending: false,
    });
}

export async function getFreelancer(id: string) {
  return await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
}

export async function updateFreelancer(
  id: string,
  values: Record<string, unknown>
) {
  return await supabase
    .from("profiles")
    .update(values)
    .eq("id", id);
}

export async function suspendFreelancer(
  id: string,
  suspended: boolean
) {
  return await supabase
    .from("profiles")
    .update({
      suspended,
    })
    .eq("id", id);
}

export async function deleteFreelancer(id: string) {
  return await supabase
    .from("profiles")
    .delete()
    .eq("id", id);
}