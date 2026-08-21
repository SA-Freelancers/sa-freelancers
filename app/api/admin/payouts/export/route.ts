import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration is incomplete.",
        },
        { status: 500 }
      );
    }

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

    const {
      data: userData,
      error: userError,
    } = await admin.auth.getUser(accessToken);

    if (
      userError ||
      !userData.user
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to verify your login session.",
        },
        { status: 401 }
      );
    }

    const {
      data: profile,
      error: profileError,
    } = await admin
      .from("profiles")
      .select("id, is_admin")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (
      profileError ||
      !profile?.is_admin
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Administrator access required.",
        },
        { status: 403 }
      );
    }

    const {
      data: payouts,
      error: payoutError,
    } = await admin
      .from("freelancer_payouts")
      .select(
        `
        id,
        milestone_id,
        freelancer_id,
        gross_amount,
        platform_fee,
        freelancer_amount,
        status,
        payout_reference,
        payout_notes,
        payment_received_at,
        approved_for_payout_at,
        payout_requested_at,
        processing_started_at,
        paid_out_at,
        processed_by,
        created_at
        `
      )
      .order("created_at", {
        ascending: false,
      });

    if (payoutError) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to load payout report.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        payouts: payouts || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Payout export error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to generate payout report.",
      },
      { status: 500 }
    );
  }
}