'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Receipt, BookUser, ShieldCheck, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Kharcha', icon: Receipt, path: '/expenses' },
  { label: 'Hisab', icon: BookUser, path: '/hisab' },
  { label: 'Vault', icon: ShieldCheck, path: '/vault' },
  { label: 'Social', icon: Users, path: '/marriage' },
  { label: 'Account', icon: User, path: '/profile' },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 px-3 pointer-events-none"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <nav
        className="nav-float mx-auto max-w-xl flex p-1.5 gap-1 pointer-events-auto"
      >
        {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
          const isActive =
            pathname === path || pathname.startsWith(`${path}/`);

          return (
            <Link
              key={path}
              href={path}
              prefetch={true}
              aria-label={label}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-1 rounded-2xl transition-all duration-200 active:scale-95 min-h-[56px]',
                isActive
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              style={
                isActive
                  ? {
                      background: 'var(--primary)',
                      boxShadow: 'var(--shadow-glow)',
                    }
                  : {}
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold tracking-wide leading-none">
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
