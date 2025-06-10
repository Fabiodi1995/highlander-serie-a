import { ReactNode } from "react";
import { Header } from "./header";
import { Footer } from "./footer";
import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { EmailVerificationBanner } from "@/components/ui/email-verification-banner";
import { useAuth } from "@/hooks/use-auth";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col safe-area-top">
      <Header />
      {user && (
        <div className="sticky top-16 z-40">
          <EmailVerificationBanner />
        </div>
      )}
      <main className="flex-1 bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
        {children}
      </main>
      {user && <Footer />}
      
      {/* Mobile-specific components - Only for authenticated users */}
      {user && (
        <div className="md:hidden">
          <MobileBottomNav />
          <FloatingActionButton />
        </div>
      )}
    </div>
  );
}