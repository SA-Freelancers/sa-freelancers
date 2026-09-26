import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  Resend,
} from "resend";

import {
  calculateProfileCompleteness,
  type ProfileCompletenessProfile,
} from "@/app/lib/profileCompleteness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const THREE_DAYS_MS =
  3 * 24 * 60 * 60 * 1000;

type ReminderProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  created_at: string | null;

  suspended: boolean | null;
  is_demo: boolean | null;

  profile_reminder_last_sent_at:
    | string
    | null;

  bio: string | null;
  category: string | null;
  avatar_url: string | null;

  headline: string | null;
  location: string | null;
  country: string | null;

  years_experience: number | null;
  hourly_rate: number | null;

  skills: unknown;
  education: string | null;
  certifications: unknown;

  cv_url: string | null;
  portfolio_url: string | null;
};

// ==================================================
// BASIC HELPERS
// ==================================================

function hasText(
  value: string | null | undefined
) {
  return Boolean(
    value?.trim()
  );
}

function escapeHtml(
  value: string
) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getFirstName(
  fullName: string | null
) {
  const cleanName =
    fullName?.trim();

  if (!cleanName) {
    return "there";
  }

  return cleanName
    .split(/\s+/)[0];
}

function getMissingFieldLabel(
  field: string
) {
  const labels:
    Record<string, string> = {
      fullName:
        "Full name",

      photo:
        "Profile photo",

      headline:
        "Professional headline",

      bio:
        "Profile bio",

      category:
        "Professional category",

      location:
        "Location",

      experience:
        "Years of experience",

      hourlyRate:
        "Hourly rate",

      skills:
        "Skills",

      education:
        "Education",

      certifications:
        "Certifications",

      cv:
        "CV",

      portfolio:
        "Portfolio",
    };

  return (
    labels[field] ||
    field
  );
}

// ==================================================
// REMINDER TIMING
// ==================================================

function isReminderDue(
  createdAt: string | null,
  lastSentAt: string | null
) {
  const now =
    Date.now();

  /*
   * If a reminder has already
   * been successfully sent,
   * wait another full 3 days.
   */
  if (lastSentAt) {
    const lastSentTime =
      new Date(
        lastSentAt
      ).getTime();

    if (
      Number.isFinite(
        lastSentTime
      )
    ) {
      return (
        now - lastSentTime >=
        THREE_DAYS_MS
      );
    }
  }

  /*
   * No reminder has been sent.
   *
   * Wait 3 days after the
   * profile/account was created
   * before sending the first one.
   */
  if (!createdAt) {
    return false;
  }

  const createdTime =
    new Date(
      createdAt
    ).getTime();

  if (
    !Number.isFinite(
      createdTime
    )
  ) {
    return false;
  }

  return (
    now - createdTime >=
    THREE_DAYS_MS
  );
}

// ==================================================
// CLIENT COMPLETENESS
// ==================================================

function getClientMissingFields(
  profile: ReminderProfile
) {
  const missing:
    string[] = [];

  if (
    !hasText(
      profile.full_name
    )
  ) {
    missing.push(
      "Full name"
    );
  }

  if (
    !hasText(
      profile.bio
    )
  ) {
    missing.push(
      "About you / business bio"
    );
  }

  if (
    !hasText(
      profile.location
    )
  ) {
    missing.push(
      "Location"
    );
  }

  if (
    !hasText(
      profile.country
    )
  ) {
    missing.push(
      "Country"
    );
  }

  return missing;
}

// ==================================================
// FREELANCER EMAIL
// ==================================================

