import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// ============================================
// SERVICE ROLE CLIENT
// ============================================

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// ============================================
// POST - DELETE USER
// ============================================

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (
      !supabaseUrl ||
      !anonKey ||
      !serviceRoleKey
    ) {
      console.error(
        "Delete user API configuration is incomplete."
      );

      return NextResponse.json(
        {
          success: false,
          error: "Server configuration is incomplete.",
        },
        {
          status: 500,
        }
      );
    }

    // ============================================
    // GET ADMIN ACCESS TOKEN
    // ============================================

    const authorization =
      req.headers.get("authorization");

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const accessToken =
      authorization.replace("Bearer ", "").trim();

    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    // ============================================
    // VERIFY LOGGED-IN USER
    // ============================================

    const authClient = createClient(
      supabaseUrl,
      anonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    const {
      data: authData,
      error: authError,
    } = await authClient.auth.getUser(accessToken);

    if (
      authError ||
      !authData.user
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired session.",
        },
        {
          status: 401,
        }
      );
    }

    const loggedInUser =
      authData.user;

    const admin =
      createAdminClient();

    // ============================================
    // CHECK CALLER IS AN ADMIN
    // ============================================

    const {
      data: adminProfile,
      error: adminProfileError,
    } = await admin
      .from("profiles")
      .select(`
        id,
        is_admin
      `)
      .eq("id", loggedInUser.id)
      .maybeSingle();

    if (adminProfileError) {
      console.error(
        "Admin profile lookup error:",
        adminProfileError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to verify administrator.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      !adminProfile ||
      adminProfile.is_admin !== true
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Administrator access required.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================
    // GET USER TO DELETE
    // ============================================

    const body =
      await req.json();

    const id =
      body?.id;

    if (
      !id ||
      typeof id !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    // ============================================
    // PREVENT ADMIN DELETING THEMSELVES
    // ============================================

    if (
      id === loggedInUser.id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You cannot delete your own administrator account.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================
    // LOAD TARGET PROFILE
    // ============================================

    const {
      data: profile,
      error: profileError,
    } = await admin
      .from("profiles")
      .select(`
        id,
        role,
        is_admin,
        verification_document_url
      `)
      .eq("id", id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "Delete user profile lookup error:",
        profileError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load user profile.",
        },
        {
          status: 500,
        }
      );
    }

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: "User profile not found.",
        },
        {
          status: 404,
        }
      );
    }

    // ============================================
    // PROTECT OTHER ADMIN ACCOUNTS
    // ============================================

    if (
      profile.is_admin === true
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Administrator accounts cannot be deleted from this page.",
        },
        {
          status: 403,
        }
      );
    }

    // ============================================
    // DELETE PRIVATE VERIFICATION DOCUMENT
    // ============================================

    if (
      profile.verification_document_url
    ) {
      const {
        error: storageDeleteError,
      } = await admin.storage
        .from("verification-documents")
        .remove([
          profile.verification_document_url,
        ]);

      if (storageDeleteError) {
        console.error(
          "Verification document delete error:",
          storageDeleteError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Unable to delete verification document.",
          },
          {
            status: 500,
          }
        );
      }
    }

    // ============================================
    // DELETE PROFILE
    // ============================================

    const {
      error: profileDeleteError,
    } = await admin
      .from("profiles")
      .delete()
      .eq("id", id);

    if (profileDeleteError) {
      console.error(
        "Profile delete error:",
        profileDeleteError
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to delete user profile.",
        },
        {
          status: 500,
        }
      );
    }

    // ============================================
    // DELETE AUTH USER
    // ============================================

    const {
      error: authDeleteError,
    } = await admin.auth.admin.deleteUser(id);

    if (authDeleteError) {
      console.error(
        "Auth user delete error:",
        authDeleteError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Profile was removed, but the login account could not be deleted.",
        },
        {
          status: 500,
        }
      );
    }

    // ============================================
    // SUCCESS
    // ============================================

    return NextResponse.json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (err) {
    console.error(
      "Delete user error:",
      err
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "An unexpected error occurred while deleting the user.",
      },
      {
        status: 500,
      }
    );
  }
}