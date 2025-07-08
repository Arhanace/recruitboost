import { useState, useMemo } from "react";
import { 
  CheckSquare, 
  Plus, 
  Calendar, 
  Filter,
  Clock,
  Flag,
  User,
  GraduationCap,
  Dumbbell,
  FileText,
  Search,
  Edit,
  Trash2,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { mockTasks, mockCoaches } from "@/lib/mock-data";
import { Task } from "@/types";

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800", 
  high: "bg-red-100 text-red-800"
};

const categoryIcons = {
  recruiting: GraduationCap,
  academic: FileText,
  athletic: Dumbbell,
  personal: User
};

export default function Tasks() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Create/Edit task state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [taskCategory, setTaskCategory] = useState<"recruiting" | "academic" | "athletic" | "personal">("recruiting");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskCoachId, setTaskCoachId] = useState("");

  const [tasks, setTasks] = useState(mockTasks);

  // Filter tasks based on active tab and filters
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Filter by tab
    switch (activeTab) {
      case "pending":
        filtered = filtered.filter(task => !task.completed);
        break;
      case "completed":
        filtered = filtered.filter(task => task.completed);
        break;
      case "overdue":
        filtered = filtered.filter(task => 
          !task.completed && 
          task.dueDate && 
          new Date(task.dueDate) < new Date()
        );
        break;
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply priority filter
    if (selectedPriority) {
      filtered = filtered.filter(task => task.priority === selectedPriority);
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(task => task.category === selectedCategory);
    }

    return filtered;
  }, [tasks, activeTab, searchTerm, selectedPriority, selectedCategory]);

  const handleToggleTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, completed: !task.completed, updatedAt: new Date().toISOString() }
        : task
    ));
    
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      toast({
        title: task.completed ? "Task marked as pending" : "Task completed!",
        description: task.title
      });
    }
  };

  const handleCreateTask = () => {
    if (!taskTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a task title",
        variant: "destructive"
      });
      return;
    }

    const newTask: Task = {
      id: Date.now().toString(),
      title: taskTitle,
      description: taskDescription || undefined,
      completed: false,
      priority: taskPriority,
      category: taskCategory,
      dueDate: taskDueDate || undefined,
      coachId: taskCoachId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setTasks(prev => [...prev, newTask]);
    
    toast({
      title: "Task created",
      description: "Your new task has been added"
    });

    // Reset form
    resetTaskForm();
    setCreateTaskOpen(false);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || "");
    setTaskPriority(task.priority);
    setTaskCategory(task.category);
    setTaskDueDate(task.dueDate ? task.dueDate.split('T')[0] : "");
    setTaskCoachId(task.coachId || "");
  };

  const handleUpdateTask = () => {
    if (!editingTask || !taskTitle.trim()) return;

    const updatedTask: Task = {
      ...editingTask,
      title: taskTitle,
      description: taskDescription || undefined,
      priority: taskPriority,
      category: taskCategory,
      dueDate: taskDueDate || undefined,
      coachId: taskCoachId || undefined,
      updatedAt: new Date().toISOString()
    };

    setTasks(prev => prev.map(task => 
      task.id === editingTask.id ? updatedTask : task
    ));

    toast({
      title: "Task updated",
      description: "Your task has been saved"
    });

    resetTaskForm();
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    toast({
      title: "Task deleted",
      description: "Task has been removed"
    });
  };

  const resetTaskForm = () => {
    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("medium");
    setTaskCategory("recruiting");
    setTaskDueDate("");
    setTaskCoachId("");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedPriority("");
    setSelectedCategory("");
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(t => 
      !t.completed && 
      t.dueDate && 
      new Date(t.dueDate) < new Date()
    ).length;

    return { total, completed, pending, overdue };
  };

  const stats = getTaskStats();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Task Management</h1>
            <p className="text-gray-600">
              Organize and track your recruiting tasks and deadlines
            </p>
          </div>
          <Button onClick={() => setCreateTaskOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-4">
                <CheckSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-600">Total Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-green-100 text-green-600 p-2 rounded-lg mr-4">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-gray-600">Completed</p>
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
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-red-100 text-red-600 p-2 rounded-lg mr-4">
                <Flag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.overdue}</p>
                <p className="text-sm text-gray-600">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priorities</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="recruiting">Recruiting</SelectItem>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="athletic">Athletic</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Task Tabs and List */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Tasks</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const CategoryIcon = categoryIcons[task.category];
              const coach = task.coachId ? mockCoaches.find(c => c.id === task.coachId) : null;
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

              return (
                <div
                  key={task.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    task.completed ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
                  } ${isOverdue ? 'bg-red-50 border-red-200' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => handleToggleTask(task.id)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditTask(task)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1">
                          <CategoryIcon className="h-3 w-3" />
                          <span className="capitalize">{task.category}</span>
                        </div>

                        <Badge className={`text-xs ${priorityColors[task.priority]}`}>
                          {task.priority} priority
                        </Badge>

                        {task.dueDate && (
                          <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                            <Calendar className="h-3 w-3" />
                            <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}

                        {coach && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <User className="h-3 w-3" />
                            <span>{coach.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredTasks.length === 0 && (
              <div className="text-center py-8">
                <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || selectedPriority || selectedCategory ? 
                    "Try adjusting your filters" : 
                    "Create your first task to get started"
                  }
                </p>
                {!searchTerm && !selectedPriority && !selectedCategory && (
                  <Button onClick={() => setCreateTaskOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Task Dialog */}
      <Dialog open={createTaskOpen || !!editingTask} onOpenChange={(open) => {
        if (!open) {
          setCreateTaskOpen(false);
          setEditingTask(null);
          resetTaskForm();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Title *</label>
              <Input
                placeholder="Task title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
              <Textarea
                placeholder="Task description (optional)"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Priority</label>
                <Select value={taskPriority} onValueChange={(value: any) => setTaskPriority(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                <Select value={taskCategory} onValueChange={(value: any) => setTaskCategory(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recruiting">Recruiting</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="athletic">Athletic</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Due Date</label>
                <Input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Related Coach</label>
                <Select value={taskCoachId} onValueChange={setTaskCoachId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a coach (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No coach</SelectItem>
                    {mockCoaches.map(coach => (
                      <SelectItem key={coach.id} value={coach.id}>
                        {coach.name} - {coach.school}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button 
                onClick={editingTask ? handleUpdateTask : handleCreateTask}
                className="flex-1"
              >
                {editingTask ? 'Update Task' : 'Create Task'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setCreateTaskOpen(false);
                  setEditingTask(null);
                  resetTaskForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}