function buildFreelancerEmail(
  fullName: string | null,
  percentage: number,
  missing: string[],
  siteUrl: string
) {
  const firstName =
    escapeHtml(
      getFirstName(
        fullName
      )
    );

  const missingItems =
    missing
      .map(
        (field) =>
          `
            <li
              style="
                margin-bottom:8px;
              "
            >
              ${escapeHtml(
                getMissingFieldLabel(
                  field
                )
              )}
            </li>
          `
      )
      .join("");

  return `
    <div
      style="
        background:#f1f5f9;
        padding:32px 16px;
        font-family:
          Arial,
          Helvetica,
          sans-serif;
        color:#0f172a;
      "
    >
      <div
        style="
          max-width:620px;
          margin:0 auto;
          background:#ffffff;
          border:1px solid #e2e8f0;
          border-radius:18px;
          overflow:hidden;
        "
      >

        <div
          style="
            background:#020617;
            padding:30px 24px;
            text-align:center;
          "
        >
          <div
            style="
              color:#22c55e;
              font-size:13px;
              font-weight:700;
              letter-spacing:1px;
              text-transform:uppercase;
              margin-bottom:8px;
            "
          >
            Profile Reminder
          </div>

          <h1
            style="
              color:#ffffff;
              margin:0;
              font-size:25px;
            "
          >
            Freelance Hub SA
          </h1>
        </div>

        <div
          style="
            padding:32px 30px;
          "
        >

          <h2
            style="
              margin:0 0 18px;
              color:#0f172a;
              font-size:23px;
              line-height:1.3;
            "
          >
            Complete your
            freelancer profile
          </h2>

          <p
            style="
              margin:0 0 16px;
              line-height:1.7;
            "
          >
            Hi ${firstName},
          </p>

          <p
            style="
              margin:0 0 20px;
              line-height:1.7;
            "
          >
            Your Freelance Hub SA
            freelancer profile is
            currently
            <strong>
              ${percentage}% complete
            </strong>.
          </p>

          <p
            style="
              margin:0 0 22px;
              line-height:1.7;
            "
          >
            Completing your profile
            gives clients a clearer
            picture of your skills,
            experience and the services
            you can provide.
          </p>

          ${
            missing.length > 0
              ? `
                <div
                  style="
                    background:#f8fafc;
                    border:1px solid #e2e8f0;
                    border-radius:12px;
                    padding:20px;
                    margin:22px 0 26px;
                  "
                >
                  <div
                    style="
                      font-weight:700;
                      margin-bottom:12px;
                    "
                  >
                    Still to complete:
                  </div>

                  <ul
                    style="
                      padding-left:22px;
                      margin:0;
                      line-height:1.5;
                    "
                  >
                    ${missingItems}
                  </ul>
                </div>
              `
              : ""
          }

          <div
            style="
              text-align:center;
              margin:28px 0;
            "
          >
            <a
              href="${siteUrl}/dashboard/freelancer/profile"
              style="
                display:inline-block;
                background:#22c55e;
                color:#052e16;
                text-decoration:none;
                font-weight:700;
                padding:14px 26px;
                border-radius:10px;
              "
            >
              Complete My Profile
            </a>
          </div>

          <p
            style="
              margin:26px 0 0;
              color:#64748b;
              font-size:13px;
              line-height:1.6;
            "
          >
            Once your profile reaches
            100%, these profile
            completion reminders will
            stop automatically.
          </p>

        </div>

        <div
          style="
            border-top:1px solid #e2e8f0;
            padding:20px;
            text-align:center;
            color:#94a3b8;
            font-size:12px;
          "
        >
          Freelance Hub SA
          <br />
          South Africa's freelance
          marketplace
        </div>

      </div>
    </div>
  `;
}

// ==================================================
// CLIENT EMAIL
// ==================================================

