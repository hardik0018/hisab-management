"use client";

import React, { useRef, useState, useEffect } from "react";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  Users, 
  Download, 
  ShieldCheck, 
  Zap, 
  ChevronRight,
  TrendingUp,
  CreditCard,
  Smartphone,
  BarChart3,
  Search,
  CheckCircle2,
  Lock,
  Heart,
  Plus,
  ArrowRight,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';

const Headline = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <h2 className={`text-4xl lg:text-6xl font-black tracking-tighter leading-[0.95] ${className}`}>
    {children}
  </h2>
);

const TiltCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const rotateX = (e.clientY - rect.top - rect.height / 2) / 20;
    const rotateY = (rect.width / 2 - (e.clientX - rect.left)) / 20;
    setRotate({ x: rotateX, y: rotateY });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setRotate({ x: 0, y: 0 })}
      style={{ transformStyle: "preserve-3d", transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`, transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}
      className={`relative ${className}`}
    >
      {children}
    </div>
  );
};

const Icon3D = ({ icon: Icon, color = "blue" }: { icon: any, color?: string }) => {
  const colors: any = {
    blue: "from-blue-500 to-indigo-600 shadow-blue-500/20",
    emerald: "from-emerald-400 to-teal-600 shadow-emerald-500/20",
    rose: "from-rose-500 to-pink-600 shadow-rose-500/20",
    amber: "from-amber-400 to-orange-500 shadow-amber-500/20",
  };
  return (
    <div className="relative group perspective-500">
      <div className={`absolute inset-0 bg-gradient-to-br ${colors[color]} blur-2xl opacity-20 group-hover:opacity-40 transition-opacity`} />
      <div className={`relative w-14 h-14 bg-gradient-to-br ${colors[color]} rounded-2xl flex items-center justify-center shadow-2xl border border-white/20 transform-gpu group-hover:rotate-y-12 transition-all duration-300`}>
        <Icon className="w-7 h-7 text-white drop-shadow-md" />
      </div>
    </div>
  );
};

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      title: "Hisab Management",
      description: "Manage your personal debit and credit records with ease. Track what you gave and what you took.",
      icon: Wallet,
      color: "blue"
    },
    {
      title: "Daily Expenses",
      description: "Keep your daily spendings in check. Log every expense and filter by categories.",
      icon: Zap,
      color: "amber"
    },
    {
      title: "Social Gifting",
      description: "Manage Marriage gifting and Vayvhar. Track social contributions across celebrations.",
      icon: Heart,
      color: "rose"
    },
    {
      title: "Shared Spaces",
      description: "Invite partners to track together. Manage collaborators and maintain privacy.",
      icon: Users,
      color: "emerald"
    }
  ];

  const dummyRecords = [
    { name: "Rahul Sharma", amount: 2450, type: "credit", date: "Today", tag: "Hisab" },
    { name: "Suresh's Wedding", amount: 500, type: "debit", date: "Yesterday", tag: "Social" },
    { name: "Grocery Store", amount: 1200, type: "debit", date: "Feb 15", tag: "Expense" },
  ];

  const chartData = [
    { name: 'M', amount: 400 }, { name: 'T', amount: 300 }, { name: 'W', amount: 600 },
    { name: 'T', amount: 500 }, { name: 'F', amount: 800 }, { name: 'S', amount: 700 }, { name: 'S', amount: 900 },
  ];

  return (
    <div className="min-h-screen bg-[#FDFEFF] text-slate-900 font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
      
      {/* Background Blurs */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[5%] -left-[10%] w-[500px] h-[500px] bg-blue-100/50 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[5%] -right-[10%] w-[500px] h-[500px] bg-rose-50/50 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-[100] transition-all duration-500 ${scrolled ? 'py-4' : 'py-6'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className={`flex items-center justify-between px-6 py-3 rounded-[1.5rem] transition-all duration-500 ${scrolled ? 'bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl shadow-slate-200/50' : 'bg-transparent'}`}>
            <div className="flex items-center gap-2 group cursor-pointer font-black text-2xl tracking-tighter italic">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <span className="text-black">HISAB</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {['Features', 'Ledger', 'Demo'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 transition-colors">
                  {item}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Link href="/login" className="px-6 py-2.5 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-black/10">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* HERO SECTION */}
        <section className="relative pt-28 pb-16 px-6">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            <div 
              
              className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-8"
            >
              All your records in one professional space
            </div>

            <h1 
               
               className="text-6xl lg:text-[7rem] font-[1000] tracking-[-0.05em] leading-[0.9] mb-10 text-slate-900"
            >
              MANAGE YOUR<br /> <span className="text-blue-600 italic">HISAB</span> & <span className="text-rose-500 italic">VAYVHAR</span>
            </h1>

            <p 
              
              className="max-w-2xl text-lg lg:text-xl text-slate-500 font-medium mb-12"
            >
              Ditch the paper books. A professional tool for Indian users to manage debit-credit, daily expenses, and social gifting flawlessly.
            </p>

            <div 
              
              className="flex flex-col sm:flex-row items-center gap-6"
            >
              <Link href="/login" className="px-10 py-5 bg-black text-white rounded-[2rem] font-black text-lg hover:bg-blue-600 transition-all shadow-2xl active:scale-95 flex items-center gap-3">
                Get Started
                <ArrowRight className="w-6 h-6" />
              </Link>
              <div className="flex items-center gap-4 text-sm font-black text-slate-400">
                <CheckCircle2 className="w-5 h-5 text-green-500" /> Secure Cloud Backup
              </div>
            </div>
          </div>

          {/* Interactive Mockup */}
          <div className="mt-10 max-w-6xl mx-auto perspective-2000">
             <TiltCard className="relative">
                <div className="absolute -inset-4 bg-blue-400 blur-[100px] opacity-10" />
                <div className="relative bg-white/40 backdrop-blur-3xl border border-white/50 p-3 rounded-[3.5rem] shadow-2xl">
                   <div className="bg-[#F8FAFC] rounded-[3rem] p-10 overflow-hidden">
                      <div className="flex justify-between items-center mb-10">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-slate-100">
                                <LayoutDashboard className="w-6 h-6 text-blue-600" />
                             </div>
                             <div>
                                <h3 className="text-xl font-black italic tracking-tighter">My Financials</h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Personal Dashboard</p>
                             </div>
                          </div>
                          <div className="flex gap-2">
                             <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><Plus className="w-5 h-5"/></div>
                             <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400"><Search className="w-5 h-5"/></div>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                         <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.02]">
                            <div className="flex items-center justify-between mb-4">
                               <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><Wallet className="w-5 h-5"/></div>
                               <TrendingUp className="w-4 h-4 text-green-500" />
                            </div>
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">BALANCE</p>
                            <h4 className="text-2xl font-black tracking-tight">₹6,01,000</h4>
                         </div>
                         <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.02]">
                            <div className="flex items-center justify-between mb-4">
                               <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600"><TrendingUp className="w-5 h-5"/></div>
                            </div>
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">CREDIT</p>
                            <h4 className="text-2xl font-black tracking-tight text-green-600">₹8,27,000</h4>
                         </div>
                         <div className="p-6 bg-rose-600 text-white rounded-3xl shadow-xl transition-transform hover:scale-[1.02]">
                            <div className="flex items-center justify-between mb-4">
                               <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white"><Heart className="w-5 h-5"/></div>
                            </div>
                            <p className="text-[10px] font-black uppercase opacity-60 mb-1">SOCIAL GIFT</p>
                            <h4 className="text-2xl font-black tracking-tight">₹3,200</h4>
                         </div>
                      </div>

                      <div className="grid grid-cols-12 gap-8">
                         <div className="col-span-12 lg:col-span-7 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black uppercase text-slate-400 mb-6">Spending Overview</p>
                            <div className="h-40 w-full">
                               <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={chartData}>
                                     <Bar dataKey="amount" radius={[4, 4, 4, 4]}>
                                        {chartData.map((e, i) => <Cell key={i} fill={i === 4 ? '#2563EB' : '#F1F5F9'} />)}
                                     </Bar>
                                  </BarChart>
                               </ResponsiveContainer>
                            </div>
                         </div>
                         <div className="col-span-12 lg:col-span-5 space-y-4">
                            {dummyRecords.map((r, i) => (
                               <div key={i} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-50 shadow-sm">
                                  <div className="flex items-center gap-4">
                                     <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${r.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'}`}>{r.name.charAt(0)}</div>
                                     <div>
                                        <p className="text-sm font-black">{r.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{r.tag} • {r.date}</p>
                                     </div>
                                  </div>
                                  <span className={`text-sm font-black ${r.type === 'credit' ? 'text-green-600' : 'text-rose-600'}`}>{r.type === 'credit' ? '+' : '-'}₹{r.amount}</span>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
             </TiltCard>
          </div>
        </section>

        {/* CORE FEATURES (REAL APP FEATURES) */}
        <section id="features" className="py-10 px-6">
           <div className="max-w-7xl mx-auto">
              <div className="mb-20 text-center space-y-4">
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">The Ecosystem</p>
                 <Headline>Built for your real<br />financial <span className="text-blue-600 underline underline-offset-8 decoration-slate-100">workflow.</span></Headline>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                 {features.map((f, i) => (
                    <div key={i} className="p-10 bg-white border border-slate-100 rounded-[2.5rem] hover:shadow-2xl hover:-translate-y-2 transition-all group">
                       <Icon3D icon={f.icon} color={f.color} />
                       <h3 className="text-2xl font-black mt-8 mb-4 tracking-tighter">{f.title}</h3>
                       <p className="text-slate-500 text-sm font-medium leading-relaxed">{f.description}</p>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* REFINED LEDGER */}
        <section id="ledger" className="py-10 px-6 bg-slate-900 text-white relative">
           <div className="max-w-7xl mx-auto">
              <div className="flex flex-col lg:flex-row items-center justify-between mb-20 gap-8">
                 <div className="text-center lg:text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-4">Live Ledger Preview</p>
                    <Headline className="text-white">Clean. Fast.<br />Transparent.</Headline>
                 </div>
                 <div className="flex gap-4">
                    <div className="px-10 py-4 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest shadow-xl cursor-default">VIEW FULL LEDGER</div>
                 </div>
              </div>

              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[3rem] overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="border-b border-white/5 uppercase text-[9px] font-black tracking-[0.4em] text-white/30">
                             <th className="py-10 pl-12 font-black">Counterparty Name</th>
                             <th className="py-10 font-black">Transaction Category</th>
                             <th className="py-10 font-black">History</th>
                             <th className="py-10 text-right pr-12 font-black">Amount (INR)</th>
                       </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5">
                          {dummyRecords.concat(dummyRecords).map((r, i) => (
                             <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="py-8 pl-12">
                                   <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black text-xs text-blue-400">{r.name.charAt(0)}</div>
                                      <p className="font-black text-lg italic">{r.name}</p>
                                   </div>
                                </td>
                                <td className="py-8"><span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">{r.tag}</span></td>
                                <td className="py-8 text-[11px] font-black uppercase text-white/20 tracking-widest">{r.date}</td>
                                <td className={`py-8 text-right pr-12 text-2xl font-black italic tracking-tighter ${r.type === 'credit' ? 'text-green-500' : 'text-rose-600'}`}>
                                   {r.type === 'credit' ? '+' : '-'}₹{r.amount.toLocaleString()}
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-10 px-6">
           <div className="max-w-4xl mx-auto text-center space-y-12">
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-300">Join the movement</p>
              <Headline>Ready to take control of<br /><span className="text-blue-600 italic">your daily hisab?</span></Headline>
              <Link href="/login" className="px-12 py-6 bg-black text-white rounded-[2.5rem] font-black text-xl hover:bg-blue-600 transition-all shadow-2xl active:scale-95 group inline-flex items-center gap-4">
                 GET STARTED FOR FREE
                 <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
           </div>
        </section>
      </main>

      <footer className="py-2 px-6 border-t border-slate-100">
         <div className="max-w-7xl mx-auto flex flex-col items-center">
            <div className="flex items-center gap-2 mb-10 font-black text-2xl tracking-tighter italic">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span>HISAB</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-10 mb-5 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
               {['About', 'Features', 'Privacy', 'Support'].map(i => <a key={i} href="#" className="hover:text-blue-600 transition-colors">{i}</a>)}
            </div>

            <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">© 2026 HISAB LABS. MADE WITH ❤️ IN INDIA.</p>
         </div>
      </footer>

      <style jsx global>{`
        .perspective-2000 { perspective: 2000px; }
        .perspective-500 { perspective: 500px; }
        .rotate-y-12 { transform: rotateY(12deg); }
      `}</style>
    </div>
  );
};

export default LandingPage;
