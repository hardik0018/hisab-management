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
  color = "blue",
}: {
  icon: any;
  color?: string;
}) => {
  const colors: any = {
    blue: "from-blue-500 to-indigo-600 shadow-blue-500/20",
    emerald: "from-emerald-400 to-teal-600 shadow-emerald-500/20",
    rose: "from-rose-500 to-pink-600 shadow-rose-500/20",
    amber: "from-amber-400 to-orange-500 shadow-amber-500/20",
    white: "from-white/20 to-white/10 shadow-black/10 border-white/10",
  };
  return (
    <div className="relative group perspective-500">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors[color]} blur-2xl opacity-20 group-hover:opacity-40 transition-opacity`}
      />
      <div
        className={`relative w-14 h-14 bg-gradient-to-br ${colors[color]} rounded-2xl flex items-center justify-center shadow-2xl border border-white/20 transform-gpu group-hover:rotate-y-12 transition-all duration-300`}
      >
        <Icon
          className={`w-7 h-7 drop-shadow-md ${color === "white" ? "text-white" : "text-white"}`}
        />
      </div>
    </div>
  );
};

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#FDFEFF] text-slate-900 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
      {/* Background Blurs */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[5%] -left-[10%] w-[500px] h-[500px] bg-blue-100/50 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[5%] -right-[10%] w-[500px] h-[500px] bg-rose-50/50 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
      </div>

      <LandingNav />

      <main>
        {/* HERO SECTION */}
        <section className="relative pt-24 pb-16 px-6">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            <FadeIn
              as="h1"
              scale={0.95}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-[7rem] font-[1000] tracking-[-0.05em] leading-[0.9] mb-8 text-slate-900"
            >
              MANAGE YOUR
              <br /> <span className="text-blue-600 italic">HISAB</span> &{" "}
              <span className="text-rose-500 italic">VAYVHAR</span>
            </FadeIn>

            <FadeIn
              y={10}
              delay={0.2}
              className="max-w-xl mx-auto mb-10 text-slate-600 text-lg sm:text-xl font-medium"
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
                className="px-10 py-5 bg-black text-white rounded-[2rem] font-black text-lg hover:bg-blue-600 transition-all shadow-2xl active:scale-95 flex items-center gap-3"
              >
                Get Started
                <ArrowRight className="w-6 h-6" />
              </Link>
            </FadeIn>
          </div>

          {/* Image Placeholder */}
          <div className="max-w-6xl mx-auto perspective-2000">
            <TiltCard className="relative">
              <div className="absolute -inset-4 bg-blue-400 blur-[100px] opacity-10" />
              <div className="relative bg-white/40 backdrop-blur-3xl border border-white/50 p-2 sm:p-4 rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl">
                {/* TODO: hero product photo, 1600x900 */}
                <div className="bg-slate-100 rounded-[1.5rem] sm:rounded-[3rem] overflow-hidden aspect-[16/9] flex items-center justify-center border border-slate-200/60 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent" />
                  <div className="text-center p-6 text-slate-400 relative z-10">
                    <LayoutDashboard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-bold text-sm uppercase tracking-widest text-slate-500">
                      Product Interface Screenshot
                    </p>
                    <p className="text-xs mt-2 max-w-xs mx-auto text-slate-400">
                      Please provide a real screenshot of the application
                      dashboard here.
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
                <span className="text-blue-600 underline underline-offset-8 decoration-slate-100">
                  workflow.
                </span>
              </Headline>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Cell 1: Large Span */}
              <div className="md:col-span-2 p-10 bg-blue-50/50 border border-blue-100/50 rounded-[2.5rem] hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/20 blur-[80px] rounded-full group-hover:bg-blue-400/30 transition-colors" />
                <div>
                  <Icon3D icon={Wallet} color="blue" />
                  <h3 className="text-2xl font-black mt-8 mb-3 tracking-tighter">
                    Hisab Management
                  </h3>
                  <p className="text-slate-600 text-sm font-medium leading-relaxed max-w-sm">
                    Manage your personal debit and credit records. Track what
                    you gave and what you took with complete transparency.
                  </p>
                </div>
              </div>

              {/* Cell 2: Small Span */}
              <div className="md:col-span-1 p-10 bg-white border border-slate-100 rounded-[2.5rem] hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between">
                <div>
                  <Icon3D icon={Zap} color="amber" />
                  <h3 className="text-2xl font-black mt-8 mb-3 tracking-tighter">
                    Daily Expenses
                  </h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">
                    Keep daily spendings in check. Log every expense and filter
                    by categories effortlessly.
                  </p>
                </div>
              </div>

              {/* Cell 3: Small Span Dark */}
              <div className="md:col-span-1 p-10 bg-rose-600 text-white rounded-[2.5rem] hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-rose-500 rounded-full blur-[40px]" />
                <div className="relative z-10">
                  <Icon3D icon={Heart} color="white" />
                  <h3 className="text-2xl font-black mt-8 mb-3 tracking-tighter">
                    Social Gifting
                  </h3>
                  <p className="text-rose-100 text-sm font-medium leading-relaxed">
                    Manage Marriage gifting and Vayvhar. Track social
                    contributions across celebrations.
                  </p>
                </div>
              </div>

              {/* Cell 4: Large Span */}
              <div className="md:col-span-2 p-10 bg-emerald-50/50 border border-emerald-100/50 rounded-[2.5rem] hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -left-10 bottom-0 w-64 h-64 bg-emerald-400/20 blur-[80px] rounded-full group-hover:bg-emerald-400/30 transition-colors" />
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8">
                  <div>
                    <Icon3D icon={Users} color="emerald" />
                    <h3 className="text-2xl font-black mt-8 mb-3 tracking-tighter">
                      Shared Spaces
                    </h3>
                    <p className="text-slate-600 text-sm font-medium leading-relaxed max-w-sm">
                      Invite partners to track together. Manage collaborators
                      and maintain privacy across all your shared ledgers.
                    </p>
                  </div>
                  {/* Abstract visual element inside the bento cell */}
                  <div className="w-full sm:w-48 h-32 bg-white rounded-2xl shadow-sm border border-emerald-100 p-4 flex flex-col gap-3">
                    <div className="w-full h-3 bg-slate-100 rounded-full" />
                    <div className="w-3/4 h-3 bg-emerald-100 rounded-full" />
                    <div className="mt-auto flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-blue-600">
                        A
                      </div>
                      <div className="w-8 h-8 rounded-full bg-rose-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-rose-600">
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
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <Headline className="text-white">
                  Clean. Fast.
                  <br />
                  Transparent.
                </Headline>
                <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                  Your financial data deserves a clear interface. View complete
                  transaction histories, filter by counterparty, and monitor
                  your exact standing in real time.
                </p>
                <div className="flex gap-4 pt-4">
                  <Link
                    href="/login"
                    className="px-8 py-4 bg-white text-slate-900 rounded-full font-black text-sm uppercase tracking-widest shadow-xl hover:bg-slate-200 transition-colors"
                  >
                    Try Live Demo
                  </Link>
                </div>
              </div>

              <div className="relative aspect-[4/3] w-full">
                {/* TODO: ledger UI photo, 1200x900 */}
                <div className="absolute inset-0 bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl flex flex-col items-center justify-center p-8 text-center overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
                  <FileText className="w-12 h-12 text-slate-600 mb-4 relative z-10" />
                  <p className="font-bold text-sm uppercase tracking-widest text-slate-400 relative z-10">
                    Ledger Interface Screenshot
                  </p>
                  <p className="text-xs mt-2 max-w-xs mx-auto text-slate-500 relative z-10">
                    Please provide a real screenshot of the ledger data table
                    here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24 px-6 text-center bg-[#FDFEFF]">
          <div className="max-w-4xl mx-auto space-y-12">
            <Headline>
              Ready to take control of
              <br />
              <span className="text-blue-600 italic">your daily hisab?</span>
            </Headline>
            <Link
              href="/login"
              className="px-12 py-6 bg-black text-white rounded-[2.5rem] font-black text-xl hover:bg-blue-600 transition-all shadow-2xl active:scale-95 group inline-flex items-center gap-4"
            >
              GET STARTED FOR FREE
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-12 px-6 border-t border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="flex items-center gap-2 mb-6 font-black text-2xl tracking-tight">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-slate-900">Hisab Management System</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 font-medium mb-6 max-w-lg leading-relaxed">
            Hisab Management System is a verified cloud application providing
            personal debit and credit ledgers, daily expense tracking, and
            encrypted document storage.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 mb-8 text-xs font-bold text-slate-600">
            <Link
              href="#features"
              className="hover:text-blue-600 transition-colors"
            >
              Features
            </Link>
            <Link
              href="#ledger"
              className="hover:text-blue-600 transition-colors"
            >
              Ledger Preview
            </Link>
            <Link
              href="/privacy"
              className="hover:text-blue-600 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-blue-600 transition-colors"
            >
              Terms of Service
            </Link>
          </div>

          <div className="w-full max-w-xs h-px bg-slate-200 mb-6" />

          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            © {new Date().getFullYear()} HISAB MANAGEMENT SYSTEM. ALL RIGHTS
            RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
