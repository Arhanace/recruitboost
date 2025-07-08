import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/layout/layout";
import SplashPage from "@/pages/splash";
import Dashboard from "@/pages/dashboard";
import Coaches from "@/pages/coaches";
import Emails from "@/pages/emails";
import Tasks from "@/pages/tasks";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <Switch>
          <Route path="/" component={SplashPage} />
          <Route path="/dashboard">
            <Layout>
              <Dashboard />
            </Layout>
          </Route>
          <Route path="/coaches">
            <Layout>
              <Coaches />
            </Layout>
          </Route>
          <Route path="/emails">
            <Layout>
              <Emails />
            </Layout>
          </Route>
          <Route path="/tasks">
            <Layout>
              <Tasks />
            </Layout>
          </Route>
          <Route path="/profile">
            <Layout>
              <Profile />
            </Layout>
          </Route>
          <Route path="/settings">
            <Layout>
              <Settings />
            </Layout>
          </Route>
          <Route>
            {/* 404 - Redirect to dashboard */}
            <Layout>
              <Dashboard />
            </Layout>
          </Route>
        </Switch>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
