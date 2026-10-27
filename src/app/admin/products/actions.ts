"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pool } from "@/lib/db";

export async function createProduct(formData: FormData) {
  const name = String(formData.get("new_product_name") ?? "").trim();
  if (!name) return;

  const parentIdRaw = String(formData.get("new_product_parent_id") ?? "");
  const parentId = parentIdRaw ? Number(parentIdRaw) : null;

  const configIdRaw = String(formData.get("new_product_config_id") ?? "");
  const configId = configIdRaw ? Number(configIdRaw) : null;

  const { rows } = await pool.query(
    `insert into products (name, parent_id, status, scoring_config_id, sort_order)
     values ($1, $2, 'ACTIVE', $3, (select coalesce(max(sort_order), 0) + 1 from products))
     returning id`,
    [name, parentId, configId]
  );

  revalidatePath("/admin/products");
  if (configId) {
    revalidatePath(`/admin/scoring/${configId}`);
    revalidatePath("/admin/scoring");
  }

  redirect(`/admin/products?created=${rows[0].id}`);
}
