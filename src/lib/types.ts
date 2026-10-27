export type Tier = "green" | "amber" | "red";

export type ApplicationStatus =
  | "draft"
  | "queued"
  | "uploading"
  | "submitted"
  | "manual_review"
  | "approved"
  | "declined"
  | "sync_failed";

export interface LoanApplication {
  id: number;
  app_code: string;
  applicant_name: string;
  national_id: string;
  phone: string | null;
  product_id: number | null;
  product_name?: string;
  amount_ngn: string;
  region: string;
  officer_id: number | null;
  officer_name?: string;
  status: ApplicationStatus;
  score: number | null;
  tier: Tier | null;
  decision: string | null;
  scoring_config_id: number | null;
  scoring_config_name?: string;
  knocked_out: boolean;
  knock_out_field: string | null;
  score_breakdown: Record<string, number> | null;
  submitted_fields: Record<string, unknown> | null;
  score_explanation: string | null;
  gps_lat: string | null;
  gps_lng: string | null;
  sync_progress_pct: number;
  sync_detail: string | null;
  sync_error: string | null;
  applied_at: string;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityItem {
  id: number;
  application_id: number;
  app_code: string;
  applicant_name: string;
  officer_name: string | null;
  region: string | null;
  action: string;
  message: string | null;
  tier: Tier | null;
  score: number | null;
  created_at: string;
}

export interface ScoringConfig {
  id: number;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  product_count?: number;
  product_names?: string[];
}

export type FieldDataType =
  | "TEXT"
  | "NUMERIC"
  | "DECIMAL"
  | "DROP_DOWN"
  | "MULTI_SELECT"
  | "BOOLEAN"
  | "GPS_LOCATION";

export interface ScoringField {
  id: number;
  group_id: number;
  name: string;
  label: string;
  data_type: FieldDataType;
  options: string | null;
  formula: string | null;
  mandatory: boolean;
  sort_order: number;
}

export interface ScoringGroup {
  id: number;
  config_id: number;
  name: string;
  weight_pct: number;
  sort_order: number;
  fields: ScoringField[];
}

export interface ScoringTier {
  id: number;
  config_id: number;
  tier: Tier;
  label: string;
  min_score: number | null;
  max_score: number | null;
  description: string;
}

export interface Product {
  id: number;
  name: string;
  parent_id: number | null;
  status: string;
  scoring_config_id: number | null;
}
