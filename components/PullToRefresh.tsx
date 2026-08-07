'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const startY = useRef(0);
  const isDragging = useRef(false);
  
  const MAX_PULL = 120;
  const THRESHOLD = 60;

  useEffect(() => {
    if (!isPending && isRefreshing) {
      // Small delay for smooth UX after data arrives
      setTimeout(() => {
        setIsRefreshing(false);
        setPullY(0);
      }, 400);
    }
  }, [isPending, isRefreshing]);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only allow pull-to-refresh if we are at the very top of the page
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      isDragging.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    // If pulling down
    if (diff > 0 && window.scrollY === 0) {
      const pull = Math.min(diff * 0.4, MAX_PULL); // Add resistance
      setPullY(pull);
    } else {
      setPullY(0);
      isDragging.current = false;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current || isRefreshing) return;
    isDragging.current = false;

    if (pullY > THRESHOLD) {
      setIsRefreshing(true);
      setPullY(THRESHOLD); // Hold at threshold while refreshing
      
      startTransition(() => {
        router.refresh();
      });
    } else {
      setPullY(0); // Snap back if not pulled enough
    }
  };

  return (
    <div
      className="relative w-full h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="absolute top-0 left-0 right-0 flex justify-center overflow-hidden z-40 pointer-events-none"
        style={{ height: pullY > 0 ? pullY : 0 }}
      >
        <div 
          className="mt-2 flex items-center justify-center bg-card shadow-md rounded-full w-10 h-10 transition-transform duration-100 ease-linear"
          style={{ 
            opacity: pullY > 10 || isRefreshing ? 1 : 0,
            transform: `scale(${Math.min(pullY / THRESHOLD, 1)}) rotate(${pullY * 2}deg)`,
          }}
        >
          <RefreshCw className={`w-5 h-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
        </div>
      </div>
      
      <div 
        className="transition-transform ease-out h-full"
        style={{ 
          transform: `translateY(${isRefreshing ? THRESHOLD : pullY}px)`,
          transitionDuration: isDragging.current ? '0ms' : '200ms',
        }}
      >
        {children}
      </div>
    </div>
  );
}
