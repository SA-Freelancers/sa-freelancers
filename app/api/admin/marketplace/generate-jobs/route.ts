import { NextRequest, NextResponse } from "next/server";
import {
  normaliseRequestedCount,
  randomBoolean,
  randomInteger,
  randomItem,
  verifyMarketplaceAdmin,
} from "@/app/lib/marketplace/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DemoClientProfile = {
  id: string;
  full_name: string | null;
  category: string | null;
  location: string | null;
};

type RawJobTemplate = Record<string, unknown>;

type NormalisedJobTemplate = {
  id: string | number | null;
  category: string;
  title: string;
  description: string;
  minimumBudget: number;
  maximumBudget: number;
  durationDays: number;
};

type JobInsert = {
  client_id: string;
  title: string;
  description: string;
  budget: number;
  category: string;
  created_at: string;
  is_demo: boolean;
  demo_expires_at: string;
  featured: boolean;
  urgent: boolean;
  high_paying: boolean;
  location: string;
};

function readText(
  record: RawJobTemplate,
  possibleKeys: string[],
  fallback: string
): string {
  for (const key of possibleKeys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return fallback;
}

function readNumber(
  record: RawJobTemplate,
  possibleKeys: string[],
  fallback: number
): number {
  for (const key of possibleKeys) {
    const value = record[key];
    const parsedValue = Number(value);

    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return fallback;
}

function normaliseTemplate(
  template: RawJobTemplate
): NormalisedJobTemplate {
  const minimumBudget = readNumber(
    template,
    [
      "minimum_budget",
      "min_budget",
      "budget_min",
      "minimum_price",
    ],
    1500
  );

  const maximumBudget = readNumber(
    template,
    [
      "maximum_budget",
      "max_budget",
      "budget_max",
      "maximum_price",
    ],
    minimumBudget + 8500
  );

  return {
    id:
      typeof template.id === "string" ||
      typeof template.id === "number"
        ? template.id
        : null,

    category: readText(
      template,
      ["category", "industry"],
      "General"
    ),

    title: readText(
      template,
      ["title", "job_title", "headline"],
      "Freelance Professional Required"
    ),

    description: readText(
      template,
      ["description", "job_description", "description_template"],
      "We are looking for an experienced freelancer to assist with this project."
    ),

    minimumBudget: Math.max(
      100,
      Math.min(minimumBudget, maximumBudget)
    ),

    maximumBudget: Math.max(
      minimumBudget,
      maximumBudget
    ),

    durationDays: Math.max(
      1,
      readNumber(
        template,
        [
          "duration_days",
          "default_duration_days",
          "duration",
        ],
        14
      )
    ),
  };
}

function normaliseCategory(value: string | null): string {
  return value?.trim().toLowerCase() ?? "";
}

function categoriesAreRelated(
  clientCategory: string | null,
  templateCategory: string
): boolean {
  const client = normaliseCategory(clientCategory);
  const template = normaliseCategory(templateCategory);

  if (!client || !template) {
    return false;
  }

  if (client === template) {
    return true;
  }

  return client.includes(template) || template.includes(client);
}

function createBudget(
  minimumBudget: number,
  maximumBudget: number
): number {
  const budget = randomInteger(
    Math.round(minimumBudget),
    Math.round(maximumBudget)
  );

  if (budget >= 10_000) {
    return Math.round(budget / 500) * 500;
  }

  return Math.round(budget / 100) * 100;
}

function createDateInPast(maximumDaysAgo = 30): Date {
  const date = new Date();

  date.setDate(
    date.getDate() - randomInteger(0, maximumDaysAgo)
  );

  date.setHours(
    randomInteger(7, 21),
    randomInteger(0, 59),
    0,
    0
  );

  return date;
}

function createExpiryDate(
  createdAt: Date,
  templateDuration: number
): Date {
  const expiry = new Date(createdAt);

  const activeDuration = Math.max(
    7,
    Math.min(templateDuration + randomInteger(7, 30), 60)
  );

  expiry.setDate(expiry.getDate() + activeDuration);

  if (expiry.getTime() <= Date.now()) {
    expiry.setTime(Date.now());
    expiry.setDate(expiry.getDate() + randomInteger(7, 30));
  }

  return expiry;
}

function chooseJobLocation(
  clientLocation: string | null
): string {
  const locationType = randomInteger(1, 100);

  if (locationType <= 48) {
    return "Remote";
  }

  if (locationType <= 75) {
    return clientLocation?.trim()
      ? `Hybrid – ${clientLocation.trim()}`
      : "Hybrid";
  }

  return clientLocation?.trim() || "South Africa";
}

function createDescription(
  template: NormalisedJobTemplate,
  companyName: string,
  location: string
): string {
  const originalDescription = template.description.trim();

  return [
    originalDescription,
    "",
    `Client: ${companyName}`,
    `Work arrangement: ${location}`,
    "",
    "The freelancer should communicate clearly, meet agreed deadlines and provide professional-quality work.",
  ].join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const verification = await verifyMarketplaceAdmin(request);

    if (!verification.ok) {
      return NextResponse.json(
        {
          error: verification.error,
        },
        {
          status: verification.status,
        }
      );
    }

    const { adminClient } = verification;

    let requestBody: { count?: unknown } = {};

    try {
      requestBody = await request.json();
    } catch {
      requestBody = {};
    }

    const requestedCount = normaliseRequestedCount(
      requestBody.count,
      20,
      200
    );

    /*
     * Load authenticated demo client profiles.
     */
    const { data: demoClients, error: clientsError } =
      await adminClient
        .from("profiles")
        .select("id, full_name, category, location")
        .eq("is_demo", true)
        .eq("role", "client")
        .eq("suspended", false);

    if (clientsError) {
      throw new Error(
        `Could not load demo clients: ${clientsError.message}`
      );
    }

    if (!demoClients?.length) {
      return NextResponse.json(
        {
          error:
            "No authenticated demo client profiles exist. Generate demo client accounts first.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Load active job templates.
     *
     * select("*") is intentional because earlier versions of the
     * template table may use slightly different range-column names.
     */
    const { data: rawTemplates, error: templatesError } =
      await adminClient
        .from("demo_job_templates")
        .select("*")
        .eq("is_active", true);

    if (templatesError) {
      throw new Error(
        `Could not load job templates: ${templatesError.message}`
      );
    }

    if (!rawTemplates?.length) {
      return NextResponse.json(
        {
          error:
            "No active job templates exist. Run the marketplace lookup seed first.",
        },
        {
          status: 400,
        }
      );
    }

    const templates = (
      rawTemplates as RawJobTemplate[]
    ).map(normaliseTemplate);

    const clients = demoClients as DemoClientProfile[];
    const jobsToInsert: JobInsert[] = [];

    for (let index = 0; index < requestedCount; index += 1) {
      const client = randomItem(clients);

      const matchingTemplates = templates.filter((template) =>
        categoriesAreRelated(client.category, template.category)
      );

      const selectedTemplate = randomItem(
        matchingTemplates.length
          ? matchingTemplates
          : templates
      );

      const createdAt = createDateInPast(25);
      const expiryDate = createExpiryDate(
        createdAt,
        selectedTemplate.durationDays
      );

      const budget = createBudget(
        selectedTemplate.minimumBudget,
        selectedTemplate.maximumBudget
      );

      const location = chooseJobLocation(client.location);
      const urgent = randomBoolean(18);
      const featured = randomBoolean(22);
      const highPaying =
        budget >= 15_000 || randomBoolean(12);

      const companyName =
        client.full_name?.trim() || "Verified Client";

      jobsToInsert.push({
        client_id: client.id,
        title: selectedTemplate.title,
        description: createDescription(
          selectedTemplate,
          companyName,
          location
        ),
        budget,
        category: selectedTemplate.category,
        created_at: createdAt.toISOString(),
        is_demo: true,
        demo_expires_at: expiryDate.toISOString(),
        featured,
        urgent,
        high_paying: highPaying,
        location,
      });
    }

    const { data: insertedJobs, error: insertError } =
      await adminClient
        .from("jobs")
        .insert(jobsToInsert)
        .select(
          `
            id,
            client_id,
            title,
            budget,
            category,
            location,
            featured,
            urgent,
            high_paying,
            demo_expires_at
          `
        );

    if (insertError) {
      throw new Error(
        `Could not insert demo jobs: ${insertError.message}`
      );
    }

    const { count: totalActiveDemoJobs, error: countError } =
      await adminClient
        .from("jobs")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("is_demo", true)
        .gt("demo_expires_at", new Date().toISOString());

    if (countError) {
      throw new Error(
        `Jobs were created, but the total could not be counted: ${countError.message}`
      );
    }

    return NextResponse.json({
      success: true,
      requested: requestedCount,
      inserted: insertedJobs?.length ?? 0,
      totalActiveDemoJobs: totalActiveDemoJobs ?? 0,
      jobs: insertedJobs ?? [],
    });
  } catch (error) {
    console.error("Demo job generation failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while generating jobs.",
      },
      {
        status: 500,
      }
    );
  }
}