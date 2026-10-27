import { evaluateFormula } from "./jexl";
import type { ScoringGroup, ScoringField } from "../types";

export type Rating = "green" | "amber" | "red";

export interface FieldRating {
  groupName: string;
  fieldName: string;
  label: string;
  dataType: string;
  submittedValue: unknown;
  rawScore: number | null;
  ceiling: number;
  rating: Rating;
}

function coerce(dataType: string, raw: unknown): unknown {
  switch (dataType) {
    case "NUMERIC":
    case "DECIMAL":
      return raw === undefined || raw === null || raw === "" ? 0 : Number(raw);
    case "MULTI_SELECT":
      return Array.isArray(raw) ? raw : [];
    default:
      return raw === undefined || raw === null ? "" : String(raw);
  }
}

/**
 * Best-case ceiling for a field's formula, found by probing it rather than requiring an
 * explicit "max" to be authored anywhere. Categorical fields (DROP_DOWN, GPS_LOCATION,
 * BOOLEAN) are probed across every possible value; numeric fields are probed with a very
 * large value, since every seeded formula caps itself with min(...). This is a heuristic
 * for rating display only — the real scoring engine never uses it.
 */
async function estimateCeiling(field: ScoringField, context: Record<string, unknown>): Promise<number> {
  if (!field.formula) return 0;

  if (field.data_type === "DROP_DOWN" || field.data_type === "MULTI_SELECT") {
    const options = field.options?.split(",").map((o) => o.trim()).filter(Boolean) ?? [];
    let max = -Infinity;
    for (const o of options) {
      const probeValue = field.data_type === "MULTI_SELECT" ? [o] : o;
      const { value } = await evaluateFormula(field.formula, { ...context, [field.name]: probeValue });
      if (value != null) max = Math.max(max, value);
    }
    return max === -Infinity ? 0 : max;
  }

  if (field.data_type === "GPS_LOCATION") {
    const captured = await evaluateFormula(field.formula, { ...context, [field.name]: "0.0,0.0" });
    const notCaptured = await evaluateFormula(field.formula, { ...context, [field.name]: "" });
    return Math.max(captured.value ?? -Infinity, notCaptured.value ?? -Infinity, 0);
  }

  if (field.data_type === "BOOLEAN") {
    const t = await evaluateFormula(field.formula, { ...context, [field.name]: "true" });
    const f = await evaluateFormula(field.formula, { ...context, [field.name]: "false" });
    return Math.max(t.value ?? -Infinity, f.value ?? -Infinity, 0);
  }

  // NUMERIC / DECIMAL / TEXT — probe with a very large value, plus the current value as a floor.
  const big = await evaluateFormula(field.formula, { ...context, [field.name]: 1e9 });
  const current = await evaluateFormula(field.formula, context);
  return Math.max(big.value ?? -Infinity, current.value ?? -Infinity, 0);
}

function rate(rawScore: number | null, ceiling: number): Rating {
  if (rawScore === null) return "amber";
  if (rawScore < 0) return "red";
  if (ceiling <= 0) return "green";
  const ratio = rawScore / ceiling;
  if (ratio >= 0.66) return "green";
  if (ratio >= 0.33) return "amber";
  return "red";
}

export async function computeFieldRatings(
  groups: ScoringGroup[],
  submittedFields: Record<string, unknown>
): Promise<FieldRating[]> {
  const context: Record<string, unknown> = {};
  for (const group of groups) {
    for (const field of group.fields) {
      context[field.name] = coerce(field.data_type, submittedFields[field.name]);
    }
  }

  const ratings: FieldRating[] = [];
  for (const group of groups) {
    for (const field of group.fields) {
      if (!field.formula) continue;
      const { value } = await evaluateFormula(field.formula, context);
      const ceiling = await estimateCeiling(field, context);
      ratings.push({
        groupName: group.name,
        fieldName: field.name,
        label: field.label,
        dataType: field.data_type,
        submittedValue: submittedFields[field.name] ?? null,
        rawScore: value,
        ceiling,
        rating: rate(value, ceiling),
      });
    }
  }
  return ratings;
}
