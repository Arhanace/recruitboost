import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { PlusIcon, TrashIcon, BellIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "@/components/ui/theme-provider";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth-provider";
import { GmailTab } from "@/components/settings/gmail-tab";
import { useLocation } from "wouter";

// Account settings form schema
const accountFormSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.newPassword && data.newPassword !== data.confirmPassword) {
        return false;
      }
      return true;
    },
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    },
  );

// Notification settings form schema
const notificationFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  responseAlerts: z.boolean().default(true),
  taskReminders: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
   const [location, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const [deleteAccount, setDeleteAccount] = useState(false);

  // Check URL params for initial tab
  // const urlParams = new URLSearchParams(location.split("?")[1] || "");
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get("tab") || "account";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Update tab when URL changes
  useEffect(() => {
     // const urlParams = new URLSearchParams(location.split("?")[1] || "");
    const tabFromUrl = urlParams.get("tab");
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [location]);

  console.log(activeTab, "tab", location, urlParams)

  // Setup account form
  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      username: user?.profile?.username || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Setup notification form
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      responseAlerts: true,
      taskReminders: true,
      marketingEmails: false,
    },
  });

  // Handle account form submission
  const onAccountSubmit = (data: AccountFormValues) => {
    toast({
      title: "Account Settings Updated",
      description: "Your account settings have been successfully updated.",
    });
    accountForm.reset({
      username: data.username,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  // Handle notification form submission
  const onNotificationSubmit = (data: NotificationFormValues) => {
    toast({
      title: "Notification Settings Updated",
      description: "Your notification preferences have been saved.",
    });
  };

  // Handle account deletion
  const handleDeleteAccount = () => {
    // In a real app, this would make an API call
    toast({
      title: "Account Deletion Requested",
      description: "Your account will be deleted after review.",
      variant: "destructive",
    });
    setDeleteAccount(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Account Settings</h1>
        <p className="text-gray-600">
          Manage your account preferences and settings
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="gmail">Gmail</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Update your account information and password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...accountForm}>
                <form
                  onSubmit={accountForm.handleSubmit(onAccountSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={accountForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          This is your public display name.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Change Password</h3>
                    <p className="text-sm text-gray-500">
                      Update your password to maintain account security
                    </p>
                  </div>

                  <FormField
                    control={accountForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={accountForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={accountForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit">Save Changes</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <GmailTab />

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form
                  onSubmit={notificationForm.handleSubmit(onNotificationSubmit)}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <FormField
                      control={notificationForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Email Notifications
                            </FormLabel>
                            <FormDescription>
                              Receive email notifications about your account
                              activity
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="responseAlerts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Coach Response Alerts
                            </FormLabel>
                            <FormDescription>
                              Get notified when coaches respond to your emails
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="taskReminders"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Task Reminders
                            </FormLabel>
                            <FormDescription>
                              Receive reminders about upcoming follow-ups and
                              tasks
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="marketingEmails"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Marketing Emails
                            </FormLabel>
                            <FormDescription>
                              Receive updates about new features and tips
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit">Save Preferences</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Theme</h3>
                <p className="text-sm text-gray-500">
                  Select your preferred color theme
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <div
                    className={`flex items-center justify-center border rounded-lg p-4 cursor-pointer ${theme === "light" ? "border-primary bg-primary/5" : "border-gray-200"}`}
                    onClick={() => setTheme("light")}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <SunIcon className="h-6 w-6" />
                      <span className="text-sm font-medium">Light</span>
                    </div>
                  </div>

                  <div
                    className={`flex items-center justify-center border rounded-lg p-4 cursor-pointer ${theme === "dark" ? "border-primary bg-primary/5" : "border-gray-200"}`}
                    onClick={() => setTheme("dark")}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <MoonIcon className="h-6 w-6" />
                      <span className="text-sm font-medium">Dark</span>
                    </div>
                  </div>

                  <div
                    className={`flex items-center justify-center border rounded-lg p-4 cursor-pointer ${theme === "system" ? "border-primary bg-primary/5" : "border-gray-200"}`}
                    onClick={() => setTheme("system")}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm font-medium">System</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Actions that can permanently affect your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-red-200 p-4">
                <h3 className="text-lg font-medium text-red-600">
                  Delete Account
                </h3>
                <p className="text-sm text-gray-500 mt-1 mb-4">
                  Permanently delete your account and all associated data. This
                  action cannot be undone.
                </p>

                <AlertDialog
                  open={deleteAccount}
                  onOpenChange={setDeleteAccount}
                >
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete your account and remove all of your data from our
                        servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700"
                        onClick={handleDeleteAccount}
                      >
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
