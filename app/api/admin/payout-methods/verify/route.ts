import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type VerificationAction = "verify" | "reject";

export async function POST(request: NextRequest) {
  try {
    // --------------------------------------------------
    // ENVIRONMENT VARIABLES
    // --------------------------------------------------

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        "Missing Supabase server environment variables."
      );

      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // AUTHORIZATION HEADER
    // --------------------------------------------------

    const authorization =
      request.headers.get("authorization");

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const accessToken =
      authorization.substring(7);

    // --------------------------------------------------
    // SUPABASE ADMIN CLIENT
    // --------------------------------------------------

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

    // --------------------------------------------------
    // VERIFY USER
    // --------------------------------------------------

    const {
      data: userData,
      error: userError,
    } = await admin.auth.getUser(accessToken);

    if (userError || !userData.user) {
      console.error(
        "Admin payout method authentication error:",
        userError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Your login session could not be verified.",
        },
        { status: 401 }
      );
    }

    const user = userData.user;

    // --------------------------------------------------
    // VERIFY ADMIN
    // --------------------------------------------------

    const {
      data: profile,
      error: profileError,
    } = await admin
      .from("profiles")
      .select("id, is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "Admin profile lookup error:",
        profileError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to verify administrator access.",
        },
        { status: 500 }
      );
    }

    if (!profile?.is_admin) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Administrator access required.",
        },
        { status: 403 }
      );
    }

    // --------------------------------------------------
    // REQUEST BODY
    // --------------------------------------------------

    let body: {
      payoutMethodId?: string;
      action?: VerificationAction;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const payoutMethodId =
      body.payoutMethodId?.trim();

    const action =
      body.action;

    if (!payoutMethodId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payout method ID is required.",
        },
        { status: 400 }
      );
    }

    if (
      action !== "verify" &&
      action !== "reject"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid verification action.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // LOAD PAYOUT METHOD
    // --------------------------------------------------

    const {
      data: payoutMethod,
      error: payoutMethodError,
    } = await admin
      .from("freelancer_payout_methods")
      .select(
        `
          id,
          freelancer_id,
          account_holder_name,
          bank_name,
          account_number,
          account_type,
          branch_code,
          status
        `
      )
      .eq("id", payoutMethodId)
      .maybeSingle();

    if (payoutMethodError) {
      console.error(
        "Payout method lookup error:",
        payoutMethodError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to load payout method.",
        },
        { status: 500 }
      );
    }

    if (!payoutMethod) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payout method not found.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // REQUIRED BANKING FIELDS
    // --------------------------------------------------

    if (
      !payoutMethod.account_holder_name ||
      !payoutMethod.bank_name ||
      !payoutMethod.account_number ||
      !payoutMethod.account_type ||
      !payoutMethod.branch_code
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The freelancer banking details are incomplete.",
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // DETERMINE NEW STATUS
    // --------------------------------------------------

    const newStatus =
      action === "verify"
        ? "verified"
        : "rejected";

    const now =
      new Date().toISOString();

    // --------------------------------------------------
    // UPDATE PAYOUT METHOD
    // --------------------------------------------------

    const {
      data: updatedMethod,
      error: updateError,
    } = await admin
      .from("freelancer_payout_methods")
      .update({
  status: newStatus,

  verified_at:
    action === "verify"
      ? now
      : null,

  updated_at: now,
})
      .eq("id", payoutMethod.id)
      .select(
        `
          id,
          freelancer_id,
          account_holder_name,
          bank_name,
          account_type,
          branch_code,
          status,
          updated_at
        `
      )
      .maybeSingle();

    if (updateError) {
      console.error(
        "Payout method verification update error:",
        updateError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to update payout method.",
        },
        { status: 500 }
      );
    }

    if (!updatedMethod) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The payout method could not be updated.",
        },
        { status: 409 }
      );
    }

    // --------------------------------------------------
    // SUCCESS
    // --------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        payoutMethod: {
          id: updatedMethod.id,
          freelancerId:
            updatedMethod.freelancer_id,
          accountHolderName:
            updatedMethod.account_holder_name,
          bankName:
            updatedMethod.bank_name,
          accountType:
            updatedMethod.account_type,
          branchCode:
            updatedMethod.branch_code,
          status:
            updatedMethod.status,
          updatedAt:
            updatedMethod.updated_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Unexpected payout method verification error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "An unexpected server error occurred.",
      },
      { status: 500 }
    );
  }
}