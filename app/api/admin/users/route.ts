import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdminClient() {
  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      "Supabase admin configuration is incomplete."
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

async function requireAdmin(
  request: NextRequest
) {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization?.startsWith(
      "Bearer "
    )
  ) {
    return {
      error: NextResponse.json(
        {
          error:
            "Unauthorized.",
        },
        {
          status: 401,
        }
      ),
    };
  }

  const accessToken =
    authorization.slice(7);

  const admin =
    getAdminClient();

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
    return {
      error: NextResponse.json(
        {
          error:
            "Invalid session.",
        },
        {
          status: 401,
        }
      ),
    };
  }

  const {
    data: profile,
    error: profileError,
  } =
    await admin
      .from("profiles")
      .select("is_admin")
      .eq(
        "id",
        userData.user.id
      )
      .single();

  if (
    profileError ||
    !profile?.is_admin
  ) {
    return {
      error: NextResponse.json(
        {
          error:
            "Administrator access required.",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return {
    admin,
    currentUser:
      userData.user,
  };
}

/* =====================================================
   UPDATE USER
   ===================================================== */

export async function PATCH(
  request: NextRequest
) {
  try {
    const auth =
      await requireAdmin(
        request
      );

    if ("error" in auth) {
      return auth.error;
    }

    const {
      admin,
      currentUser,
    } = auth;

    const body =
      await request.json();

    const {
      id,
      action,
    } = body;

    if (!id) {
      return NextResponse.json(
        {
          error:
            "User ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------
       SUSPEND / UNSUSPEND
       ----------------------------------------- */

    if (
      action ===
      "suspension"
    ) {
      if (
        id ===
        currentUser.id
      ) {
        return NextResponse.json(
          {
            error:
              "You cannot suspend your own administrator account.",
          },
          {
            status: 400,
          }
        );
      }

      const suspended =
        Boolean(
          body.suspended
        );

      const {
        error,
      } =
        await admin
          .from(
            "profiles"
          )
          .update({
            suspended,
          })
          .eq(
            "id",
            id
          );

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        suspended,
      });
    }

    /* -----------------------------------------
       EDIT USER
       ----------------------------------------- */

    if (
      action === "edit"
    ) {
      const fullName =
        String(
          body.full_name ||
            ""
        ).trim();

      const email =
        String(
          body.email ||
            ""
        )
          .trim()
          .toLowerCase();

      const category =
        body.category
          ? String(
              body.category
            ).trim()
          : null;

      const location =
        body.location
          ? String(
              body.location
            ).trim()
          : null;

      const country =
        body.country
          ? String(
              body.country
            ).trim()
          : null;

      const bio =
        body.bio
          ? String(
              body.bio
            ).trim()
          : null;

      if (!email) {
        return NextResponse.json(
          {
            error:
              "Email is required.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * Update Supabase Auth first.
       */

      const {
        error: authUpdateError,
      } =
        await admin.auth.admin.updateUserById(
          id,
          {
            email,
            user_metadata: {
              full_name:
                fullName,
            },
          }
        );

      if (
        authUpdateError
      ) {
        return NextResponse.json(
          {
            error:
              authUpdateError.message,
          },
          {
            status: 400,
          }
        );
      }

      /*
       * Update profile.
       */

      const {
        data:
          updatedProfile,
        error:
          profileUpdateError,
      } =
        await admin
          .from(
            "profiles"
          )
          .update({
            full_name:
              fullName,
            email,
            category,
            location,
            country,
            bio,
          })
          .eq(
            "id",
            id
          )
          .select("*")
          .single();

      if (
        profileUpdateError
      ) {
        return NextResponse.json(
          {
            error:
              profileUpdateError.message,
          },
          {
            status: 400,
          }
        );
      }

      return NextResponse.json({
        success: true,
        user:
          updatedProfile,
      });
    }

    return NextResponse.json(
      {
        error:
          "Invalid action.",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(
      "Admin users PATCH error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =====================================================
   DELETE USER
   ===================================================== */

export async function DELETE(
  request: NextRequest
) {
  try {
    const auth =
      await requireAdmin(
        request
      );

    if ("error" in auth) {
      return auth.error;
    }

    const {
      admin,
      currentUser,
    } = auth;

    const body =
      await request.json();

    const id =
      String(
        body.id || ""
      ).trim();

    if (!id) {
      return NextResponse.json(
        {
          error:
            "User ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Protect the currently logged-in administrator.
     */

    if (
      id ===
      currentUser.id
    ) {
      return NextResponse.json(
        {
          error:
            "You cannot delete your own administrator account.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Check target before deleting.
     */

    const {
      data:
        targetProfile,
      error:
        targetError,
    } =
      await admin
        .from(
          "profiles"
        )
        .select(
          "id, full_name, is_admin"
        )
        .eq(
          "id",
          id
        )
        .single();

    if (
      targetError ||
      !targetProfile
    ) {
      return NextResponse.json(
        {
          error:
            "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Extra protection:
     * don't delete another administrator
     * from this screen.
     */

    if (
      targetProfile.is_admin
    ) {
      return NextResponse.json(
        {
          error:
            "Administrator accounts cannot be deleted from User Management.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Delete the Auth user.
     *
     * If profiles.id references auth.users(id)
     * with ON DELETE CASCADE, the profile and
     * related cascade-enabled records will also
     * be removed.
     */

    const {
      error:
        deleteError,
    } =
      await admin.auth.admin.deleteUser(
        id
      );

    if (
      deleteError
    ) {
      return NextResponse.json(
        {
          error:
            deleteError.message,
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json({
      success: true,
      id,
    });
  } catch (error) {
    console.error(
      "Admin users DELETE error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      },
      {
        status: 500,
      }
    );
  }
}