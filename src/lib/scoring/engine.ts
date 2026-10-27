import { evaluateFormula } from "./jexl";
import type { ScoringGroup } from "../types";

export interface ScoringOutcome {
  finalScore: number;
  knockedOut: boolean;
  knockOutField: string | null;
  breakdown: Record<string, number>;
  formulaError: string | null;
}

function coerceContextValue(dataType: string, raw: unknown): unknown {
  switch (dataType) {
    case "NUMERIC":
      return raw === undefined || raw === null || raw === "" ? 0 : Number(raw);
    case "DECIMAL":
      return raw === undefined || raw === null || raw === "" ? 0 : Number(raw);
    case "MULTI_SELECT":
      return Array.isArray(raw) ? raw : [];
    default:
      return raw === undefined || raw === null ? "" : String(raw);
  }
}

/**
 * Faithful (simplified) re-implementation of the original UNCDF ScoringService:
 * inject all submitted field values into a flat context keyed by field name, then walk
 * groups → fields in order evaluating each field's JEXL formula. A negative raw score
 * knocks the whole application out immediately. Otherwise groupScore = sum(raw scores) *
 * group.weight / 100, and finalScore = clamp(sum(groupScores), 0, 1000).
 */
export async function scoreApplication(
  groups: ScoringGroup[],
  submittedFields: Record<string, unknown>
): Promise<ScoringOutcome> {
  const context: Record<string, unknown> = {};
  for (const group of groups) {
    for (const field of group.fields) {
      context[field.name] = coerceContextValue(field.data_type, submittedFields[field.name]);
    }
  }

  const breakdown: Record<string, number> = {};
  let total = 0;

  for (const group of groups) {
    let groupFieldsTotal = 0;
    for (const field of group.fields) {
      if (!field.formula || !field.formula.trim()) continue;

      const { value, error } = await evaluateFormula(field.formula, context);
      if (error) {
        return {
          finalScore: 0,
          knockedOut: false,
          knockOutField: null,
          breakdown: {},
          formulaError: `${field.label}: ${error}`,
        };
      }
      if (value === null) continue;

      if (value < 0) {
        return {
          finalScore: 0,
          knockedOut: true,
          knockOutField: field.name,
          breakdown,
          formulaError: null,
        };
      }

      groupFieldsTotal += value;
    }
    const groupScore = groupFieldsTotal * (group.weight_pct / 100);
    breakdown[group.name] = Math.round(groupScore * 100) / 100;
    total += groupScore;
  }

  const finalScore = Math.max(0, Math.min(1000, Math.round(total)));
  return { finalScore, knockedOut: false, knockOutField: null, breakdown, formulaError: null };
}
