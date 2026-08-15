import { supabase } from "@/app/lib/supabase";

export type PortfolioProject = {
  id?: string;
  freelancer_id?: string;

  title?: string;
  description?: string;
  category?: string;
  client_name?: string;

  completed_at?: string;

  project_url?: string;
  video_url?: string;

  featured?: boolean;

  skills?: string[];

  images?: string[];

  image_url?: string;

  software?: string;
};

export type PortfolioProjectInput =
  Omit<
    PortfolioProject,
    "id"
  >;

export async function getPortfolioProjects(
  freelancerId: string
) {
  return await supabase
    .from("portfolio_projects")
    .select("*")
    .eq("freelancer_id", freelancerId)
    .order("featured", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    });
}

export async function getFeaturedProjects(
  freelancerId: string
) {
  return await supabase
    .from("portfolio_projects")
    .select("*")
    .eq("freelancer_id", freelancerId)
    .eq("featured", true);
}

export async function createPortfolioProject(
  project: PortfolioProjectInput
) {
  return await supabase
    .from("portfolio_projects")
    .insert(project)
    .select()
    .single();
}

export async function updatePortfolioProject(
  id: string,
  values: Partial<PortfolioProjectInput>
) {
  return await supabase
    .from("portfolio_projects")
    .update(values)
    .eq("id", id)
    .select()
    .single();
}

export async function deletePortfolioProject(
  id: string
) {
  return await supabase
    .from("portfolio_projects")
    .delete()
    .eq("id", id);
}

export async function uploadPortfolioImage(
  file: File,
  freelancerId: string
) {
  const extension =
    file.name.split(".").pop();

  const filename =
    `${freelancerId}/${Date.now()}.${extension}`;

  const { error } =
    await supabase.storage
      .from("portfolio-images")
      .upload(
        filename,
        file
      );

  if (error) {
    return { error };
  }

  const { data } =
    supabase.storage
      .from("portfolio-images")
      .getPublicUrl(
        filename
      );

  return {
    publicUrl: data.publicUrl,
  };
}