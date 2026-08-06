"use client";

import React, { useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import Link from "next/link";
import { Wallet } from "lucide-react";

export const FadeIn = ({
  children,
  delay = 0,
  y = 0,
  scale = 1,
  className = "",
  as: Component = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  scale?: number;
  className?: string;
  as?: any;
}) => {
  const MotionComponent = motion(Component as any);
  const shouldReduceMotion = useReducedMotion();

  return (
    <MotionComponent
      initial={shouldReduceMotion ? false : { opacity: 0, y, scale }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay }}
      className={className}
    >
      {children}
    </MotionComponent>
  );
};

export const LandingNav = () => {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  return (
    <nav
      className={`fixed top-0 w-full z-[100] transition-all duration-500 ${scrolled ? "py-4" : "py-6"}`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div
          className={`flex items-center justify-between px-6 py-3 rounded-[1.5rem] transition-all duration-500 ${scrolled ? "bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl shadow-slate-200/50" : "bg-transparent"}`}
        >
          <div className="flex items-center gap-2 group cursor-pointer font-black text-2xl tracking-tighter italic">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-black tracking-tight font-black text-xl md:text-2xl not-italic">
              Hisab Management System
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {["Features", "Ledger", "Demo"].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-6 py-2.5 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-black/10"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
