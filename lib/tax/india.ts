// lib/tax/india.ts
// Pure India income-tax calculator. No React, no I/O.
// FY-driven: add a new entry to FY_RULES when the Budget changes. The engine
// resolves the closest earlier FY if the requested one isn't listed yet.

export type Regime = 'new' | 'old';
export type UserType = 'salaried' | 'business' | 'mixed';

export interface TaxInput {
  fy: string;                    // e.g. "2026-27"
  regime: Regime;
  userType: UserType;
  salary?: number;
  businessProfit?: number;       // income - business expenses (only when business)
  otherIncome?: number;          // interest, rent, etc.
  deductions?: {
    sec80C?: number;             // Old regime only, cap 1.5L
    sec80D?: number;             // Old regime only, cap 25k (50k senior)
    hraExempt?: number;          // Old regime only
    homeLoanInterest?: number;   // Old regime only, cap 2L (self-occupied)
    nps80CCD1B?: number;         // Both regimes eligible; cap 50k
  };
  tdsPaid?: number;
}

export interface TaxBreakdownRow { label: string; amount: number; }
export interface TaxResult {
  fyUsed: string;                // actual rule-set FY applied (may differ from input)
  regime: Regime;
  grossIncome: number;
  standardDeduction: number;
  totalDeductions: number;
  taxableIncome: number;
  slabTax: number;
  rebate87A: number;
  taxAfterRebate: number;
  surcharge: number;
  cess: number;
  totalTax: number;
  marginalReliefApplied: number;
  netPayable: number;            // totalTax - tdsPaid (min 0)
  effectiveRate: number;         // totalTax / grossIncome
  breakdown: TaxBreakdownRow[];
}

interface Slab { upto: number; rate: number; }  // upto = Infinity for last
interface FyRules {
  new: {
    slabs: Slab[];
    standardDeduction: number;   // salaried only
    rebate87A: { taxableUpto: number; maxRebate: number };
  };
  old: {
    slabs: Slab[];
    standardDeduction: number;
    rebate87A: { taxableUpto: number; maxRebate: number };
  };
  surcharge: { threshold: number; rate: number }[];
  cess: number;                  // 0.04 = 4%
}

// ---- FY registry. Add new years here; nothing else changes. ----
const FY_RULES: Record<string, FyRules> = {
  // FY 2025-26 & 2026-27 use the Budget-2025 slabs.
  '2025-26': {
    new: {
      slabs: [
        { upto: 400000, rate: 0 },
        { upto: 800000, rate: 0.05 },
        { upto: 1200000, rate: 0.10 },
        { upto: 1600000, rate: 0.15 },
        { upto: 2000000, rate: 0.20 },
        { upto: 2400000, rate: 0.25 },
        { upto: Infinity, rate: 0.30 },
      ],
      standardDeduction: 75000,
      rebate87A: { taxableUpto: 1200000, maxRebate: 60000 },
    },
    old: {
      slabs: [
        { upto: 250000, rate: 0 },
        { upto: 500000, rate: 0.05 },
        { upto: 1000000, rate: 0.20 },
        { upto: Infinity, rate: 0.30 },
      ],
      standardDeduction: 50000,
      rebate87A: { taxableUpto: 500000, maxRebate: 12500 },
    },
    surcharge: [
      { threshold: 5000000,  rate: 0.10 },
      { threshold: 10000000, rate: 0.15 },
      { threshold: 20000000, rate: 0.25 },
      // Note: 37% surcharge was removed under New regime; kept simple here.
    ],
    cess: 0.04,
  },
  '2026-27': {
    // Same rules as 2025-26 until Budget 2026 changes them.
    // (Duplicated intentionally so future edits don't cascade.)
    get new() { return FY_RULES['2025-26'].new; },
    get old() { return FY_RULES['2025-26'].old; },
    get surcharge() { return FY_RULES['2025-26'].surcharge; },
    get cess() { return FY_RULES['2025-26'].cess; },
  } as unknown as FyRules,
};

/** Compute current Indian financial year string like "2026-27". */
export function currentFy(now: Date = new Date()): string {
  const y = now.getFullYear();
  const startYear = now.getMonth() >= 3 ? y : y - 1; // April = month 3
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}

/** Resolve FY rules with fallback to closest earlier known FY. */
function resolveRules(fy: string): { fyUsed: string; rules: FyRules } {
  if (FY_RULES[fy]) return { fyUsed: fy, rules: FY_RULES[fy] };
  const requestedStart = parseInt(fy.split('-')[0], 10);
  const known = Object.keys(FY_RULES)
    .map(k => ({ k, start: parseInt(k.split('-')[0], 10) }))
    .filter(x => !isNaN(x.start) && x.start <= requestedStart)
    .sort((a, b) => b.start - a.start);
  const pick = known[0]?.k ?? Object.keys(FY_RULES).sort().pop()!;
  return { fyUsed: pick, rules: FY_RULES[pick] };
}

function walkSlabs(taxable: number, slabs: Slab[]): number {
  let tax = 0;
  let prev = 0;
  for (const s of slabs) {
    if (taxable <= prev) break;
    const chunk = Math.min(taxable, s.upto) - prev;
    tax += chunk * s.rate;
    prev = s.upto;
  }
  return tax;
}

