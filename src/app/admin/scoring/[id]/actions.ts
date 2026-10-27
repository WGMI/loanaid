"use server";

import { revalidatePath } from "next/cache";
import { pool } from "@/lib/db";
import { evaluateFormula, type FormulaResult } from "@/lib/scoring/jexl";
import type { FieldDataType } from "@/lib/types";

export async function saveScoringConfig(configId: number, formData: FormData) {
  const client = await pool.connect();
  try {
    await client.query("begin");

    const groupIds = formData.getAll("group_id").map(String);
    for (const id of groupIds) {
      const weight = Number(formData.get(`group_weight_${id}`));
      await client.query(
        `update scoring_groups set weight_pct = $1 where id = $2 and config_id = $3`,
        [weight, id, configId]
      );
    }

    const fieldIds = formData.getAll("field_id").map(String);
    for (const id of fieldIds) {
      const label = String(formData.get(`field_label_${id}`) ?? "");
      const formula = String(formData.get(`field_formula_${id}`) ?? "");
      const options = String(formData.get(`field_options_${id}`) ?? "");
      const mandatory = formData.get(`field_mandatory_${id}`) === "on";
      await client.query(
        `update scoring_fields
         set label = $1, formula = $2, options = $3, mandatory = $4
         where id = $5 and group_id in (select id from scoring_groups where config_id = $6)`,
        [label, formula || null, options || null, mandatory, id, configId]
      );
    }

    const green = Number(formData.get("tier_green_min"));
    const amberMin = Number(formData.get("tier_amber_min"));
    await client.query(
      `update scoring_tiers set min_score = $1 where config_id = $2 and tier = 'green'`,
      [green, configId]
    );
    await client.query(
      `update scoring_tiers set min_score = $1, max_score = $2 where config_id = $3 and tier = 'amber'`,
      [amberMin, green, configId]
    );
    await client.query(
      `update scoring_tiers set max_score = $1 where config_id = $2 and tier = 'red'`,
      [amberMin, configId]
    );

    await client.query("commit");
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }

  revalidatePath(`/admin/scoring/${configId}`);
  revalidatePath("/admin/scoring");
}

export async function renameConfig(configId: number, formData: FormData) {
  const name = String(formData.get("config_name") ?? "").trim();
  const description = String(formData.get("config_description") ?? "").trim();
  if (!name) return;
  await pool.query(
    `update scoring_configs set name = $1, description = $2, updated_at = now() where id = $3`,
    [name, description || null, configId]
  );
  revalidatePath(`/admin/scoring/${configId}`);
  revalidatePath("/admin/scoring");
}

export async function addGroup(configId: number, formData: FormData) {
  const name = String(formData.get("new_group_name") ?? "").trim();
  if (!name) return;
  await pool.query(
    `insert into scoring_groups (config_id, name, weight_pct, sort_order)
     values ($1, $2, 0, (select coalesce(max(sort_order), 0) + 1 from scoring_groups where config_id = $1))`,
    [configId, name]
  );
  revalidatePath(`/admin/scoring/${configId}`);
}

export async function deleteGroup(configId: number, groupId: number) {
  await pool.query(`delete from scoring_groups where id = $1 and config_id = $2`, [
    groupId,
    configId,
  ]);
  revalidatePath(`/admin/scoring/${configId}`);
}

export async function addField(configId: number, groupId: number, formData: FormData) {
  const name = String(formData.get(`new_field_name_${groupId}`) ?? "").trim();
  const label = String(formData.get(`new_field_label_${groupId}`) ?? "").trim();
  const dataType = String(
    formData.get(`new_field_data_type_${groupId}`) ?? "NUMERIC"
  ) as FieldDataType;
  const options = String(formData.get(`new_field_options_${groupId}`) ?? "").trim();
  const formula = String(formData.get(`new_field_formula_${groupId}`) ?? "").trim();
  if (!name || !label) return;

  await pool.query(
    `insert into scoring_fields (group_id, name, label, data_type, options, formula, mandatory, sort_order)
     values ($1,$2,$3,$4,$5,$6,false,(select coalesce(max(sort_order),0)+1 from scoring_fields where group_id = $1))`,
    [groupId, name, label, dataType, options || null, formula || null]
  );
  revalidatePath(`/admin/scoring/${configId}`);
}

export async function deleteField(configId: number, fieldId: number) {
  await pool.query(
    `delete from scoring_fields
     where id = $1 and group_id in (select id from scoring_groups where config_id = $2)`,
    [fieldId, configId]
  );
  revalidatePath(`/admin/scoring/${configId}`);
}

export async function testFormula(
  formula: string,
  contextJson: string
): Promise<FormulaResult & { contextError?: string }> {
  let context: Record<string, unknown>;
  try {
    context = contextJson.trim() ? JSON.parse(contextJson) : {};
  } catch {
    return { value: null, error: null, contextError: "Test context is not valid JSON" };
  }
  return evaluateFormula(formula, context);
}

export async function assignProducts(configId: number, formData: FormData) {
  const checkedIds = formData.getAll("product_id").map(Number);
  const allIds = formData.getAll("all_product_id").map(Number);

  // Checking a product claims it for this config. Unchecking only releases it if it
  // currently belongs to *this* config — a product owned by a different config is left
  // untouched, so editing this page can never silently steal a product from another config.
  await pool.query(
    `update products
     set scoring_config_id = case
       when id = any($1::int[]) then $2
       when scoring_config_id = $2 then null
       else scoring_config_id
     end
     where id = any($3::int[])`,
    [checkedIds, configId, allIds]
  );

  revalidatePath(`/admin/scoring/${configId}`);
  revalidatePath("/admin/scoring");
}
