'use client';

import React from 'react';
import { FinancialYearSummary } from '@/types';
import { 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  ShieldCheck,
  HelpCircle,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TaxDashboardClientProps {
  initialSummary: FinancialYearSummary;
}

export default function TaxDashboardClient({ initialSummary }: TaxDashboardClientProps) {
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalIncome = initialSummary.totalIncome;
  const totalExpense = initialSummary.totalExpense;
  const isLossOrZero = totalExpense >= totalIncome;
  const profit = Math.max(0, totalIncome - totalExpense);

  // In India (2026 rules): Up to ₹12 Lakhs (₹12,00,000) profit = ZERO TAX!
  const isZeroTax = profit <= 1200000;

  // Simple tax estimation if above 12 Lakhs
  let estimatedTax = 0;
  if (!isZeroTax) {
    const taxableAbove12 = profit - 1200000;
    estimatedTax = taxableAbove12 * 0.15; // Approx 15% effective on amount above 12L for simple understanding
  }

  return (
    <div className="space-y-6 text-foreground pb-12 font-sans">
      
      {/* 1. THE BIG ANSWER — Clear, friendly, 0 jargon */}
      {isZeroTax ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-teal-500/15 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 text-center shadow-lg relative overflow-hidden"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          
          <span className="text-xs font-black bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full uppercase tracking-wider">
            Current Year Status (FY {initialSummary.fy})
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight mt-3">
            ✅ Good News: You have ₹0 Income Tax to pay!
          </h2>
          
          <p className="text-sm sm:text-base text-emerald-600 dark:text-emerald-400 max-w-xl mx-auto mt-2 font-medium leading-relaxed">
            In India, if your total yearly profit is <strong>₹12,00,000 (12 Lakhs) or less</strong>, the government does not charge you any income tax. Since your profit this year is <strong>{formatINR(profit)}</strong>, you are completely tax-free!
          </p>

          {isLossOrZero && totalExpense > 0 && (
            <div className="mt-4 pt-4 border-t border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
              💡 Note: You spent {formatINR(totalExpense)} but earned {formatINR(totalIncome)}, which means your expenses were higher than your income.
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-rose-500/15 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 text-center shadow-lg relative overflow-hidden"
        >
          <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <AlertCircle className="w-9 h-9" />
          </div>

          <span className="text-xs font-black bg-amber-500/20 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full uppercase tracking-wider">
            Current Year Status (FY {initialSummary.fy})
          </span>

          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mt-3 font-mono">
            Estimated Tax: {formatINR(estimatedTax)}
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto mt-2 font-medium leading-relaxed">
            Your profit (<strong>{formatINR(profit)}</strong>) is above the ₹12 Lakh free limit. This is an estimate of the tax you may need to pay on the extra profit above ₹12 Lakhs.
          </p>
        </motion.div>
      )}

      {/* 2. SIMPLE 3-BOX SUMMARY ("Your Numbers This Year") */}
      <div className="space-y-3">
        <h3 className="text-base font-black text-foreground px-1 flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" />
          How we got these numbers (from your recorded entries):
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Box 1: Money In */}
          <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Step 1: Money In</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-sans">
                {formatINR(totalIncome)}
              </h4>
            </div>
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50 font-medium">
              Total earnings / income added by you this year.
            </p>
          </div>

          {/* Box 2: Money Out */}
          <div className="bg-card border border-border p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Step 2: Money Out</span>
                <TrendingDown className="w-4 h-4 text-rose-500" />
              </div>
              <h4 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 font-sans">
                {formatINR(totalExpense)}
              </h4>
            </div>
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50 font-medium">
              Total business expenses & bills added by you this year.
            </p>
          </div>

          {/* Box 3: Profit */}
          <div className="bg-primary/5 border-2 border-primary/20 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 3: Your Profit</span>
                <Wallet className="w-4 h-4 text-primary" />
              </div>
              <h4 className="text-2xl font-black text-foreground mt-1 font-sans">
                {formatINR(profit)}
              </h4>
            </div>
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/50 font-medium">
              {isLossOrZero && totalExpense > 0 
                ? 'No profit (spent more than earned).' 
                : 'Money In minus Money Out. Tax is decided on this!'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. SIMPLE GUIDE IN PLAIN ENGLISH */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-foreground font-black text-base border-b border-border pb-3">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span>How Does Income Tax Work in India? (Simple Guide)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="bg-muted/40 p-4 rounded-2xl space-y-1.5 border border-border/40">
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> 1. Up to ₹12 Lakhs = Free!
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The Indian Government lets you earn up to <strong>₹12,00,000 profit</strong> every single year without paying a single rupee in income tax!
            </p>
          </div>

          <div className="bg-muted/40 p-4 rounded-2xl space-y-1.5 border border-border/40">
            <span className="text-xs font-black text-primary flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4" /> 2. Why record expenses?
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every time you record a business expense (like laptop, wifi, office rent), it lowers your profit. <strong>Lower profit = Less tax to pay!</strong>
            </p>
          </div>

          <div className="bg-muted/40 p-4 rounded-2xl space-y-1.5 border border-border/40">
            <span className="text-xs font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> 3. When do I file?
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You only need to file your tax return once a year (by <strong>July 31st</strong>). Until your profit crosses ₹12 Lakhs, you can relax!
            </p>
          </div>
        </div>
      </div>

      {/* 4. REASSURANCE CARD */}
      <div className="bg-muted/30 border border-border/60 rounded-2xl p-4 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-muted-foreground shrink-0" />
          <span>
            <strong>Everything is automatic!</strong> Whenever you add a new income or expense in the app, this page will automatically update your profit and check if you owe any tax.
          </span>
        </div>
      </div>

    </div>
  );
}
