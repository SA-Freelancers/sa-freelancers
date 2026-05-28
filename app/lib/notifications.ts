import { supabase } from "@/app/lib/supabase";

type NotificationInput = {
  userId: string;
  title: string;
  body?: string;
  link?: string;
};

export async function createNotification({
  userId,
  title,
  body,
  link,
}: NotificationInput) {
  const { error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      title,
      body,
      link,
    });

  if (error) {
    console.error("Notification error:", error);
  }
}