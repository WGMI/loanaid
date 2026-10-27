import jexl from "jexl";

// Custom functions available to every scoring formula, on top of JEXL's built-in
// arithmetic/comparison/ternary operators — mirrors the "AVERAGE, Math.min, Math.max"
// helpers the original Formula Builder view exposes.
jexl.addFunction("log10", (n: unknown) => Math.log10(Number(n) || 0));
jexl.addFunction("min", (...args: unknown[]) => Math.min(...args.map(Number)));
jexl.addFunction("max", (...args: unknown[]) => Math.max(...args.map(Number)));
jexl.addFunction("clamp", (n: unknown, lo: unknown, hi: unknown) =>
  Math.min(Number(hi), Math.max(Number(lo), Number(n)))
);

export interface FormulaResult {
  value: number | null;
  error: string | null;
}

export async function evaluateFormula(
  formula: string,
  context: Record<string, unknown>
): Promise<FormulaResult> {
  if (!formula || !formula.trim()) {
    return { value: null, error: null };
  }
  try {
    const result = await jexl.eval(formula, context);
    const num = Number(result);
    if (Number.isNaN(num)) {
      return { value: null, error: `Formula did not return a number (got: ${JSON.stringify(result)})` };
    }
    return { value: num, error: null };
  } catch (e) {
    return { value: null, error: e instanceof Error ? e.message : "Invalid formula" };
  }
}
