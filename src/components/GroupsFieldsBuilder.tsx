"use client";

import { useState } from "react";
import type { ScoringGroup, ScoringField, FieldDataType } from "@/lib/types";
import { deleteGroup, deleteField, addField } from "@/app/admin/scoring/[id]/actions";
import { FormulaTester } from "./FormulaTester";

const DATA_TYPES: FieldDataType[] = [
  "NUMERIC",
  "DECIMAL",
  "TEXT",
  "DROP_DOWN",
  "MULTI_SELECT",
  "BOOLEAN",
  "GPS_LOCATION",
];

function FieldRow({ configId, field }: { configId: number; field: ScoringField }) {
  const [formula, setFormula] = useState(field.formula ?? "");
  const needsOptions = field.data_type === "DROP_DOWN" || field.data_type === "MULTI_SELECT";

  return (
    <div className="p-3 bg-surface-container-lowest rounded border border-outline-variant/50 flex flex-col gap-2">
      <input type="hidden" name="field_id" value={field.id} />
      <div className="flex items-start gap-3">
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-data-mono text-xs text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded">
              {field.name}
            </span>
            <span className="text-[10px] font-bold uppercase text-on-surface-variant border border-outline-variant rounded px-1.5 py-0.5">
              {field.data_type}
            </span>
            <label className="ml-auto flex items-center gap-1 text-xs text-on-surface-variant">
              <input
                type="checkbox"
                name={`field_mandatory_${field.id}`}
                defaultChecked={field.mandatory}
                className="accent-primary"
              />
              Mandatory
            </label>
          </div>
          <input
            name={`field_label_${field.id}`}
            defaultValue={field.label}
            placeholder="Display label"
            className="w-full px-2 py-1 border border-outline-variant rounded text-sm bg-surface-container-lowest focus:ring-1 focus:ring-primary outline-none"
          />
          {needsOptions && (
            <input
              name={`field_options_${field.id}`}
              defaultValue={field.options ?? ""}
              placeholder="Comma-separated options, e.g. Clean,Minor Arrears,Active Default"
              className="w-full px-2 py-1 border border-outline-variant rounded text-xs font-data-mono bg-surface-container-lowest focus:ring-1 focus:ring-primary outline-none"
            />
          )}
          <textarea
            name={`field_formula_${field.id}`}
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            rows={2}
            placeholder={`JEXL formula, referencing ${field.name} and any other field's name`}
            className="w-full px-2 py-1 border border-outline-variant rounded font-data-mono text-xs bg-surface-container-lowest focus:ring-1 focus:ring-primary outline-none"
          />
          <FormulaTester getFormula={() => formula} />
        </div>
        <button
          type="submit"
          formAction={deleteField.bind(null, configId, field.id)}
          className="text-on-surface-variant hover:text-status-error shrink-0"
          title="Delete field"
        >
          <span className="material-symbols-outlined text-sm">delete</span>
        </button>
      </div>
    </div>
  );
}

function AddFieldRow({ configId, groupId }: { configId: number; groupId: number }) {
  const [dataType, setDataType] = useState<FieldDataType>("NUMERIC");
  const needsOptions = dataType === "DROP_DOWN" || dataType === "MULTI_SELECT";

  return (
    <div className="p-3 border-2 border-dashed border-outline-variant rounded flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          name={`new_field_name_${groupId}`}
          placeholder="Context name, e.g. crbStatus"
          className="px-2 py-1 border border-outline-variant rounded text-xs font-data-mono bg-surface-container-lowest focus:ring-1 focus:ring-primary outline-none"
        />
        <input
          name={`new_field_label_${groupId}`}
          placeholder="Display label"
          className="px-2 py-1 border border-outline-variant rounded text-xs bg-surface-container-lowest focus:ring-1 focus:ring-primary outline-none"
        />
      </div>
      <select
        name={`new_field_data_type_${groupId}`}
        value={dataType}
        onChange={(e) => setDataType(e.target.value as FieldDataType)}
        className="px-2 py-1 border border-outline-variant rounded text-xs bg-surface-container-lowest focus:ring-1 focus:ring-primary outline-none"
      >
        {DATA_TYPES.map((dt) => (
          <option key={dt} value={dt}>
            {dt}
          </option>
        ))}
      </select>
      {needsOptions && (
        <input
          name={`new_field_options_${groupId}`}
          placeholder="Comma-separated options"
          className="px-2 py-1 border border-outline-variant rounded text-xs font-data-mono bg-surface-container-lowest focus:ring-1 focus:ring-primary outline-none"
        />
      )}
      <textarea
        name={`new_field_formula_${groupId}`}
        rows={2}
        placeholder="JEXL formula (optional — a field with no formula contributes 0)"
        className="px-2 py-1 border border-outline-variant rounded text-xs font-data-mono bg-surface-container-lowest focus:ring-1 focus:ring-primary outline-none"
      />
      <button
        type="submit"
        formAction={addField.bind(null, configId, groupId)}
        className="self-start text-xs text-primary hover:bg-primary/10 px-3 py-1 rounded border border-primary/30"
      >
        + Add Field to this Group
      </button>
    </div>
  );
}

