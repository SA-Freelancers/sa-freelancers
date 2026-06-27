"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

type Category = {
  category: string;
  jobs_count: number;
};

export default function TrendingCategories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase
      .from("trending_categories")
      .select("*");

    setCategories((data as Category[]) || []);
  };

  if (categories.length === 0) return null;

  return (
    <section className="home-section">
      <div className="home-section-header">
        <p className="dashboard-badge">Trending Categories</p>
        <h2>Popular skills on Freelance Hub SA</h2>
      </div>

      <div className="home-grid">
        {categories.map((item) => (
          <div key={item.category} className="dark-card home-card">
            <h3>🔥 {item.category}</h3>
            <p>{item.jobs_count} active opportunities</p>
          </div>
        ))}
      </div>
    </section>
  );
}