function buildClientEmail(
  fullName: string | null,
  missingFields: string[],
  siteUrl: string
) {
  const firstName =
    escapeHtml(
      getFirstName(
        fullName
      )
    );

  const missingItems =
    missingFields
      .map(
        (field) =>
          `
            <li
              style="
                margin-bottom:8px;
              "
            >
              ${escapeHtml(
                field
              )}
            </li>
          `
      )
      .join("");

  return `
    <div
      style="
        background:#f1f5f9;
        padding:32px 16px;
        font-family:
          Arial,
          Helvetica,
          sans-serif;
        color:#0f172a;
      "
    >
      <div
        style="
          max-width:620px;
          margin:0 auto;
          background:#ffffff;
          border:1px solid #e2e8f0;
          border-radius:18px;
          overflow:hidden;
        "
      >

        <div
          style="
            background:#020617;
            padding:30px 24px;
            text-align:center;
          "
        >
          <div
            style="
              color:#22c55e;
              font-size:13px;
              font-weight:700;
              letter-spacing:1px;
              text-transform:uppercase;
              margin-bottom:8px;
            "
          >
            Profile Reminder
          </div>

          <h1
            style="
              color:#ffffff;
              margin:0;
              font-size:25px;
            "
          >
            Freelance Hub SA
          </h1>
        </div>

        <div
          style="
            padding:32px 30px;
          "
        >

          <h2
            style="
              margin:0 0 18px;
              color:#0f172a;
              font-size:23px;
              line-height:1.3;
            "
          >
            Complete your
            client profile
          </h2>

          <p
            style="
              margin:0 0 16px;
              line-height:1.7;
            "
          >
            Hi ${firstName},
          </p>

          <p
            style="
              margin:0 0 20px;
              line-height:1.7;
            "
          >
            Your Freelance Hub SA
            client profile still needs
            a few details.
          </p>

          <p
            style="
              margin:0 0 22px;
              line-height:1.7;
            "
          >
            A complete profile gives
            freelancers useful
            information about the
            person or business they
            may be working with.
          </p>

          <div
            style="
              background:#f8fafc;
              border:1px solid #e2e8f0;
              border-radius:12px;
              padding:20px;
              margin:22px 0 26px;
            "
          >
            <div
              style="
                font-weight:700;
                margin-bottom:12px;
              "
            >
              Still to complete:
            </div>

            <ul
              style="
                padding-left:22px;
                margin:0;
                line-height:1.5;
              "
            >
              ${missingItems}
            </ul>
          </div>

          <div
            style="
              text-align:center;
              margin:28px 0;
            "
          >
            <a
              href="${siteUrl}/dashboard/profile"
              style="
                display:inline-block;
                background:#22c55e;
                color:#052e16;
                text-decoration:none;
                font-weight:700;
                padding:14px 26px;
                border-radius:10px;
              "
            >
              Complete My Profile
            </a>
          </div>

          <p
            style="
              margin:26px 0 0;
              color:#64748b;
              font-size:13px;
              line-height:1.6;
            "
          >
            Once your profile is
            complete, these profile
            completion reminders will
            stop automatically.
          </p>

        </div>

        <div
          style="
            border-top:1px solid #e2e8f0;
            padding:20px;
            text-align:center;
            color:#94a3b8;
            font-size:12px;
          "
        >
          Freelance Hub SA
          <br />
          South Africa's freelance
          marketplace
        </div>

      </div>
    </div>
  `;
}

// ==================================================
// CRON ROUTE
// ==================================================

