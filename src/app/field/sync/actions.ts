"use server";

import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db";

export async function syncAll(formData: FormData) {
  const officerId = Number(formData.get("officerId"));
  await pool.query(
    `update loan_applications
     set status = 'submitted', sync_progress_pct = 100, sync_detail = null, sync_error = null, synced_at = now()
     where officer_id = $1 and status in ('queued','uploading','sync_failed')`,
    [officerId]
  );
  revalidatePath("/field/sync");
  revalidatePath("/field");
}

export async function retryUpload(formData: FormData) {
  const id = Number(formData.get("applicationId"));
  await pool.query(
    `update loan_applications
     set status = 'submitted', sync_progress_pct = 100, sync_detail = null, sync_error = null, synced_at = now()
     where id = $1`,
    [id]
  );
  revalidatePath("/field/sync");
  revalidatePath("/field");
}
