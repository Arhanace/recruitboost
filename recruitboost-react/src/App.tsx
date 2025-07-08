import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import SplashPage from "@/pages/splash";
import Dashboard from "@/pages/dashboard";

function Router() {
  const [location] = useLocation();

  // Show splash page for root and splash routes
  if (location === "/" || location === "/splash") {
    return (
      <Switch>
        <Route path="/" component={SplashPage} />
        <Route path="/splash" component={SplashPage} />
      </Switch>
    );
  }

  // For other routes, show the dashboard
  return (
    <Switch>
      <Route path="/dashboard" component={Dashboard} />
      <Route>
        {() => {
          // Redirect to splash for unknown routes
          const [, setLocation] = useLocation();
          setLocation("/splash");
          return null;
        }}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <Router />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
