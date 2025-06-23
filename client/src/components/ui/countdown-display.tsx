import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownDisplayProps {
  deadline: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export function CountdownDisplay({ 
  deadline, 
  className = '', 
  size = 'md',
  showIcon = true 
}: CountdownDisplayProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!deadline) {
      setTimeRemaining(null);
      setIsExpired(false);
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const difference = deadlineTime - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeRemaining(null);
        return;
      }

      setIsExpired(false);
      setTimeRemaining({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        total: difference
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  if (!deadline) {
    return null;
  }

  if (isExpired) {
    return (
      <div className={`flex items-center gap-2 text-red-600 ${className}`}>
        <AlertTriangle className="h-4 w-4" />
        <span className="font-medium">Scaduto</span>
      </div>
    );
  }

  if (!timeRemaining) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const formatTime = () => {
    const parts = [];
    
    if (timeRemaining.days > 0) {
      parts.push(`${timeRemaining.days}g`);
    }
    
    if (timeRemaining.hours > 0 || timeRemaining.days > 0) {
      parts.push(`${timeRemaining.hours}h`);
    }
    
    parts.push(`${timeRemaining.minutes}m`);
    
    // Mostra i secondi solo se rimangono meno di 60 minuti
    if (timeRemaining.days === 0 && timeRemaining.hours === 0) {
      parts.push(`${timeRemaining.seconds}s`);
    }
    
    return parts.join(' ');
  };

  const getColorClass = () => {
    if (timeRemaining.total < 5 * 60 * 1000) { // Meno di 5 minuti
      return 'text-red-600';
    } else if (timeRemaining.total < 30 * 60 * 1000) { // Meno di 30 minuti
      return 'text-orange-600';
    } else if (timeRemaining.total < 2 * 60 * 60 * 1000) { // Meno di 2 ore
      return 'text-yellow-600';
    }
    return 'text-green-600';
  };

  return (
    <div className={`flex items-center gap-2 ${getColorClass()} ${sizeClasses[size]} ${className}`}>
      {showIcon && <Clock className={iconSizes[size]} />}
      <span className="font-mono font-medium">{formatTime()}</span>
    </div>
  );
}