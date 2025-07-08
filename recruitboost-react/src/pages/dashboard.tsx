import { useState, useEffect } from "react";
import { 
  Mail, 
  ReplyIcon, 
  UserIcon, 
  CalendarCheckIcon,
  Settings,
  GraduationCap
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { mockStats, mockActivities, mockTasks, mockCoaches, mockEmails } from "@/lib/mock-data";

// Widget configuration options
const widgetOptions = [
  { id: "stats", name: "Stats Overview", defaultEnabled: true },
  { id: "activity", name: "Recent Activity", defaultEnabled: true },
  { id: "tasks", name: "Upcoming Tasks", defaultEnabled: true },
  { id: "saved", name: "Saved Coaches", defaultEnabled: true },
  { id: "responses", name: "Recent Responses", defaultEnabled: true }
];

function StatCard({ title, value, icon, iconBgColor, iconColor }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`${iconBgColor} ${iconColor} p-2 rounded-lg mr-4`}>
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-gray-600">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { toast } = useToast();
  
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
    <div className="container mx-auto px-4 py-8">
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
            value={mockStats.emailsSent}
            icon={<Mail className="h-5 w-5" />}
            iconBgColor="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Responses"
            value={mockStats.responses}
            icon={<ReplyIcon className="h-5 w-5" />}
            iconBgColor="bg-emerald-100"
            iconColor="text-emerald-600"
          />
          <StatCard
            title="Coaches Contacted"
            value={mockStats.coachesContacted}
            icon={<UserIcon className="h-5 w-5" />}
            iconBgColor="bg-amber-100"
            iconColor="text-amber-600"
          />
          <StatCard
            title="Follow-ups Due"
            value={mockStats.followUpsDue}
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
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest recruiting activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockActivities.slice(0, 4).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Upcoming Tasks */}
        {activeWidgets.tasks && (
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Tasks</CardTitle>
              <CardDescription>Tasks that need your attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTasks.filter(task => !task.completed).slice(0, 4).map((task) => (
                  <div key={task.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      task.priority === 'high' ? 'bg-red-500' : 
                      task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-gray-500">{task.description}</p>
                      {task.dueDate && (
                        <p className="text-xs text-gray-400 mt-1">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Saved Coaches Section */}
      {activeWidgets.saved && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Saved Coaches</CardTitle>
            <CardDescription>Coaches you've marked as potential targets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockCoaches.filter(coach => coach.isSaved).map((coach) => (
                <div key={coach.id} className="border rounded-lg p-4">
                  <h4 className="font-medium">{coach.name}</h4>
                  <p className="text-sm text-gray-600">{coach.school}</p>
                  <p className="text-xs text-gray-500">{coach.position}</p>
                  <p className="text-xs text-gray-500">{coach.division}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Responses */}
      {activeWidgets.responses && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Responses</CardTitle>
            <CardDescription>Latest replies from coaches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockEmails.filter(email => email.status === 'received').slice(0, 3).map((email) => {
                const coach = mockCoaches.find(c => c.id === email.coachId);
                return (
                  <div key={email.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">{coach?.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{coach?.name}</p>
                      <p className="text-xs text-gray-600">{coach?.school}</p>
                      <p className="text-sm mt-1">{email.subject}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(email.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
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
                <Label htmlFor={`widget-${widget.id}`} className="cursor-pointer">
                  {widget.name}
                </Label>
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