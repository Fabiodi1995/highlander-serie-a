import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface CountdownTimerProps {
  deadline: string | null;
  onExpired?: () => void;
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export function CountdownTimer({ deadline, onExpired, className }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  });
  const [isExpired, setIsExpired] = useState(false);

  const calculateTimeRemaining = (deadline: string): TimeRemaining => {
    const now = new Date().getTime();
    const target = new Date(deadline).getTime();
    const difference = target - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, total: difference };
  };

  useEffect(() => {
    if (!deadline) {
      setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
      setIsExpired(false);
      return;
    }

    const updateTimer = () => {
      const remaining = calculateTimeRemaining(deadline);
      setTimeRemaining(remaining);

      if (remaining.total <= 0 && !isExpired) {
        setIsExpired(true);
        onExpired?.();
      }
    };

    // Update immediately
    updateTimer();

    // Set up interval for real-time updates
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [deadline, isExpired, onExpired]);

  if (!deadline) {
    return null;
  }

  const getUrgencyLevel = () => {
    const totalHours = timeRemaining.total / (1000 * 60 * 60);
    if (totalHours <= 1) return 'critical';
    if (totalHours <= 24) return 'urgent';
    return 'normal';
  };

  const getUrgencyColor = () => {
    switch (getUrgencyLevel()) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'urgent': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getUrgencyIcon = () => {
    switch (getUrgencyLevel()) {
      case 'critical': return <AlertCircle className="h-5 w-5" />;
      case 'urgent': return <AlertTriangle className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  const getProgressValue = () => {
    const totalInitial = 7 * 24 * 60 * 60 * 1000; // 7 giorni massimi in ms
    const remaining = timeRemaining.total;
    return Math.max(0, Math.min(100, (remaining / totalInitial) * 100));
  };

  const formatTime = (value: number, unit: string) => {
    return (
      <div className="text-center">
        <div className="text-2xl font-bold">{value.toString().padStart(2, '0')}</div>
        <div className="text-xs text-gray-500 uppercase">{unit}</div>
      </div>
    );
  };

  if (isExpired) {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">Tempo Scaduto</span>
          </div>
          <div className="text-center text-sm text-red-500 mt-2">
            Le selezioni sono state automaticamente bloccate
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border ${getUrgencyColor()} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getUrgencyIcon()}
            <span className="font-semibold">Tempo Rimanente</span>
          </div>
          <div className="text-sm text-gray-500">
            Scadenza: {new Date(deadline).toLocaleString('it-IT')}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-4">
          {formatTime(timeRemaining.days, 'giorni')}
          {formatTime(timeRemaining.hours, 'ore')}
          {formatTime(timeRemaining.minutes, 'min')}
          {formatTime(timeRemaining.seconds, 'sec')}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso</span>
            <span>{getUrgencyLevel() === 'critical' ? 'CRITICO' : 
                  getUrgencyLevel() === 'urgent' ? 'URGENTE' : 'NORMALE'}</span>
          </div>
          <Progress 
            value={getProgressValue()} 
            className={`h-2 ${
              getUrgencyLevel() === 'critical' ? 'bg-red-100' : 
              getUrgencyLevel() === 'urgent' ? 'bg-yellow-100' : 'bg-green-100'
            }`}
          />
        </div>

        {getUrgencyLevel() === 'critical' && (
          <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700 text-center">
            ⚠️ ATTENZIONE: Meno di 1 ora rimasta!
          </div>
        )}
      </CardContent>
    </Card>
  );
}