import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, 
  Wifi, 
  Battery, 
  Signal, 
  Clock,
  HardDrive,
  Cpu
} from "lucide-react";

interface PerformanceMetrics {
  connectionType: string;
  downlink: number;
  rtt: number;
  batteryLevel?: number;
  isCharging?: boolean;
  memoryUsage: number;
  timing: {
    loadTime: number;
    domContentLoaded: number;
    firstPaint: number;
  };
}

export function MobilePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const collectMetrics = async () => {
      const nav = navigator as any;
      const perf = performance as any;
      
      try {
        const metrics: PerformanceMetrics = {
          connectionType: nav.connection?.effectiveType || 'unknown',
          downlink: nav.connection?.downlink || 0,
          rtt: nav.connection?.rtt || 0,
          memoryUsage: perf.memory?.usedJSHeapSize || 0,
          timing: {
            loadTime: perf.timing?.loadEventEnd - perf.timing?.navigationStart || 0,
            domContentLoaded: perf.timing?.domContentLoadedEventEnd - perf.timing?.navigationStart || 0,
            firstPaint: 0
          }
        };

        // Get battery info if available
        if ('getBattery' in navigator) {
          const battery = await (navigator as any).getBattery();
          metrics.batteryLevel = battery.level * 100;
          metrics.isCharging = battery.charging;
        }

        // Get paint timing
        const paintEntries = perf.getEntriesByType('paint');
        const firstPaint = paintEntries.find((entry: any) => entry.name === 'first-contentful-paint');
        if (firstPaint) {
          metrics.timing.firstPaint = firstPaint.startTime;
        }

        setMetrics(metrics);
      } catch (error) {
        console.error('Error collecting performance metrics:', error);
      }
    };

    collectMetrics();

    // Show monitor only in development or for debugging
    const isDev = import.meta.env.DEV;
    const showMonitor = localStorage.getItem('show-performance-monitor') === 'true';
    setIsVisible(isDev || showMonitor);
  }, []);

  const getConnectionQuality = (effectiveType: string) => {
    switch (effectiveType) {
      case '4g': return { color: 'bg-green-500', label: 'Ottima' };
      case '3g': return { color: 'bg-yellow-500', label: 'Buona' };
      case '2g': return { color: 'bg-red-500', label: 'Lenta' };
      default: return { color: 'bg-gray-500', label: 'Sconosciuta' };
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isVisible || !metrics) {
    return null;
  }

  const connectionQuality = getConnectionQuality(metrics.connectionType);

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-4">
      <Card className="w-80 bg-black/90 text-white border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Performance Monitor</span>
            <Badge variant="outline" className="text-xs">
              PWA
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          {/* Connection */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wifi className="h-3 w-3" />
              <span>Connessione</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${connectionQuality.color}`} />
              <span>{metrics.connectionType.toUpperCase()}</span>
              <span className="text-gray-400">({connectionQuality.label})</span>
            </div>
          </div>

          {/* Network Speed */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Signal className="h-3 w-3" />
              <span>Velocità</span>
            </div>
            <span>{metrics.downlink} Mbps</span>
          </div>

          {/* Latency */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-3 w-3" />
              <span>Latenza</span>
            </div>
            <span>{metrics.rtt} ms</span>
          </div>

          {/* Battery */}
          {metrics.batteryLevel !== undefined && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Battery className="h-3 w-3" />
                <span>Batteria</span>
              </div>
              <div className="flex items-center space-x-2">
                <Progress value={metrics.batteryLevel} className="w-12 h-1" />
                <span>{Math.round(metrics.batteryLevel)}%</span>
                {metrics.isCharging && <span className="text-green-400">⚡</span>}
              </div>
            </div>
          )}

          {/* Memory Usage */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-3 w-3" />
              <span>Memoria</span>
            </div>
            <span>{formatBytes(metrics.memoryUsage)}</span>
          </div>

          {/* Load Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Cpu className="h-3 w-3" />
              <span>Caricamento</span>
            </div>
            <span>{Math.round(metrics.timing.loadTime)} ms</span>
          </div>

          {/* Performance Score */}
          <div className="pt-2 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <span>Performance Score</span>
              <Badge 
                variant={metrics.timing.loadTime < 2000 ? "default" : "destructive"}
                className="text-xs"
              >
                {metrics.timing.loadTime < 1000 ? 'Eccellente' : 
                 metrics.timing.loadTime < 2000 ? 'Buona' : 'Da migliorare'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}