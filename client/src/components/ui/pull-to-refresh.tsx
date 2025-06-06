import { useState, useCallback, useRef, ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  threshold?: number;
}

export function PullToRefresh({ 
  children, 
  onRefresh, 
  disabled = false, 
  threshold = 80 
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || window.scrollY > 0) return;
    setStartY(e.touches[0].clientY);
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || window.scrollY > 0 || !startY) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    
    if (diff > 0) {
      e.preventDefault();
      const distance = Math.min(diff * 0.6, threshold * 1.5);
      setPullDistance(distance);
      setIsPulling(distance > threshold);
    }
  }, [disabled, startY, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled) return;
    
    if (isPulling && pullDistance > threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setIsPulling(false);
    setPullDistance(0);
    setStartY(0);
  }, [disabled, isPulling, pullDistance, threshold, onRefresh]);

  const pullProgress = Math.min(pullDistance / threshold, 1);
  const rotation = pullProgress * 360;

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div 
        className={cn(
          "absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-300 z-10",
          "bg-gradient-to-b from-green-50 to-transparent dark:from-green-900/20",
          pullDistance > 0 ? "opacity-100" : "opacity-0"
        )}
        style={{ 
          height: `${Math.min(pullDistance, threshold * 1.2)}px`,
          transform: `translateY(-${Math.max(0, threshold * 1.2 - pullDistance)}px)`
        }}
      >
        <div className={cn(
          "flex flex-col items-center gap-2 text-green-600 dark:text-green-400 transition-all duration-200",
          isPulling && "scale-110"
        )}>
          <RefreshCw 
            className={cn(
              "h-6 w-6 transition-transform duration-200",
              isRefreshing ? "animate-spin" : ""
            )}
            style={{ transform: `rotate(${rotation}deg)` }}
          />
          <span className="text-sm font-medium">
            {isRefreshing ? "Aggiornamento..." : isPulling ? "Rilascia per aggiornare" : "Trascina per aggiornare"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div 
        className="transition-transform duration-300"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  );
}