function computeSurcharge(taxableIncome: number, baseTax: number, tiers: FyRules['surcharge']): number {
  let rate = 0;
  for (const t of tiers) if (taxableIncome > t.threshold) rate = t.rate;
  return baseTax * rate;
}

export function computeIndiaTax(input: TaxInput): TaxResult {
  const { fyUsed, rules } = resolveRules(input.fy);
  const cfg = rules[input.regime];

  const salary = Math.max(0, input.salary ?? 0);
  const business = Math.max(0, input.businessProfit ?? 0);
  const other = Math.max(0, input.otherIncome ?? 0);
  const grossIncome = salary + business + other;

  // Standard deduction only for salaried / mixed-with-salary
  const hasSalary = salary > 0 && (input.userType === 'salaried' || input.userType === 'mixed');
  const stdDed = hasSalary ? cfg.standardDeduction : 0;

  // Other deductions
  const d = input.deductions ?? {};
  let chapterVI = 0;
  if (input.regime === 'old') {
    chapterVI += Math.min(d.sec80C ?? 0, 150000);
    chapterVI += Math.min(d.sec80D ?? 0, 50000);
    chapterVI += Math.max(0, d.hraExempt ?? 0);
    chapterVI += Math.min(d.homeLoanInterest ?? 0, 200000);
  }
  // 80CCD(1B) NPS extra 50k — available in both regimes
  chapterVI += Math.min(d.nps80CCD1B ?? 0, 50000);

  const totalDeductions = stdDed + chapterVI;
  const taxableIncome = Math.max(0, grossIncome - totalDeductions);

  const slabTax = walkSlabs(taxableIncome, cfg.slabs);

  // 87A rebate
  let rebate = 0;
  if (taxableIncome <= cfg.rebate87A.taxableUpto) {
    rebate = Math.min(slabTax, cfg.rebate87A.maxRebate);
  }
  let taxAfterRebate = Math.max(0, slabTax - rebate);

  // Marginal relief around the rebate cliff (New regime, above ₹12L)
  let marginalReliefApplied = 0;
  if (input.regime === 'new' && taxableIncome > cfg.rebate87A.taxableUpto) {
    const excess = taxableIncome - cfg.rebate87A.taxableUpto;
    if (taxAfterRebate > excess) {
      marginalReliefApplied = taxAfterRebate - excess;
      taxAfterRebate = excess;
    }
  }

  const surcharge = computeSurcharge(taxableIncome, taxAfterRebate, rules.surcharge);
  const cess = (taxAfterRebate + surcharge) * rules.cess;
  const totalTax = Math.round(taxAfterRebate + surcharge + cess);

  const netPayable = Math.max(0, totalTax - (input.tdsPaid ?? 0));
  const effectiveRate = grossIncome > 0 ? totalTax / grossIncome : 0;

  return {
    fyUsed,
    regime: input.regime,
    grossIncome,
    standardDeduction: stdDed,
    totalDeductions,
    taxableIncome,
    slabTax: Math.round(slabTax),
    rebate87A: Math.round(rebate),
    taxAfterRebate: Math.round(taxAfterRebate),
    surcharge: Math.round(surcharge),
    cess: Math.round(cess),
    totalTax,
    marginalReliefApplied: Math.round(marginalReliefApplied),
    netPayable,
    effectiveRate,
    breakdown: [
      { label: 'Gross income',        amount: grossIncome },
      { label: 'Standard deduction',  amount: -stdDed },
      { label: 'Other deductions',    amount: -chapterVI },
      { label: 'Taxable income',      amount: taxableIncome },
      { label: 'Tax as per slabs',    amount: Math.round(slabTax) },
      { label: '87A rebate',          amount: -Math.round(rebate) },
      { label: 'Marginal relief',     amount: -Math.round(marginalReliefApplied) },
      { label: 'Surcharge',           amount: Math.round(surcharge) },
      { label: 'Health & Edu Cess 4%',amount: Math.round(cess) },
      { label: 'Total tax',           amount: totalTax },
    ],
  };
}

/** Compare both regimes and return the cheaper one plus both results. */
export function compareRegimes(base: Omit<TaxInput, 'regime'>) {
  const asNew = computeIndiaTax({ ...base, regime: 'new' });
  const asOld = computeIndiaTax({ ...base, regime: 'old' });
  const recommended: Regime = asNew.totalTax <= asOld.totalTax ? 'new' : 'old';
  return { new: asNew, old: asOld, recommended };
}

/** Next advance-tax due date for a given FY. */
export function nextAdvanceTaxDeadline(fy: string, now: Date = new Date()): { date: Date; label: string } | null {
  const startYear = parseInt(fy.split('-')[0], 10);
  if (isNaN(startYear)) return null;
  const q = [
    { d: new Date(startYear,     5, 15), label: 'Q1 · 15 Jun' },   // 15 Jun
    { d: new Date(startYear,     8, 15), label: 'Q2 · 15 Sep' },   // 15 Sep
    { d: new Date(startYear,    11, 15), label: 'Q3 · 15 Dec' },   // 15 Dec
    { d: new Date(startYear + 1, 2, 15), label: 'Q4 · 15 Mar' },   // 15 Mar
  ];
  const upcoming = q.find(x => x.d >= now);
  return upcoming ? { date: upcoming.d, label: upcoming.label } : null;
}