export function GroupsFieldsBuilder({
  configId,
  groups,
}: {
  configId: number;
  groups: ScoringGroup[];
}) {
  const [weights, setWeights] = useState<Record<number, number>>(
    Object.fromEntries(groups.map((g) => [g.id, g.weight_pct]))
  );

  // `groups` is refetched from the server after every add/delete/save on this page
  // (via revalidatePath), but this component stays mounted across those refreshes.
  // Adjust local weight state during render when the authoritative group list changes
  // — otherwise deleted groups keep contributing to the displayed total indefinitely.
  // (React-recommended pattern: https://react.dev/learn/you-might-not-need-an-effect)
  const [prevGroups, setPrevGroups] = useState(groups);
  if (groups !== prevGroups) {
    setPrevGroups(groups);
    setWeights(Object.fromEntries(groups.map((g) => [g.id, g.weight_pct])));
  }

  const total = Object.values(weights).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-surface-field border border-outline-variant rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-2 border-b border-outline-variant pb-4">
        <span className="material-symbols-outlined text-primary">functions</span>
        <h3 className="text-2xl font-headline text-on-surface">Formula Builder: Groups &amp; Fields</h3>
      </div>
      <p className="text-sm text-on-surface-variant mb-6">
        Each group holds dynamic fields with their own JEXL scoring formula. A field&rsquo;s
        formula can reference any field&rsquo;s context name across the whole configuration. A
        formula returning a negative number knocks the application out immediately. Group weights
        must total 100%.
      </p>

      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <div key={group.id} className="border border-outline-variant rounded-lg p-4">
            <input type="hidden" name="group_id" value={group.id} />
            <div className="flex items-center gap-4 mb-4">
              <span className="material-symbols-outlined text-on-surface-variant">folder</span>
              <span className="font-semibold text-on-surface flex-1">{group.name}</span>
              <input
                className="w-20 px-2 py-1 border border-outline-variant rounded font-data-mono text-center bg-surface-container-lowest focus:ring-1 focus:ring-primary"
                type="number"
                name={`group_weight_${group.id}`}
                value={weights[group.id]}
                onChange={(e) =>
                  setWeights((w) => ({ ...w, [group.id]: Number(e.target.value) || 0 }))
                }
              />
              <span className="text-sm text-on-surface-variant">%</span>
              <button
                type="submit"
                formAction={deleteGroup.bind(null, configId, group.id)}
                className="text-on-surface-variant hover:text-status-error"
                title="Delete group"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
            <div className="flex flex-col gap-3 pl-8">
              {group.fields.map((field) => (
                <FieldRow key={field.id} configId={configId} field={field} />
              ))}
              <AddFieldRow configId={configId} groupId={group.id} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4 mt-4 border-t border-outline-variant">
        <span className="text-xs font-bold tracking-wider uppercase text-on-surface-variant">
          Total Group Weight Allocation
        </span>
        <span
          className={`font-data-mono font-bold ${
            total === 100 ? "text-status-success" : "text-status-error"
          }`}
        >
          {total}%
        </span>
      </div>
    </div>
  );
}
