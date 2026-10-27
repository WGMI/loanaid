import {
  getOfficerByName,
  getProducts,
  getProductScoringConfigId,
  getScoringConfigDetail,
} from "@/lib/data";
import { LoanApplicationWizard } from "@/components/LoanApplicationWizard";
import type { ScoringGroup } from "@/lib/types";

export default async function NewLoanApplicationPage() {
  const [officer, products] = await Promise.all([
    getOfficerByName("Officer John Eze"),
    getProducts(),
  ]);

  const parentIds = new Set(products.filter((p) => p.parent_id !== null).map((p) => p.parent_id));
  const leafProducts = products.filter((p) => !parentIds.has(p.id));

  const configCache = new Map<number, ScoringGroup[]>();
  const groupsByProduct: Record<number, ScoringGroup[]> = {};

  for (const product of leafProducts) {
    const configId = await getProductScoringConfigId(product.id);
    if (!configCache.has(configId)) {
      const { groups } = await getScoringConfigDetail(configId);
      configCache.set(configId, groups);
    }
    groupsByProduct[product.id] = configCache.get(configId)!;
  }

  return (
    <LoanApplicationWizard
      products={leafProducts.map((p) => ({ id: p.id, name: p.name }))}
      groupsByProduct={groupsByProduct}
      officerId={officer?.id ?? 0}
      region={officer?.region ?? "Lagos"}
    />
  );
}
