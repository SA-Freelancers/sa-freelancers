"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  created_at?: string;
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      setAllowed(false);
      setLoading(false);
      return;
    }

    setAllowed(true);

    const { data } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    setMessages((data as ContactMessage[]) || []);
    setLoading(false);
  };

  if (loading) return <LoadingSkeleton />;

  if (!allowed) {
    return (
      <main className="contracts-page">
        <section className="dark-card contract-card">
          <p className="dashboard-badge">Admin</p>
          <h1>Access Restricted</h1>
          <p>Only admins can view support messages.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="contracts-page">
      <section className="contracts-header dark-card">
        <p className="dashboard-badge">Admin Support</p>
        <h1>Contact Messages</h1>
        <p>View support messages submitted from the website.</p>
      </section>

      <section className="contracts-grid">
        {messages.length === 0 ? (
          <div className="dark-card contract-card">
            <h2>No Messages</h2>
            <p>No support messages have been submitted yet.</p>
          </div>
        ) : (
          messages.map((item) => (
            <div key={item.id} className="dark-card contract-card">
              <h2>{item.subject || "Support Message"}</h2>

              <p>
                <strong>Name:</strong> {item.name}
              </p>

              <p>
                <strong>Email:</strong>{" "}
                <a href={`mailto:${item.email}`}>{item.email}</a>
              </p>

              <p>{item.message}</p>

              <small>
                {item.created_at
                  ? new Date(item.created_at).toLocaleString()
                  : ""}
              </small>
            </div>
          ))
        )}
      </section>
    </main>
  );
}