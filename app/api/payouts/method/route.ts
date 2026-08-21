import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
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

async function getAuthenticatedUser(
  request: NextRequest
) {
  const admin = getAdminClient();

  if (!admin) {
    return {
      admin: null,
      user: null,
      error:
        "Server configuration is incomplete.",
      status: 500,
    };
  }

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
    return {
      admin,
      user: null,
      error:
        "Authentication required.",
      status: 401,
    };
  }

  const accessToken =
    authorization.substring(7);

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
      admin,
      user: null,
      error:
        "Unable to verify your login session.",
      status: 401,
    };
  }

  return {
    admin,
    user:
      userData.user,
    error: null,
    status: 200,
  };
}

function maskAccountNumber(
  accountNumber: string
) {
  const clean =
    accountNumber.replace(
      /\s+/g,
      ""
    );

  if (clean.length <= 4) {
    return clean;
  }

  return (
    "•••• " +
    clean.slice(-4)
  );
}

/*
 * --------------------------------------------------
 * GET
 *
 * Freelancer loads their saved payout method.
 * --------------------------------------------------
 */

export async function GET(
  request: NextRequest
) {
  try {
    const auth =
      await getAuthenticatedUser(
        request
      );

    if (
      !auth.admin ||
      !auth.user
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            auth.error,
        },
        {
          status:
            auth.status,
        }
      );
    }

    const admin =
      auth.admin;

    const user =
      auth.user;

    /*
     * Verify freelancer role.
     */

    const {
      data: profile,
      error: profileError,
    } = await admin
      .from("profiles")
      .select(
        "id, role"
      )
      .eq(
        "id",
        user.id
      )
      .maybeSingle();

    if (
      profileError ||
      !profile
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Profile could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      profile.role !==
      "freelancer"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only freelancers can manage payout details.",
        },
        {
          status: 403,
        }
      );
    }

    const {
      data: method,
      error: methodError,
    } = await admin
      .from(
        "freelancer_payout_methods"
      )
      .select(
        `
        id,
        freelancer_id,
        account_holder_name,
        bank_name,
        account_number,
        account_type,
        branch_code,
        status,
        created_at,
        updated_at,
        verified_at
        `
      )
      .eq(
        "freelancer_id",
        user.id
      )
      .maybeSingle();

    if (methodError) {
      console.error(
        "Payout method loading error:",
        methodError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to load payout details.",
        },
        {
          status: 500,
        }
      );
    }

    if (!method) {
      return NextResponse.json(
        {
          success: true,
          method: null,
        },
        {
          status: 200,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,

        method: {
          id:
            method.id,

          accountHolderName:
            method.account_holder_name,

          bankName:
            method.bank_name,

          accountNumberMasked:
            maskAccountNumber(
              method.account_number
            ),

          accountType:
            method.account_type,

          branchCode:
            method.branch_code,

          status:
            method.status,

          verifiedAt:
            method.verified_at,

          updatedAt:
            method.updated_at,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Unexpected payout method GET error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "An unexpected server error occurred.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * --------------------------------------------------
 * POST
 *
 * Freelancer creates or updates banking details.
 * --------------------------------------------------
 */

export async function POST(
  request: NextRequest
) {
  try {
    const auth =
      await getAuthenticatedUser(
        request
      );

    if (
      !auth.admin ||
      !auth.user
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            auth.error,
        },
        {
          status:
            auth.status,
        }
      );
    }

    const admin =
      auth.admin;

    const user =
      auth.user;

    /*
     * Verify freelancer role.
     */

    const {
      data: profile,
      error: profileError,
    } = await admin
      .from("profiles")
      .select(
        "id, role"
      )
      .eq(
        "id",
        user.id
      )
      .maybeSingle();

    if (
      profileError ||
      !profile
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Profile could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      profile.role !==
      "freelancer"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only freelancers can manage payout details.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Read body.
     */

    let body: {
      accountHolderName?: string;
      bankName?: string;
      accountNumber?: string;
      accountType?: string;
      branchCode?: string;
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

    const accountHolderName =
      String(
        body.accountHolderName ||
          ""
      ).trim();

    const bankName =
      String(
        body.bankName || ""
      ).trim();

    const accountNumber =
      String(
        body.accountNumber ||
          ""
      )
        .replace(/\s+/g, "")
        .trim();

    const accountType =
      String(
        body.accountType ||
          ""
      ).trim();

    const branchCode =
      String(
        body.branchCode ||
          ""
      )
        .replace(/\s+/g, "")
        .trim();

    /*
     * Validate.
     */

    if (
      !accountHolderName ||
      !bankName ||
      !accountNumber ||
      !accountType ||
      !branchCode
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please complete all payout banking fields.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !/^[0-9]+$/.test(
        accountNumber
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Account number must contain numbers only.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      accountNumber.length <
        6 ||
      accountNumber.length >
        20
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter a valid bank account number.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !/^[0-9]{6}$/.test(
        branchCode
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Branch code must contain exactly 6 digits.",
        },
        {
          status: 400,
        }
      );
    }

    const allowedAccountTypes =
      [
        "Cheque",
        "Savings",
        "Current",
        "Transmission",
      ];

    if (
      !allowedAccountTypes.includes(
        accountType
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please select a valid account type.",
        },
        {
          status: 400,
        }
      );
    }

    const now =
      new Date().toISOString();

    /*
     * Any banking change resets verification
     * back to pending.
     */

    const {
      data: savedMethod,
      error: saveError,
    } = await admin
      .from(
        "freelancer_payout_methods"
      )
      .upsert(
        {
          freelancer_id:
            user.id,

          account_holder_name:
            accountHolderName,

          bank_name:
            bankName,

          account_number:
            accountNumber,

          account_type:
            accountType,

          branch_code:
            branchCode,

          status:
            "pending",

          verified_at:
            null,

          updated_at:
            now,
        },
        {
          onConflict:
            "freelancer_id",
        }
      )
      .select(
        `
        id,
        account_holder_name,
        bank_name,
        account_number,
        account_type,
        branch_code,
        status,
        updated_at
        `
      )
      .single();

    if (saveError) {
      console.error(
        "Payout method save error:",
        saveError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to save payout details.",
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
          "Payout banking details saved successfully.",

        method: {
          id:
            savedMethod.id,

          accountHolderName:
            savedMethod.account_holder_name,

          bankName:
            savedMethod.bank_name,

          accountNumberMasked:
            maskAccountNumber(
              savedMethod.account_number
            ),

          accountType:
            savedMethod.account_type,

          branchCode:
            savedMethod.branch_code,

          status:
            savedMethod.status,

          updatedAt:
            savedMethod.updated_at,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Unexpected payout method POST error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "An unexpected server error occurred.",
      },
      {
        status: 500,
      }
    );
  }
}