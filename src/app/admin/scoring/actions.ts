"use server";

import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import { getDefaultConfigId } from "@/lib/data";

export async function createScoringConfig(formData: FormData) {
  const name = String(formData.get("new_config_name") ?? "").trim();
  const description = String(formData.get("new_config_description") ?? "").trim();
  if (!name) return;

  const cloneFromId = Number(formData.get("clone_from_id")) || (await getDefaultConfigId());

  const client = await pool.connect();
  let newConfigId: number;
  try {
    await client.query("begin");

    const { rows } = await client.query(
      `insert into scoring_configs (name, description, is_default) values ($1, $2, false) returning id`,
      [name, description || null]
    );
    newConfigId = rows[0].id;

    const { rows: sourceGroups } = await client.query(
      `select * from scoring_groups where config_id = $1 order by sort_order`,
      [cloneFromId]
    );
    for (const g of sourceGroups) {
      const { rows: newGroupRows } = await client.query(
        `insert into scoring_groups (config_id, name, weight_pct, sort_order) values ($1,$2,$3,$4) returning id`,
        [newConfigId, g.name, g.weight_pct, g.sort_order]
      );
      const newGroupId = newGroupRows[0].id;
      await client.query(
        `insert into scoring_fields (group_id, name, label, data_type, options, formula, mandatory, sort_order)
         select $1, name, label, data_type, options, formula, mandatory, sort_order
         from scoring_fields where group_id = $2`,
        [newGroupId, g.id]
      );
    }

    await client.query(
      `insert into scoring_tiers (config_id, tier, label, min_score, max_score, description)
       select $1, tier, label, min_score, max_score, description from scoring_tiers where config_id = $2`,
      [newConfigId, cloneFromId]
    );

    await client.query("commit");
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }

  redirect(`/admin/scoring/${newConfigId}`);
}
