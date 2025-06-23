import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Calendar, 
  Shield, 
  User
} from "lucide-react";

export function MobileAppNavigation() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Don't show navigation if user is not logged in
  if (!user) {
    return null;
  }

  const navigationItems = [
    {
      href: "/",
      label: "Home",
      icon: Home,
      show: true
    },
    {
      href: "/calendar",
      label: "Calendario",
      icon: Calendar,
      show: true
    },
    {
      href: "/rules",
      label: "Regolamento",
      icon: Shield,
      show: true
    },
    {
      href: "/profile",
      label: "Profilo",
      icon: User,
      show: true
    }
  ];

  const visibleItems = navigationItems.filter(item => item.show);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Main navigation bar */}
      <div className="bg-white/95 backdrop-blur-sm border-t shadow-lg">
        <div className="flex items-center h-16">
          {/* Main navigation items - full width */}
          <div className="flex-1 grid grid-cols-4 h-full">
            {visibleItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <div className={cn(
                    "flex flex-col items-center justify-center h-full space-y-1 transition-colors",
                    isActive 
                      ? "text-blue-600 bg-blue-50" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}>
                    <item.icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}