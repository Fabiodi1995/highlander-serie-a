import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  duration: number;
}

interface TouchPosition {
  x: number;
  y: number;
  timestamp: number;
}

export function useMobileGestures() {
  const [isEnabled, setIsEnabled] = useState(true);
  const startTouch = useRef<TouchPosition | null>(null);
  const { toast } = useToast();

  const handleTouchStart = (e: TouchEvent) => {
    if (!isEnabled || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    startTouch.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!isEnabled || !startTouch.current || e.changedTouches.length !== 1) return;
    
    const touch = e.changedTouches[0];
    const endTouch = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };

    const deltaX = endTouch.x - startTouch.current.x;
    const deltaY = endTouch.y - startTouch.current.y;
    const duration = endTouch.timestamp - startTouch.current.timestamp;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Minimum swipe distance and maximum duration
    if (distance < 50 || duration > 500) return;

    let direction: SwipeGesture['direction'];
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    const gesture: SwipeGesture = { direction, distance, duration };
    handleSwipeGesture(gesture);
    
    startTouch.current = null;
  };

  const handleSwipeGesture = (gesture: SwipeGesture) => {
    // Implement swipe actions based on current page
    const currentPath = window.location.pathname;

    switch (gesture.direction) {
      case 'left':
        if (currentPath === '/') {
          // Navigate to calendar
          window.location.href = '/calendar';
        }
        break;
      case 'right':
        if (currentPath === '/calendar') {
          // Navigate back to home
          window.location.href = '/';
        }
        break;
      case 'up':
        // Refresh current page
        if (gesture.distance > 100) {
          window.location.reload();
          toast({
            title: "Pagina aggiornata",
            description: "Pull to refresh attivato",
          });
        }
        break;
      case 'down':
        // Show notification panel or quick actions
        break;
    }
  };

  useEffect(() => {
    if (!isEnabled) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isEnabled]);

  return {
    isEnabled,
    setIsEnabled
  };
}

export function MobileGesturesProvider({ children }: { children: React.ReactNode }) {
  useMobileGestures();
  return <>{children}</>;
}