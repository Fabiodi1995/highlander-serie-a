import * as React from "react";
import { cn } from "@/lib/utils";

export interface MobileInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  autoOptimize?: boolean;
}

const MobileOptimizedInput = React.forwardRef<HTMLInputElement, MobileInputProps>(
  ({ className, type, autoOptimize = true, ...props }, ref) => {
    // Auto-optimize input attributes for mobile
    const mobileProps = autoOptimize ? {
      autoComplete: props.autoComplete || getAutoComplete(props.name || ''),
      inputMode: getInputMode(type || 'text'),
      enterKeyHint: getEnterKeyHint(props.name || ''),
      spellCheck: getSpellCheck(type || 'text'),
    } : {};

    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-lg border border-input bg-background px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          "transition-all duration-200 focus:transform focus:scale-[1.02]",
          className
        )}
        ref={ref}
        {...mobileProps}
        {...props}
      />
    );
  }
);

MobileOptimizedInput.displayName = "MobileOptimizedInput";

// Helper functions for mobile optimization
function getAutoComplete(name: string): string {
  const autoCompleteMap: Record<string, string> = {
    email: 'email',
    username: 'username',
    password: 'current-password',
    firstName: 'given-name',
    lastName: 'family-name',
    phoneNumber: 'tel',
    city: 'address-level2',
    country: 'country-name',
    dateOfBirth: 'bday',
  };
  return autoCompleteMap[name] || 'off';
}

function getInputMode(type: string): string {
  const inputModeMap: Record<string, string> = {
    email: 'email',
    tel: 'tel',
    number: 'numeric',
    url: 'url',
    search: 'search',
  };
  return inputModeMap[type] || 'text';
}

function getEnterKeyHint(name: string): "search" | "next" | "done" | "enter" | "go" | "previous" | "send" | undefined {
  if (name.includes('search')) return 'search';
  if (name.includes('email')) return 'next';
  if (name.includes('password')) return 'done';
  return 'next';
}

function getSpellCheck(type: string): boolean {
  const noSpellCheck = ['email', 'password', 'tel', 'number', 'url'];
  return !noSpellCheck.includes(type);
}

export { MobileOptimizedInput };