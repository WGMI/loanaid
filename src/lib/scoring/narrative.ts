import type { FieldRating } from "./explain";

export interface NarrativeFacts {
  applicantName: string;
  productName: string;
  score: number | null;
  tier: string | null;
  decision: string | null;
  knockedOut: boolean;
  knockOutField: string | null;
  groupBreakdown: Record<string, number>;
  groupWeights: Record<string, number>;
  fieldRatings: FieldRating[];
}

function fallbackNarrative(facts: NarrativeFacts): string {
  const { applicantName, productName, score, decision, knockedOut, knockOutField, fieldRatings } = facts;
  if (knockedOut) {
    const field = fieldRatings.find((f) => f.fieldName === knockOutField);
    return `${applicantName}'s ${productName} application was declined outright because ${
      field?.label ?? knockOutField
    } failed a hard eligibility rule, regardless of every other factor. No further scoring was applied once that rule was triggered.`;
  }
  const strong = fieldRatings.filter((f) => f.rating === "green").map((f) => f.label);
  const weak = fieldRatings.filter((f) => f.rating === "red").map((f) => f.label);
  const parts = [`${applicantName} scored ${score} out of 1000 on the ${productName} scorecard, resulting in "${decision}".`];
  if (strong.length) parts.push(`Strongest factors: ${strong.join(", ")}.`);
  if (weak.length) parts.push(`Weakest factors: ${weak.join(", ")}.`);
  return parts.join(" ");
}

/**
 * Turns already-computed, deterministic facts into underwriter-style prose. The model is
 * instructed to narrate only the supplied facts — it never sees raw formulas or is asked to
 * do arithmetic, so it can't invent a number or a reason that isn't already true.
 */
export async function generateNarrative(facts: NarrativeFacts): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallbackNarrative(facts);

  const factsForModel = {
    applicant: facts.applicantName,
    product: facts.productName,
    finalScore: facts.score,
    scoreScale: "0-1000",
    tier: facts.tier,
    decision: facts.decision,
    knockedOut: facts.knockedOut,
    knockOutField: facts.knockOutField,
    groupContributions: Object.entries(facts.groupBreakdown).map(([group, points]) => ({
      group,
      pointsAwarded: points,
      weightPercent: facts.groupWeights[group] ?? null,
    })),
    fieldDetails: facts.fieldRatings.map((f) => ({
      field: f.label,
      submittedValue: f.submittedValue,
      rating: f.rating,
    })),
  };

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "You are a credit underwriting assistant explaining a scoring decision to a loan officer at a Nigerian agricultural lender. " +
              "You will be given a JSON object of already-computed facts: the final score, decision, per-group point contributions, and a " +
              "green/amber/red rating for each individual field the applicant answered. " +
              "Write a short, plain-language narrative (3-5 sentences) explaining why the applicant got this score and decision. " +
              "Rules: use ONLY the facts provided — never invent a number, a crop detail, a formula, or a reason that isn't in the JSON. " +
              "Reference the specific fields that helped or hurt the score by name. If knockedOut is true, explain that a single hard " +
              "rule forced the decision regardless of everything else, and name that field. Do not restate the raw JSON or use bullet points — write flowing prose.",
          },
          {
            role: "user",
            content: JSON.stringify(factsForModel),
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error("OpenAI narrative request failed", res.status, await res.text());
      return fallbackNarrative(facts);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    return text || fallbackNarrative(facts);
  } catch (e) {
    console.error("OpenAI narrative request errored", e);
    return fallbackNarrative(facts);
  }
}
