"use server";

import { pool, query } from "@/lib/db";
import { getScoringConfigDetail } from "@/lib/data";
import { computeFieldRatings, type FieldRating } from "@/lib/scoring/explain";
import { generateNarrative } from "@/lib/scoring/narrative";
import type { LoanApplication } from "@/lib/types";

export interface ScoreExplanation {
  narrative: string;
  fieldRatings: FieldRating[];
  score: number | null;
  tier: string | null;
  decision: string | null;
  knockedOut: boolean;
  knockOutField: string | null;
}

export async function explainScore(applicationId: number): Promise<ScoreExplanation> {
  const [app] = await query<
    LoanApplication & { product_name: string }
  >(
    `select la.*, p.name as product_name
     from loan_applications la
     left join products p on p.id = la.product_id
     where la.id = $1`,
    [applicationId]
  );

  if (!app) {
    throw new Error("Application not found");
  }

  if (!app.scoring_config_id || !app.submitted_fields) {
    return {
      narrative: "This application has no scoring data to explain yet.",
      fieldRatings: [],
      score: app.score,
      tier: app.tier,
      decision: app.decision,
      knockedOut: app.knocked_out,
      knockOutField: app.knock_out_field,
    };
  }

  const { groups } = await getScoringConfigDetail(app.scoring_config_id);
  const fieldRatings = await computeFieldRatings(groups, app.submitted_fields);

  const groupWeights = Object.fromEntries(groups.map((g) => [g.name, g.weight_pct]));

  let narrative = app.score_explanation;
  if (!narrative) {
    narrative = await generateNarrative({
      applicantName: app.applicant_name,
      productName: app.product_name,
      score: app.score,
      tier: app.tier,
      decision: app.decision,
      knockedOut: app.knocked_out,
      knockOutField: app.knock_out_field,
      groupBreakdown: app.score_breakdown ?? {},
      groupWeights,
      fieldRatings,
    });
    await pool.query(`update loan_applications set score_explanation = $1 where id = $2`, [
      narrative,
      applicationId,
    ]);
  }

  return {
    narrative,
    fieldRatings,
    score: app.score,
    tier: app.tier,
    decision: app.decision,
    knockedOut: app.knocked_out,
    knockOutField: app.knock_out_field,
  };
}
