import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL!;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ========================================================
// SERVICE ROLE CLIENT
// Used ONLY for trusted server-side admin operations.
// ========================================================

const admin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ========================================================
// REQUIRE ADMIN
// ========================================================

async function requireAdmin(
  request: NextRequest
) {
  const authHeader =
    request.headers.get(
      "authorization"
    );

  if (
    !authHeader ||
    !authHeader.startsWith(
      "Bearer "
    )
  ) {
    return {
      ok: false as const,
      error:
        "Missing authorization token.",
      status: 401,
    };
  }

  const token = authHeader
    .slice(7)
    .trim();

  if (!token) {
    return {
      ok: false as const,
      error:
        "Missing authorization token.",
      status: 401,
    };
  }

  // ======================================================
  // AUTH CLIENT
  //
  // Validate the user's access token using the normal
  // Supabase anon client rather than the service-role
  // client.
  // ======================================================

  const authClient = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },

      global: {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      },
    }
  );

  const {
    data: userData,
    error: userError,
  } = await authClient.auth.getUser(
    token
  );

  if (userError) {
    console.error(
      "Admin authentication error:",
      {
        message:
          userError.message,
        status:
          userError.status,
        name:
          userError.name,
      }
    );

    return {
      ok: false as const,
      error:
        "Invalid or expired session.",
      status: 401,
    };
  }

  const user =
    userData.user;


  if (!user) {
    console.error(
      "Admin authentication error: no user returned."
    );

    return {
      ok: false as const,
      error:
        "Invalid or expired session.",
      status: 401,
    };
  }

  // ======================================================
  // CHECK ADMIN PROFILE
  // ======================================================

  const {
  data: profile,
  error: profileError,
} = await authClient
  .from("profiles")
  .select(
    `
    id,
    is_admin,
    role
  `
  )
  .eq("id", user.id)
  .maybeSingle();

  if (profileError) {
  console.error(
    "Admin profile lookup error:",
    profileError
  );

  return {
    ok: false as const,
    error:
      "Unable to verify admin access.",
    status: 500,
  };
}

if (!profile) {
  console.error(
    "Authenticated user has no matching profile:",
    {
      userId: user.id,
      email: user.email,
    }
  );

  return {
    ok: false as const,
    error:
      "Admin profile could not be found.",
    status: 403,
  };
}

  if (
    !profile ||
    profile.is_admin !== true
  ) {
    return {
      ok: false as const,
      error:
        "Admin access required.",
      status: 403,
    };
  }

  return {
    ok: true as const,
    user,
    profile,
  };
}

// ========================================================
// GET FREELANCER VERIFICATIONS
// ========================================================

export async function GET(
  request: NextRequest
) {
  try {
    const auth =
      await requireAdmin(
        request
      );

    if (!auth.ok) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error,
        },
        {
          status: auth.status,
        }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const requestedStatus =
      searchParams.get(
        "status"
      ) || "pending";

    const allowedStatuses =
      new Set([
        "all",
        "pending",
        "verified",
        "rejected",
        "not_submitted",
      ]);

    const status =
      allowedStatuses.has(
        requestedStatus
      )
        ? requestedStatus
        : "pending";

    // ====================================================
    // LOAD FREELANCERS
    // ====================================================

    let query = admin
      .from("profiles")
      .select(
        `
        id,
        full_name,
        email,
        role,
        category,
        headline,
        location,
        avatar_url,
        cv_url,
        portfolio_url,
        skills,
        years_experience,
        hourly_rate,
        verified,
        verification_status,
        verification_document_url,
        suspended,
        top_rated,
        is_demo,
        created_at
      `
      )
      .eq(
        "role",
        "freelancer"
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (
      status !== "all"
    ) {
      query = query.eq(
        "verification_status",
        status
      );
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      console.error(
        "Verification fetch error:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error:
            error.message,
        },
        {
          status: 500,
        }
      );
    }

    // ====================================================
    // CREATE PRIVATE SIGNED ID LINKS
    //
    // These expire after 10 minutes.
    // ====================================================

    const records =
      await Promise.all(
        (data || []).map(
          async (
            freelancer
          ) => {
            let verificationDocumentSignedUrl:
              | string
              | null = null;

            if (
              freelancer.verification_document_url
            ) {
              const {
                data:
                  signedData,
                error:
                  signedError,
              } =
                await admin.storage
                  .from(
                    "verification-documents"
                  )
                  .createSignedUrl(
                    freelancer.verification_document_url,
                    60 * 10
                  );

              if (
                signedError
              ) {
                console.error(
                  `Unable to create signed verification URL for ${freelancer.id}:`,
                  signedError
                );
              }

              if (
                !signedError &&
                signedData?.signedUrl
              ) {
                verificationDocumentSignedUrl =
                  signedData.signedUrl;
              }
            }

            return {
              ...freelancer,

              verification_document_signed_url:
                verificationDocumentSignedUrl,
            };
          }
        )
      );

    return NextResponse.json(
      {
        success: true,
        verifications:
          records,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET freelancer verifications error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to load freelancer verifications.",
      },
      {
        status: 500,
      }
    );
  }
}

