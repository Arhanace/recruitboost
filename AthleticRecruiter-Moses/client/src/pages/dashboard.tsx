import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Coach, Email, Task } from "@shared/schema";
import { 
  RectangleEllipsis, 
  ReplyIcon, 
  UserIcon, 
  CalendarCheckIcon,
  Settings,
  CirclePlus,
  X,
  Grip,
  GraduationCap,
  Mail
} from "lucide-react";

import StatCard from "@/components/dashboard/stat-card";
import RecentActivityCard from "@/components/dashboard/recent-activity-card";
import UpcomingTasksCard from "@/components/dashboard/upcoming-tasks-card";
import RecentResponsesCard from "@/components/dashboard/recent-responses-card";
import SavedCoachesCard from "@/components/dashboard/saved-coaches-card";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

// Widget configuration options
const widgetOptions = [
  { id: "stats", name: "Stats Overview", defaultEnabled: true },
  { id: "activity", name: "Recent Activity", defaultEnabled: true },
  { id: "tasks", name: "Upcoming Tasks", defaultEnabled: true },
  { id: "saved", name: "Saved Coaches", defaultEnabled: true },
  { id: "responses", name: "Recent Responses", defaultEnabled: true }
];

export default function Dashboard() {
  // Dashboard customization state
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [activeWidgets, setActiveWidgets] = useState<Record<string, boolean>>(() => {
    const savedWidgets = localStorage.getItem('dashboard_widgets');
    if (savedWidgets) {
      return JSON.parse(savedWidgets);
    }
    return widgetOptions.reduce((acc, widget) => ({
      ...acc,
      [widget.id]: widget.defaultEnabled
    }), {});
  });

  // Save widget preferences to localStorage
  useEffect(() => {
    localStorage.setItem('dashboard_widgets', JSON.stringify(activeWidgets));
  }, [activeWidgets]);
  
  // Fetch stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/stats"],
  });
  
  // Fetch activities
  const { data: activities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ["/api/activities?limit=4"],
  });
  
  // Fetch incomplete tasks
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["/api/tasks?completed=false"],
  });
  
  // Fetch coaches
  const { data: coachesData, isLoading: isLoadingCoaches } = useQuery({
    queryKey: ["/api/coaches"],
  });
  
  const coaches = coachesData?.coaches || [];
  
  // Fetch emails
  const { data: emails, isLoading: isLoadingEmails } = useQuery({
    queryKey: ["/api/emails"],
  });
  
  // Process data for responses
  const responses = !isLoadingCoaches && !isLoadingEmails && emails && coaches
    ? emails
        .filter((email: Email) => email?.status === 'received')
        .map((email: Email) => {
          // replied
          // Find matching coach and provide a fallback if not found
          const coach = coaches.find((coach: Coach) => coach?.id === email?.coachId) || null;
          return {
            email,
            coach
          };
        })
        .slice(0, 3)
    : [];
  
  // Handle widget toggle
  const toggleWidget = (widgetId: string) => {
    setActiveWidgets(prev => ({
      ...prev,
      [widgetId]: !prev[widgetId]
    }));
  };

  // Save dashboard customization
  const saveDashboardCustomization = () => {
    localStorage.setItem('dashboard_widgets', JSON.stringify(activeWidgets));
    setCustomizeOpen(false);
    toast({
      title: "Dashboard updated",
      description: "Your dashboard layout has been saved",
    });
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your recruiting activity at a glance.</p>
        </div>
        <Button variant="outline" onClick={() => setCustomizeOpen(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Customize
        </Button>
      </div>

      {/* Stats Overview */}
      {activeWidgets.stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard
            title="Emails Sent"
            value={isLoadingStats ? "-" : stats?.emailsSent || 0}
            icon={<Mail className="h-5 w-5" />}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Responses"
            value={isLoadingStats ? "-" : stats?.responses || 0}
            icon={<ReplyIcon className="h-5 w-5" />}
            iconBgColor="bg-emerald-100"
            iconColor="text-emerald-600"
          />
          <StatCard
            title="Coaches Contacted"
            value={isLoadingStats ? "-" : stats?.coachesContacted || 0}
            icon={<UserIcon className="h-5 w-5" />}
            iconBgColor="bg-amber-100"
            iconColor="text-amber-600"
          />
          <StatCard
            title="Follow-ups Due"
            value={isLoadingStats ? "-" : stats?.followUpsDue || 0}
            icon={<CalendarCheckIcon className="h-5 w-5" />}
            iconBgColor="bg-red-100"
            iconColor="text-red-600"
          />
        </div>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        {activeWidgets.activity && (
          <div className="lg:col-span-1">
            <RecentActivityCard 
              activities={activities || []} 
              isLoading={isLoadingActivities}
            />
          </div>
        )}
        
        {/* Upcoming Tasks */}
        {activeWidgets.tasks && (
          <div className="lg:col-span-1">
            <UpcomingTasksCard 
              tasks={tasks || []} 
              isLoading={isLoadingTasks}
            />
          </div>
        )}
      </div>

      {/* Saved Coaches Section */}
      {activeWidgets.saved && (
        <div className="mt-6">
          <SavedCoachesCard 
            isLoading={isLoadingCoaches}
          />
        </div>
      )}

      {/* Recent Responses */}
      {activeWidgets.responses && (
        <div className="mt-6">
          <RecentResponsesCard 
            responses={responses} 
            isLoading={isLoadingEmails || isLoadingCoaches}
          />
        </div>
      )}

      {/* Dashboard with no widgets enabled */}
      {Object.values(activeWidgets).every(v => !v) && (
        <div className="border border-dashed rounded-lg p-8 text-center mt-4">
          <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Your dashboard is empty</h3>
          <p className="text-gray-500 mb-4">Enable some widgets to customize your dashboard view</p>
          <Button onClick={() => setCustomizeOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Customize Dashboard
          </Button>
        </div>
      )}

      {/* Customize Dashboard Dialog */}
      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Customize Your Dashboard</DialogTitle>
            <DialogDescription>
              Select which widgets to display on your dashboard
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {widgetOptions.map(widget => (
              <div key={widget.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Grip className="h-4 w-4 text-gray-400" />
                  <Label htmlFor={`widget-${widget.id}`} className="cursor-pointer">
                    {widget.name}
                  </Label>
                </div>
                <Switch 
                  id={`widget-${widget.id}`}
                  checked={activeWidgets[widget.id]}
                  onCheckedChange={() => toggleWidget(widget.id)}
                />
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomizeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveDashboardCustomization}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
