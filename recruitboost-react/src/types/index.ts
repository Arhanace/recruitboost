export interface Coach {
  id: string;
  name: string;
  email: string;
  school: string;
  sport: string;
  division: string;
  conference: string;
  position: string;
  phone?: string;
  website?: string;
  notes?: string;
  isSaved?: boolean;
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Email {
  id: string;
  coachId: string;
  subject: string;
  body: string;
  status: 'draft' | 'sent' | 'delivered' | 'opened' | 'replied' | 'received';
  sentAt?: string;
  openedAt?: string;
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  category: 'recruiting' | 'academic' | 'athletic' | 'personal';
  coachId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  type: 'email_sent' | 'email_received' | 'task_completed' | 'coach_saved' | 'profile_updated';
  title: string;
  description: string;
  entityId?: string;
  entityType?: 'coach' | 'email' | 'task';
  createdAt: string;
}

export interface Stats {
  emailsSent: number;
  responses: number;
  coachesContacted: number;
  followUpsDue: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  sport?: string;
  graduationYear?: number;
  gpa?: number;
  position?: string;
  achievements?: string[];
  createdAt: string;
}