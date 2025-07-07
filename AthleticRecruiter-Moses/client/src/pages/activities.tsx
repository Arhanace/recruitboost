import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "@shared/schema";
import { formatDistanceToNow, format } from "date-fns";
import { 
  RectangleEllipsis, 
  ReplyIcon, 
  UserPlusIcon,
  ClipboardCheckIcon,
  Mail,
  CalendarDays,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

type ActivityType = "all" | "email_sent" | "email_received" | "coach_added" | "task_completed" | "database_update";

function ActivityTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "email_sent":
      return (
        <span className="bg-indigo-100 text-primary p-2 rounded-full">
          <RectangleEllipsis className="h-4 w-4" />
        </span>
      );
    case "email_received":
      return (
        <span className="bg-emerald-100 text-emerald-600 p-2 rounded-full">
          <ReplyIcon className="h-4 w-4" />
        </span>
      );
    case "coach_added":
      return (
        <span className="bg-amber-100 text-amber-600 p-2 rounded-full">
          <UserPlusIcon className="h-4 w-4" />
        </span>
      );
    case "task_completed":
      return (
        <span className="bg-blue-100 text-blue-600 p-2 rounded-full">
          <ClipboardCheckIcon className="h-4 w-4" />
        </span>
      );
    default:
      return (
        <span className="bg-gray-100 text-gray-600 p-2 rounded-full">
          <Mail className="h-4 w-4" />
        </span>
      );
  }
}

function ActivityTypeBadge({ type }: { type: string }) {
  switch (type) {
    case "email_sent":
      return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Email Sent</Badge>;
    case "email_received":
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Response Received</Badge>;
    case "coach_added":
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Coach Added</Badge>;
    case "task_completed":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Task Completed</Badge>;
    case "database_update":
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Database Updated</Badge>;
    default:
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Activity</Badge>;
  }
}

export default function ActivitiesPage() {
  const [activeTab, setActiveTab] = useState<ActivityType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch activities
  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/activities"],
  });

  // Filter and sort activities
  const filteredActivities = !isLoading && activities ? activities.filter((activity: Activity) => {
    // Filter by type if not "all"
    if (activeTab !== "all" && activity.type !== activeTab) {
      return false;
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        activity.description.toLowerCase().includes(query) ||
        (activity.metaData?.school && activity.metaData.school.toLowerCase().includes(query)) ||
        (activity.metaData?.sport && activity.metaData.sport.toLowerCase().includes(query))
      );
    }

    return true;
  }) : [];

  // Sort activities
  const sortedActivities = [...(filteredActivities || [])].sort((a: Activity, b: Activity) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    
    if (sortOption === "newest") {
      return dateB - dateA;
    } else if (sortOption === "oldest") {
      return dateA - dateB;
    }
    return 0;
  });
  
  // Pagination logic
  const totalPages = Math.ceil(sortedActivities.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentActivities = sortedActivities.slice(indexOfFirstItem, indexOfLastItem);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, sortOption]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Activity History</h1>
          <p className="text-gray-600">Track all your recruitment actions and interactions</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search activities..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => {
            setSearchQuery("");
            setSortOption("newest");
            setActiveTab("all");
          }}>
            Reset
          </Button>
        </div>
      </div>

      {/* Activity Type Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActivityType)} className="w-full">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="email_sent">Emails Sent</TabsTrigger>
          <TabsTrigger value="email_received">Responses</TabsTrigger>
          <TabsTrigger value="coach_added">Coaches Added</TabsTrigger>
          <TabsTrigger value="task_completed">Tasks</TabsTrigger>
          <TabsTrigger value="database_update">Updates</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Activity Timeline</CardTitle>
              <CardDescription>
                {activeTab === "all" 
                  ? "Showing all activities" 
                  : `Showing ${activeTab.replace("_", " ")} activities`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-3">
                      <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : sortedActivities.length === 0 ? (
                <div className="text-center py-10">
                  <div className="rounded-full bg-gray-100 p-3 w-fit mx-auto mb-4">
                    <Mail className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No activities found</h3>
                  <p className="text-gray-500">
                    {searchQuery 
                      ? "Try adjusting your search or filters" 
                      : "Your recruitment activities will appear here"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentActivities.map((activity: Activity) => {
                    // Group activities by date
                    const activityDate = new Date(activity.timestamp);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    
                    let dateHeader = format(activityDate, "MMMM d, yyyy");
                    if (activityDate >= today) {
                      dateHeader = "Today";
                    } else if (activityDate >= yesterday) {
                      dateHeader = "Yesterday";
                    }
                    
                    return (
                      <div key={activity.id} className="border-l-2 border-gray-200 pl-4 pb-2">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            <ActivityTypeIcon type={activity.type} />
                            <span className="text-sm font-medium text-gray-900">{activity.description}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ActivityTypeBadge type={activity.type} />
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        
                        {activity.coachId && activity.metaData && (
                          <div className="ml-10 mt-1">
                            <span className="text-xs text-gray-600">
                              {activity.metaData.school && activity.metaData.sport 
                                ? `${activity.metaData.school}, ${activity.metaData.sport}`
                                : (activity.metaData.school || activity.metaData.sport || '')}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Pagination Controls */}
                  {sortedActivities.length > 0 && (
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-500">
                        Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedActivities.length)} of {sortedActivities.length} activities
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          // Show pages around the current page
                          let pageToShow = i + 1;
                          if (totalPages > 5) {
                            if (currentPage > 3) {
                              pageToShow = currentPage - 3 + i;
                            }
                            if (currentPage > totalPages - 2) {
                              pageToShow = totalPages - 5 + i + 1;
                            }
                          }
                          
                          if (pageToShow <= totalPages) {
                            return (
                              <Button
                                key={i}
                                variant={currentPage === pageToShow ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageToShow)}
                              >
                                {pageToShow}
                              </Button>
                            );
                          }
                          return null;
                        })}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}