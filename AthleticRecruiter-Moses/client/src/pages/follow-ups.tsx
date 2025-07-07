import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Task } from "@shared/schema";
import { format, isToday, isTomorrow, isPast, addDays, isAfter } from "date-fns";
import { 
  Plus,
  CheckCircle2,
  CircleAlert,
  CalendarDays,
  CheckIcon,
  Filter,
  Search,
  Trash2,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { SchoolLogo } from "@/components/ui/school-logo";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TaskStatusBadgeProps = {
  dueDate: string;
  completed?: boolean;
};

function TaskStatusBadge({ dueDate, completed }: TaskStatusBadgeProps) {
  if (completed) {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <CheckIcon className="mr-1 h-3 w-3" /> Completed
      </Badge>
    );
  }
  
  const date = new Date(dueDate);
  
  if (isPast(date) && !isToday(date)) {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        <CircleAlert className="mr-1 h-3 w-3" /> Overdue
      </Badge>
    );
  } else if (isToday(date)) {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
        <Clock className="mr-1 h-3 w-3" /> Today
      </Badge>
    );
  } else if (isTomorrow(date)) {
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <Calendar className="mr-1 h-3 w-3" /> Tomorrow
      </Badge>
    );
  } else {
    const now = new Date();
    const threeDaysFromNow = addDays(now, 3);
    
    if (!isAfter(date, threeDaysFromNow)) {
      return (
        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
          <CalendarDays className="mr-1 h-3 w-3" /> In {format(date, "d")} days
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          <CalendarDays className="mr-1 h-3 w-3" /> {format(date, "MMM d")}
        </Badge>
      );
    }
  }
}

// New Task Dialog Component
type TaskFormDialogProps = {
  onTaskCreated: () => void;
};

