import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { ProtectedRoute } from "@/lib/protected-route";
import { Layout } from "@/components/layout/layout";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import PlayerDashboard from "@/pages/player-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import GameInterface from "@/pages/game-interface";
import ProfilePage from "@/pages/profile-page-simple";
import RulesPage from "@/pages/rules-page";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/rules" component={RulesPage} />
      <ProtectedRoute path="/game/:id" component={GameInterface} />
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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="highlander-ui-theme">
        <AuthProvider>
          <TooltipProvider>
            <Layout>
              <Router />
            </Layout>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
