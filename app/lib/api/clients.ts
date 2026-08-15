import { supabase } from "@/app/lib/supabase";

export async function getClients() {
  return await supabase
    .from("profiles")
    .select("*")
    .eq("role", "client")
    .order("created_at", {
      ascending: false,
    });
}

export async function getClient(id: string) {
  return await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
}

export async function updateClient(
  id: string,
  values: Record<string, unknown>
) {
  return await supabase
    .from("profiles")
    .update(values)
    .eq("id", id);
}

export async function suspendClient(
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