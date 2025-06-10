import { ReactNode } from "react";
import { Header } from "./header";
import { Footer } from "./footer";
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { EmailVerificationBanner } from "@/components/ui/email-verification-banner";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col safe-area-top">
      <Header />
      <div className="sticky top-16 z-40">
        <EmailVerificationBanner />
      </div>
      <main className="flex-1 bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
        {children}
      </main>
      <Footer />
      
      {/* Mobile-specific components */}
      <div className="md:hidden">
        <MobileBottomNav />
        <FloatingActionButton />
      </div>
    </div>
  );
}