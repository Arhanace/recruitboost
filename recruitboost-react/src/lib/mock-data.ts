import { Coach, Email, Task, Activity, Stats, User } from "@/types";

export const mockUser: User = {
  id: "1",
  email: "john.athlete@email.com",
  name: "John Athlete",
  avatar: "https://images.unsplash.com/photo-1628157588553-5eeea00af15c?auto=format&fit=crop&q=80&w=120&h=120",
  sport: "Basketball",
  graduationYear: 2025,
  gpa: 3.8,
  position: "Point Guard",
  achievements: ["Team Captain", "All-State Selection", "Academic Honor Roll"],
  createdAt: "2024-01-01T00:00:00Z"
};

export const mockCoaches: Coach[] = [
  {
    id: "1",
    name: "Mike Johnson",
    email: "mjohnson@stanford.edu",
    school: "Stanford University",
    sport: "Basketball",
    division: "Division I",
    conference: "Pac-12",
    position: "Head Coach",
    phone: "(650) 123-4567",
    website: "https://stanford.edu/basketball",
    isSaved: true,
    lastContactedAt: "2024-12-01T10:00:00Z",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-12-01T10:00:00Z"
  },
  {
    id: "2",
    name: "Sarah Williams",
    email: "swilliams@ucla.edu",
    school: "UCLA",
    sport: "Basketball",
    division: "Division I", 
    conference: "Pac-12",
    position: "Assistant Coach",
    phone: "(310) 123-4567",
    isSaved: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "3",
    name: "David Brown",
    email: "dbrown@duke.edu",
    school: "Duke University",
    sport: "Basketball",
    division: "Division I",
    conference: "ACC",
    position: "Head Coach",
    phone: "(919) 123-4567",
    isSaved: true,
    lastContactedAt: "2024-11-28T14:30:00Z",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-11-28T14:30:00Z"
  }
];

export const mockEmails: Email[] = [
  {
    id: "1",
    coachId: "1",
    subject: "Interest in Basketball Program",
    body: "Dear Coach Johnson, I am writing to express my interest in your basketball program...",
    status: "sent",
    sentAt: "2024-12-01T10:00:00Z",
    createdAt: "2024-12-01T09:30:00Z",
    updatedAt: "2024-12-01T10:00:00Z"
  },
  {
    id: "2", 
    coachId: "1",
    subject: "Re: Interest in Basketball Program",
    body: "Thank you for your interest. We would like to schedule a call...",
    status: "received",
    createdAt: "2024-12-01T15:00:00Z",
    updatedAt: "2024-12-01T15:00:00Z"
  },
  {
    id: "3",
    coachId: "3",
    subject: "Basketball Recruitment Inquiry",
    body: "Dear Coach Brown, I would like to know more about your program...",
    status: "opened",
    sentAt: "2024-11-28T14:30:00Z",
    openedAt: "2024-11-28T16:00:00Z",
    createdAt: "2024-11-28T14:00:00Z",
    updatedAt: "2024-11-28T16:00:00Z"
  }
];

export const mockTasks: Task[] = [
  {
    id: "1",
    title: "Follow up with Stanford Coach",
    description: "Send thank you email and additional highlight video",
    completed: false,
    dueDate: "2024-12-10T00:00:00Z",
    priority: "high",
    category: "recruiting",
    coachId: "1",
    createdAt: "2024-12-01T00:00:00Z",
    updatedAt: "2024-12-01T00:00:00Z"
  },
  {
    id: "2",
    title: "Complete SAT Registration",
    description: "Register for December SAT test",
    completed: false,
    dueDate: "2024-12-08T00:00:00Z",
    priority: "medium",
    category: "academic",
    createdAt: "2024-12-01T00:00:00Z",
    updatedAt: "2024-12-01T00:00:00Z"
  },
  {
    id: "3",
    title: "Update Athletic Resume",
    description: "Add recent game statistics and achievements",
    completed: true,
    priority: "low",
    category: "recruiting",
    createdAt: "2024-11-25T00:00:00Z",
    updatedAt: "2024-11-30T00:00:00Z"
  }
];

export const mockActivities: Activity[] = [
  {
    id: "1",
    type: "email_received",
    title: "Response from Stanford",
    description: "Coach Johnson replied to your email",
    entityId: "2",
    entityType: "email",
    createdAt: "2024-12-01T15:00:00Z"
  },
  {
    id: "2",
    type: "email_sent",
    title: "Email sent to Stanford",
    description: "Sent interest email to Coach Johnson",
    entityId: "1",
    entityType: "email",
    createdAt: "2024-12-01T10:00:00Z"
  },
  {
    id: "3",
    type: "task_completed",
    title: "Task completed",
    description: "Updated athletic resume",
    entityId: "3",
    entityType: "task",
    createdAt: "2024-11-30T00:00:00Z"
  },
  {
    id: "4",
    type: "coach_saved",
    title: "Coach saved",
    description: "Added Duke University to saved coaches",
    entityId: "3",
    entityType: "coach",
    createdAt: "2024-11-28T14:30:00Z"
  }
];

export const mockStats: Stats = {
  emailsSent: 15,
  responses: 4,
  coachesContacted: 12,
  followUpsDue: 3
};