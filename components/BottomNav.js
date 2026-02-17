'use client'

// Repaint trigger for HMR

import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Receipt, HandCoins, Heart, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { label: 'Home', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Spend', icon: Receipt, path: '/expenses' },
  { label: 'Hisab', icon: HandCoins, path: '/hisab' },
  { label: 'Social', icon: Heart, path: '/marriage' },
  { label: 'Account', icon: UserCircle, path: '/profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-6 pt-2 pointer-events-none">
      <nav className="max-w-md mx-auto bg-slate-900/90 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2.5rem] pointer-events-auto border border-white/10 ring-1 ring-black/5 overflow-hidden">
        <div className="flex justify-between items-center h-[72px] px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={cn(
                  'relative flex flex-col items-center justify-center w-full h-[60px] transition-all duration-500 rounded-3xl',
                  isActive ? 'text-white' : 'text-slate-500 hover:text-slate-400'
                )}
              >
                <div className="relative z-10 flex flex-col items-center gap-0.5">
                   <Icon className={cn(
                    'h-6 w-6 transition-all duration-500',
                    isActive ? 'scale-110' : 'scale-100'
                  )} />
                  <span className={cn(
                    'text-[9px] font-black uppercase tracking-widest transition-all duration-500',
                    isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-75 h-0 overflow-hidden'
                  )}>
                    {item.label}
                  </span>
                </div>

                {isActive && (
                  <motion.div 
                    layoutId="nav-glow"
                    className="absolute inset-x-2 inset-y-1 bg-white/10 rounded-2xl z-0"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-primary rounded-full shadow-[0_0_10px_#3B82F6]" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}