export async function GET(
  request: NextRequest
) {
  try {
    // ==============================================
    // ENVIRONMENT
    // ==============================================

    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY;

    const resendApiKey =
      process.env
        .RESEND_API_KEY;

    const fromEmail =
      process.env
        .RESEND_FROM_EMAIL;

    const cronSecret =
      process.env
        .CRON_SECRET;

    const siteUrl = (
      process.env
        .NEXT_PUBLIC_SITE_URL ||
      "https://www.freelancehubsa.co.za"
    ).replace(
      /\/+$/,
      ""
    );

    // ==============================================
    // ENVIRONMENT CHECK
    // ==============================================

    const missingEnvironmentVariables:
      string[] = [];

    if (!supabaseUrl) {
      missingEnvironmentVariables.push(
        "NEXT_PUBLIC_SUPABASE_URL"
      );
    }

    if (!serviceRoleKey) {
      missingEnvironmentVariables.push(
        "SUPABASE_SERVICE_ROLE_KEY"
      );
    }

    if (!resendApiKey) {
      missingEnvironmentVariables.push(
        "RESEND_API_KEY"
      );
    }

    if (!fromEmail) {
      missingEnvironmentVariables.push(
        "RESEND_FROM_EMAIL"
      );
    }

    if (!cronSecret) {
      missingEnvironmentVariables.push(
        "CRON_SECRET"
      );
    }

    if (
      missingEnvironmentVariables.length >
      0
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            "Server configuration is incomplete.",

          missing:
            missingEnvironmentVariables,
        },
        {
          status: 500,
        }
      );
    }

    // ==============================================
    // TYPESCRIPT SAFE ENVIRONMENT VALUES
    // ==============================================

    const safeSupabaseUrl =
      supabaseUrl as string;

    const safeServiceRoleKey =
      serviceRoleKey as string;

    const safeResendApiKey =
      resendApiKey as string;

    const safeFromEmail =
      fromEmail as string;

    const safeCronSecret =
      cronSecret as string;

    // ==============================================
    // CRON AUTHORIZATION
    // ==============================================

    const authorization =
      request.headers.get(
        "authorization"
      );

    if (
      authorization !==
      `Bearer ${safeCronSecret}`
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    // ==============================================
    // SERVER CLIENTS
    // ==============================================

    const admin =
      createClient(
        safeSupabaseUrl,
        safeServiceRoleKey,
        {
          auth: {
            autoRefreshToken:
              false,

            persistSession:
              false,
          },
        }
      );

    const resend =
      new Resend(
        safeResendApiKey
      );

    /*
     * RESEND_FROM_EMAIL contains the
     * verified email address.
     *
     * Users will see:
     *
     * Freelance Hub SA
     *
     * instead of the previous
     * payment-related sender name.
     */
    const sender =
      `Freelance Hub SA <${safeFromEmail}>`;

    // ==============================================
    // LOAD PROFILES
    // ==============================================

    const {
      data: profileRows,
      error: profileError,
    } = await admin
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        role,
        created_at,
        suspended,
        is_demo,
        profile_reminder_last_sent_at,
        bio,
        category,
        avatar_url,
        headline,
        location,
        country,
        years_experience,
        hourly_rate,
        skills,
        education,
        certifications,
        cv_url,
        portfolio_url
      `)
      .in(
        "role",
        [
          "freelancer",
          "client",
        ]
      )
      .eq(
        "suspended",
        false
      )
      .eq(
        "is_demo",
        false
      );

    if (profileError) {
      console.error(
        "Profile reminder profile loading error:",
        profileError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to load profiles.",
        },
        {
          status: 500,
        }
      );
    }

    const profiles =
  (profileRows ||
    []) as ReminderProfile[];

    // ==============================================
    // LOAD FREELANCER PORTFOLIO PROJECTS
    // ==============================================

    const freelancerIds =
      profiles
        .filter(
          (profile) =>
            profile.role ===
            "freelancer"
        )
        .map(
          (profile) =>
            profile.id
        );

    const freelancersWithProjects =
      new Set<string>();

    if (
      freelancerIds.length > 0
    ) {
      const {
        data: projectRows,
        error: projectError,
      } = await admin
        .from(
          "portfolio_projects"
        )
        .select(
          "freelancer_id"
        )
        .in(
          "freelancer_id",
          freelancerIds
        );

      if (projectError) {
        console.error(
          "Profile reminder portfolio loading error:",
          projectError
        );

        return NextResponse.json(
          {
            success: false,
            error:
              "Unable to check freelancer portfolios.",
          },
          {
            status: 500,
          }
        );
      }

      for (
        const project of
          projectRows || []
      ) {
        if (
          project.freelancer_id
        ) {
          freelancersWithProjects.add(
            project.freelancer_id
          );
        }
      }
    }

    // ==============================================
    // PROCESS REMINDERS
    // ==============================================

    let checked = 0;
    let incomplete = 0;
    let sent = 0;

    let skippedNotDue = 0;
    let skippedNoEmail = 0;
    let skippedComplete = 0;

    let failed = 0;

    const failures: Array<{
      id: string;
      error: string;
    }> = [];

    for (
      const profile of profiles
    ) {
      checked += 1;

      // ============================================
      // EMAIL REQUIRED
      // ============================================

      if (
        !profile.email?.trim()
      ) {
        skippedNoEmail += 1;
        continue;
      }

      let profileComplete =
        false;

      let subject =
        "";

      let html =
        "";

      // ============================================
      // FREELANCER
      // ============================================

      if (
        profile.role ===
        "freelancer"
      ) {
        const completion =
          calculateProfileCompleteness({
            ...(profile as ProfileCompletenessProfile),

            portfolio_project_exists:
              freelancersWithProjects.has(
                profile.id
              ),
          });

        profileComplete =
          completion.percentage ===
          100;

        if (
          !profileComplete
        ) {
          subject =
            "Complete your Freelance Hub SA profile";

          html =
            buildFreelancerEmail(
              profile.full_name,
              completion.percentage,
              completion.missing,
              siteUrl
            );
        }
      }

      // ============================================
      // CLIENT
      // ============================================

      else if (
        profile.role ===
        "client"
      ) {
        const missingFields =
          getClientMissingFields(
            profile
          );

        profileComplete =
          missingFields.length ===
          0;

        if (
          !profileComplete
        ) {
          subject =
            "Complete your Freelance Hub SA client profile";

          html =
            buildClientEmail(
              profile.full_name,
              missingFields,
              siteUrl
            );
        }
      }

      else {
        continue;
      }

      // ============================================
      // COMPLETE PROFILE
      // ============================================

      if (
        profileComplete
      ) {
        skippedComplete += 1;
        continue;
      }

      incomplete += 1;

      // ============================================
      // THREE-DAY CHECK
      // ============================================

      if (
  !isReminderDue(
    profile.created_at,
    profile
      .profile_reminder_last_sent_at
  )
) {
  skippedNotDue += 1;
  continue;
}

      // ============================================
      // FINAL SAFETY CHECK
      // ============================================

      if (
        !subject ||
        !html
      ) {
        failed += 1;

        failures.push({
          id:
            profile.id,

          error:
            "Reminder email content was not generated.",
        });

        continue;
      }

      // ============================================
      // SEND EMAIL
      // ============================================

      try {
        const {
          error: emailError,
        } =
          await resend.emails.send({
            from:
              sender,

            to: [
              profile.email.trim(),
            ],

            subject,

            html,
          });

        if (
          emailError
        ) {
          failed += 1;

          failures.push({
            id:
              profile.id,

            error:
              emailError.message,
          });

          console.error(
            `Profile reminder email failed for ${profile.id}:`,
            emailError
          );

          continue;
        }

        // ==========================================
        // SAVE SUCCESSFUL REMINDER TIME
        // ==========================================

        const {
          error: updateError,
        } = await admin
          .from("profiles")
          .update({
            profile_reminder_last_sent_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            profile.id
          );

        if (
          updateError
        ) {
          failed += 1;

          failures.push({
            id:
              profile.id,

            error:
              `Email sent, but reminder timestamp failed: ${updateError.message}`,
          });

          console.error(
            `Profile reminder timestamp update failed for ${profile.id}:`,
            updateError
          );

          continue;
        }

        sent += 1;
      } catch (error) {
        failed += 1;

        const message =
          error instanceof Error
            ? error.message
            : "Unknown email error.";

        failures.push({
          id:
            profile.id,

          error:
            message,
        });

        console.error(
          `Unexpected profile reminder error for ${profile.id}:`,
          error
        );
      }
    }

    // ==============================================
    // RESULT
    // ==============================================

    return NextResponse.json(
      {
        success: true,

        checked,

        incomplete,

        sent,

        skippedComplete,

        skippedNotDue,

        skippedNoEmail,

        failed,

        failures,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Unexpected profile reminder cron error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unexpected profile reminder error.",
      },
      {
        status: 500,
      }
    );
  }
}