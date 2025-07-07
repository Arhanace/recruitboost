import { Task } from "@shared/schema";
import { format, isToday, isTomorrow, addDays } from "date-fns";
import { useState } from "react";
import { Link } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

type TaskStatusProps = {
  dueDate: string;
};

function TaskStatus({ dueDate }: TaskStatusProps) {
  const date = new Date(dueDate);
  
  if (isToday(date)) {
    return <span className="text-xs text-red-500 font-medium">Today</span>;
  } else if (isTomorrow(date)) {
    return <span className="text-xs text-amber-500 font-medium">Tomorrow</span>;
  } else if (date < new Date()) {
    return <span className="text-xs text-red-500 font-medium">Overdue</span>;
  } else {
    const now = new Date();
    const threeDaysFromNow = addDays(now, 3);
    
    if (date <= threeDaysFromNow) {
      return <span className="text-xs text-gray-500 font-medium">In {format(date, "d")} days</span>;
    } else {
      return <span className="text-xs text-gray-500 font-medium">{format(date, "MMM d")}</span>;
    }
  }
}

type TaskItemProps = {
  task: Task;
  onTaskComplete: (taskId: number, completed: boolean) => void;
};

function TaskItem({ task, onTaskComplete }: TaskItemProps) {
  const [isChecked, setIsChecked] = useState(task.completed);
  
  const handleCheckboxChange = (checked: boolean) => {
    setIsChecked(checked);
    onTaskComplete(task.id, checked);
  };
  
  return (
    <li className="py-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Checkbox 
            id={`task-${task.id}`} 
            checked={isChecked}
            onCheckedChange={handleCheckboxChange}
            className="h-4 w-4"
          />
          <div className="ml-3">
            <p className={cn(
              "text-sm font-medium",
              isChecked ? "text-gray-400 line-through" : "text-gray-900"
            )}>
              {task.title}
            </p>
            <p className="text-xs text-gray-500">{task.metaData?.school || 'Unknown School'}, {task.metaData?.sport || 'Unknown Sport'}</p>
          </div>
        </div>
        <TaskStatus dueDate={task.dueDate} />
      </div>
    </li>
  );
}

type UpcomingTasksCardProps = {
  tasks: Task[];
  isLoading: boolean;
};

export default function UpcomingTasksCard({ tasks, isLoading }: UpcomingTasksCardProps) {
  const { toast } = useToast();
  
  const handleTaskComplete = async (taskId: number, completed: boolean) => {
    try {
      await apiRequest("PUT", `/api/tasks/${taskId}`, { completed });
      
      // Invalidate tasks query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      
      toast({
        title: completed ? "Task completed" : "Task reopened",
        description: "Task status has been updated.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">My Tasks</h2>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                <div className="ml-3">
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                  <div className="h-3 bg-gray-200 rounded w-24 mt-2"></div>
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-12"></div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                <div className="ml-3">
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                  <div className="h-3 bg-gray-200 rounded w-24 mt-2"></div>
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-12"></div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                <div className="ml-3">
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                  <div className="h-3 bg-gray-200 rounded w-24 mt-2"></div>
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-12"></div>
            </div>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onTaskComplete={handleTaskComplete}
                />
              ))}
            </ul>
            <div className="mt-4 text-center">
              <Link href="/follow-ups" className="text-sm text-primary font-medium hover:text-indigo-700">
                View All Tasks
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
