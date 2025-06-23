import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Download, Apple, Play } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { MobileInstallPrompt } from "@/components/ui/mobile-install-prompt";

export function MobileDownloadButton() {
  const { canInstall, isInstalled, installApp } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);

  const handleClick = async () => {
    if (canInstall) {
      const success = await installApp();
      if (!success) {
        setShowPrompt(true);
      }
    } else {
      setShowPrompt(true);
    }
  };

  // Don't show if already installed
  if (isInstalled) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleClick}
        variant="outline"
        size="sm"
        className="flex items-center space-x-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
      >
        <Smartphone className="h-4 w-4" />
        <span className="hidden sm:inline">Scarica App</span>
        <span className="sm:hidden">App</span>
        <Badge variant="secondary" className="ml-1 text-xs bg-blue-100 text-blue-600">
          PWA
        </Badge>
      </Button>

      {showPrompt && (
        <MobileInstallPrompt onClose={() => setShowPrompt(false)} />
      )}
    </>
  );
}