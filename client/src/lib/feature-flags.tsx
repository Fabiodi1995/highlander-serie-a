import { createContext, useContext, type ReactNode } from 'react';

// Feature Flags Configuration
export interface FeatureFlags {
  // Core Features
  analytics: boolean;
  achievements: boolean;
  notifications: boolean;
  social: boolean;
  pwa: boolean;
  
  // Advanced Features
  tutorial: boolean;
  darkMode: boolean;
  emailConfirmation: boolean;
  twoFactorAuth: boolean;
  realTimeChat: boolean;
  
  // Admin Features
  adminPanel: boolean;
  userManagement: boolean;
  gameManagement: boolean;
  analyticsForNonAdmin: boolean;
  
  // Experimental Features
  aiPredictions: boolean;
  advancedStats: boolean;
  socialLeaderboards: boolean;
}

// Default feature flags
const DEFAULT_FLAGS: FeatureFlags = {
  analytics: true,
  achievements: true,
  notifications: true,
  social: true,
  pwa: true,
  tutorial: true,
  darkMode: true,
  emailConfirmation: true,
  twoFactorAuth: false,
  realTimeChat: true,
  adminPanel: true,
  userManagement: true,
  gameManagement: true,
  analyticsForNonAdmin: false, // DISABLED as requested
  aiPredictions: false,
  advancedStats: false,
  socialLeaderboards: true,
};

// Environment-based overrides
function getEnvFlag(key: string): boolean | undefined {
  const envValue = import.meta.env[`VITE_FEATURE_${key.toUpperCase()}`];
  if (envValue === undefined) return undefined;
  return envValue === 'true' || envValue === '1';
}

// Build final feature flags
export const FEATURE_FLAGS: FeatureFlags = Object.keys(DEFAULT_FLAGS).reduce((flags, key) => {
  const flagKey = key as keyof FeatureFlags;
  const envOverride = getEnvFlag(key);
  flags[flagKey] = envOverride !== undefined ? envOverride : DEFAULT_FLAGS[flagKey];
  return flags;
}, {} as FeatureFlags);

// Utility functions
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return FEATURE_FLAGS[feature];
};

// React Context
const FeatureFlagsContext = createContext<FeatureFlags>(FEATURE_FLAGS);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  return (
    <FeatureFlagsContext.Provider value={FEATURE_FLAGS}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}

export function useFeature(feature: keyof FeatureFlags): boolean {
  const flags = useFeatureFlags();
  return flags[feature];
}

// Development logging
if (import.meta.env.DEV) {
  console.group('🏁 Highlander Feature Flags');
  console.log('Analytics for Non-Admin:', FEATURE_FLAGS.analyticsForNonAdmin ? '✅ ENABLED' : '❌ DISABLED');
  console.log('Email Confirmation:', FEATURE_FLAGS.emailConfirmation ? '✅ ENABLED' : '❌ DISABLED');
  console.groupEnd();
}