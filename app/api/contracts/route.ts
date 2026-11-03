import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const contractId = body?.contractId;

    if (!contractId || typeof contractId !== "string") {
      return NextResponse.json(
        { error: "Contract ID is required." },
        { status: 400 }
      );
    }

    /*
     * ==========================================
     * ENVIRONMENT VARIABLES
     * ==========================================
     */

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
        "Approve work API: missing Supabase environment variables."
      );

      return NextResponse.json(
        {
          error:
            "Server configuration is incomplete.",
        },
        { status: 500 }
      );
    }

    /*
     * ==========================================
     * AUTHORIZATION HEADER
     * ==========================================
     */

    const authHeader =
      request.headers.get("authorization");

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const accessToken =
      authHeader.replace("Bearer ", "");

    /*
     * ==========================================
     * VERIFY CURRENT USER
     * ==========================================
     */

    const authClient = createClient(
      supabaseUrl,
      anonKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(
      accessToken
    );

    if (userError || !user) {
      console.error(
        "Approve work auth error:",
        userError
      );

      return NextResponse.json(
        { error: "Invalid session." },
        { status: 401 }
      );
    }

    /*
     * ==========================================
     * SERVER ADMIN CLIENT
     * ==========================================
     */

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

    /*
     * ==========================================
     * LOAD CONTRACT
     * ==========================================
     */

    const {
      data: contract,
      error: contractError,
    } = await admin
      .from("contracts")
      .select(`
        id,
        client_id,
        freelancer_id,
        project_id,
        project_title,
        status
      `)
      .eq("id", contractId)
      .maybeSingle();

    if (contractError) {
      console.error(
        "Approve work contract error:",
        contractError
      );

      return NextResponse.json(
        { error: "Unable to load contract." },
        { status: 500 }
      );
    }

    if (!contract) {
      return NextResponse.json(
        { error: "Contract not found." },
        { status: 404 }
      );
    }

    /*
     * ==========================================
     * CLIENT OWNERSHIP CHECK
     * ==========================================
     */

    if (contract.client_id !== user.id) {
      return NextResponse.json(
        {
          error:
            "You are not authorized to approve this contract.",
        },
        { status: 403 }
      );
    }

    /*
     * ==========================================
     * CONTRACT MUST BE COMPLETED
     * ==========================================
     */

    if (contract.status !== "completed") {
      return NextResponse.json(
        {
          error:
            "The freelancer must complete the work before it can be approved.",
        },
        { status: 400 }
      );
    }

    if (!contract.project_id) {
      return NextResponse.json(
        {
          error:
            "This contract is not linked to a project.",
        },
        { status: 400 }
      );
    }

    /*
     * ==========================================
     * LOAD PROJECT
     * ==========================================
     */

    const {
      data: project,
      error: projectError,
    } = await admin
      .from("projects")
      .select(`
        id,
        client_id,
        freelancer_id,
        status,
        payment_status,
        paid_at
      `)
      .eq("id", contract.project_id)
      .maybeSingle();

    if (projectError) {
      console.error(
        "Approve work project error:",
        projectError
      );

      return NextResponse.json(
        { error: "Unable to load project." },
        { status: 500 }
      );
    }

    if (!project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    /*
     * ==========================================
     * PROJECT OWNERSHIP CHECK
     * ==========================================
     */

    if (project.client_id !== user.id) {
      return NextResponse.json(
        {
          error:
            "You are not authorized to approve this project.",
        },
        { status: 403 }
      );
    }

    /*
     * ==========================================
     * PROJECT MUST BE COMPLETED
     * ==========================================
     */

    if (project.status !== "completed") {
      return NextResponse.json(
        {
          error:
            "The project has not been completed yet.",
        },
        { status: 400 }
      );
    }

    /*
     * ==========================================
     * PAYMENT MUST HAVE BEEN RECEIVED
     * ==========================================
     */

    if (
      project.payment_status !== "paid" ||
      !project.paid_at
    ) {
      return NextResponse.json(
        {
          error:
            "Project funding has not been confirmed.",
        },
        { status: 400 }
      );
    }

    /*
     * ==========================================
     * VERIFY WORK FILE EXISTS
     * ==========================================
     */

    const {
      data: deliveries,
      error: deliveryError,
    } = await admin
      .from("contract_deliveries")
      .select("id, file_url")
      .eq("contract_id", contract.id)
      .limit(1);

    if (deliveryError) {
      console.error(
        "Approve work delivery error:",
        deliveryError
      );

      return NextResponse.json(
        {
          error:
            "Unable to verify submitted work.",
        },
        { status: 500 }
      );
    }

    const hasDelivery =
      Array.isArray(deliveries) &&
      deliveries.some(
        (delivery) =>
          typeof delivery.file_url ===
            "string" &&
          delivery.file_url.trim().length > 0
      );

    if (!hasDelivery) {
      return NextResponse.json(
        {
          error:
            "No submitted work file was found.",
        },
        { status: 400 }
      );
    }

    /*
     * ==========================================
     * LOAD PAYOUT
     * ==========================================
     */

    const {
      data: payout,
      error: payoutError,
    } = await admin
      .from("freelancer_payouts")
      .select(`
        id,
        status,
        payment_type,
        paid_out_at
      `)
      .eq("contract_id", contract.id)
      .eq("project_id", project.id)
      .maybeSingle();

    if (payoutError) {
      console.error(
        "Approve work payout error:",
        payoutError
      );

      return NextResponse.json(
        {
          error:
            "Unable to load freelancer payout.",
        },
        { status: 500 }
      );
    }

    if (!payout) {
      return NextResponse.json(
        {
          error:
            "Freelancer payout record was not found.",
        },
        { status: 404 }
      );
    }

    /*
     * ==========================================
     * ALREADY PAID
     * ==========================================
     */

    if (payout.paid_out_at) {
      return NextResponse.json(
        {
          error:
            "This freelancer payout has already been paid.",
        },
        { status: 400 }
      );
    }

    /*
     * ==========================================
     * IDEMPOTENT APPROVAL
     * ==========================================
     */

    if (payout.status === "approved") {
      return NextResponse.json({
        success: true,
        alreadyApproved: true,
        message:
          "Work has already been approved.",
      });
    }

    /*
     * ==========================================
     * PAYOUT MUST CURRENTLY BE HELD
     * ==========================================
     */

    if (payout.status !== "held") {
      return NextResponse.json(
        {
          error: `This payout cannot be approved from status "${payout.status}".`,
        },
        { status: 400 }
      );
    }

    /*
     * ==========================================
     * APPROVE PAYOUT
     *
     * IMPORTANT:
     * We do NOT set paid_out_at here.
     * ==========================================
     */

    const {
      error: updateError,
    } = await admin
      .from("freelancer_payouts")
      .update({
        status: "approved",
        approved_for_payout_at:
          new Date().toISOString(),
      })
      .eq("id", payout.id)
      .eq("status", "held");

    if (updateError) {
      console.error(
        "Approve payout update error:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            "Unable to approve freelancer payout.",
        },
        { status: 500 }
      );
    }

    /*
     * ==========================================
     * CONTRACT ACTIVITY
     * ==========================================
     */

    const {
      error: activityError,
    } = await admin
      .from("contract_activity")
      .insert({
        contract_id: contract.id,
        action:
          "Client approved completed work for payout",
      });

    if (activityError) {
      console.error(
        "Approve work activity error:",
        activityError
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Work approved successfully. Freelancer payment is now approved for payout.",
    });
  } catch (error) {
    console.error(
      "Approve work API unexpected error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong while approving the work.",
      },
      { status: 500 }
    );
  }
}