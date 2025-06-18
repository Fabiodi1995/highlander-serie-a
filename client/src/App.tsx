import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { ProtectedRoute } from "@/lib/protected-route";
import { Layout } from "@/components/layout/layout";
import { CookieConsentBanner } from "@/components/ui/cookie-consent-banner";
import { LegalFooter } from "@/components/ui/legal-footer";
import { NotificationProvider } from "@/hooks/use-notifications";
import { AnalyticsProvider } from "@/hooks/use-analytics";
import { AchievementsProvider } from "@/hooks/use-achievements";
import { SocialProvider } from "@/hooks/use-social";
import { PWAProvider } from "@/hooks/use-pwa";
import { FeatureFlagsProvider } from "@/lib/feature-flags";
import { ErrorBoundary } from "@/components/error-boundary";
import NotFound from "@/pages/not-found-enhanced";
import AuthPage from "@/pages/auth-page";
import PlayerDashboard from "@/pages/player-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import GameInterface from "@/pages/game-interface";
import ProfilePage from "@/pages/profile-page-simple";
import RulesPage from "@/pages/rules-page";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import TermsOfServicePage from "@/pages/terms-of-service";
import CookiePolicyPage from "@/pages/cookie-policy";
import AnalyticsDashboard from "@/pages/analytics-dashboard";
import CalendarPage from "@/pages/calendar";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/privacy-policy" component={PrivacyPolicyPage} />
      <Route path="/terms-of-service" component={TermsOfServicePage} />
      <Route path="/cookie-policy" component={CookiePolicyPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/rules" component={RulesPage} />
      <ProtectedRoute path="/analytics" component={AnalyticsDashboard} />
      <ProtectedRoute path="/calendar" component={CalendarPage} />
      <ProtectedRoute path="/games/:id" component={GameInterface} />
      <Route component={NotFound} />
    </Switch>
  );
}

function HomePage() {
  const { user } = useAuth();
  
  if (user?.isAdmin) {
    return <AdminDashboard />;
  } else {
    return <PlayerDashboard />;
  }
}

function App() {
  return (
    <ErrorBoundary onError={(error, errorInfo) => {
      console.error('App-level error:', error, errorInfo);
    }}>
      <QueryClientProvider client={queryClient}>
        <FeatureFlagsProvider>
          <ThemeProvider defaultTheme="system" storageKey="highlander-ui-theme">
            <AuthProvider>
              <NotificationProvider>
                <PWAProvider>
                  <AnalyticsProvider>
                    <AchievementsProvider>
                      <SocialProvider>
                        <TooltipProvider>
                          <Layout>
                            <ErrorBoundary>
                              <Router />
                            </ErrorBoundary>
                          </Layout>
                          <CookieConsentBanner />
                          <Toaster />
                        </TooltipProvider>
                      </SocialProvider>
                    </AchievementsProvider>
                  </AnalyticsProvider>
                </PWAProvider>
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </FeatureFlagsProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
