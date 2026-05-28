'use client'

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Receipt, HandCoins, Heart, UserCircle, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Expenses', icon: Receipt, path: '/expenses' },
  { label: 'Hisab', icon: HandCoins, path: '/hisab' },
  { label: 'Social', icon: Heart, path: '/marriage' },
  { label: 'Account', icon: UserCircle, path: '/profile' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-4 md:pb-6 pointer-events-none">
      <nav className="max-w-md mx-auto w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2rem] pointer-events-auto border border-slate-200/50 dark:border-slate-800/50 ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
        <div className="flex justify-between items-center h-[66px] px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            // Robust active check: exact match or sub-path match
            const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);

            return (
              <Link
                key={item.path}
                href={item.path}
                prefetch={true}
                className={cn(
                  'relative flex flex-col items-center justify-center w-full h-[58px] transition-all duration-300 rounded-2xl',
                  isActive ? 'text-primary dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                )}
              >
                {/* Background Pill Slider */}
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-x-1 inset-y-0.5 bg-primary/10 dark:bg-primary/20 rounded-2xl z-0"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}

                {/* Content Container */}
                <motion.div
                  animate={{ y: isActive ? -2 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="relative z-10 flex flex-col items-center gap-1"
                >
                  <Icon className={cn(
                    'h-5 w-5 transition-transform duration-300',
                    isActive ? 'scale-110' : 'scale-100'
                  )} />
                  <span className="text-[10px] font-bold tracking-wide transition-colors duration-300">
                    {item.label}
                  </span>
                </motion.div>

                {/* Active Indicator Dot */}
                {isActive && (
                  <motion.div
                    layoutId="active-dot"
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary dark:bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)] z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
