import pg from "pg";
import jexl from "jexl";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

// Same custom functions as src/lib/scoring/jexl.ts, so seeded historical applications are
// scored with the exact same engine live submissions run through.
jexl.addFunction("min", (...a) => Math.min(...a.map(Number)));
jexl.addFunction("max", (...a) => Math.max(...a.map(Number)));
jexl.addFunction("log10", (n) => Math.log10(Number(n) || 0));
jexl.addFunction("clamp", (n, lo, hi) => Math.min(hi, Math.max(lo, n)));

async function scoreApplication(groups, context) {
  let total = 0;
  const breakdown = {};
  for (const g of groups) {
    let groupTotal = 0;
    for (const f of g.fields) {
      const raw = await jexl.eval(f.formula, context);
      if (raw < 0) return { finalScore: 0, knockedOut: true, knockOutField: f.name, breakdown: {} };
      groupTotal += raw;
    }
    const groupScore = groupTotal * (g.weight / 100);
    breakdown[g.name] = Math.round(groupScore * 100) / 100;
    total += groupScore;
  }
  return { finalScore: Math.max(0, Math.min(1000, Math.round(total))), knockedOut: false, knockOutField: null, breakdown };
}

const NIGERIAN_FIRST = [
  "Chinedu", "Ngozi", "Emeka", "Adaeze", "Ifeoma", "Tunde", "Bukola", "Folake",
  "Aisha", "Chiamaka", "Kelechi", "Oluwaseun", "Chukwudi", "Amara", "Bolanle",
  "Chidinma", "Uche", "Kunle", "Ronke", "Ebele", "Segun", "Grace", "Emmanuel",
  "Precious", "Musa",
];
const NIGERIAN_LAST = [
  "Okafor", "Adewale", "Abubakar", "Eze", "Balogun", "Chukwu", "Nwosu",
  "Adeyemi", "Okonkwo", "Bello", "Afolabi", "Uzoma", "Okoro", "Adekunle",
  "Danjuma", "Igwe", "Chukwuma", "Yakubu", "Ibrahim", "Nnamdi",
];
const STATES = ["Lagos", "Abuja", "Kano", "Port Harcourt", "Ibadan", "Enugu"];

function pick(arr, seed) {
  return arr[seed % arr.length];
}
function fullName(seed) {
  return `${pick(NIGERIAN_FIRST, seed)} ${pick(NIGERIAN_LAST, seed * 7 + 3)}`;
}
function pad(n, len) {
  return String(n).padStart(len, "0");
}
function gps(quality) {
  return quality > 0.1
    ? `${(6.5 + Math.random() * 6).toFixed(6)},${(3.4 + Math.random() * 5).toFixed(6)}`
    : "";
}

