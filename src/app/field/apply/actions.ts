"use server";

import { redirect } from "next/navigation";
import { pool, query } from "@/lib/db";
import { getProductScoringConfigId, getScoringConfigDetail } from "@/lib/data";
import { scoreApplication } from "@/lib/scoring/engine";

export async function submitLoanApplication(formData: FormData) {
  const applicantName = String(formData.get("applicantName") ?? "").trim();
  const nationalId = String(formData.get("nationalId") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const productId = Number(formData.get("productId"));
  const amount = Number(formData.get("amount")) || 0;
  const region = String(formData.get("region") ?? "Lagos");
  const officerId = Number(formData.get("officerId"));
  const saveAsDraft = formData.get("intent") === "draft";

  let submittedFields: Record<string, unknown> = {};
  try {
    submittedFields = JSON.parse(String(formData.get("submittedFieldsJson") ?? "{}"));
  } catch {
    submittedFields = {};
  }

  const appCode = `APP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  if (saveAsDraft) {
    await pool.query(
      `insert into loan_applications
        (app_code, applicant_name, national_id, phone, product_id, amount_ngn, region, officer_id, status, sync_progress_pct, sync_detail, submitted_fields)
       values ($1,$2,$3,$4,$5,$6,$7,$8,'draft',0,null,$9)`,
      [
        appCode, applicantName || "Unnamed Applicant", nationalId || "PENDING", phone,
        productId || null, amount, region, officerId, JSON.stringify(submittedFields),
      ]
    );
    redirect("/field");
  }

  const configId = await getProductScoringConfigId(productId);
  const [configMeta] = await query<{ name: string }>(
    `select name from scoring_configs where id = $1`,
    [configId]
  );
  const configName = configMeta?.name ?? "Unknown Scorecard";
  const { groups, tiers } = await getScoringConfigDetail(configId);

  const outcome = await scoreApplication(groups, submittedFields);

  const greenMin = tiers.find((t) => t.tier === "green")?.min_score ?? 700;
  const amberMin = tiers.find((t) => t.tier === "amber")?.min_score ?? 400;

  let tier: "green" | "amber" | "red";
  let decision: string;
  let status: "approved" | "manual_review" | "declined";

  if (outcome.formulaError) {
    tier = "amber";
    decision = "Manual Review (Formula Error)";
    status = "manual_review";
  } else if (outcome.knockedOut) {
    tier = "red";
    decision = "Declined (Knockout)";
    status = "declined";
  } else if (outcome.finalScore >= greenMin) {
    tier = "green";
    decision = outcome.finalScore >= greenMin + 150 ? "STP Approve" : "Approve";
    status = "approved";
  } else if (outcome.finalScore >= amberMin) {
    tier = "amber";
    decision = "Manual Review";
    status = "manual_review";
  } else {
    tier = "red";
    decision = "Declined";
    status = "declined";
  }

  const { rows } = await pool.query(
    `insert into loan_applications
      (app_code, applicant_name, national_id, phone, product_id, amount_ngn, region, officer_id, status, score, tier, decision, scoring_config_id, knocked_out, knock_out_field, score_breakdown, submitted_fields, sync_progress_pct, sync_detail, synced_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,100,null,now())
     returning id`,
    [
      appCode, applicantName || "Unnamed Applicant", nationalId || "PENDING", phone, productId || null,
      amount, region, officerId, status, outcome.finalScore, tier, decision, configId,
      outcome.knockedOut, outcome.knockOutField, JSON.stringify(outcome.breakdown),
      JSON.stringify(submittedFields),
    ]
  );

  await pool.query(
    `insert into activity_log (application_id, action, message, tier, score)
     values ($1, $2, $3, $4, $5)`,
    [
      rows[0].id,
      decision.toUpperCase(),
      outcome.knockedOut
        ? `Knocked out on field "${outcome.knockOutField}" — scored under "${configName}".`
        : `Submitted via field app by Officer John Eze in ${region} state — scored under "${configName}".`,
      tier,
      outcome.finalScore,
    ]
  );

  redirect(
    `/field/apply/success?id=${rows[0].id}&code=${appCode}&score=${outcome.finalScore}&tier=${tier}&decision=${encodeURIComponent(decision)}`
  );
}
