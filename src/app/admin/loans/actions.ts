"use server";

import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db";

export async function overrideDecision(
  applicationId: number,
  newStatus: "approved" | "declined"
) {
  const tier = newStatus === "approved" ? "green" : "red";
  const decision = newStatus === "approved" ? "Approve (Manual Override)" : "Declined (Manual Override)";

  const { rows } = await pool.query(
    `update loan_applications
     set status = $1, tier = $2, decision = $3, updated_at = now()
     where id = $4
     returning score, region`,
    [newStatus, tier, decision, applicationId]
  );

  if (rows[0]) {
    await pool.query(
      `insert into activity_log (application_id, action, message, tier, score)
       values ($1, $2, $3, $4, $5)`,
      [
        applicationId,
        decision.toUpperCase(),
        `Manually ${newStatus === "approved" ? "approved" : "declined"} by back-office admin after review.`,
        tier,
        rows[0].score,
      ]
    );
  }

  revalidatePath("/admin/loans");
  revalidatePath("/admin");
}
