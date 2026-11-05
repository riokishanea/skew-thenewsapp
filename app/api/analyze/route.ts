import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { runArticleAnalysisPipeline } from "@/lib/analysis/pipeline";
import type { AnalysisRequestOptions } from "@/lib/analysis/types";

export const maxDuration = 300;

const requestSchema = z.object({
  articleIds: z.array(z.string().uuid()).max(100).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

function isAuthorized(request: NextRequest): boolean {
  const configuredSecret = process.env.SKEW_ADMIN_SECRET?.trim();
  const providedSecret = request.headers.get("x-skew-admin-secret")?.trim();

  return Boolean(configuredSecret && providedSecret && providedSecret === configuredSecret);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let options: AnalysisRequestOptions = {};

  try {
    const body = await request.text();
    if (body.trim().length > 0) {
      const parsedJson: unknown = JSON.parse(body);
      const parsedOptions = requestSchema.safeParse(parsedJson);

      if (!parsedOptions.success) {
        return NextResponse.json(
          { error: "Invalid analysis request options" },
          { status: 400 },
        );
      }

      options = parsedOptions.data;
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const summary = await runArticleAnalysisPipeline(options);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("[POST /api/analyze] Pipeline error:", error);
    return NextResponse.json({ error: "Unable to analyze articles" }, { status: 500 });
  }
}
