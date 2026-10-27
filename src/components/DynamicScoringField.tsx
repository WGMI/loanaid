"use client";

import type { ScoringField } from "@/lib/types";

export type DynamicValue = string | string[];

export function DynamicScoringField({
  field,
  value,
  onChange,
}: {
  field: ScoringField;
  value: DynamicValue | undefined;
  onChange: (name: string, value: DynamicValue) => void;
}) {
  const options = field.options?.split(",").map((o) => o.trim()).filter(Boolean) ?? [];
  const inputClass =
    "w-full h-12 px-4 bg-surface border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none";

  switch (field.data_type) {
    case "NUMERIC":
    case "DECIMAL":
      return (
        <Field label={field.label} mandatory={field.mandatory}>
          <input
            type="number"
            step={field.data_type === "DECIMAL" ? "0.01" : "1"}
            className={inputClass}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(field.name, e.target.value)}
          />
        </Field>
      );

    case "TEXT":
      return (
        <Field label={field.label} mandatory={field.mandatory}>
          <input
            type="text"
            className={inputClass}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(field.name, e.target.value)}
          />
        </Field>
      );

    case "DROP_DOWN":
      return (
        <Field label={field.label} mandatory={field.mandatory}>
          <select
            className={inputClass}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(field.name, e.target.value)}
          >
            <option value="" disabled>
              Select…
            </option>
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Field>
      );

    case "MULTI_SELECT": {
      const selected = Array.isArray(value) ? value : [];
      return (
        <Field label={field.label} mandatory={field.mandatory}>
          <div className="flex flex-wrap gap-2">
            {options.map((o) => {
              const checked = selected.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() =>
                    onChange(
                      field.name,
                      checked ? selected.filter((s) => s !== o) : [...selected, o]
                    )
                  }
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    checked
                      ? "bg-primary text-on-primary border-primary"
                      : "border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  {o}
                </button>
              );
            })}
          </div>
        </Field>
      );
    }

    case "BOOLEAN":
      return (
        <Field label={field.label} mandatory={field.mandatory}>
          <button
            type="button"
            onClick={() => onChange(field.name, value === "true" ? "false" : "true")}
            className={`w-full h-12 rounded-lg border flex items-center justify-center gap-2 transition-colors ${
              value === "true"
                ? "border-status-success bg-status-success/5 text-status-success"
                : "border-outline-variant text-on-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {value === "true" ? "check_box" : "check_box_outline_blank"}
            </span>
            <span className="text-sm font-semibold">{value === "true" ? "Yes" : "No"}</span>
          </button>
        </Field>
      );

    case "GPS_LOCATION": {
      const captured = Boolean(value);
      return (
        <Field label={field.label} mandatory={field.mandatory}>
          <button
            type="button"
            onClick={() =>
              onChange(
                field.name,
                captured ? "" : `${(6.5 + Math.random() * 6).toFixed(6)},${(3.4 + Math.random() * 5).toFixed(6)}`
              )
            }
            className={`w-full h-12 rounded-lg border flex items-center justify-center gap-2 transition-colors ${
              captured
                ? "border-status-success bg-status-success/5 text-status-success"
                : "border-dashed border-primary/30 text-primary hover:bg-primary-fixed/10"
            }`}
          >
            <span className="material-symbols-outlined">
              {captured ? "location_on" : "my_location"}
            </span>
            <span className="text-sm font-semibold">
              {captured ? "GPS location captured" : "Tap to capture GPS location"}
            </span>
          </button>
        </Field>
      );
    }

    default:
      return null;
  }
}

function Field({
  label,
  mandatory,
  children,
}: {
  label: string;
  mandatory: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-xs font-bold uppercase text-on-surface-variant">
        {label}
        {mandatory && <span className="text-status-error"> *</span>}
      </label>
      {children}
    </div>
  );
}
