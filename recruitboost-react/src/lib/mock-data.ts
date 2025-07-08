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
  },
  {
    id: "4",
    name: "Jennifer Martinez",
    email: "jmartinez@unc.edu",
    school: "University of North Carolina",
    sport: "Basketball",
    division: "Division I",
    conference: "ACC",
    position: "Associate Head Coach",
    phone: "(919) 987-6543",
    isSaved: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "5",
    name: "Robert Thompson",
    email: "rthompson@gonzaga.edu",
    school: "Gonzaga University",
    sport: "Basketball",
    division: "Division I",
    conference: "WCC",
    position: "Head Coach",
    phone: "(509) 123-7890",
    isSaved: true,
    lastContactedAt: "2024-11-20T09:15:00Z",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-11-20T09:15:00Z"
  },
  {
    id: "6",
    name: "Lisa Anderson",
    email: "landerson@villanova.edu",
    school: "Villanova University",
    sport: "Basketball",
    division: "Division I",
    conference: "Big East",
    position: "Assistant Coach",
    phone: "(610) 456-7890",
    isSaved: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "7",
    name: "Kevin Davis",
    email: "kdavis@kansas.edu",
    school: "University of Kansas",
    sport: "Basketball",
    division: "Division I",
    conference: "Big 12",
    position: "Head Coach",
    phone: "(785) 234-5678",
    isSaved: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "8",
    name: "Amanda Foster",
    email: "afoster@baylor.edu",
    school: "Baylor University",
    sport: "Basketball",
    division: "Division I",
    conference: "Big 12",
    position: "Associate Head Coach",
    phone: "(254) 345-6789",
    isSaved: true,
    lastContactedAt: "2024-11-15T16:45:00Z",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-11-15T16:45:00Z"
  },
  {
    id: "9",
    name: "James Wilson",
    email: "jwilson@michigan.edu",
    school: "University of Michigan",
    sport: "Basketball",
    division: "Division I",
    conference: "Big Ten",
    position: "Head Coach",
    phone: "(734) 567-8901",
    isSaved: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "10",
    name: "Rachel Green",
    email: "rgreen@purdue.edu",
    school: "Purdue University",
    sport: "Basketball",
    division: "Division I",
    conference: "Big Ten",
    position: "Assistant Coach",
    phone: "(765) 678-9012",
    isSaved: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "11",
    name: "Mark Stevens",
    email: "mstevens@middlebury.edu",
    school: "Middlebury College",
    sport: "Basketball",
    division: "Division III",
    conference: "NESCAC",
    position: "Head Coach",
    phone: "(802) 789-0123",
    isSaved: false,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "12",
    name: "Catherine Lee",
    email: "clee@williams.edu",
    school: "Williams College",
    sport: "Basketball",
    division: "Division III",
    conference: "NESCAC",
    position: "Head Coach",
    phone: "(413) 890-1234",
    isSaved: true,
    lastContactedAt: "2024-11-10T11:30:00Z",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-11-10T11:30:00Z"
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
  },
  {
    id: "4",
    coachId: "5",
    subject: "Follow-up on Campus Visit",
    body: "Coach Thompson, Thank you for the campus visit opportunity...",
    status: "sent",
    sentAt: "2024-11-20T09:15:00Z",
    createdAt: "2024-11-20T09:00:00Z",
    updatedAt: "2024-11-20T09:15:00Z"
  },
  {
    id: "5",
    coachId: "8",
    subject: "Recruiting Video Submission",
    body: "Dear Coach Foster, I am submitting my basketball highlights...",
    status: "delivered",
    sentAt: "2024-11-15T16:45:00Z",
    createdAt: "2024-11-15T16:30:00Z",
    updatedAt: "2024-11-15T16:45:00Z"
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
  },
  {
    id: "4",
    title: "Schedule campus visit to Duke",
    description: "Contact admissions office and arrange overnight visit",
    completed: false,
    dueDate: "2024-12-15T00:00:00Z",
    priority: "high",
    category: "recruiting",
    coachId: "3",
    createdAt: "2024-11-28T00:00:00Z",
    updatedAt: "2024-11-28T00:00:00Z"
  },
  {
    id: "5",
    title: "Submit FAFSA Application",
    description: "Complete financial aid application for college",
    completed: false,
    dueDate: "2024-12-31T00:00:00Z",
    priority: "medium",
    category: "academic",
    createdAt: "2024-11-01T00:00:00Z",
    updatedAt: "2024-11-01T00:00:00Z"
  },
  {
    id: "6",
    title: "Record new highlight video",
    description: "Create updated basketball highlight reel",
    completed: false,
    dueDate: "2024-12-20T00:00:00Z",
    priority: "medium",
    category: "athletic",
    createdAt: "2024-11-15T00:00:00Z",
    updatedAt: "2024-11-15T00:00:00Z"
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
  },
  {
    id: "5",
    type: "email_sent",
    title: "Follow-up sent to Gonzaga",
    description: "Sent campus visit thank you to Coach Thompson",
    entityId: "4",
    entityType: "email",
    createdAt: "2024-11-20T09:15:00Z"
  },
  {
    id: "6",
    type: "coach_saved",
    title: "Coach saved",
    description: "Added Baylor University to saved coaches",
    entityId: "8",
    entityType: "coach",
    createdAt: "2024-11-15T16:45:00Z"
  }
];

