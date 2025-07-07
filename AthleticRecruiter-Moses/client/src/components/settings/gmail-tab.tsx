import { useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export function GmailTab() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  // 1️⃣ Load the user profile
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ["/api/user/profile"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user/profile");
      return res.json();
    },
  });

  // 2️⃣ Parse hash params for redirect callback
  const params = new URLSearchParams(location.split("?")[1] || "");

  const connected    = params.get("connected") === "1"     || params.get("google_connected") === "true";
  const demoConnected= params.get("demo_connected") === "true";
  const errorCode    = params.get("error");
  const hasError     = !!errorCode;

  // 3️⃣ Show toast once on mount if redirected
  useEffect(() => {
    if (connected || demoConnected) {
      toast({
        title: demoConnected ? "Demo Gmail connected" : "Gmail connected",
        description: "Your Gmail account is now linked.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      // clear hash
      setTimeout(() => setLocation("/settings?tab=gmail", { replace: true }), 1500);
    } else if (hasError) {
      toast({
        title: "Gmail connection failed",
        description: errorCode,
        variant: "destructive",
      });
      setTimeout(() => setLocation("/settings?tab=gmail", { replace: true }), 1500);
    }
  }, [connected, demoConnected, hasError]);

  // 4️⃣ Mutation: kick off /api/gmail/auth
  const connectMutation = useMutation({
    mutationFn: () => apiRequest("GET", "/api/gmail/auth").then(r => r.json()),
    onSuccess: (data) => {
      if (data.isDemo) {
        // demo mode
        setLocation("/settings?tab=gmail&demo_connected=true", { replace: true });
      } else if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast({ title: "Error", description: "No authUrl returned", variant: "destructive" });
      }
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  // 5️⃣ Mutation: /api/gmail/disconnect
  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/gmail/disconnect").then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Disconnected", description: "Gmail has been unlinked.", variant: "default" });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  return (
    <TabsContent value="gmail">
      <Card>
        <CardHeader>
          <CardTitle>Gmail Integration</CardTitle>
          <CardDescription>
            Connect your Gmail so you can send emails from your own inbox.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isLoadingUser ? (
            <div>Loading…</div>
          ) : user?.gmailRefreshToken ? (
            <>
              <p className="text-sm">
                Connected as <span className="font-medium">{user.email}</span>
              </p>
              <Button
                variant="destructive"
                onClick={() => disconnectMutation.mutate()}
                className="w-fit"
                disabled={disconnectMutation.isPending}
              >
                {disconnectMutation.isPending ? "Disconnecting…" : "Disconnect Gmail"}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => connectMutation.mutate()}
              className="w-fit"
              disabled={connectMutation.isPending}
            >
              {connectMutation.isPending ? "Connecting…" : "Connect with Gmail"}
            </Button>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
