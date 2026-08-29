import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest
) {
  try {
    // ==========================================
    // ENVIRONMENT
    // ==========================================

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Server configuration is incomplete.",
        },
        {
          status: 500,
        }
      );
    }

    // ==========================================
    // AUTHORIZATION HEADER
    // ==========================================

    const authorization =
      request.headers.get(
        "authorization"
      );

    if (
      !authorization ||
      !authorization.startsWith(
        "Bearer "
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const accessToken =
      authorization.substring(7);

    const admin =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

    // ==========================================
    // VERIFY LOGGED-IN USER
    // ==========================================

    const {
      data: userData,
      error: userError,
    } =
      await admin.auth.getUser(
        accessToken
      );

    if (
      userError ||
      !userData.user
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to verify your login session.",
        },
        {
          status: 401,
        }
      );
    }

    // ==========================================
    // VERIFY ADMIN
    // ==========================================

    const {
      data: adminProfile,
      error: adminProfileError,
    } = await admin
      .from("profiles")
      .select(
        `
        id,
        is_admin
        `
      )
      .eq(
        "id",
        userData.user.id
      )
      .maybeSingle();

    if (
      adminProfileError ||
      !adminProfile?.is_admin
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Administrator access required.",
        },
        {
          status: 403,
        }
      );
    }

    // ==========================================
    // SEARCH TERM
    // ==========================================

    const searchParams =
      request.nextUrl.searchParams;

    const query =
      (
        searchParams.get("q") ||
        ""
      )
        .trim()
        .toLowerCase();

    // Don't return the whole user database
    // when there is no search term.
    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        users: [],
      });
    }

    // ==========================================
    // LOAD PROFILES
    // ==========================================

    const {
      data: profiles,
      error: profilesError,
    } = await admin
      .from("profiles")
      .select(
        `
        id,
        full_name,
        role,
        is_demo
        `
      )
      .eq(
        "is_demo",
        false
      )
      .limit(100);

    if (profilesError) {
      console.error(
        "Email user profiles error:",
        profilesError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to load users.",
        },
        {
          status: 500,
        }
      );
    }

    // ==========================================
    // LOAD AUTH USERS
    // ==========================================

    const {
      data: authData,
      error: authError,
    } =
      await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (authError) {
      console.error(
        "Auth users error:",
        authError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to load user email addresses.",
        },
        {
          status: 500,
        }
      );
    }

    const emailMap =
      new Map<
        string,
        string
      >();

    for (
      const authUser of
      authData.users
    ) {
      if (authUser.email) {
        emailMap.set(
          authUser.id,
          authUser.email
        );
      }
    }

    // ==========================================
    // MERGE + SEARCH
    // ==========================================

    const users =
      (profiles || [])
        .map((profile) => {
          const email =
            emailMap.get(
              profile.id
            ) || "";

          return {
            id:
              profile.id,

            fullName:
              profile.full_name ||
              "Unnamed User",

            role:
              profile.role ||
              "user",

            email,
          };
        })
        .filter((user) => {
          if (!user.email) {
            return false;
          }

          const searchable =
            `${user.fullName} ${user.email} ${user.role}`
              .toLowerCase();

          return searchable.includes(
            query
          );
        })
        .slice(0, 20);

    // ==========================================
    // RESPONSE
    // ==========================================

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error(
      "Admin email user search error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to search users.",
      },
      {
        status: 500,
      }
    );
  }
}