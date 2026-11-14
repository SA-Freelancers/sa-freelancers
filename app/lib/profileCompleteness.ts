
export type ProfileCompletenessProfile = {
  full_name?: string | null;
  bio?: string | null;
  category?: string | null;
  avatar_url?: string | null;
  headline?: string | null;
  location?: string | null;
  years_experience?: number | null;
  hourly_rate?: number | null;
  skills?: unknown;
  education?: string | null;
  certifications?: unknown;
  cv_url?: string | null;
  portfolio_url?: string | null;
  portfolio_project_exists?: boolean;
};

function normaliseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string =>
        typeof item === "string" &&
        item.trim().length > 0
    );
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is string =>
            typeof item === "string" &&
            item.trim().length > 0
        );
      }
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

export function calculateProfileCompleteness(
  profile: ProfileCompletenessProfile
) {
  const skills = normaliseStringArray(profile.skills);

  const checks = {
    fullName: Boolean(profile.full_name?.trim()),
    headline: Boolean(profile.headline?.trim()),
    bio: Boolean(profile.bio?.trim()),
    category: Boolean(profile.category?.trim()),
    photo: Boolean(profile.avatar_url?.trim()),
    cv: Boolean(profile.cv_url?.trim()),
    portfolio:
      Boolean(profile.portfolio_url?.trim()) ||
      profile.portfolio_project_exists === true,
    skills: skills.length > 0,
    hourlyRate:
      typeof profile.hourly_rate === "number" &&
      Number.isFinite(profile.hourly_rate) &&
      profile.hourly_rate > 0,
    experience:
      typeof profile.years_experience === "number" &&
      Number.isFinite(profile.years_experience) &&
      profile.years_experience >= 0,
  };

  const completed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  const percentage = Math.round((completed / total) * 100);

  const missing = Object.entries(checks)
    .filter(([, complete]) => !complete)
    .map(([field]) => field);

  let strength:
    | "Excellent"
    | "Good"
    | "Needs Improvement"
    | "Needs Completion";

  if (percentage >= 90) {
    strength = "Excellent";
  } else if (percentage >= 70) {
    strength = "Good";
  } else if (percentage >= 40) {
    strength = "Needs Improvement";
  } else {
    strength = "Needs Completion";
  }

  return {
    percentage,
    strength,
    missing,
    checks,
  };
}
