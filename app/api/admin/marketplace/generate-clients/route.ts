import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DemoClient = {
  id: string;
  display_name: string;
  industry: string | null;
  description: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
  verified: boolean | null;
  is_active: boolean | null;
  created_at: string | null;
};

type ExistingDemoProfile = {
  demo_client_id: string | null;
};

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function createUserClient(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase public environment variables are missing.");
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

function normaliseCount(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 10;
  }

  return Math.min(parsed, 100);
}

function createSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 45);
}

function createRandomPassword(): string {
  return `${randomBytes(24).toString("hex")}Aa1!`;
}

function createLocation(client: DemoClient): string {
  return [client.city, client.province]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(", ");
}

function createEmail(client: DemoClient): string {
  const companySlug = createSlug(client.display_name) || "client";
  const uniquePart = client.id.replaceAll("-", "").slice(0, 10);

  return `${companySlug}.${uniquePart}@demo.freelancehubsa.co.za`;
}

function shuffle<T>(values: T[]): T[] {
  const copy = [...values];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [copy[index], copy[randomIndex]] = [
      copy[randomIndex],
      copy[index],
    ];
  }

  return copy;
}

export async function POST(request: NextRequest) {
  let createdAuthUserIds: string[] = [];

  try {
    /*
     * Verify the person calling this route.
     */
    const authorizationHeader = request.headers.get("authorization");

    if (!authorizationHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "Authentication is required.",
        },
        {
          status: 401,
        }
      );
    }

    const accessToken = authorizationHeader.slice("Bearer ".length).trim();

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Invalid access token.",
        },
        {
          status: 401,
        }
      );
    }

    const userClient = createUserClient(accessToken);

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Your session is invalid or has expired.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * Use the service-role client only after the caller has been verified.
     */
    const adminClient = createAdminClient();

    const { data: callerProfile, error: callerProfileError } =
      await adminClient
        .from("profiles")
        .select("id, is_admin, suspended")
        .eq("id", user.id)
        .maybeSingle();

    if (callerProfileError) {
      throw new Error(
        `Could not verify the administrator: ${callerProfileError.message}`
      );
    }

    if (!callerProfile?.is_admin || callerProfile.suspended) {
      return NextResponse.json(
        {
          error: "Administrator access is required.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Read the requested number of accounts.
     */
    let body: unknown = {};

    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const requestedCount = normaliseCount(
      (body as { count?: unknown }).count
    );

    /*
     * Load all active demo-client records.
     */
    const { data: demoClients, error: clientsError } = await adminClient
      .from("demo_clients")
      .select(
        `
          id,
          display_name,
          industry,
          description,
          city,
          province,
          country,
          verified,
          is_active,
          created_at
        `
      )
      .eq("is_active", true);

    if (clientsError) {
      throw new Error(
        `Could not load demo clients: ${clientsError.message}`
      );
    }

    if (!demoClients?.length) {
      return NextResponse.json(
        {
          error:
            "No active demo clients were found. Generate demo clients first.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Identify demo clients that already have authenticated profiles.
     */
    const { data: existingProfiles, error: profilesError } =
      await adminClient
        .from("profiles")
        .select("demo_client_id")
        .not("demo_client_id", "is", null);

    if (profilesError) {
      throw new Error(
        `Could not inspect existing demo profiles: ${profilesError.message}`
      );
    }

    const usedDemoClientIds = new Set(
      ((existingProfiles ?? []) as ExistingDemoProfile[])
        .map((profile) => profile.demo_client_id)
        .filter((id): id is string => Boolean(id))
    );

    const availableClients = shuffle(
      (demoClients as DemoClient[]).filter(
        (client) => !usedDemoClientIds.has(client.id)
      )
    );

    const selectedClients = availableClients.slice(0, requestedCount);

    if (!selectedClients.length) {
      return NextResponse.json({
        requested: requestedCount,
        inserted: 0,
        availableBeforeGeneration: 0,
        message:
          "Every active demo client already has an authenticated profile.",
      });
    }

    const createdProfiles: Array<{
      id: string;
      fullName: string;
      email: string;
      demoClientId: string;
    }> = [];

    const failedClients: Array<{
      demoClientId: string;
      company: string;
      reason: string;
    }> = [];

    /*
     * Create one Auth user and one profile for each selected company.
     */
    for (const client of selectedClients) {
      const email = createEmail(client);
      const password = createRandomPassword();

      const { data: authData, error: authError } =
        await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: client.display_name,
            role: "client",
            is_demo: true,
            demo_client_id: client.id,
          },
        });

      if (authError || !authData.user) {
        failedClients.push({
          demoClientId: client.id,
          company: client.display_name,
          reason:
            authError?.message ??
            "Supabase did not return the created Auth user.",
        });

        continue;
      }

      const authUserId = authData.user.id;
      createdAuthUserIds.push(authUserId);

      const industry =
        client.industry?.trim() || "Professional Services";

      const description =
        client.description?.trim() ||
        `${client.display_name} is a South African ${industry.toLowerCase()} company that hires skilled freelancers through Freelance Hub SA.`;

      const location = createLocation(client);

      /*
       * Upsert is used because your signup trigger may have already created
       * a basic profile when the Auth user was created.
       */
      const { error: profileError } = await adminClient
        .from("profiles")
        .upsert(
          {
            id: authUserId,
            email,
            full_name: client.display_name,
            role: "client",
            bio: description,
            category: industry,
            is_admin: false,
            verified: client.verified ?? true,
            top_rated: false,
            suspended: false,
            email_verified: true,
            is_demo: true,
            demo_expires_at: new Date(
              Date.now() + 365 * 24 * 60 * 60 * 1000
            ).toISOString(),
            country: client.country?.trim() || "South Africa",
            availability: "Available",
            location: location || null,
            response_time: "Within 2 hours",
            tagline: "Hiring skilled South African freelancers",
            completed_jobs: Math.floor(Math.random() * 18) + 1,
            completed_projects: Math.floor(Math.random() * 18) + 1,
            repeat_clients: 0,
            completion_rate: 100,
            demo_client_id: client.id,
            created_at:
              client.created_at ?? new Date().toISOString(),
            last_seen: new Date().toISOString(),
          },
          {
            onConflict: "id",
          }
        );

      if (profileError) {
        /*
         * Remove the newly created Auth account when its profile fails.
         * This prevents orphaned demo users.
         */
        await adminClient.auth.admin.deleteUser(authUserId);

        createdAuthUserIds = createdAuthUserIds.filter(
          (id) => id !== authUserId
        );

        failedClients.push({
          demoClientId: client.id,
          company: client.display_name,
          reason: profileError.message,
        });

        continue;
      }

      createdProfiles.push({
        id: authUserId,
        fullName: client.display_name,
        email,
        demoClientId: client.id,
      });
    }

    const { count: totalDemoClientProfiles } = await adminClient
      .from("profiles")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("is_demo", true)
      .eq("role", "client");

    return NextResponse.json({
      success: true,
      requested: requestedCount,
      availableBeforeGeneration: availableClients.length,
      inserted: createdProfiles.length,
      failed: failedClients.length,
      totalDemoClientProfiles: totalDemoClientProfiles ?? 0,
      createdProfiles,
      failures: failedClients,
    });
  } catch (error) {
    console.error("Demo client generation failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      },
      {
        status: 500,
      }
    );
  }
}