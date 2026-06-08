"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "../components/DashboardSidebar";
import { supabase } from "@/app/lib/supabase";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSuspendedUser();
  }, []);

  const checkSuspendedUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("suspended")
      .eq("id", user.id)
      .single();

    if (profile?.suspended) {
      await supabase.auth.signOut();
      router.push("/suspended");
      return;
    }

    setLoading(false);
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="dashboard-layout">
      <DashboardSidebar />

      <main className="dashboard-main">{children}</main>
    </div>
  );
}