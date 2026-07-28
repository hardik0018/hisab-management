'use client';

import React, { useMemo, useState } from 'react';
import { FinancialYearSummary } from '@/types';
import {
  CheckCircle2, AlertCircle, Calendar, Calculator,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  compareRegimes, nextAdvanceTaxDeadline,
  type UserType, type Regime,
} from '@/lib/tax/india';

interface Props { initialSummary: FinancialYearSummary; }

const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function TaxDashboardClient({ initialSummary }: Props) {
  const fy = initialSummary.fy;

  // ---- Step 1: who are you ----
  const [userType, setUserType] = useState<UserType>('salaried');

  // ---- Step 2: money numbers (pre-filled from entries) ----
  // Salaried default: all recorded income is salary, personal expenses ignored.
  // Business default: recorded income is business turnover, expenses are business expenses.
  const defaultSalary  = userType === 'salaried' ? initialSummary.totalIncome : 0;
  const defaultBusiness = userType === 'business'
    ? Math.max(0, initialSummary.totalIncome - initialSummary.totalExpense)
    : userType === 'mixed'
      ? Math.max(0, initialSummary.totalIncome - initialSummary.totalExpense)
      : 0;

  const [salary,   setSalary]   = useState(defaultSalary);
  const [business, setBusiness] = useState(defaultBusiness);
  const [other,    setOther]    = useState(0);

  // Reset defaults when userType flips
  React.useEffect(() => {
    setSalary(userType === 'salaried' || userType === 'mixed' ? initialSummary.totalIncome : 0);
    setBusiness(userType === 'business' || userType === 'mixed'
      ? Math.max(0, initialSummary.totalIncome - initialSummary.totalExpense) : 0);
  }, [userType, initialSummary.totalIncome, initialSummary.totalExpense]);

  // ---- Step 3: deductions ----
  const [sec80C, set80C] = useState(0);
  const [sec80D, set80D] = useState(0);
  const [hraExempt, setHra] = useState(0);
  const [homeLoan, setHome] = useState(0);
  const [nps, setNps] = useState(0);
  const [tdsPaid, setTds] = useState(0);

  const baseInput = {
    fy, userType,
    salary, businessProfit: business, otherIncome: other,
    deductions: { sec80C, sec80D, hraExempt, homeLoanInterest: homeLoan, nps80CCD1B: nps },
    tdsPaid,
  };

  const compare = useMemo(() => compareRegimes(baseInput), [
    fy, userType, salary, business, other, sec80C, sec80D, hraExempt, homeLoan, nps, tdsPaid,
  ]);

  const [regime, setRegime] = useState<Regime>('new');
  React.useEffect(() => setRegime(compare.recommended), [compare.recommended]);

  const result = regime === 'new' ? compare.new : compare.old;
  const zeroTax = result.totalTax === 0;
  const nextDue = nextAdvanceTaxDeadline(fy);

  return (
    <div className="space-y-6 text-foreground pb-12 font-sans">
      {/* HEADLINE */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
        className={`rounded-3xl p-6 sm:p-8 text-center shadow-lg border-2 ${
          zeroTax
            ? 'bg-gradient-to-br from-emerald-500/15 to-teal-500/15 border-emerald-500/40'
            : 'bg-gradient-to-br from-amber-500/15 to-rose-500/15 border-amber-500/40'
        }`}
      >
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm ${
          zeroTax ? 'bg-emerald-500/20 text-emerald-600' : 'bg-amber-500/20 text-amber-600'
        }`}>
          {zeroTax ? <CheckCircle2 className="w-9 h-9" /> : <AlertCircle className="w-9 h-9" />}
        </div>
        <span className="text-xs font-black bg-black/5 dark:bg-white/10 px-3 py-1 rounded-full uppercase tracking-wider">
          FY {fy} · {regime === 'new' ? 'New Regime' : 'Old Regime'}
          {result.fyUsed !== fy && ` · rules of ${result.fyUsed}`}
        </span>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-3 font-mono">
          {zeroTax ? '✅ ₹0 Income Tax' : inr(result.totalTax)}
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto mt-2 font-medium leading-relaxed">
          {zeroTax
            ? `Your taxable income (${inr(result.taxableIncome)}) is within the tax-free limit for this regime.`
            : `Estimated total tax on ${inr(result.taxableIncome)} taxable income. Effective rate ${(result.effectiveRate*100).toFixed(1)}%.`}
        </p>
        {tdsPaid > 0 && !zeroTax && (
          <p className="text-xs mt-2 font-bold">
            TDS already paid: {inr(tdsPaid)} · You still owe: <span className="text-rose-600">{inr(result.netPayable)}</span>
          </p>
        )}
      </motion.div>

      {/* STEP 1 — user type */}
      <Section n="1" title="Who are you?">
        <div className="grid grid-cols-3 gap-2">
          {(['salaried','business','mixed'] as UserType[]).map(t => (
            <button key={t} onClick={() => setUserType(t)}
              className={`p-3 rounded-xl border-2 text-xs font-bold capitalize ${
                userType === t ? 'border-primary bg-primary/10' : 'border-border bg-card'
              }`}>
              {t === 'salaried' ? '💼 Salaried' : t === 'business' ? '🧾 Freelancer / Business' : '🔀 Both'}
            </button>
          ))}
        </div>
      </Section>

      {/* STEP 2 — money */}
      <Section n="2" title="Your money this year (edit if needed)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(userType !== 'business') && <NumField label="Salary income" value={salary} onChange={setSalary} />}
          {(userType !== 'salaried') && <NumField label="Business profit (income − business expenses)" value={business} onChange={setBusiness} />}
          <NumField label="Other income (interest, rent…)" value={other} onChange={setOther} />
          <NumField label="TDS already paid" value={tdsPaid} onChange={setTds} />
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Auto-filled from your entries in FY {fy}. Personal expenses do not reduce salary tax — only business expenses reduce business profit.
        </p>
      </Section>

      {/* STEP 3 — deductions */}
      <Section n="3" title="Savings you can claim (optional)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <NumField label="80C — PPF / ELSS / LIC (max ₹1.5L, Old only)" value={sec80C} onChange={set80C} />
          <NumField label="80D — Health insurance (max ₹50k, Old only)" value={sec80D} onChange={set80D} />
          <NumField label="HRA exemption (Old only)" value={hraExempt} onChange={setHra} />
          <NumField label="Home-loan interest (max ₹2L, Old only)" value={homeLoan} onChange={setHome} />
          <NumField label="NPS 80CCD(1B) — extra ₹50k (both regimes)" value={nps} onChange={setNps} />
        </div>
      </Section>

      {/* STEP 4 — regime compare */}
      <Section n="4" title="Which regime is better for you?">
        <div className="grid grid-cols-2 gap-3">
          <RegimeCard title="New Regime" active={regime==='new'} recommended={compare.recommended==='new'}
            tax={compare.new.totalTax} onClick={() => setRegime('new')} />
          <RegimeCard title="Old Regime" active={regime==='old'} recommended={compare.recommended==='old'}
            tax={compare.old.totalTax} onClick={() => setRegime('old')} />
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          We recommend <b>{compare.recommended === 'new' ? 'New' : 'Old'} regime</b> — it saves you{' '}
          {inr(Math.abs(compare.new.totalTax - compare.old.totalTax))}.
        </p>
      </Section>

      {/* STEP 5 — breakdown */}
      <Section n="5" title="How we got this number" icon={<Calculator className="w-4 h-4" />}>
        <div className="rounded-xl border border-border overflow-hidden">
          {result.breakdown
            .filter(r => r.amount !== 0 || r.label === 'Taxable income' || r.label === 'Total tax')
            .map((r, i) => (
            <div key={i} className={`flex justify-between px-4 py-2 text-sm ${
              r.label === 'Total tax' ? 'bg-primary/10 font-black' :
              r.label === 'Taxable income' ? 'bg-muted/40 font-bold' : ''
            }`}>
              <span>{r.label}</span>
              <span className={r.amount < 0 ? 'text-emerald-600' : ''}>{inr(r.amount)}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* DEADLINES */}
      {nextDue && (
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 text-sm">
          <Calendar className="w-5 h-5 text-primary" />
          <div>
            <div className="font-bold">Next deadline · {nextDue.label} · {nextDue.date.toLocaleDateString('en-IN')}</div>
            <div className="text-xs text-muted-foreground">
              {userType === 'salaried'
                ? `Return filing due 31 July ${parseInt(fy.split('-')[0])+1}. TDS handles most of your tax.`
                : `Advance tax quarterly. Return filing due 31 July / 31 Oct ${parseInt(fy.split('-')[0])+1} depending on audit.`}
            </div>
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground text-center">
        Estimate only, not tax advice. Rules applied: FY {result.fyUsed}. Consult a CA before filing.
      </p>
    </div>
  );
}

/* ---- tiny presentational helpers ---- */
function Section({ n, title, icon, children }: { n: string; title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-3">
      <h3 className="text-sm font-black flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] flex items-center justify-center">{n}</span>
        {icon}{title}
      </h3>
      {children}
    </div>
  );
}
function NumField({ label, value, onChange }: { label: string; value: number; onChange: (n:number)=>void }) {
  return (
    <label className="text-xs font-medium text-muted-foreground block">
      {label}
      <input
        type="number" min={0} value={value || ''}
        onChange={e => onChange(Number(e.target.value) || 0)}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground font-mono"
        placeholder="0"
      />
    </label>
  );
}
function RegimeCard({ title, tax, active, recommended, onClick }:{
  title:string; tax:number; active:boolean; recommended:boolean; onClick:()=>void;
}) {
  return (
    <button onClick={onClick}
      className={`p-4 rounded-2xl border-2 text-left transition ${
        active ? 'border-primary bg-primary/5' : 'border-border bg-card'
      }`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider">{title}</span>
        {recommended && <span className="text-[10px] bg-emerald-500/20 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Best</span>}
      </div>
      <div className="text-2xl font-black font-mono mt-1">{inr(tax)}</div>
    </button>
  );
}
