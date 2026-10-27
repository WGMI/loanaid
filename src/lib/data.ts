import { query } from "./db";
import type {
  LoanApplication,
  ActivityItem,
  ScoringGroup,
  ScoringField,
  ScoringTier,
  ScoringConfig,
  Product,
} from "./types";

export async function getKpis() {
  const [totals] = await query<{
    total_volume: string;
    active_officers: string;
    approval_rate: string;
    total_apps: string;
  }>(`
    select
      coalesce(sum(amount_ngn), 0)::text as total_volume,
      count(distinct officer_id)::text as active_officers,
      round(
        100.0 * count(*) filter (where status = 'approved') /
        greatest(count(*) filter (where status in ('approved','declined')), 1)
      , 0)::text as approval_rate,
      count(*)::text as total_apps
    from loan_applications
  `);

  const [syncHealth] = await query<{ pending: string; failed: string }>(`
    select
      count(*) filter (where status in ('queued','uploading'))::text as pending,
      count(*) filter (where status = 'sync_failed')::text as failed
    from loan_applications
  `);

  return { ...totals, ...syncHealth };
}

export async function getRecentActivity(limit = 6): Promise<ActivityItem[]> {
  return query<ActivityItem>(
    `
    select
      a.id, a.application_id, la.app_code, la.applicant_name,
      coalesce(o.name, la.applicant_name) as officer_name,
      la.region,
      a.action, a.message, a.tier, a.score, a.created_at
    from activity_log a
    join loan_applications la on la.id = a.application_id
    left join officers o on o.id = la.officer_id
    order by a.created_at desc
    limit $1
  `,
    [limit]
  );
}

export interface ReviewQueueFilters {
  tier?: "green" | "amber" | "red" | "all";
  region?: string;
  page?: number;
  pageSize?: number;
}

export async function getReviewQueue(filters: ReviewQueueFilters = {}) {
  const { tier = "all", region = "all", page = 1, pageSize = 8 } = filters;
  const conditions: string[] = [`la.status in ('submitted','manual_review','approved','declined')`];
  const params: unknown[] = [];

  if (tier !== "all") {
    params.push(tier);
    conditions.push(`la.tier = $${params.length}`);
  }
  if (region !== "all") {
    params.push(region);
    conditions.push(`la.region = $${params.length}`);
  }

  const where = conditions.length ? `where ${conditions.join(" and ")}` : "";

  const [{ count }] = await query<{ count: string }>(
    `select count(*)::text as count from loan_applications la ${where}`,
    params
  );

  const offset = (page - 1) * pageSize;
  params.push(pageSize, offset);

  const rows = await query<LoanApplication>(
    `
    select la.*, p.name as product_name, o.name as officer_name, sc.name as scoring_config_name
    from loan_applications la
    left join products p on p.id = la.product_id
    left join officers o on o.id = la.officer_id
    left join scoring_configs sc on sc.id = la.scoring_config_id
    ${where}
    order by la.applied_at desc
    limit $${params.length - 1} offset $${params.length}
  `,
    params
  );

  return { rows, total: Number(count), page, pageSize };
}

export async function getRegions(): Promise<string[]> {
  const rows = await query<{ region: string }>(
    `select distinct region from loan_applications order by region`
  );
  return rows.map((r) => r.region);
}

export async function getDefaultConfigId(): Promise<number> {
  const [row] = await query<{ id: number }>(
    `select id from scoring_configs where is_default = true order by id limit 1`
  );
  if (row) return row.id;
  const [fallback] = await query<{ id: number }>(
    `select id from scoring_configs order by id limit 1`
  );
  return fallback.id;
}

export async function getScoringConfigsList(): Promise<ScoringConfig[]> {
  return query<ScoringConfig>(`
    select
      sc.*,
      count(p.id)::int as product_count,
      coalesce(array_agg(p.name order by p.name) filter (where p.id is not null), '{}') as product_names
    from scoring_configs sc
    left join products p on p.scoring_config_id = sc.id
    group by sc.id
    order by sc.is_default desc, sc.name
  `);
}

export async function getScoringConfigMeta(configId: number): Promise<ScoringConfig | null> {
  const [row] = await query<ScoringConfig>(`select * from scoring_configs where id = $1`, [
    configId,
  ]);
  return row ?? null;
}

export async function getScoringConfigDetail(configId: number) {
  const [groupRows, fieldRows, tiers] = await Promise.all([
    query<Omit<ScoringGroup, "fields">>(
      `select * from scoring_groups where config_id = $1 order by sort_order`,
      [configId]
    ),
    query<ScoringField>(
      `select f.* from scoring_fields f
       join scoring_groups g on g.id = f.group_id
       where g.config_id = $1
       order by f.sort_order`,
      [configId]
    ),
    query<ScoringTier>(
      `select * from scoring_tiers where config_id = $1 order by (case tier when 'green' then 1 when 'amber' then 2 else 3 end)`,
      [configId]
    ),
  ]);

  const groups: ScoringGroup[] = groupRows.map((g) => ({
    ...g,
    fields: fieldRows.filter((f) => f.group_id === g.id),
  }));

  return { groups, tiers };
}

export async function getProducts(): Promise<Product[]> {
  return query<Product>(`select * from products order by sort_order`);
}

export async function getProductsWithConfigNames(): Promise<
  (Product & { config_name: string | null })[]
> {
  return query<Product & { config_name: string | null }>(`
    select p.*, sc.name as config_name
    from products p
    left join scoring_configs sc on sc.id = p.scoring_config_id
    order by p.sort_order
  `);
}

export async function getProductScoringConfigId(productId: number): Promise<number> {
  const [row] = await query<{ scoring_config_id: number | null }>(
    `select scoring_config_id from products where id = $1`,
    [productId]
  );
  if (row?.scoring_config_id) return row.scoring_config_id;
  return getDefaultConfigId();
}

export async function getOfficerByName(name: string) {
  const [officer] = await query<{ id: number; name: string; region: string }>(
    `select id, name, region from officers where name = $1 limit 1`,
    [name]
  );
  return officer ?? null;
}

export async function getOfficerApplications(officerId: number, limit = 10) {
  return query<LoanApplication>(
    `
    select la.*, p.name as product_name
    from loan_applications la
    left join products p on p.id = la.product_id
    where la.officer_id = $1
    order by la.applied_at desc
    limit $2
  `,
    [officerId, limit]
  );
}

export async function getSyncQueue(officerId: number) {
  return query<LoanApplication>(
    `
    select la.*, p.name as product_name
    from loan_applications la
    left join products p on p.id = la.product_id
    where la.officer_id = $1
      and la.status in ('queued','uploading','submitted','approved','sync_failed')
    order by
      case la.status
        when 'sync_failed' then 1
        when 'uploading' then 2
        when 'queued' then 3
        else 4
      end,
      la.applied_at desc
    limit 12
  `,
    [officerId]
  );
}