export const mockStats: Stats = {
  emailsSent: 15,
  responses: 4,
  coachesContacted: 12,
  followUpsDue: 3
};

// Email Templates
export const emailTemplates = [
  {
    id: "1",
    name: "Initial Interest",
    subject: "Interest in {{school}} {{sport}} Program",
    body: `Dear Coach {{coachName}},

I hope this email finds you well. My name is {{playerName}}, and I am a {{graduationYear}} graduate from {{highSchool}}. I am writing to express my strong interest in the {{sport}} program at {{school}}.

About me:
- Position: {{position}}
- GPA: {{gpa}}
- Height/Weight: {{height}}/{{weight}}
- Key Achievements: {{achievements}}

I have been following {{school}}'s basketball program and am impressed by your coaching philosophy and the team's success. I believe my skills and work ethic would be a great fit for your program.

I have attached my athletic resume and highlight video for your review. I would welcome the opportunity to discuss how I can contribute to your team's continued success.

Thank you for your time and consideration. I look forward to hearing from you.

Best regards,
{{playerName}}
{{playerEmail}}
{{playerPhone}}`
  },
  {
    id: "2",
    name: "Follow-up",
    subject: "Follow-up: {{playerName}} - {{sport}} Recruitment",
    body: `Dear Coach {{coachName}},

I wanted to follow up on my previous email regarding my interest in the {{sport}} program at {{school}}. 

Since my last communication, I have:
- {{recentAchievement1}}
- {{recentAchievement2}}
- {{recentAchievement3}}

I remain very interested in {{school}} and would appreciate any feedback you might have regarding my potential fit within your program.

I am available for a phone call at your convenience and would be interested in scheduling a campus visit if possible.

Thank you again for your consideration.

Sincerely,
{{playerName}}`
  },
  {
    id: "3",
    name: "Thank You - Campus Visit",
    subject: "Thank you for the campus visit opportunity",
    body: `Dear Coach {{coachName}},

Thank you so much for taking the time to meet with me during my recent visit to {{school}}. The campus tour and our conversation about the {{sport}} program were incredibly informative and only strengthened my interest in becoming part of your team.

I was particularly impressed by:
- {{visitHighlight1}}
- {{visitHighlight2}}
- {{visitHighlight3}}

Please let me know if there is any additional information you need from me as you continue your recruitment process. I am very excited about the possibility of contributing to the program at {{school}}.

Thank you again for your hospitality and consideration.

Best regards,
{{playerName}}`
  }
];

// Filter options for coach search
export const divisions = ["Division I", "Division II", "Division III"];
export const conferences = ["ACC", "Big Ten", "Big 12", "Pac-12", "SEC", "Big East", "WCC", "NESCAC"];
export const positions = ["Head Coach", "Assistant Coach", "Associate Head Coach"];
export const sports = ["Basketball", "Football", "Soccer", "Baseball", "Tennis", "Swimming"];

// Settings options
export const notificationSettings = {
  emailNotifications: true,
  taskReminders: true,
  coachResponses: true,
  weeklyDigest: false,
  marketingEmails: false
};

export const dashboardSettings = {
  defaultView: "dashboard",
  itemsPerPage: 10,
  autoSave: true,
  compactMode: false
};