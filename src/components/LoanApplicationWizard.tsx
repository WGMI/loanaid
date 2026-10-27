"use client";

import { useState } from "react";
import { submitLoanApplication } from "@/app/field/apply/actions";
import { DynamicScoringField, type DynamicValue } from "./DynamicScoringField";
import type { ScoringGroup } from "@/lib/types";

interface Product {
  id: number;
  name: string;
}

const STEPS = ["Personal", "Business", "Review"];

export function LoanApplicationWizard({
  products,
  groupsByProduct,
  officerId,
  region,
}: {
  products: Product[];
  groupsByProduct: Record<number, ScoringGroup[]>;
  officerId: number;
  region: string;
}) {
  const [step, setStep] = useState(1);
  const [applicantName, setApplicantName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [productId, setProductId] = useState(products[0]?.id ?? 0);
  const [amount, setAmount] = useState(250000);
  const [dynamicValues, setDynamicValues] = useState<Record<string, DynamicValue>>({});

  const productName = products.find((p) => p.id === productId)?.name ?? "—";
  const groups = groupsByProduct[productId] ?? [];

  function updateDynamic(name: string, value: DynamicValue) {
    setDynamicValues((v) => ({ ...v, [name]: value }));
  }

  return (
    <form action={submitLoanApplication} className="flex flex-col gap-8 px-4 py-6 md:py-10 max-w-3xl mx-auto">
      <input type="hidden" name="officerId" value={officerId} />
      <input type="hidden" name="region" value={region} />
      <input type="hidden" name="applicantName" value={applicantName} />
      <input type="hidden" name="nationalId" value={nationalId} />
      <input type="hidden" name="phone" value={phone} />
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="submittedFieldsJson" value={JSON.stringify(dynamicValues)} />

      <div>
        <h1 className="text-2xl md:text-3xl font-headline text-primary mb-2">New Quick Loan Application</h1>
        <p className="text-base text-on-surface-variant">
          Complete the steps below to apply. Progress is saved automatically.
        </p>
      </div>

      <div className="flex items-center justify-between relative mb-2">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-surface-container-highest z-0" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary z-0 transition-all duration-300"
          style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
        />
        {STEPS.map((label, idx) => {
          const n = idx + 1;
          const active = n <= step;
          return (
            <div key={label} className="relative z-10 flex flex-col items-center gap-2 bg-surface px-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ring-4 ring-surface ${
                  active ? "bg-primary text-on-primary" : "bg-surface-container-highest text-on-surface-variant"
                }`}
              >
                {n}
              </div>
              <span
                className={`text-xs font-bold uppercase hidden md:block ${
                  active ? "text-primary" : "text-on-surface-variant"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="bg-surface-field border border-outline-variant rounded-xl shadow-sm p-4 md:p-6 flex flex-col gap-6">
        {step === 1 && (
          <>
            <div className="border-b border-outline-variant pb-4 mb-2">
              <h2 className="text-xl font-headline text-primary">Step 1: Personal Details</h2>
              <p className="text-sm text-on-surface-variant">Verify applicant identity information.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              <div className="flex flex-col gap-1 w-full md:col-span-2">
                <label className="text-xs font-bold uppercase text-on-surface-variant">Full Legal Name</label>
                <input
                  className="w-full h-12 px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none"
                  placeholder="e.g. John Doe"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1 w-full">
                <label className="text-xs font-bold uppercase text-on-surface-variant">National ID Number</label>
                <input
                  className="w-full h-12 px-4 py-3 bg-surface border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none"
                  placeholder="MAL-XXXX"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1 w-full">
                <label className="text-xs font-bold uppercase text-on-surface-variant">Primary Phone</label>
                <div className="relative flex">
                  <div className="flex items-center justify-center px-3 bg-surface-container-low border-y border-l border-outline-variant rounded-l-lg text-on-surface-variant">
                    +234
                  </div>
                  <input
                    className="w-full h-12 px-3 py-3 bg-surface border border-outline-variant rounded-r-lg focus:border-primary focus:ring-1 focus:ring-primary transition-colors outline-none"
                    placeholder="803 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-surface-admin rounded-lg border border-outline-variant relative overflow-hidden">
              <h3 className="text-base text-primary mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined">photo_camera</span>
                Document Captures
              </h3>
              <p className="text-sm text-on-surface-variant mb-4">
                Please attach a clear photo of the National ID.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  type="button"
                  className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-primary/30 rounded-lg bg-surface hover:bg-primary-fixed/10 transition-colors h-24 gap-1"
                >
                  <span className="material-symbols-outlined text-primary">add_a_photo</span>
                  <span className="text-[10px] font-bold text-primary">Add ID Front</span>
                </button>
                <button
                  type="button"
                  className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-primary/30 rounded-lg bg-surface hover:bg-primary-fixed/10 transition-colors h-24 gap-1"
                >
                  <span className="material-symbols-outlined text-primary">add_a_photo</span>
                  <span className="text-[10px] font-bold text-primary">Add ID Back</span>
                </button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="border-b border-outline-variant pb-4 mb-2">
              <h2 className="text-xl font-headline text-primary">Step 2: Business &amp; Household</h2>
              <p className="text-sm text-on-surface-variant">
                These fields come straight from the product&rsquo;s scoring configuration — pick a
                different product to see the form change.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              <div className="flex flex-col gap-1 w-full md:col-span-2">
                <label className="text-xs font-bold uppercase text-on-surface-variant">Loan Product</label>
                <select
                  className="w-full h-12 px-4 bg-surface border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  value={productId}
                  onChange={(e) => setProductId(Number(e.target.value))}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1 w-full">
                <label className="text-xs font-bold uppercase text-on-surface-variant">Requested Amount (₦)</label>
                <input
                  type="number"
                  className="w-full h-12 px-4 bg-surface border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                />
              </div>
            </div>

            {groups.map((group) => (
              <div key={group.id} className="flex flex-col gap-4 pt-2">
                <div className="flex items-center gap-2 border-t border-outline-variant pt-4">
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                    folder
                  </span>
                  <h3 className="text-sm font-bold uppercase text-on-surface-variant">
                    {group.name}
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {group.fields.map((field) => (
                    <DynamicScoringField
                      key={field.id}
                      field={field}
                      value={dynamicValues[field.name]}
                      onChange={updateDynamic}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {step === 3 && (
          <>
            <div className="border-b border-outline-variant pb-4 mb-2">
              <h2 className="text-xl font-headline text-primary">Step 3: Review &amp; Submit</h2>
              <p className="text-sm text-on-surface-variant">
                Confirm the details before submitting to the scoring engine.
              </p>
            </div>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-on-surface-variant text-xs uppercase font-bold">Applicant</dt>
                <dd className="text-on-surface font-semibold">{applicantName || "—"}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant text-xs uppercase font-bold">National ID</dt>
                <dd className="text-on-surface font-semibold">{nationalId || "—"}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant text-xs uppercase font-bold">Product</dt>
                <dd className="text-on-surface font-semibold">{productName}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant text-xs uppercase font-bold">Amount Requested</dt>
                <dd className="text-on-surface font-semibold">₦{amount.toLocaleString()}</dd>
              </div>
              {groups.flatMap((g) => g.fields).map((field) => {
                const v = dynamicValues[field.name];
                const display =
                  field.data_type === "GPS_LOCATION"
                    ? v
                      ? "Captured"
                      : "Not captured"
                    : Array.isArray(v)
                    ? v.join(", ") || "—"
                    : v || "—";
                return (
                  <div key={field.id}>
                    <dt className="text-on-surface-variant text-xs uppercase font-bold">
                      {field.label}
                    </dt>
                    <dd className="text-on-surface font-semibold">{display}</dd>
                  </div>
                );
              })}
            </dl>
            <p className="text-xs text-on-surface-variant bg-surface-admin rounded p-3 border border-outline-variant">
              Submitting will run this application through the live alternative-data scoring engine
              (same groups, fields &amp; formulas as configured in the Admin Cockpit) and return a
              decision instantly.
            </p>
          </>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 pb-4">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="px-6 py-3 rounded-full border border-primary text-primary text-sm font-bold uppercase hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          Back
        </button>
        <div className="flex gap-3">
          <button
            type="submit"
            name="intent"
            value="draft"
            className="px-6 py-3 rounded-full border border-primary text-primary text-sm font-bold uppercase hover:bg-surface-container-low transition-colors"
          >
            Save for Later
          </button>
          {step < STEPS.length ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}
              className="px-6 py-3 rounded-full bg-primary text-on-primary text-sm font-bold uppercase hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
            >
              Next
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          ) : (
            <button
              type="submit"
              name="intent"
              value="submit"
              className="px-6 py-3 rounded-full bg-primary text-on-primary text-sm font-bold uppercase hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
            >
              Submit Application
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
