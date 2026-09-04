import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

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

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id || typeof id !== "string") {
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

    const admin = createAdminClient();

    // ============================================
    // LOAD PROFILE FIRST
    // ============================================

    const {
      data: profile,
      error: profileError,
    } = await admin
      .from("profiles")
      .select(`
        id,
        role,
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

    // ============================================
    // DELETE PRIVATE VERIFICATION DOCUMENT
    // ============================================

    if (profile?.verification_document_url) {
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
          error:
            "Unable to delete user profile.",
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