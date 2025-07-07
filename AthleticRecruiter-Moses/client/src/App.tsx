import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import Layout from "@/components/layout/layout";
import Dashboard from "@/pages/dashboard";
import Coaches from "@/pages/coaches";
import CoachesNew from "@/pages/coaches-new";
import SchoolDatabase from "@/pages/school-database"; // Import new unified school database page
import Outreach from "@/pages/emails";
import Activities from "@/pages/activities";
import Tasks from "@/pages/tasks";
import FollowUps from "@/pages/follow-ups";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import SplashPage from "@/pages/splash";
import CoachComingSoon from "@/pages/coach-coming-soon";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";

function Router() {
  const [location] = useLocation();

  // Show splash page and coach-coming-soon page without layout
  // The auth check happens inside SplashPage component
  if (location === "/splash" || location === "/coach-coming-soon") {
    return (
      <Switch>
        <Route path="/splash" component={SplashPage} />
        <Route path="/coach-coming-soon" component={CoachComingSoon} />
        <Route path="*">
          {() => {
            // Redirect programmatically using setLocation
            const [, setLocation] = useLocation();
            setLocation("/splash");
            return null;
          }}
        </Route>
      </Switch>
    );
  }

  // For all other routes, use the authenticated layout with protected routes
  return (
    <Layout>
      <Switch>
        <ProtectedRoute path="/" component={Dashboard} />
        <ProtectedRoute path="/dashboard" component={Dashboard} />
        <ProtectedRoute path="/school-database" component={SchoolDatabase} />
        {/* Redirect old coach routes to the new unified school database */}
        <Route path="/coaches">
          <Redirect to="/school-database" />
        </Route>
        <Route path="/coaches-new">
          <Redirect to="/school-database" />
        </Route>
        <ProtectedRoute path="/emails" component={Outreach} />
        <ProtectedRoute path="/activities" component={Activities} />
        <ProtectedRoute path="/tasks" component={Tasks} />
        <ProtectedRoute path="/follow-ups" component={FollowUps} />
        <ProtectedRoute path="/profile" component={Profile} />
        <ProtectedRoute path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  const [location, setLocation] = useLocation();

  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
