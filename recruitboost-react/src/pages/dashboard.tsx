import { useState } from "react";
import { useLocation } from "wouter";
import { 
  Mail, 
  Users, 
  CheckSquare, 
  Star,
  Plus,
  ArrowRight,
  MessageSquare,
  Target,
  Clock,
  Trophy,
  Activity,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  mockStats, 
  mockCoaches, 
  mockEmails, 
  mockTasks, 
  mockActivities,
  mockUser 
} from "@/lib/mock-data";
import { getInitials } from "@/lib/utils";

type Widget = {
  id: string;
  title: string;
  component: React.ComponentType;
  size: "small" | "medium" | "large";
};

function StatsWidget() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-4">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockStats.emailsSent}</p>
              <p className="text-sm text-gray-600">Emails Sent</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="bg-green-100 text-green-600 p-2 rounded-lg mr-4">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockStats.responses}</p>
              <p className="text-sm text-gray-600">Responses</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 text-purple-600 p-2 rounded-lg mr-4">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockStats.coachesContacted}</p>
              <p className="text-sm text-gray-600">Coaches Contacted</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 text-yellow-600 p-2 rounded-lg mr-4">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{mockStats.followUpsDue}</p>
              <p className="text-sm text-gray-600">Follow-ups Due</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RecruitingProgressWidget() {
  const responseRate = Math.round((mockStats.responses / mockStats.emailsSent) * 100);
  const totalCoaches = mockCoaches.length;
  const contactedCoaches = mockStats.coachesContacted;
  const contactProgress = Math.round((contactedCoaches / totalCoaches) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Recruiting Progress
        </CardTitle>
        <CardDescription>Track your recruiting journey</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Response Rate</span>
            <span className="text-sm text-gray-500">{responseRate}%</span>
          </div>
          <Progress value={responseRate} className="h-2" />
        </div>
        
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Coaches Contacted</span>
            <span className="text-sm text-gray-500">{contactedCoaches}/{totalCoaches}</span>
          </div>
          <Progress value={contactProgress} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-lg font-bold text-green-600">{mockStats.responses}</p>
            <p className="text-xs text-green-700">Positive Responses</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-lg font-bold text-blue-600">{mockCoaches.filter(c => c.isSaved).length}</p>
            <p className="text-xs text-blue-700">Saved Coaches</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SavedCoachesWidget() {
  const [, setLocation] = useLocation();
  const savedCoaches = mockCoaches.filter(coach => coach.isSaved);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Saved Coaches
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation("/coaches")}
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {savedCoaches.slice(0, 5).map((coach) => (
            <div key={coach.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">{coach.name}</p>
                <p className="text-xs text-gray-500">{coach.school}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">{coach.division}</Badge>
                  <Badge variant="secondary" className="text-xs">{coach.position}</Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {savedCoaches.length === 0 && (
            <div className="text-center py-8">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No saved coaches</h3>
              <p className="text-gray-500 mb-4">Start building your target list</p>
              <Button onClick={() => setLocation("/coaches")}>
                Find Coaches
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function UpcomingTasksWidget() {
  const [, setLocation] = useLocation();
  const upcomingTasks = mockTasks
    .filter(task => !task.completed && task.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const priorityColors = {
    high: "bg-red-100 text-red-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800"
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Upcoming Tasks
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation("/tasks")}
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingTasks.map((task) => (
            <div key={task.id} className="flex items-start justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-sm">{task.title}</p>
                {task.description && (
                  <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={`text-xs ${priorityColors[task.priority]}`}>
                    {task.priority} priority
                  </Badge>
                  <span className="text-xs text-gray-500">
                    Due {new Date(task.dueDate!).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {upcomingTasks.length === 0 && (
            <div className="text-center py-8">
              <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming tasks</h3>
              <p className="text-gray-500 mb-4">You're all caught up!</p>
              <Button onClick={() => setLocation("/tasks")}>
                Create Task
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivityWidget() {
  const [, setLocation] = useLocation();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation("/dashboard")}
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivities.slice(0, 6).map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="bg-blue-100 p-2 rounded-full">
                  {activity.type === "email_sent" && <Mail className="h-4 w-4 text-blue-600" />}
                  {activity.type === "email_received" && <MessageSquare className="h-4 w-4 text-green-600" />}
                  {activity.type === "task_completed" && <CheckSquare className="h-4 w-4 text-green-600" />}
                  {activity.type === "coach_saved" && <Star className="h-4 w-4 text-yellow-600" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
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
  );
}

function EmailInsightsWidget() {
  const [, setLocation] = useLocation();
  const totalEmails = mockStats.emailsSent;
  const responses = mockStats.responses;
  const responseRate = Math.round((responses / totalEmails) * 100);

  const recentEmails = mockEmails
    .filter(email => email.status !== "draft")
    .slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Email Insights
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation("/emails")}
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{totalEmails}</p>
            <p className="text-xs text-gray-600">Sent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{responses}</p>
            <p className="text-xs text-gray-600">Replies</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{responseRate}%</p>
            <p className="text-xs text-gray-600">Rate</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-sm">Recent Emails</h4>
          {recentEmails.map((email) => {
            const coach = mockCoaches.find(c => c.id === email.coachId);
            return (
              <div key={email.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <p className="text-sm font-medium">{coach?.name}</p>
                  <p className="text-xs text-gray-500">{email.subject}</p>
                </div>
                <Badge variant={email.status === "received" ? "success" : "secondary"} className="text-xs">
                  {email.status}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionsWidget() {
  const [, setLocation] = useLocation();

  const actions = [
    {
      title: "Compose Email",
      description: "Send a new email to a coach",
      icon: Mail,
      action: () => setLocation("/emails"),
      color: "bg-blue-100 text-blue-600"
    },
    {
      title: "Find Coaches",
      description: "Search for new coaches to contact",
      icon: Users,
      action: () => setLocation("/coaches"),
      color: "bg-green-100 text-green-600"
    },
    {
      title: "Create Task",
      description: "Add a new task or reminder",
      icon: Plus,
      action: () => setLocation("/tasks"),
      color: "bg-purple-100 text-purple-600"
    },
    {
      title: "Update Profile",
      description: "Keep your athletic profile current",
      icon: Trophy,
      action: () => setLocation("/profile"),
      color: "bg-yellow-100 text-yellow-600"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Quick Actions
        </CardTitle>
        <CardDescription>Common recruiting tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              className="justify-start h-auto p-4"
              onClick={action.action}
            >
              <div className={`p-2 rounded-lg mr-3 ${action.color}`}>
                <action.icon className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">{action.title}</p>
                <p className="text-xs text-gray-500">{action.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto text-gray-400" />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const widgets: Widget[] = [
  { id: "stats", title: "Overview Stats", component: StatsWidget, size: "large" },
  { id: "progress", title: "Recruiting Progress", component: RecruitingProgressWidget, size: "medium" },
  { id: "coaches", title: "Saved Coaches", component: SavedCoachesWidget, size: "medium" },
  { id: "tasks", title: "Upcoming Tasks", component: UpcomingTasksWidget, size: "medium" },
  { id: "activity", title: "Recent Activity", component: RecentActivityWidget, size: "medium" },
  { id: "emails", title: "Email Insights", component: EmailInsightsWidget, size: "medium" },
  { id: "actions", title: "Quick Actions", component: QuickActionsWidget, size: "small" }
];

export default function Dashboard() {
  const [visibleWidgets, setVisibleWidgets] = useState<string[]>(
    widgets.map(w => w.id)
  );

  const toggleWidget = (widgetId: string) => {
    setVisibleWidgets(prev =>
      prev.includes(widgetId)
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {mockUser.name}!
            </h1>
            <p className="text-gray-600">
              Here's your recruiting progress at a glance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={mockUser.avatar} alt={mockUser.name} />
              <AvatarFallback>{getInitials(mockUser.name)}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customize">Customize</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Always show stats at the top */}
          <StatsWidget />

          {/* Main dashboard grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {visibleWidgets.includes("progress") && <RecruitingProgressWidget />}
              {visibleWidgets.includes("emails") && <EmailInsightsWidget />}
            </div>
            
            <div className="lg:col-span-1 space-y-6">
              {visibleWidgets.includes("actions") && <QuickActionsWidget />}
              {visibleWidgets.includes("tasks") && <UpcomingTasksWidget />}
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {visibleWidgets.includes("coaches") && <SavedCoachesWidget />}
            {visibleWidgets.includes("activity") && <RecentActivityWidget />}
          </div>
        </TabsContent>

        <TabsContent value="customize">
          <Card>
            <CardHeader>
              <CardTitle>Customize Dashboard</CardTitle>
              <CardDescription>
                Choose which widgets to display on your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {widgets.map((widget) => (
                  <div key={widget.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{widget.title}</h4>
                      <p className="text-sm text-gray-500">Size: {widget.size}</p>
                    </div>
                    <Button
                      variant={visibleWidgets.includes(widget.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleWidget(widget.id)}
                    >
                      {visibleWidgets.includes(widget.id) ? "Hide" : "Show"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}