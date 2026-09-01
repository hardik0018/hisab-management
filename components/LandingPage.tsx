import React from "react";
import {
  Wallet,
  Users,
  Zap,
  Heart,
  ArrowRight,
  LayoutDashboard,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { TiltCard } from "./TiltCard.client";
import { LandingNav, FadeIn } from "./LandingAnimations.client";

const Headline = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h2
    className={`text-4xl lg:text-5xl font-black tracking-tighter leading-[0.95] ${className}`}
  >
    {children}
  </h2>
);

const Icon3D = ({
  icon: Icon,
  color = "violet",
}: {
  icon: any;
  color?: string;
}) => {
  const colors: any = {
    violet: "from-violet-500 to-indigo-600 shadow-violet-500/25",
    emerald: "from-emerald-400 to-teal-600 shadow-emerald-500/25",
    pink: "from-pink-500 to-rose-600 shadow-pink-500/25",
    amber: "from-amber-400 to-orange-500 shadow-amber-500/25",
    white: "from-white/25 to-white/10 shadow-black/10 border-white/20",
  };
  return (
    <div className="relative group perspective-500">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors[color] || colors.violet} blur-2xl opacity-20 group-hover:opacity-40 transition-opacity`}
      />
      <div
        className={`relative w-14 h-14 bg-gradient-to-br ${colors[color] || colors.violet} rounded-2xl flex items-center justify-center shadow-xl border border-white/20 transform-gpu group-hover:rotate-y-12 transition-all duration-300`}
      >
        <Icon
          className="w-7 h-7 drop-shadow-md text-white"
        />
      </div>
    </div>
  );
};

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      {/* Background Blurs */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[5%] -left-[10%] w-[500px] h-[500px] bg-violet-100/60 blur-[140px] rounded-full animate-pulse" />
        <div className="absolute bottom-[5%] -right-[10%] w-[500px] h-[500px] bg-pink-100/50 blur-[140px] rounded-full animate-pulse [animation-delay:2s]" />
      </div>

      <LandingNav />

      <main>
        {/* HERO SECTION */}
        <section className="relative pt-24 pb-16 px-6">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            <FadeIn
              as="h1"
              scale={0.95}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-[6.5rem] font-[1000] tracking-[-0.05em] leading-[0.92] mb-8 text-foreground"
            >
              MANAGE YOUR
              <br /> <span className="gradient-text italic">HISAB</span> &{" "}
              <span className="text-pink-500 italic">VAYVHAR</span>
            </FadeIn>

            <FadeIn
              y={10}
              delay={0.2}
              className="max-w-xl mx-auto mb-10 text-muted-foreground text-lg sm:text-xl font-medium"
            >
              Log daily expenses, track shared records, and compute tax
              obligations in one secure space.
            </FadeIn>

            <FadeIn
              y={20}
              delay={0.3}
              className="flex flex-col sm:flex-row items-center gap-6 mb-16"
            >
              <Link
                href="/login"
                className="px-10 py-5 bg-primary text-primary-foreground rounded-[2rem] font-bold text-lg hover:opacity-90 transition-all shadow-glow active:scale-95 flex items-center gap-3"
              >
                Get Started
                <ArrowRight className="w-6 h-6" />
              </Link>
            </FadeIn>
          </div>

          {/* Image Placeholder */}
          <div className="max-w-6xl mx-auto perspective-2000">
            <TiltCard className="relative">
              <div className="absolute -inset-4 bg-primary/20 blur-[100px] opacity-20" />
              <div className="relative bg-card/60 backdrop-blur-3xl border border-border p-2 sm:p-4 rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl">
                {/* hero product photo, 1600x900 */}
                <div className="bg-surface-muted rounded-[1.5rem] sm:rounded-[3rem] overflow-hidden aspect-[16/9] flex items-center justify-center border border-border relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 to-transparent" />
                  <div className="text-center p-6 text-muted-foreground relative z-10">
                    <LayoutDashboard className="w-12 h-12 mx-auto mb-4 opacity-50 text-primary" />
                    <p className="font-bold text-sm uppercase tracking-widest text-foreground/80">
                      Product Interface Screenshot
                    </p>
                    <p className="text-xs mt-2 max-w-xs mx-auto text-muted-foreground">
                      Clean dashboard for daily expense tracking & personal hisab.
                    </p>
                  </div>
                </div>
              </div>
            </TiltCard>
          </div>
        </section>

        {/* BENTO GRID FEATURES */}
        <section id="features" className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16">
              <Headline>
                Built for your real
                <br />
                financial{" "}
                <span className="text-primary underline underline-offset-8 decoration-primary/20">
                  workflow.
                </span>
              </Headline>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Cell 1: Large Span */}
              <div className="md:col-span-2 p-10 bg-violet-50/60 border border-violet-100/80 rounded-[2.5rem] hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-400/15 blur-[80px] rounded-full group-hover:bg-violet-400/25 transition-colors" />
                <div>
                  <Icon3D icon={Wallet} color="violet" />
                  <h3 className="text-2xl font-black mt-8 mb-3 tracking-tighter text-foreground">
                    Hisab Management
                  </h3>
                  <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-sm">
                    Manage your personal debit and credit records. Track what
                    you gave and what you took with complete transparency.
                  </p>
                </div>
              </div>

              {/* Cell 2: Small Span */}
              <div className="md:col-span-1 p-10 bg-card border border-border rounded-[2.5rem] hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between">
                <div>
                  <Icon3D icon={Zap} color="amber" />
                  <h3 className="text-2xl font-black mt-8 mb-3 tracking-tighter text-foreground">
                    Daily Expenses
                  </h3>
                  <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                    Keep daily spendings in check. Log every expense and filter
                    by categories effortlessly.
                  </p>
                </div>
              </div>

              {/* Cell 3: Small Span Dark */}
              <div className="md:col-span-1 p-10 hero-gradient text-white rounded-[2.5rem] hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-pink-500 rounded-full blur-[40px] opacity-40" />
                <div className="relative z-10">
                  <Icon3D icon={Heart} color="white" />
                  <h3 className="text-2xl font-black mt-8 mb-3 tracking-tighter text-white">
                    Social Gifting
                  </h3>
                  <p className="text-white/80 text-sm font-medium leading-relaxed">
                    Manage Marriage gifting and Vayvhar. Track social
                    contributions across celebrations.
                  </p>
                </div>
              </div>

              {/* Cell 4: Large Span */}
              <div className="md:col-span-2 p-10 bg-emerald-50/60 border border-emerald-100/80 rounded-[2.5rem] hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -left-10 bottom-0 w-64 h-64 bg-emerald-400/15 blur-[80px] rounded-full group-hover:bg-emerald-400/25 transition-colors" />
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8">
                  <div>
                    <Icon3D icon={Users} color="emerald" />
                    <h3 className="text-2xl font-black mt-8 mb-3 tracking-tighter text-foreground">
                      Shared Spaces
                    </h3>
                    <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-sm">
                      Invite partners to track together. Manage collaborators
                      and maintain privacy across all your shared ledgers.
                    </p>
                  </div>
                  {/* Abstract visual element inside the bento cell */}
                  <div className="w-full sm:w-48 h-32 bg-card rounded-2xl shadow-sm border border-emerald-100 p-4 flex flex-col gap-3">
                    <div className="w-full h-3 bg-muted rounded-full" />
                    <div className="w-3/4 h-3 bg-emerald-200 rounded-full" />
                    <div className="mt-auto flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-violet-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-violet-700">
                        A
                      </div>
                      <div className="w-8 h-8 rounded-full bg-pink-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-pink-700">
                        B
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LEDGER SPLIT SCREEN */}
        <section
          id="ledger"
          className="py-20 px-6 bg-slate-900 text-white relative overflow-hidden"
        >
          {/* Subtle background gradient */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 blur-[140px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <Headline className="text-white">
                  Clean. Fast.
                  <br />
                  Transparent.
                </Headline>
                <p className="text-slate-300 text-lg leading-relaxed max-w-md">
                  Your financial data deserves a clear interface. View complete
                  transaction histories, filter by counterparty, and monitor
                  your exact standing in real time.
                </p>
                <div className="flex gap-4 pt-4">
                  <Link
                    href="/login"
                    className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold text-sm uppercase tracking-wider shadow-glow hover:opacity-90 transition-all"
                  >
                    Try Live Demo
                  </Link>
                </div>
              </div>

              <div className="relative aspect-[4/3] w-full">
                <div className="absolute inset-0 bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl flex flex-col items-center justify-center p-8 text-center overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
                  <FileText className="w-12 h-12 text-primary mb-4 relative z-10" />
                  <p className="font-bold text-sm uppercase tracking-widest text-slate-300 relative z-10">
                    Ledger Interface
                  </p>
                  <p className="text-xs mt-2 max-w-xs mx-auto text-slate-400 relative z-10">
                    Real-time balances, itemized transactions, and instant settling.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24 px-6 text-center bg-background">
          <div className="max-w-4xl mx-auto space-y-12">
            <Headline>
              Ready to take control of
              <br />
              <span className="gradient-text italic">your daily hisab?</span>
            </Headline>
            <Link
              href="/login"
              className="px-12 py-6 bg-primary text-primary-foreground rounded-[2.5rem] font-bold text-xl hover:opacity-90 transition-all shadow-glow active:scale-95 group inline-flex items-center gap-4"
            >
              GET STARTED FOR FREE
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 border-t border-border bg-surface-muted/60">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-6 font-black text-2xl tracking-tight">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-foreground">Hisab Management System</span>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-6 max-w-lg leading-relaxed">
            Hisab Management System is a verified cloud application providing
            personal debit and credit ledgers, daily expense tracking, and
            encrypted document storage.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 mb-8 text-xs font-bold text-muted-foreground">
            <Link
              href="#features"
              className="hover:text-primary transition-colors"
            >
              Features
            </Link>
            <Link
              href="#ledger"
              className="hover:text-primary transition-colors"
            >
              Ledger Preview
            </Link>
            <Link
              href="/privacy"
              className="hover:text-primary transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-primary transition-colors"
            >
              Terms of Service
            </Link>
          </div>

          <div className="w-full max-w-xs h-px bg-border mb-6" />

          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            © {new Date().getFullYear()} HISAB MANAGEMENT SYSTEM. ALL RIGHTS
            RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