function TaskFormDialog({ onTaskCreated }: TaskFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedCoach, setSelectedCoach] = useState("");
  const [taskType, setTaskType] = useState("follow_up");
  const { toast } = useToast();
  
  // Fetch coaches for dropdown
  const { data: coaches } = useQuery({
    queryKey: ["/api/coaches"],
  });
  
  const createTaskMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await apiRequest("POST", "/api/tasks", formData);
      if (!response.ok) {
        throw new Error("Failed to create task");
      }
      return response.json();
    },
    onSuccess: () => {
      // Reset form and close dialog
      setTitle("");
      setDueDate("");
      setSelectedCoach("");
      setTaskType("follow_up");
      setOpen(false);
      
      // Notify parent component and refresh tasks
      onTaskCreated();
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      
      toast({
        title: "Task created",
        description: "Your new task has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !dueDate || !selectedCoach) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    const coachData = coaches?.find((coach: any) => coach.id.toString() === selectedCoach);
    
    createTaskMutation.mutate({
      title,
      dueDate: new Date(dueDate).toISOString(),
      coachId: parseInt(selectedCoach),
      type: taskType,
      completed: false,
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new follow-up task or reminder for your recruitment process
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="task-title" className="text-sm font-medium">
              Task Title
            </label>
            <Input
              id="task-title"
              placeholder="Follow up with Coach Smith"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="coach" className="text-sm font-medium">
              Coach
            </label>
            <Select value={selectedCoach} onValueChange={setSelectedCoach} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a coach" />
              </SelectTrigger>
              <SelectContent>
                {coaches && coaches.map((coach: any) => (
                  <SelectItem key={coach.id} value={coach.id.toString()}>
                    {coach.firstName} {coach.lastName} - {coach.school}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="task-type" className="text-sm font-medium">
              Task Type
            </label>
            <Select value={taskType} onValueChange={setTaskType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select task type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="follow_up">Follow Up</SelectItem>
                <SelectItem value="call">Phone Call</SelectItem>
                <SelectItem value="email">Send Email</SelectItem>
                <SelectItem value="research">Research</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="due-date" className="text-sm font-medium">
              Due Date
            </label>
            <Input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createTaskMutation.isPending}>
              {createTaskMutation.isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function FollowUpsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("dueDate");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();
  
  // Fetch tasks
  const { data: tasks, isLoading, refetch } = useQuery({
    queryKey: ["/api/tasks"],
  });
  
  // Task completion mutation
  const completeTaskMutation = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: number, completed: boolean }) => {
      const response = await apiRequest("PUT", `/api/tasks/${taskId}`, { completed });
      if (!response.ok) {
        throw new Error("Failed to update task");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task updated",
        description: "Task status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Task deletion mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await apiRequest("DELETE", `/api/tasks/${taskId}`);
      if (!response.ok) {
        throw new Error("Failed to delete task");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task deleted",
        description: "Task has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Handle task completion
  const handleTaskComplete = (taskId: number, completed: boolean) => {
    completeTaskMutation.mutate({ taskId, completed });
  };
  
  // Handle task deletion
  const handleTaskDelete = (taskId: number) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate(taskId);
    }
  };
  
  // Filter and sort tasks
  const filteredTasks = !isLoading && tasks ? tasks.filter((task: Task) => {
    // Filter by tab
    if (activeTab === "completed" && !task.completed) {
      return false;
    } else if (activeTab === "pending" && task.completed) {
      return false;
    } else if (activeTab === "overdue" && (task.completed || !isPast(new Date(task.dueDate)) || isToday(new Date(task.dueDate)))) {
      return false;
    } else if (activeTab === "today" && (!isToday(new Date(task.dueDate)) || task.completed)) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(query) ||
        (task.metaData?.school && task.metaData.school.toLowerCase().includes(query)) ||
        (task.metaData?.sport && task.metaData.sport.toLowerCase().includes(query))
      );
    }
    
    return true;
  }) : [];
  
  // Sort tasks
  const sortedTasks = [...(filteredTasks || [])].sort((a: Task, b: Task) => {
    if (sortOption === "dueDate") {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else if (sortOption === "title") {
      return a.title.localeCompare(b.title);
    } else if (sortOption === "status") {
      if (a.completed === b.completed) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return a.completed ? 1 : -1;
    }
    return 0;
  });
  
  // Pagination logic
  const totalPages = Math.ceil(sortedTasks.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTasks = sortedTasks.slice(indexOfFirstItem, indexOfLastItem);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, sortOption]);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Tasks</h1>
          <p className="text-gray-600">Manage your follow-ups and recruiting tasks</p>
        </div>
        <TaskFormDialog onTaskCreated={refetch} />
      </div>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search tasks..."
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
              <SelectItem value="dueDate">Due Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => {
            setSearchQuery("");
            setSortOption("dueDate");
            setActiveTab("all");
          }}>
            Reset
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-6">
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="today">Due Today</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Task List</CardTitle>
              <CardDescription>
                {activeTab === "all" 
                  ? "Showing all tasks" 
                  : `Showing ${activeTab} tasks`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 bg-gray-200 rounded"></div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              ) : sortedTasks.length === 0 ? (
                <div className="text-center py-10">
                  <div className="rounded-full bg-gray-100 p-3 w-fit mx-auto mb-4">
                    <CheckCircle2 className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No tasks found</h3>
                  <p className="text-gray-500">
                    {searchQuery 
                      ? "Try adjusting your search or filters" 
                      : "Create a new task to stay on top of your recruiting process"}
                  </p>
                  <div className="mt-4">
                    <TaskFormDialog onTaskCreated={refetch} />
                  </div>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">Status</TableHead>
                        <TableHead>Task</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentTasks.map((task: Task) => (
                        <TableRow key={task.id} className={cn(
                          task.completed ? "bg-gray-50" : "",
                          isPast(new Date(task.dueDate)) && !task.completed && !isToday(new Date(task.dueDate)) 
                            ? "bg-red-50" 
                            : ""
                        )}>
                          <TableCell>
                            <Checkbox
                              id={`task-${task.id}`}
                              checked={task.completed}
                              onCheckedChange={(checked) => 
                                handleTaskComplete(task.id, checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div className={cn(
                              "font-medium", 
                              task.completed ? "line-through text-gray-500" : "text-gray-900"
                            )}>
                              {task.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              Type: {task.type.replace("_", " ")}
                            </div>
                          </TableCell>
                          <TableCell>
                            {task.metaData?.school && (
                              <div className="flex items-center gap-2">
                                <SchoolLogo school={task.metaData.school} className="h-5 w-5" />
                                <span className="text-sm">{task.metaData.school}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <TaskStatusBadge dueDate={task.dueDate} completed={task.completed} />
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                    />
                                  </svg>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleTaskComplete(task.id, !task.completed)}
                                >
                                  <CheckIcon className="mr-2 h-4 w-4" />
                                  {task.completed ? "Mark as Pending" : "Mark as Complete"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleTaskDelete(task.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Task
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {sortedTasks.length > 0 && (
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-500">
                        Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedTasks.length)} of {sortedTasks.length} tasks
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
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}