async function main() {
  await client.connect();
  console.log("Connected. Seeding...");

  await client.query(
    "truncate table activity_log, loan_applications, scoring_tiers, scoring_fields, scoring_groups, products, scoring_configs, officers restart identity cascade"
  );

  // --- Officers ---
  const officerRows = [
    ["J. Adewale", "PB-1042", "Lagos", "+234 803 200 1001"],
    ["M. Okafor", "PB-1088", "Port Harcourt", "+234 803 200 1002"],
    ["T. Abubakar", "PB-1103", "Kano", "+234 803 200 1003"],
    ["K. Adeyemi", "PB-1121", "Lagos", "+234 803 200 1004"],
    ["Officer John Eze", "PB-1077", "Ibadan", "+234 803 200 1005"],
  ];
  const officers = [];
  for (const [name, code, region, phone] of officerRows) {
    const { rows } = await client.query(
      `insert into officers (name, employee_code, region, phone) values ($1,$2,$3,$4) returning id, name, region`,
      [name, code, region, phone]
    );
    officers.push(rows[0]);
  }
  const fieldOfficer = officers.find((o) => o.name === "Officer John Eze");
  const backOfficeOfficers = officers.filter((o) => o.name !== "Officer John Eze");

  // --- Scoring configs: agriculture only (palm oil, cashew, yam) ---
  async function createConfig({ name, description, isDefault, groups, tiers }) {
    const { rows } = await client.query(
      `insert into scoring_configs (name, description, is_default) values ($1,$2,$3) returning id`,
      [name, description, isDefault]
    );
    const configId = rows[0].id;
    const insertedGroups = [];

    for (const [gi, g] of groups.entries()) {
      const { rows: groupRows } = await client.query(
        `insert into scoring_groups (config_id, name, weight_pct, sort_order) values ($1,$2,$3,$4) returning id`,
        [configId, g.name, g.weight, gi + 1]
      );
      const groupId = groupRows[0].id;
      for (const [fi, f] of g.fields.entries()) {
        await client.query(
          `insert into scoring_fields (group_id, name, label, data_type, options, formula, mandatory, sort_order)
           values ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [groupId, f.name, f.label, f.dataType, f.options ?? null, f.formula, f.mandatory ?? false, fi + 1]
        );
      }
      insertedGroups.push({ name: g.name, weight: g.weight, fields: g.fields });
    }
    for (const t of tiers) {
      await client.query(
        `insert into scoring_tiers (config_id, tier, label, min_score, max_score, description) values ($1,$2,$3,$4,$5,$6)`,
        [configId, t.tier, t.label, t.min, t.max, t.description]
      );
    }
    return { configId, groups: insertedGroups };
  }

  const palmOil = await createConfig({
    name: "Palm Oil Farming Scorecard",
    description: "Alternative-data scorecard for smallholder palm oil plantation loans.",
    isDefault: true,
    groups: [
      {
        name: "Plantation Profile",
        weight: 35,
        fields: [
          { name: "palmTreeCount", label: "Number of Palm Trees", dataType: "NUMERIC", mandatory: true, formula: "min(500, palmTreeCount * 2)" },
          { name: "plantationAge", label: "Plantation Age (years)", dataType: "NUMERIC", mandatory: true, formula: "plantationAge < 3 ? -1 : min(500, plantationAge * 50)" },
        ],
      },
      {
        name: "Yield & Market Access",
        weight: 45,
        fields: [
          { name: "monthlyYieldLiters", label: "Monthly Palm Oil Yield (Litres)", dataType: "DECIMAL", mandatory: true, formula: "min(600, monthlyYieldLiters / 2)" },
          { name: "marketAccess", label: "Market Access", dataType: "DROP_DOWN", options: "Direct Mill Buyer,Cooperative,Local Market Only", mandatory: true, formula: 'marketAccess == "Direct Mill Buyer" ? 400 : marketAccess == "Cooperative" ? 250 : 100' },
        ],
      },
      {
        name: "Land & Verification",
        weight: 20,
        fields: [
          { name: "landTenure", label: "Land Ownership", dataType: "DROP_DOWN", options: "Freehold,Leasehold,Family Land", mandatory: true, formula: 'landTenure == "Freehold" ? 500 : landTenure == "Leasehold" ? 350 : 200' },
          { name: "gpsLocation", label: "Plantation GPS Location", dataType: "GPS_LOCATION", mandatory: true, formula: 'gpsLocation == "" ? 100 : 500' },
        ],
      },
    ],
    tiers: [
      { tier: "green", label: "STP Approve", min: 700, max: null, description: "Applications above this score are automatically approved." },
      { tier: "amber", label: "Manual Review", min: 400, max: 700, description: "Requires Branch Manager intervention and physical sign-off." },
      { tier: "red", label: "Auto Decline", min: null, max: 400, description: "Immediate rejection. Excludes knockout rules." },
    ],
  });

  const cashew = await createConfig({
    name: "Cashew Farming Scorecard",
    description: "Alternative-data scorecard for cashew nut smallholder loans.",
    isDefault: false,
    groups: [
      {
        name: "Farm Profile",
        weight: 30,
        fields: [
          { name: "cashewTreeCount", label: "Number of Cashew Trees", dataType: "NUMERIC", mandatory: true, formula: "min(500, cashewTreeCount * 2)" },
          { name: "yearsSincePlanting", label: "Years Since Planting", dataType: "NUMERIC", mandatory: true, formula: "yearsSincePlanting < 3 ? -1 : min(500, yearsSincePlanting * 60)" },
        ],
      },
      {
        name: "Yield & Grade",
        weight: 50,
        fields: [
          { name: "expectedYieldKg", label: "Expected Cashew Yield (kg)", dataType: "DECIMAL", mandatory: true, formula: "min(600, expectedYieldKg / 5)" },
          { name: "nutGrade", label: "Nut Grade", dataType: "DROP_DOWN", options: "Grade A (Export),Grade B (Local),Ungraded", mandatory: true, formula: 'nutGrade == "Grade A (Export)" ? 400 : nutGrade == "Grade B (Local)" ? 220 : 80' },
        ],
      },
      {
        name: "Verification",
        weight: 20,
        fields: [
          { name: "gpsLocation", label: "Farm GPS Location", dataType: "GPS_LOCATION", mandatory: true, formula: 'gpsLocation == "" ? 200 : 1000' },
        ],
      },
    ],
    tiers: [
      { tier: "green", label: "STP Approve", min: 700, max: null, description: "Applications above this score are automatically approved." },
      { tier: "amber", label: "Manual Review", min: 400, max: 700, description: "Requires Branch Manager intervention and physical sign-off." },
      { tier: "red", label: "Auto Decline", min: null, max: 400, description: "Immediate rejection. Excludes knockout rules." },
    ],
  });

  const yam = await createConfig({
    name: "Yam Farming Scorecard",
    description: "Alternative-data scorecard for yam farming input and expansion loans.",
    isDefault: false,
    groups: [
      {
        name: "Farm Profile",
        weight: 30,
        fields: [
          { name: "farmSizeHectares", label: "Farm Size (Hectares)", dataType: "DECIMAL", mandatory: true, formula: "min(500, farmSizeHectares * 100)" },
          { name: "farmingSeasons", label: "Years Farming Yam", dataType: "NUMERIC", mandatory: true, formula: "min(500, farmingSeasons * 50)" },
        ],
      },
      {
        name: "Yield & Storage",
        weight: 50,
        fields: [
          { name: "expectedTubers", label: "Expected Yam Tubers", dataType: "NUMERIC", mandatory: true, formula: "min(600, expectedTubers / 10)" },
          { name: "storageAccess", label: "Storage Facility Access", dataType: "DROP_DOWN", options: "Modern Barn,Traditional Barn,None", mandatory: true, formula: 'storageAccess == "Modern Barn" ? 400 : storageAccess == "Traditional Barn" ? 250 : 50' },
        ],
      },
      {
        name: "Verification",
        weight: 20,
        fields: [
          { name: "gpsLocation", label: "Farm GPS Location", dataType: "GPS_LOCATION", mandatory: true, formula: 'gpsLocation == "" ? 150 : 1000' },
        ],
      },
    ],
    tiers: [
      { tier: "green", label: "STP Approve", min: 700, max: null, description: "Applications above this score are automatically approved." },
      { tier: "amber", label: "Manual Review", min: 400, max: 700, description: "Requires Branch Manager intervention and physical sign-off." },
      { tier: "red", label: "Auto Decline", min: null, max: 400, description: "Immediate rejection. Excludes knockout rules." },
    ],
  });

  // --- Products: exactly one per crop, tied to its scorecard ---
  const productDefs = [
    ["Palm Oil Expansion Loan", palmOil.configId, palmOil.groups],
    ["Cashew Farm Loan", cashew.configId, cashew.groups],
    ["Yam Farming Loan", yam.configId, yam.groups],
  ];
  const products = [];
  for (const [name, configId, groups] of productDefs) {
    const { rows } = await client.query(
      `insert into products (name, status, scoring_config_id, sort_order) values ($1,'ACTIVE',$2,$3) returning id, name`,
      [name, configId, products.length + 1]
    );
    products.push({ ...rows[0], configId, groups });
  }

  function fieldsFor(productName, quality) {
    if (productName === "Palm Oil Expansion Loan") {
      return {
        palmTreeCount: Math.round(40 + quality * 280 + (Math.random() * 40 - 20)),
        plantationAge: Math.max(1, Math.round(1 + quality * 11)),
        monthlyYieldLiters: Math.round(150 + quality * 1400 + (Math.random() * 200 - 100)),
        marketAccess: quality > 0.66 ? "Direct Mill Buyer" : quality > 0.33 ? "Cooperative" : "Local Market Only",
        landTenure: quality > 0.6 ? "Freehold" : quality > 0.3 ? "Leasehold" : "Family Land",
        gpsLocation: gps(quality),
      };
    }
    if (productName === "Cashew Farm Loan") {
      return {
        cashewTreeCount: Math.round(30 + quality * 230 + (Math.random() * 30 - 15)),
        yearsSincePlanting: Math.max(1, Math.round(1 + quality * 9)),
        expectedYieldKg: Math.round(300 + quality * 2900 + (Math.random() * 200 - 100)),
        nutGrade: quality > 0.66 ? "Grade A (Export)" : quality > 0.33 ? "Grade B (Local)" : "Ungraded",
        gpsLocation: gps(quality),
      };
    }
    // Yam Farming Loan
    return {
      farmSizeHectares: Math.round((0.5 + quality * 5.5) * 10) / 10,
      farmingSeasons: Math.max(1, Math.round(1 + quality * 9)),
      expectedTubers: Math.round(400 + quality * 5800 + (Math.random() * 300 - 150)),
      storageAccess: quality > 0.66 ? "Modern Barn" : quality > 0.33 ? "Traditional Barn" : "None",
      gpsLocation: gps(quality),
    };
  }

  function decisionFor(tier, score) {
    if (tier === "green") return score >= 900 ? "STP Approve" : "Approve";
    if (tier === "amber") return "Manual Review";
    return "Declined";
  }

  const apps = [];
  let appSeq = 100;

  // Bulk historical applications, evenly spread across the 3 crops, scored with the real engine.
  for (const product of products) {
    for (let i = 0; i < 12; i++) {
      const seed = appSeq++;
      // Deterministic-ish spread across quality bands, with a few forced knockouts.
      const band = i % 6;
      const quality =
        band === 0 ? 0.05 + Math.random() * 0.05 // forced knockout (too young)
        : band === 1 ? 0.15 + Math.random() * 0.15
        : band === 2 ? 0.35 + Math.random() * 0.15
        : band === 3 ? 0.55 + Math.random() * 0.15
        : band === 4 ? 0.75 + Math.random() * 0.15
        : 0.9 + Math.random() * 0.1;

      const fields = fieldsFor(product.name, quality);
      const outcome = await scoreApplication(product.groups, fields);
      const tier = outcome.knockedOut ? "red" : outcome.finalScore >= 700 ? "green" : outcome.finalScore >= 400 ? "amber" : "red";
      const decision = outcome.knockedOut ? "Declined (Knockout)" : decisionFor(tier, outcome.finalScore);
      const status = tier === "green" ? "approved" : tier === "amber" ? "manual_review" : "declined";
      const officer = pick(backOfficeOfficers, seed);
      const daysAgo = (seed % 28) + 1;
      const appliedAt = new Date(Date.now() - daysAgo * 24 * 3600 * 1000);

      apps.push({
        app_code: `APP-NGA-${pad(1000 + seed, 4)}`,
        applicant_name: fullName(seed),
        national_id: `NIN-${pad(2000 + seed, 4)}`,
        phone: "+234 705 " + pad((seed * 4931) % 1000000, 6),
        product_id: product.id,
        amount_ngn: 80000 + ((seed * 12345) % 900000),
        region: pick(STATES, seed),
        officer_id: officer.id,
        status,
        score: outcome.finalScore,
        tier,
        decision,
        scoring_config_id: product.configId,
        knocked_out: outcome.knockedOut,
        knock_out_field: outcome.knockOutField,
        score_breakdown: outcome.breakdown,
        submitted_fields: fields,
        gps_lat: 6.5 + Math.random() * 6,
        gps_lng: 3.4 + Math.random() * 5,
        sync_progress_pct: 100,
        sync_detail: null,
        sync_error: null,
        applied_at: appliedAt,
        synced_at: appliedAt,
      });
    }
  }

  // A handful of in-flight applications for the field officer persona, to populate the
  // field app's dashboard and sync center with every sync state.
  const fieldOfficerRows = [
    { product: products[0], name: "Sarah Okonkwo", quality: null, status: "queued", syncProgress: 0, syncDetail: "QUEUED FOR SYNC" },
    { product: products[1], name: "James Chukwu", quality: null, status: "draft", syncProgress: 0, syncDetail: null },
    { product: products[2], name: "Mary Uzoma", quality: 0.8, status: "uploading", syncProgress: 50, syncDetail: "UPLOADING ATTACHMENTS (2/4)" },
    { product: products[0], name: "Peter Okoro", quality: null, status: "sync_failed", syncProgress: 75, syncError: "Timeout while uploading KYC_doc_2.pdf" },
    { product: products[1], name: "Sarah Adekunle", quality: 0.85, status: "approved", syncStatus: "submitted" },
    { product: products[2], name: "David Ibrahim", quality: 0.7, status: "manual_review", syncStatus: "submitted" },
  ];

  for (const r of fieldOfficerRows) {
    const seed = appSeq++;
    const hasFields = r.quality != null;
    const fields = hasFields ? fieldsFor(r.product.name, r.quality) : {};
    const outcome = hasFields ? await scoreApplication(r.product.groups, fields) : null;
    const tier = outcome ? (outcome.knockedOut ? "red" : outcome.finalScore >= 700 ? "green" : outcome.finalScore >= 400 ? "amber" : "red") : null;
    const decision = outcome ? (outcome.knockedOut ? "Declined (Knockout)" : decisionFor(tier, outcome.finalScore)) : null;
    const daysAgo = hasFields ? 1 : 0;
    const appliedAt = new Date(Date.now() - daysAgo * 24 * 3600 * 1000);

    apps.push({
      app_code: `APP-2026-${pad(seed, 4)}`,
      applicant_name: r.name,
      national_id: `NIN-${pad(3000 + seed, 4)}`,
      phone: "+234 803 " + pad((seed * 913) % 1000000, 6),
      product_id: r.product.id,
      amount_ngn: 80000 + ((seed * 4321) % 500000),
      region: fieldOfficer.region,
      officer_id: fieldOfficer.id,
      status: r.status,
      score: outcome ? outcome.finalScore : null,
      tier,
      decision,
      scoring_config_id: hasFields ? r.product.configId : null,
      knocked_out: outcome ? outcome.knockedOut : false,
      knock_out_field: outcome ? outcome.knockOutField : null,
      score_breakdown: outcome ? outcome.breakdown : null,
      submitted_fields: hasFields ? fields : null,
      gps_lat: 6.5 + Math.random() * 6,
      gps_lng: 3.4 + Math.random() * 5,
      sync_progress_pct: r.syncProgress ?? 100,
      sync_detail: r.syncDetail ?? null,
      sync_error: r.syncError ?? null,
      applied_at: appliedAt,
      synced_at: ["draft", "queued", "uploading", "sync_failed"].includes(r.status) ? null : appliedAt,
    });
  }

  const appIdByCode = {};
  for (const a of apps) {
    const { rows } = await client.query(
      `insert into loan_applications
        (app_code, applicant_name, national_id, phone, product_id, amount_ngn, region, officer_id, status, score, tier, decision, scoring_config_id, knocked_out, knock_out_field, score_breakdown, submitted_fields, gps_lat, gps_lng, sync_progress_pct, sync_detail, sync_error, applied_at, synced_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
       returning id`,
      [
        a.app_code, a.applicant_name, a.national_id, a.phone, a.product_id, a.amount_ngn, a.region, a.officer_id,
        a.status, a.score, a.tier, a.decision, a.scoring_config_id, a.knocked_out, a.knock_out_field,
        a.score_breakdown ? JSON.stringify(a.score_breakdown) : null,
        a.submitted_fields ? JSON.stringify(a.submitted_fields) : null,
        a.gps_lat, a.gps_lng, a.sync_progress_pct, a.sync_detail, a.sync_error, a.applied_at, a.synced_at,
      ]
    );
    appIdByCode[a.app_code] = rows[0].id;
  }

  // --- Activity feed (admin dashboard "Recent Activity") — most recent handful of decided apps ---
  const decided = apps
    .filter((a) => a.score != null)
    .sort((a, b) => b.applied_at - a.applied_at)
    .slice(0, 4);
  let minsAgo = 8;
  for (const a of decided) {
    const appId = appIdByCode[a.app_code];
    const action = a.decision === "STP Approve" ? "STP APPROVE" : a.decision === "Approve" ? "APPROVE" : a.tier === "amber" ? "MANUAL REVIEW" : "DECLINED";
    const message = a.knocked_out
      ? `Knocked out on field "${a.knock_out_field}".`
      : a.tier === "amber"
      ? "Flagged for manual underwriting review."
      : a.tier === "green"
      ? `Processed automatically in ${a.region} state.`
      : "Automated rejection based on scorecard result.";
    await client.query(
      `insert into activity_log (application_id, action, message, tier, score, created_at)
       values ($1,$2,$3,$4,$5, now() - ($6 || ' minutes')::interval)`,
      [appId, action, message, a.tier, a.score, minsAgo]
    );
    minsAgo += 35;
  }

  console.log(
    `Seeded ${officers.length} officers, 3 scoring configs (palm oil, cashew, yam), ${products.length} products, ${apps.length} applications.`
  );
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
