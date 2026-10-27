import Link from "next/link";
import { getScoringConfigsList } from "@/lib/data";
import { createScoringConfig } from "./actions";

export default async function ScoringConfigsListPage() {
  const configs = await getScoringConfigsList();
  const defaultConfig = configs.find((c) => c.is_default) ?? configs[0];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-headline text-on-surface">Scoring Configurations</h2>
        <p className="text-base text-on-surface-variant mt-1">
          Named scorecards — weights, knockout rules, and RAG tiers. Each loan product is tied to
          one configuration; new loans are scored under whichever configuration their product
          currently points to.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
        {configs.map((config) => (
          <Link
            key={config.id}
            href={`/admin/scoring/${config.id}`}
            className="bg-surface-field border border-outline-variant rounded-xl p-6 shadow-sm hover:border-primary transition-colors flex flex-col gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-xl font-headline text-on-surface">{config.name}</h3>
              {config.is_default && (
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                  Default
                </span>
              )}
            </div>
            <p className="text-sm text-on-surface-variant flex-1">{config.description}</p>
            <div className="pt-3 border-t border-outline-variant">
              <p className="text-xs font-bold uppercase text-on-surface-variant mb-1">
                {config.product_count} product{config.product_count === 1 ? "" : "s"} tied to this
                configuration
              </p>
              {config.product_names && config.product_names.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {config.product_names.map((name) => (
                    <span
                      key={name}
                      className="px-2 py-0.5 rounded-sm text-xs bg-surface-container-low text-on-surface-variant"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-surface-field border border-outline-variant rounded-xl p-6 shadow-sm max-w-xl">
        <h3 className="text-lg font-headline text-on-surface mb-1">New Configuration</h3>
        <p className="text-sm text-on-surface-variant mb-4">
          Starts as a copy of &ldquo;{defaultConfig?.name}&rdquo; — adjust weights, rules and tiers
          after creating it, then assign products to it.
        </p>
        <form action={createScoringConfig} className="flex flex-col gap-3">
          <input type="hidden" name="clone_from_id" value={defaultConfig?.id} />
          <div>
            <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
              Name
            </label>
            <input
              name="new_config_name"
              required
              placeholder="e.g. High-Value Agri Scorecard"
              className="w-full px-3 py-2 border border-outline-variant rounded text-sm bg-surface-container-lowest focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-on-surface-variant mb-1">
              Description
            </label>
            <input
              name="new_config_description"
              placeholder="What is this scorecard for?"
              className="w-full px-3 py-2 border border-outline-variant rounded text-sm bg-surface-container-lowest focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <button
            type="submit"
            className="self-start mt-1 px-4 py-2 bg-primary text-on-primary rounded hover:bg-primary/90 transition-colors text-sm font-bold uppercase"
          >
            Create Configuration
          </button>
        </form>
      </div>
    </div>
  );
}
