import Link from "next/link";
import { getProductsWithConfigNames, getScoringConfigsList } from "@/lib/data";
import { createProduct } from "./actions";

export default async function ProductsPage({
  searchParams,
}: PageProps<"/admin/products">) {
  const sp = await searchParams;
  const configIdParam = Array.isArray(sp.configId) ? sp.configId[0] : sp.configId;
  const createdIdParam = Array.isArray(sp.created) ? sp.created[0] : sp.created;
  const preselectedConfigId = configIdParam ? Number(configIdParam) : undefined;
  const createdId = createdIdParam ? Number(createdIdParam) : undefined;

  const [products, configs] = await Promise.all([
    getProductsWithConfigNames(),
    getScoringConfigsList(),
  ]);

  const nameById = new Map(products.map((p) => [p.id, p.name]));
  const preselectedConfig = configs.find((c) => c.id === preselectedConfigId);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-headline text-on-surface">Loan Products</h2>
        <p className="text-base text-on-surface-variant mt-1">
          Products field officers can originate against, each tied to a scoring
          configuration.
        </p>
      </div>

      {createdId && (
        <div className="mb-6 px-4 py-3 rounded bg-status-success/10 border border-status-success/30 text-status-success text-sm">
          Product created — it&rsquo;s now available in the field app&rsquo;s product picker.
        </div>
      )}

      <div className="bg-surface-container-lowest rounded border border-outline-variant overflow-hidden shadow-sm mb-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant">
              <th className="py-3 px-4 text-xs font-bold uppercase text-on-surface-variant">Product</th>
              <th className="py-3 px-4 text-xs font-bold uppercase text-on-surface-variant">Parent</th>
              <th className="py-3 px-4 text-xs font-bold uppercase text-on-surface-variant">Status</th>
              <th className="py-3 px-4 text-xs font-bold uppercase text-on-surface-variant">Scoring Configuration</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {products.map((p, i) => (
              <tr
                key={p.id}
                className={`border-b border-outline-variant last:border-0 ${
                  i % 2 === 1 ? "bg-surface-admin" : ""
                }`}
              >
                <td className="py-2 px-4 font-semibold text-on-surface">{p.name}</td>
                <td className="py-2 px-4 text-on-surface-variant">
                  {p.parent_id ? nameById.get(p.parent_id) ?? "—" : "—"}
                </td>
                <td className="py-2 px-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-status-success/10 text-status-success border border-status-success/20">
                    {p.status}
                  </span>
                </td>
                <td className="py-2 px-4">
                  {p.scoring_config_id ? (
                    <Link
                      href={`/admin/scoring/${p.scoring_config_id}`}
                      className="text-primary hover:underline"
                    >
                      {p.config_name}
                    </Link>
                  ) : (
                    <span className="text-on-surface-variant">Unassigned</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-surface-field border border-outline-variant rounded-xl p-6 shadow-sm max-w-xl">
        <h3 className="text-lg font-headline text-on-surface mb-1">New Loan Product</h3>
        <p className="text-sm text-on-surface-variant mb-4">
          {preselectedConfig
            ? `Will be tied to "${preselectedConfig.name}" — every application against it scores under that configuration.`
            : "Optionally tie it to a scoring configuration now, or assign one later from the configuration page."}
        </p>
        <form action={createProduct} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
              Product Name
            </label>
            <input
              name="new_product_name"
              required
              placeholder="e.g. Agri-Micro Loan"
              className="w-full px-3 py-2 border border-outline-variant rounded text-sm bg-surface-container-lowest focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
              Parent Product (optional)
            </label>
            <select
              name="new_product_parent_id"
              defaultValue=""
              className="w-full px-3 py-2 border border-outline-variant rounded text-sm bg-surface-container-lowest focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">None — top-level product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
              Scoring Configuration
            </label>
            <select
              name="new_product_config_id"
              defaultValue={preselectedConfigId ?? ""}
              className="w-full px-3 py-2 border border-outline-variant rounded text-sm bg-surface-container-lowest focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">Unassigned — falls back to default configuration</option>
              {configs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.is_default ? " (Default)" : ""}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="self-start mt-1 px-4 py-2 bg-primary text-on-primary rounded hover:bg-primary/90 transition-colors text-sm font-bold uppercase"
          >
            Create Product
          </button>
        </form>
      </div>
    </div>
  );
}
