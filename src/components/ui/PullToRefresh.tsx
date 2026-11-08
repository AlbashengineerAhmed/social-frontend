import React, { useState, useRef } from 'react';
import { ArrowDown, Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<any> | void;
  children: React.ReactNode;
  threshold?: number;
  maxPull?: number;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 70,
  maxPull = 110,
  disabled = false,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    // Only allow pull to refresh when user is at the very top of the scroll container / window
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    if (scrollTop <= 2) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current || disabled || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    if (scrollTop > 2) {
      isPullingRef.current = false;
      setPullDistance(0);
      return;
    }

    if (diff > 0) {
      // Rubber-band resistance formula
      const damped = Math.min(diff * 0.42, maxPull);
      setPullDistance(damped);
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPullingRef.current || disabled) return;
    isPullingRef.current = false;

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(52); // Keep spinner visible while fetching
      try {
        await Promise.resolve(onRefresh());
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const isTriggered = pullDistance >= threshold;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full"
    >
      {/* Pull down indicator badge */}
      <div
        className="w-full flex items-center justify-center pointer-events-none transition-transform duration-150 overflow-hidden"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 10 ? Math.min(pullDistance / threshold, 1) : 0,
        }}
      >
        <div
          className={`w-9 h-9 rounded-full shadow-md border flex items-center justify-center transition-all ${
            isTriggered || isRefreshing
              ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200'
              : 'bg-white text-gray-600 border-gray-200'
          }`}
          style={{
            transform: `scale(${Math.min(0.6 + (pullDistance / threshold) * 0.4, 1.1)})`,
          }}
        >
          {isRefreshing ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <ArrowDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isTriggered ? 'rotate-180' : 'rotate-0'
              }`}
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance * 0.3}px)` : 'none',
          transition: isPullingRef.current ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {children}
      </div>
    </div>
  );
};
