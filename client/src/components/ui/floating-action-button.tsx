import { useState } from "react";
import { Plus, X, Users, Trophy, Settings } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface FABAction {
  icon: React.ComponentType<any>;
  label: string;
  href?: string;
  onClick?: () => void;
  adminOnly?: boolean;
  color: string;
}

const fabActions: FABAction[] = [
  {
    icon: Trophy,
    label: "Nuovo Gioco",
    href: "/admin",
    adminOnly: true,
    color: "bg-blue-500 hover:bg-blue-600"
  },
  {
    icon: Users,
    label: "Invita Amici",
    onClick: () => {
      if (navigator.share) {
        navigator.share({
          title: 'Highlander - Gioco di Eliminazione Serie A',
          text: 'Unisciti a me in questo fantastico gioco!',
          url: window.location.origin
        });
      } else {
        navigator.clipboard.writeText(window.location.origin);
      }
    },
    color: "bg-green-500 hover:bg-green-600"
  }
];

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  if (!user) return null;

  const filteredActions = fabActions.filter(action => 
    !action.adminOnly || user.isAdmin
  );

  return (
    <div className="fixed bottom-20 right-4 z-40">
      {/* Action buttons */}
      <div className={cn(
        "flex flex-col-reverse gap-3 mb-3 transition-all duration-300",
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {filteredActions.map((action, index) => {
          const Icon = action.icon;
          const content = (
            <div
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-full shadow-lg text-white font-medium transition-all duration-200 haptic-feedback",
                action.color,
                "hover:shadow-xl transform hover:scale-105"
              )}
              onClick={action.onClick}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm">{action.label}</span>
            </div>
          );

          return action.href ? (
            <Link key={index} href={action.href}>
              {content}
            </Link>
          ) : (
            <button key={index}>
              {content}
            </button>
          );
        })}
      </div>

      {/* Main FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg text-white transition-all duration-300 haptic-feedback",
          "bg-green-600 hover:bg-green-700 hover:shadow-xl",
          "flex items-center justify-center",
          "transform hover:scale-110 active:scale-95",
          isOpen && "rotate-45"
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}