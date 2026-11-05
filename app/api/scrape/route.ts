import { type NextRequest, NextResponse } from "next/server";

import { runScrapePipeline } from "@/lib/scraper/pipeline";
import type { ScrapeRequestOptions } from "@/lib/scraper/types";

export const maxDuration = 300;

function isAuthorized(request: NextRequest): boolean {
  const headerSecret = request.headers.get("x-skew-admin-secret");
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  const provided = headerSecret?.trim() || bearerToken;

  const adminSecret =
    process.env.SKEW_ADMIN_SECRET ||
    process.env["x-SKEW-admin-secret"] ||
    process.env["X_SKEW_ADMIN_SECRET"];
  const oxyApiKey = process.env.OXYLABS_WEB_API_KEY;

  if (!provided) {
    return false;
  }

  // Accept admin secret or Oxylabs API key as bearer token
  if (adminSecret && provided === adminSecret.trim()) {
    return true;
  }
  if (oxyApiKey && provided === oxyApiKey.trim()) {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        error:
          "Unauthorized: provide a valid 'Authorization: Bearer <KEY>' or 'x-skew-admin-secret' header",
      },
      { status: 401 },
    );
  }

  let options: ScrapeRequestOptions = {};

  try {
    const text = await request.text();
    if (text.trim().length > 0) {
      options = JSON.parse(text) as ScrapeRequestOptions;
    }
  } catch (parseError) {
    return NextResponse.json(
      { error: `Invalid JSON body: ${(parseError as Error).message}` },
      { status: 400 },
    );
  }

  try {
    const summary = await runScrapePipeline(options);
    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    console.error("[POST /api/scrape] Pipeline error:", error);
    return NextResponse.json(
      {
        status: "failed",
        error: (error as Error).message,
      },
      { status: 500 },
    );
  }
}

