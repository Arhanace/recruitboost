import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format, isPast, isToday, isTomorrow, parseISO } from "date-fns";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Task, Coach, Email } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarIcon, PlusIcon, TrashIcon, Mail } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Task form schema
const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  dueDate: z.date({
    required_error: "A due date is required",
  }),
  notes: z.string().optional(),
  coachId: z.number().optional(),
  type: z.string().default("followup"),
  metaData: z.record(z.any()).optional().default({}),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

type TaskItemProps = {
  task: Task;
  coaches: Coach[];
  onComplete: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
};

function TaskItem({ task, coaches, onComplete, onDelete }: TaskItemProps) {
  const [isChecked, setIsChecked] = useState(task.completed || false);
  const [isFollowUpDialogOpen, setIsFollowUpDialogOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const coach = coaches.find(c => c.id === task.coachId);
  
  useEffect(() => {
    if (isFollowUpDialogOpen) {
      if (coach) {
        setSubject(task.metaData?.suggestedSubject || `Follow-up: ${coach.firstName} ${coach.lastName}`);
        setMessage(`Dear ${coach.firstName},\n\nI wanted to follow up on my previous email regarding my interest in the ${coach.sport} program at ${coach.school}. I'm still very interested in learning more about your program and would appreciate an opportunity to discuss further.\n\nBest regards,`);
      } else {
        setSubject(task.metaData?.suggestedSubject || `Follow-up: ${task.title}`);
        setMessage(`Hello,\n\nI wanted to follow up regarding ${task.title}. Please let me know if you need any additional information.\n\nBest regards,`);
      }
    }
  }, [isFollowUpDialogOpen, coach, task.metaData, task.title]);
  
  const handleCheckboxChange = (checked: boolean) => {
    setIsChecked(checked);
    onComplete(task.id, checked);
  };
  
  // Send follow-up email mutation
  const sendFollowUpMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/emails", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
      setIsFollowUpDialogOpen(false);
      setIsSending(false);
      handleCheckboxChange(true);
      toast({
        title: "Success!",
        description: "Follow-up email has been sent successfully.",
      });
    },
    onError: (error) => {
      setIsSending(false);
      toast({
        title: "Error",
        description: "Failed to send follow-up email. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const getStatusClassName = () => {
    if (isChecked) return "line-through text-gray-400";
    
    try {
      // Handle both Date objects and ISO strings
      const dueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
      if (isPast(dueDate) && !isToday(dueDate)) return "text-red-600 font-medium";
      if (isToday(dueDate)) return "text-amber-600 font-medium";
      return "text-gray-900";
    } catch (e) {
      console.error("Error processing date for status:", e);
      return "text-gray-900";
    }
  };
  
  const getDateStatus = () => {
    try {
      // Handle both Date objects and ISO strings
      const dueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
      
      if (isToday(dueDate)) {
        return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Today</Badge>;
      } else if (isTomorrow(dueDate)) {
        return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Tomorrow</Badge>;
      } else if (isPast(dueDate)) {
        return <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Overdue</Badge>;
      } else {
        return <Badge variant="outline" className="text-gray-600 border-gray-200">{format(dueDate, "MMM d")}</Badge>;
      }
    } catch (e) {
      console.error("Error formatting date:", e);
      return null;
    }
  };
  
  // Detect if this is an email follow-up task - only allow for tasks with coaches
  const isEmailFollowUp = task.type === "email-follow-up" && task.metaData && task.coachId;
  
  return (
    <div className="flex items-start justify-between p-4 border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-3 flex-1">
        <Checkbox 
          id={`task-${task.id}`}
          checked={isChecked}
          onCheckedChange={handleCheckboxChange}
          className="mt-1"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium ${getStatusClassName()}`}>
              {task.title}
            </p>
            {isEmailFollowUp && !isChecked && (
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
                Email Follow-up
              </Badge>
            )}
          </div>
          {coach && (
            <p className="text-xs text-gray-500 mt-1">
              {coach.firstName} {coach.lastName} • {coach.school}
            </p>
          )}
          {(task.metaData?.notes) && (
            <p className="text-xs text-gray-500 mt-1">
              {task.metaData.notes}
            </p>
          )}
          {isEmailFollowUp && !isChecked && (
            <div className="mt-2 flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs" 
                onClick={() => setIsFollowUpDialogOpen(true)}
              >
                <Mail className="h-3 w-3 mr-1" />
                Send Follow-up
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs text-gray-600" 
                onClick={() => handleCheckboxChange(true)}
              >
                Skip
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {getDateStatus()}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(task.id)}
          className="h-8 w-8 text-gray-500 hover:text-red-500 opacity-50 hover:opacity-100 transition-opacity"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Follow-up Email Dialog */}
      {isEmailFollowUp && (
        <Dialog open={isFollowUpDialogOpen} onOpenChange={setIsFollowUpDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Send Follow-up Email</DialogTitle>
              <DialogDescription>
                {coach ? 
                  `Send a follow-up email to ${coach.firstName} ${coach.lastName} at ${coach.school}` : 
                  'Send a follow-up email'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input 
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea 
                  id="message"
                  rows={8}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsFollowUpDialogOpen(false)}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!coach) return;
                  
                  // Send the follow-up email
                  setIsSending(true);
                  
                  const emailData = {
                    coachIds: [coach.id],
                    subject: subject,
                    body: message,
                    status: "sent",
                    scheduledFor: null,
                    type: "follow-up",
                    originalEmailId: task.metaData?.emailId,
                    isFollowUp: true
                  };
                  
                  sendFollowUpMutation.mutate(emailData);
                }}
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Follow-up
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function TasksPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();
  
  // Fetch tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });
  
  // Fetch coaches for coach selection
  const { data: allCoaches = [], isLoading: coachesLoading } = useQuery<Coach[]>({
    queryKey: ["/api/coaches"],
  });

  const coaches = allCoaches.coaches || []
  
  // Create new task form
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      dueDate: new Date(),
      notes: "",
      type: "followup",
      metaData: {},
    },
  });
  
  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      // Convert dueDate to ISO string for server
      const taskData = {
        ...data,
        // Do not convert date to string since it's already a Date object
        // The API handles Date objects correctly
      };
      console.log("Sending task data to API:", taskData);
      const response = await apiRequest("POST", "/api/tasks", taskData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setCreateDialogOpen(false);
      form.reset({
        title: "",
        dueDate: new Date(),
        notes: "",
        type: "followup",
        metaData: {},
      });
      toast({
        title: "Task Created",
        description: "New task has been successfully created",
      });
    },
    onError: (error) => {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Task> }) => {
      const response = await apiRequest("PUT", `/api/tasks/${id}`, data);
      return {
        result: await response.json(),
        completed: data.completed // Return the completed status from the mutation
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      
      // If task was marked as completed, switch to completed tab
      if (data.completed === true && activeTab !== "completed") {
        setTimeout(() => {
          setActiveTab("completed");
        }, 300); // Short delay to allow the task list to update first
      }
      
      toast({
        title: "Task Updated",
        description: "Task has been successfully updated",
      });
    },
    onError: (error) => {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/tasks/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Task Deleted",
        description: "Task has been successfully deleted",
      });
    },
    onError: (error) => {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: TaskFormValues) => {
    // Store notes in metaData since the task schema doesn't have notes field
    const submitData = {
      ...data,
      // Only include coachId if it's explicitly selected
      ...(data.coachId ? { coachId: data.coachId } : {}),
      metaData: {
        ...data.metaData,
        notes: data.notes // Store notes in metaData
      }
    };
    console.log("Submitting task with data:", submitData);
    createTaskMutation.mutate(submitData);
  };
  
  // Handle task completion toggle
  const handleCompleteTask = (id: number, completed: boolean) => {
    updateTaskMutation.mutate({ id, data: { completed } });
    // The tab switching is now handled in the mutation's onSuccess callback
  };
  
  // Handle task deletion
  const handleDeleteTask = (id: number) => {
    deleteTaskMutation.mutate(id);
  };
  
  // Filter tasks based on active tab
  const filteredTasks = tasks.filter(task => {
    if (activeTab === "all") return true;
    if (activeTab === "completed") return task.completed;
    if (activeTab === "pending") return !task.completed;
    if (activeTab === "overdue") {
      try {
        // Handle both Date objects and ISO strings
        const dueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
        return isPast(dueDate) && !isToday(dueDate) && !task.completed;
      } catch (e) {
        console.error("Error processing date for overdue filter:", e);
        return false;
      }
    }
    return true;
  });
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Tasks</h1>
          <p className="text-gray-600">Manage your recruitment tasks and follow-ups</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="all">All Tasks</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-start gap-3 p-4 border-b border-gray-100">
                  <div className="h-4 w-4 rounded-sm bg-gray-200"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 w-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No tasks to display.</p>
              <Button 
                variant="outline" 
                className="mt-2"
                onClick={() => setCreateDialogOpen(true)}
              >
                Create your first task
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredTasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  coaches={coaches}
                  onComplete={handleCompleteTask}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Create Task Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a new task to help manage your recruitment process
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Email Coach Johnson" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="coachId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Coach (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a coach" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {coaches.map((coach) => (
                          <SelectItem key={coach.id} value={coach.id.toString()}>
                            {coach.firstName} {coach.lastName} ({coach.school})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Link this task to a specific coach
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional details about this task"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTaskMutation.isPending}
                >
                  {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}