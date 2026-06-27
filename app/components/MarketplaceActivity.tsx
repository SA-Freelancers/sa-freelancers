"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

type Activity = {
  id: string;
  activity_type: string;
  title: string;
  description?: string;
  created_at?: string;
};

export default function MarketplaceActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    const { data } = await supabase
      .from("marketplace_activity")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6);

    setActivities((data as Activity[]) || []);
  };

  if (activities.length === 0) return null;

  return (
    <section className="home-section">
      <div className="home-section-header">
        <p className="dashboard-badge">Live Activity</p>
        <h2>What&apos;s happening on Freelance Hub SA</h2>
      </div>

      <div className="home-grid">
        {activities.map((item) => (
          <div key={item.id} className="dark-card home-card">
            <h3>
              {item.activity_type === "job" && "💼 "}
              {item.activity_type === "application" && "📩 "}
              {item.activity_type === "hire" && "✅ "}
              {item.activity_type === "review" && "⭐ "}
              {item.title}
            </h3>

            <p>{item.description}</p>

            {item.created_at && (
              <small>
                {new Date(item.created_at).toLocaleString("en-ZA")}
              </small>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}