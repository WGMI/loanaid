import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getScoringConfigMeta,
  getScoringConfigDetail,
  getProductsWithConfigNames,
} from "@/lib/data";
import { GroupsFieldsBuilder } from "@/components/GroupsFieldsBuilder";
import { TiersSection } from "@/components/TiersSection";
import { saveScoringConfig, addGroup, renameConfig, assignProducts } from "./actions";

export default async function ScoringConfigDetailPage({
  params,
}: PageProps<"/admin/scoring/[id]">) {
  const { id } = await params;
  const configId = Number(id);

  const [config, { groups, tiers }, products] = await Promise.all([
    getScoringConfigMeta(configId),
    getScoringConfigDetail(configId),
    getProductsWithConfigNames(),
  ]);

  if (!config) notFound();

  const green = tiers.find((t) => t.tier === "green")?.min_score ?? 700;
  const amber = tiers.find((t) => t.tier === "amber")?.min_score ?? 400;

  const boundSave = saveScoringConfig.bind(null, configId);
  const boundAddGroup = addGroup.bind(null, configId);
  const boundRename = renameConfig.bind(null, configId);
  const boundAssign = assignProducts.bind(null, configId);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <Link href="/admin/scoring" className="text-sm text-primary hover:underline">
          &larr; All Configurations
        </Link>
      </div>

      <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <form action={boundRename} className="flex flex-col gap-2 max-w-lg">
          <input
            name="config_name"
            defaultValue={config.name}
            className="text-3xl font-headline text-on-surface bg-transparent border-b border-transparent hover:border-outline-variant focus:border-primary outline-none px-0.5 -mx-0.5"
          />
          <input
            name="config_description"
            defaultValue={config.description ?? ""}
            placeholder="Description"
            className="text-base text-on-surface-variant bg-transparent border-b border-transparent hover:border-outline-variant focus:border-primary outline-none px-0.5 -mx-0.5"
          />
          <button
            type="submit"
            className="self-start text-xs font-bold uppercase text-primary hover:underline"
          >
            Save name &amp; description
          </button>
        </form>
        {config.is_default && (
          <span className="shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase bg-primary/10 text-primary border border-primary/20">
            Default Configuration
          </span>
        )}
      </div>

      <form action={boundSave} className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2 flex flex-col gap-6">
          <GroupsFieldsBuilder configId={configId} groups={groups} />

          <div className="flex items-center gap-2">
            <input
              name="new_group_name"
              placeholder="e.g. Repayment Behaviour"
              className="flex-1 px-3 py-2 border border-outline-variant rounded text-sm bg-surface-container-lowest focus:ring-1 focus:ring-primary outline-none"
            />
            <button
              type="submit"
              formAction={boundAddGroup}
              className="text-sm text-primary hover:bg-primary/10 px-3 py-1.5 rounded transition-colors border border-primary/30 whitespace-nowrap"
            >
              + Add Group
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <TiersSection greenMin={green} amberMin={amber} />
          <button
            type="submit"
            className="px-4 py-3 bg-primary text-on-primary rounded hover:bg-primary/90 transition-colors shadow-sm text-sm font-bold uppercase"
          >
            Save Configuration
          </button>
        </div>
      </form>

      <div className="bg-surface-field border border-outline-variant rounded-xl p-6 shadow-sm max-w-3xl">
        <div className="flex items-start justify-between gap-4 mb-1">
          <h3 className="text-xl font-headline text-on-surface">
            Products tied to this configuration
          </h3>
          <Link
            href={`/admin/products?configId=${configId}`}
            className="shrink-0 text-sm text-primary hover:bg-primary/10 px-3 py-1.5 rounded transition-colors border border-primary/30 whitespace-nowrap flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create Loan Product
          </Link>
        </div>
        <p className="text-sm text-on-surface-variant mb-4">
          Every new loan application against a checked product is scored using{" "}
          <span className="font-semibold text-on-surface">{config.name}</span>. Unchecking a
          product only releases it from this configuration — it won&rsquo;t touch a product
          currently owned by a different configuration.
        </p>
        <form action={boundAssign} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {products.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-3 p-3 bg-surface-container-low rounded border border-outline-variant/50 cursor-pointer"
              >
                <input type="hidden" name="all_product_id" value={p.id} />
                <input
                  type="checkbox"
                  name="product_id"
                  value={p.id}
                  defaultChecked={p.scoring_config_id === configId}
                  className="accent-primary"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-on-surface">{p.name}</p>
                  {p.config_name && p.scoring_config_id !== configId && (
                    <p className="text-xs text-on-surface-variant">
                      Currently: {p.config_name}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
          <button
            type="submit"
            className="self-start mt-1 px-4 py-2 bg-primary text-on-primary rounded hover:bg-primary/90 transition-colors text-sm font-bold uppercase"
          >
            Save Product Assignments
          </button>
        </form>
      </div>
    </div>
  );
}
