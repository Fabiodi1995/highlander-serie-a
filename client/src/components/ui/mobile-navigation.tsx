import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Trophy, 
  Calendar, 
  User, 
  Settings, 
  BarChart3,
  Shield,
  Users,
  Plus
} from "lucide-react";

export function MobileNavigation() {
  const { user } = useAuth();
  
  // Don't show navigation if user is not logged in
  if (!user) {
    return null;
  }
  const [location] = useLocation();

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
      href: "/admin",
      label: "Admin",
      icon: Plus,
      show: user?.isAdmin,
      badge: "Admin"
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
    <div className="hidden">
      <div className="grid grid-cols-5 h-16">
        {visibleItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div className={`
                flex flex-col items-center justify-center h-full space-y-1 transition-colors
                ${isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}
              `}>
                <div className="relative">
                  <item.icon className="h-5 w-5" />
                  {item.badge && (
                    <Badge 
                      variant="default" 
                      className="absolute -top-2 -right-2 h-4 px-1 text-xs"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}