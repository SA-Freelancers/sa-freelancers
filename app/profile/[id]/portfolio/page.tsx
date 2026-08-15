import { createClient } from "@supabase/supabase-js";

import PortfolioGrid from "@/app/dashboard/freelancer/portfolio/components/PortfolioGrid";

type Props = {
  params: {
    id: string;
  };
};

export default async function PublicPortfolio({
  params,
}: Props) {

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.id)
    .single();

  const { data: projects } = await supabase
    .from("portfolio_projects")
    .select("*")
    .eq("freelancer_id", params.id)
    .order("featured", {
      ascending: false,
    });

  return (

    <main className="contracts-page">

      <section className="contracts-header dark-card">

        <h1>
          {profile?.full_name}
        </h1>

        <p>
          {profile?.tagline}
        </p>

      </section>

      <PortfolioGrid

        projects={projects ?? []}

        onView={() => {}}

        onEdit={() => {}}

        onDelete={() => {}}

      />

    </main>

  );

}