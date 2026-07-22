import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type AdminVerification =
  | {
      ok: true;
      adminClient: SupabaseClient;
      userId: string;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

export function createSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing.");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function createSupabaseUserClient(accessToken: string): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing.");
  }

  if (!anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.");
  }

  return createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function verifyMarketplaceAdmin(
  request: Request
): Promise<AdminVerification> {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return {
      ok: false,
      status: 401,
      error: "Authentication is required.",
    };
  }

  const accessToken = authorization.slice("Bearer ".length).trim();

  if (!accessToken) {
    return {
      ok: false,
      status: 401,
      error: "The access token is missing.",
    };
  }

  const userClient = createSupabaseUserClient(accessToken);

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(accessToken);

  if (userError || !user) {
    return {
      ok: false,
      status: 401,
      error: "Your session is invalid or has expired.",
    };
  }

  const adminClient = createSupabaseAdminClient();

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, is_admin, suspended")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(
      `Could not verify administrator access: ${profileError.message}`
    );
  }

  if (!profile?.is_admin) {
    return {
      ok: false,
      status: 403,
      error: "Administrator access is required.",
    };
  }

  if (profile.suspended) {
    return {
      ok: false,
      status: 403,
      error: "This administrator account is suspended.",
    };
  }

  return {
    ok: true,
    adminClient,
    userId: user.id,
  };
}

export function normaliseRequestedCount(
  value: unknown,
  defaultValue: number,
  maximum: number
): number {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return defaultValue;
  }

  return Math.min(parsedValue, maximum);
}

export function randomInteger(minimum: number, maximum: number): number {
  const safeMinimum = Math.ceil(Math.min(minimum, maximum));
  const safeMaximum = Math.floor(Math.max(minimum, maximum));

  return (
    Math.floor(Math.random() * (safeMaximum - safeMinimum + 1)) +
    safeMinimum
  );
}

export function randomBoolean(truePercentage: number): boolean {
  return Math.random() * 100 < truePercentage;
}

export function randomItem<T>(values: T[]): T {
  if (!values.length) {
    throw new Error("Cannot select a random item from an empty array.");
  }

  return values[Math.floor(Math.random() * values.length)];
}

export function shuffle<T>(values: T[]): T[] {
  const result = [...values];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [result[index], result[randomIndex]] = [
      result[randomIndex],
      result[index],
    ];
  }

  return result;
}