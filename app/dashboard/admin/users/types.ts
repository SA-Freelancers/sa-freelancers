export type UserProfile = {
  id: string;

  full_name: string | null;

  email: string | null;

  role: string | null;

  is_admin: boolean | null;

  suspended: boolean | null;

  verified: boolean | null;

  top_rated: boolean | null;

  is_demo: boolean | null;

  avatar_url?: string | null;

  bio: string | null;

  skills?: string | null;

  category: string | null;

  location: string | null;

  country: string | null;

  completed_jobs: number | null;

  created_at: string | null;

  last_seen: string | null;
};