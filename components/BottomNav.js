'use client'

import { usePathname, useRouter } from 'next/navigation';
import { Home, Receipt, Scale, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: Home, path: '/dashboard' },
  { label: 'Expenses', icon: Receipt, path: '/expenses' },
  { label: 'Hisab', icon: Scale, path: '/hisab' },
  { label: 'Marriage', icon: Users, path: '/marriage' },
  { label: 'Profile', icon: User, path: '/profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom">
      <div className="flex justify-around items-center h-16 max-w-7xl mx-auto px-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg transition-all min-w-[60px]',
                isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon className={cn(
                'h-6 w-6',
                isActive && 'stroke-[2.5]'
              )} />
              <span className={cn(
                'text-xs',
                isActive && 'font-semibold'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}