// ========================================================
// APPROVE / REJECT
// ========================================================

export async function PATCH(
  request: NextRequest
) {
  try {
    const auth =
      await requireAdmin(
        request
      );

    if (!auth.ok) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error,
        },
        {
          status: auth.status,
        }
      );
    }

    // ====================================================
    // READ REQUEST
    // ====================================================

    let body: {
      freelancerId?: unknown;
      action?: unknown;
    };

    try {
      body =
        await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    const freelancerId =
      typeof body.freelancerId ===
      "string"
        ? body.freelancerId.trim()
        : "";

    const action =
      typeof body.action ===
      "string"
        ? body.action.trim()
        : "";

    if (!freelancerId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Freelancer ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      action !== "approve" &&
      action !== "reject"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Action must be approve or reject.",
        },
        {
          status: 400,
        }
      );
    }

    // ====================================================
    // LOAD FREELANCER
    // ====================================================

    const {
      data: freelancer,
      error:
        freelancerError,
    } = await admin
      .from("profiles")
      .select(
        `
        id,
        full_name,
        email,
        role,
        verified,
        verification_status,
        verification_document_url
      `
      )
      .eq(
        "id",
        freelancerId
      )
      .single();

    if (
      freelancerError ||
      !freelancer
    ) {
      console.error(
        "Freelancer lookup error:",
        freelancerError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Freelancer could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      freelancer.role !==
      "freelancer"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This account is not a freelancer.",
        },
        {
          status: 400,
        }
      );
    }

    // ====================================================
    // APPROVAL VALIDATION
    // ====================================================

    if (
      action === "approve"
    ) {
      if (
        freelancer.verification_status !==
        "pending"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Only pending verification requests can be approved.",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !freelancer.verification_document_url
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "A verification document is required before approval.",
          },
          {
            status: 400,
          }
        );
      }
    }

    // ====================================================
    // UPDATE VERIFICATION
    // ====================================================

    const updates =
      action === "approve"
        ? {
            verified:
              true,

            verification_status:
              "verified",
          }
        : {
            verified:
              false,

            verification_status:
              "rejected",
          };

    const {
      data:
        updatedFreelancer,
      error:
        updateError,
    } = await admin
      .from("profiles")
      .update(updates)
      .eq(
        "id",
        freelancerId
      )
      .select(
        `
        id,
        full_name,
        email,
        verified,
        verification_status
      `
      )
      .single();

    if (updateError) {
      console.error(
        "Verification update error:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            updateError.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,

        message:
          action ===
          "approve"
            ? "Freelancer approved successfully."
            : "Freelancer verification rejected.",

        freelancer:
          updatedFreelancer,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "PATCH freelancer verification error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to update freelancer verification.",
      },
      {
        status: 500,
      }
    );
  }
}