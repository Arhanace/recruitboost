import {
  User,
  InsertUser,
  users,
  Coach,
  InsertCoach,
  coaches,
  SavedCoach,
  InsertSavedCoach,
  savedCoaches,
  EmailTemplate,
  InsertEmailTemplate,
  emailTemplates,
  Email,
  InsertEmail,
  emails,
  Task,
  InsertTask,
  tasks,
  Activity,
  InsertActivity,
  activities,
} from "@shared/schema";
import { format } from "date-fns";
import { DatabaseStorage } from "./databaseStorage";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(
    user: InsertUser & {
      firebaseUid?: string;
      gmailAccessToken?: string;
      gmailRefreshToken?: string;
      gmailTokenExpiry?: Date;
    },
  ): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  connectGmail(
    userId: number,
    tokens: {
      gmailAccessToken: string;
      gmailRefreshToken: string;
      gmailTokenExpiry: Date;
    },
  ): Promise<User | undefined>;
  disconnectGmail(userId: number): Promise<User | undefined>;
  addAccessToken(
    userId: number,
    gmailAccessToken: string,
  ): Promise<User | undefined>;

  // Coach methods
  getCoach(id: number): Promise<Coach | undefined>;
  getCoaches(filters?: {
    sport?: string;
    status?: string;
    division?: string;
    conference?: string;
    region?: string;
    state?: string;
    favorite?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ coaches: Coach[]; total: number }>;
  createCoach(coach: InsertCoach): Promise<Coach>;
  updateCoach(
    id: number,
    coach: Partial<InsertCoach>,
  ): Promise<Coach | undefined>;
  deleteCoach(id: number): Promise<boolean>;

  // Saved Coach methods
  getSavedCoach(id: number): Promise<SavedCoach | undefined>;
  getSavedCoaches(userId: number): Promise<SavedCoach[]>;
  getSavedCoachByUserAndCoach(
    userId: number,
    coachId: number,
  ): Promise<SavedCoach | undefined>;
  createSavedCoach(savedCoach: InsertSavedCoach): Promise<SavedCoach>;
  updateSavedCoach(
    id: number,
    savedCoach: Partial<InsertSavedCoach>,
  ): Promise<SavedCoach | undefined>;
  deleteSavedCoach(id: number): Promise<boolean>;

  // Email Template methods
  getEmailTemplate(id: number): Promise<EmailTemplate | undefined>;
  getEmailTemplates(userId: number): Promise<EmailTemplate[]>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(
    id: number,
    template: Partial<InsertEmailTemplate>,
  ): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: number): Promise<boolean>;

  // Email methods
  getEmail(id: number): Promise<Email | undefined>;
  getEmails(filters?: { userId?: number; coachId?: number }): Promise<Email[]>;
  createEmail(email: InsertEmail): Promise<Email>;
  updateEmail(
    id: number,
    email: Partial<InsertEmail>,
  ): Promise<Email | undefined>;
  deleteEmail(id: number): Promise<boolean>;
  getThreads(userId: number): Promise<Email[]>;

  // Task methods
  getTask(id: number): Promise<Task | undefined>;
  getTasks(filters?: {
    userId?: number;
    coachId?: number;
    completed?: boolean;
  }): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;

  // Activity methods
  getActivity(id: number): Promise<Activity | undefined>;
  getActivities(filters?: {
    userId?: number;
    coachId?: number;
    limit?: number;
  }): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private coaches: Map<number, Coach>;
  private savedCoaches: Map<number, SavedCoach>;
  private emailTemplates: Map<number, EmailTemplate>;
  private emails: Map<number, Email>;
  private tasks: Map<number, Task>;
  private activities: Map<number, Activity>;

  private userIdCounter: number;
  private coachIdCounter: number;
  private savedCoachIdCounter: number;
  private templateIdCounter: number;
  private emailIdCounter: number;
  private taskIdCounter: number;
  private activityIdCounter: number;

  constructor() {
    this.users = new Map();
    this.coaches = new Map();
    this.savedCoaches = new Map();
    this.emailTemplates = new Map();
    this.emails = new Map();
    this.tasks = new Map();
    this.activities = new Map();

    this.userIdCounter = 1;
    this.coachIdCounter = 1;
    this.savedCoachIdCounter = 1;
    this.templateIdCounter = 1;
    this.emailIdCounter = 1;
    this.taskIdCounter = 1;
    this.activityIdCounter = 1;

    // Initialize with demo data
    this.initializeDemoData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => (user as any).firebaseUid === firebaseUid,
    );
  }

  async createUser(
    insertUser: InsertUser & {
      firebaseUid?: string;
      gmailAccessToken?: string;
      gmailRefreshToken?: string;
      gmailTokenExpiry?: Date;
    },
  ): Promise<User> {
    const id = this.userIdCounter++;
    // Since firebaseUid is not in InsertUser type, we have to cast
    const user: User & {
      firebaseUid?: string;
      gmailAccessToken?: string;
      gmailRefreshToken?: string;
      gmailTokenExpiry?: Date;
    } = { ...insertUser, id };
    this.users.set(id, user as User);
    return user as User;
  }

  async updateUser(
    id: number,
    userData: Partial<InsertUser>,
  ): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async connectGmail(
    userId: number,
    tokens: {
      gmailAccessToken: string;
      gmailRefreshToken: string;
      gmailTokenExpiry: Date;
    },
  ): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const updatedUser = {
      ...user,
      gmailAccessToken: tokens.gmailAccessToken,
      gmailRefreshToken: tokens.gmailRefreshToken,
      gmailTokenExpiry: tokens.gmailTokenExpiry,
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async disconnectGmail(userId: number): Promise<User | undefined>{
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const updatedUser = {
      ...user,
      gmailAccessToken: null,
      gmailRefreshToken: null,
      gmailTokenExpiry: null,
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async addAccessToken(
    userId: number,
    gmailAccessToken: string,
  ): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const updatedUser = {
      ...user,
      gmailAccessToken: gmailAccessToken,
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  // Coach methods
  async getCoach(id: number): Promise<Coach | undefined> {
    return this.coaches.get(id);
  }

  async getCoaches(filters?: {
    sport?: string;
    status?: string;
    division?: string;
    conference?: string;
    region?: string;
    state?: string;
    favorite?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ coaches: Coach[]; total: number }> {
    let result = Array.from(this.coaches.values());

    if (filters?.sport) {
      result = result.filter((coach) => coach.sport === filters.sport);
    }

    if (filters?.status) {
      result = result.filter((coach) => coach.status === filters.status);
    }

    if (filters?.division) {
      result = result.filter((coach) => coach.division === filters.division);
    }

    if (filters?.conference) {
      result = result.filter(
        (coach) => coach.conference === filters.conference,
      );
    }

    if (filters?.region) {
      result = result.filter((coach) => coach.region === filters.region);
    }

    if (filters?.state) {
      result = result.filter((coach) => coach.state === filters.state);
    }

    if (filters?.favorite !== undefined) {
      result = result.filter((coach) => coach.favorite === filters.favorite);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (coach) =>
          coach.firstName.toLowerCase().includes(searchLower) ||
          coach.lastName.toLowerCase().includes(searchLower) ||
          coach.school.toLowerCase().includes(searchLower) ||
          coach.sport.toLowerCase().includes(searchLower) ||
          (coach.division &&
            coach.division.toLowerCase().includes(searchLower)) ||
          (coach.city && coach.city.toLowerCase().includes(searchLower)) ||
          (coach.state && coach.state.toLowerCase().includes(searchLower)),
      );
    }

    // Get total count
    const total = result.length;

    // Apply pagination if requested
    if (filters?.page !== undefined && filters?.limit !== undefined) {
      const page = Math.max(1, filters.page);
      const limit = Math.max(1, filters.limit);
      const offset = (page - 1) * limit;

      result = result.slice(offset, offset + limit);
    }

    return {
      coaches: result,
      total,
    };
  }

  async createCoach(insertCoach: InsertCoach): Promise<Coach> {
    const id = this.coachIdCounter++;
    const coach: Coach = { ...insertCoach, id };
    this.coaches.set(id, coach);
    return coach;
  }

  async updateCoach(
    id: number,
    coachData: Partial<InsertCoach>,
  ): Promise<Coach | undefined> {
    const coach = await this.getCoach(id);
    if (!coach) return undefined;

    const updatedCoach = { ...coach, ...coachData };
    this.coaches.set(id, updatedCoach);
    return updatedCoach;
  }

  async deleteCoach(id: number): Promise<boolean> {
    return this.coaches.delete(id);
  }

  // Saved Coach methods
  async getSavedCoach(id: number): Promise<SavedCoach | undefined> {
    return this.savedCoaches.get(id);
  }

  async getSavedCoaches(userId: number): Promise<SavedCoach[]> {
    return Array.from(this.savedCoaches.values()).filter(
      (savedCoach) => savedCoach.userId === userId,
    );
  }

  async getSavedCoachByUserAndCoach(
    userId: number,
    coachId: number,
  ): Promise<SavedCoach | undefined> {
    return Array.from(this.savedCoaches.values()).find(
      (savedCoach) =>
        savedCoach.userId === userId && savedCoach.coachId === coachId,
    );
  }

  async createSavedCoach(
    insertSavedCoach: InsertSavedCoach,
  ): Promise<SavedCoach> {
    const id = this.savedCoachIdCounter++;
    const savedCoach: SavedCoach = { ...insertSavedCoach, id };
    this.savedCoaches.set(id, savedCoach);
    return savedCoach;
  }

  async updateSavedCoach(
    id: number,
    savedCoachData: Partial<InsertSavedCoach>,
  ): Promise<SavedCoach | undefined> {
    const savedCoach = await this.getSavedCoach(id);
    if (!savedCoach) return undefined;

    const updatedSavedCoach = { ...savedCoach, ...savedCoachData };
    this.savedCoaches.set(id, updatedSavedCoach);
    return updatedSavedCoach;
  }

  async deleteSavedCoach(id: number): Promise<boolean> {
    return this.savedCoaches.delete(id);
  }

  // Email Template methods
  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    return this.emailTemplates.get(id);
  }

  async getEmailTemplates(userId: number): Promise<EmailTemplate[]> {
    return Array.from(this.emailTemplates.values()).filter(
      (template) => template.userId === userId,
    );
  }

  async createEmailTemplate(
    insertTemplate: InsertEmailTemplate,
  ): Promise<EmailTemplate> {
    const id = this.templateIdCounter++;
    const template: EmailTemplate = { ...insertTemplate, id };
    this.emailTemplates.set(id, template);
    return template;
  }

  async updateEmailTemplate(
    id: number,
    templateData: Partial<InsertEmailTemplate>,
  ): Promise<EmailTemplate | undefined> {
    const template = await this.getEmailTemplate(id);
    if (!template) return undefined;

    const updatedTemplate = { ...template, ...templateData };
    this.emailTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteEmailTemplate(id: number): Promise<boolean> {
    return this.emailTemplates.delete(id);
  }

  // Email methods
  async getEmail(id: number): Promise<Email | undefined> {
    return this.emails.get(id);
  }

  async getEmails(filters?: {
    userId?: number;
    coachId?: number;
  }): Promise<Email[]> {
    let result = Array.from(this.emails.values());

    if (filters?.userId) {
      result = result.filter((email) => email.userId === filters.userId);
    }

    if (filters?.coachId) {
      result = result.filter((email) => email.coachId === filters.coachId);
    }

    return result.sort(
      (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime(),
    );
  }

  async createEmail(insertEmail: InsertEmail): Promise<Email> {
    const id = this.emailIdCounter++;
    const email: Email = { ...insertEmail, id };
    this.emails.set(id, email);
    return email;
  }

  async updateEmail(
    id: number,
    emailData: Partial<InsertEmail>,
  ): Promise<Email | undefined> {
    const email = await this.getEmail(id);
    if (!email) return undefined;

    const updatedEmail = { ...email, ...emailData };
    this.emails.set(id, updatedEmail);
    return updatedEmail;
  }

  async deleteEmail(id: number): Promise<boolean> {
    return this.emails.delete(id);
  }

  async getThreads(userId: number): Promise<Email[]> {
    const allEmails = Array.from(this.emails.values()).filter(
      (email) => email.userId === userId,
    );

    return allEmails;
  }

  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasks(filters?: {
    userId?: number;
    coachId?: number;
    completed?: boolean;
  }): Promise<Task[]> {
    let result = Array.from(this.tasks.values());

    if (filters?.userId !== undefined) {
      result = result.filter((task) => task.userId === filters.userId);
    }

    if (filters?.coachId !== undefined) {
      result = result.filter((task) => task.coachId === filters.coachId);
    }

    if (filters?.completed !== undefined) {
      result = result.filter((task) => task.completed === filters.completed);
    }

    return result.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const task: Task = { ...insertTask, id };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(
    id: number,
    taskData: Partial<InsertTask>,
  ): Promise<Task | undefined> {
    const task = await this.getTask(id);
    if (!task) return undefined;

    const updatedTask = { ...task, ...taskData };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Activity methods
  async getActivity(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async getActivities(filters?: {
    userId?: number;
    coachId?: number;
    limit?: number;
  }): Promise<Activity[]> {
    let result = Array.from(this.activities.values());

    if (filters?.userId !== undefined) {
      result = result.filter((activity) => activity.userId === filters.userId);
    }

    if (filters?.coachId !== undefined) {
      result = result.filter(
        (activity) => activity.coachId === filters.coachId,
      );
    }

    // Sort by timestamp (most recent first)
    result = result.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    if (filters?.limit) {
      result = result.slice(0, filters.limit);
    }

    return result;
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityIdCounter++;
    const activity: Activity = { ...insertActivity, id };
    this.activities.set(id, activity);
    return activity;
  }

  // Initialize demo data
  private initializeDemoData() {
    // Create demo user
    const demoUser: InsertUser = {
      username: "alexjohnson",
      password: "password123", // In a real app, this would be hashed
      firstName: "Alex",
      lastName: "Johnson",
      email: "alex.johnson@example.com",
      sport: "Basketball",
      graduationYear: 2024,
      highlights: "https://youtu.be/example",
      stats: {
        "Points per game": "18.5",
        Rebounds: "7.2",
        Assists: "4.3",
      },
      bio: "Senior point guard with strong leadership skills and court vision.",
      avatar: null,
      gpa: "3.8",
      testScores: "ACT: 28, SAT: 1350",
      academicHonors: "Honor Roll, National Honor Society",
      intendedMajor: "Business Administration",
    };
    this.createUser(demoUser).then((user) => {
      // Create 100 demo coaches for rich filtering and search functionality
      const coachData = [
        // Division I Basketball
        {
          firstName: "Mike",
          lastName: "Johnson",
          email: "mjohnson@ucal.edu",
          school: "University of California",
          sport: "Basketball",
          division: "Division I",
          position: "Head Coach",
          city: "Berkeley",
          state: "CA",
          notes: "",
          status: "Contacted",
        },
        {
          firstName: "Sarah",
          lastName: "Williams",
          email: "swilliams@stanford.edu",
          school: "Stanford University",
          sport: "Basketball",
          division: "Division I",
          position: "Assistant Coach",
          city: "Stanford",
          state: "CA",
          notes: "Showed interest in highlight reel",
          status: "Interested",
        },
        {
          firstName: "Jason",
          lastName: "Miller",
          email: "jmiller@duke.edu",
          school: "Duke University",
          sport: "Basketball",
          division: "Division I",
          position: "Head Coach",
          city: "Durham",
          state: "NC",
          notes: "Needs updated stats",
          status: "Need Info",
        },
        {
          firstName: "David",
          lastName: "Reynolds",
          email: "dreynolds@ucla.edu",
          school: "UCLA",
          sport: "Basketball",
          division: "Division I",
          position: "Assistant Coach",
          city: "Los Angeles",
          state: "CA",
          notes: "",
          status: "Contacted",
        },
        {
          firstName: "Robert",
          lastName: "Davis",
          email: "rdavis@berkeley.edu",
          school: "UC Berkeley",
          sport: "Basketball",
          division: "Division I",
          position: "Head Coach",
          city: "Berkeley",
          state: "CA",
          notes: "",
          status: "Not Available",
        },
        {
          firstName: "Lisa",
          lastName: "Brown",
          email: "lbrown@umich.edu",
          school: "University of Michigan",
          sport: "Basketball",
          division: "Division I",
          position: "Head Coach",
          city: "Ann Arbor",
          state: "MI",
          notes: "",
          status: "Contacted",
        },
        {
          firstName: "Jennifer",
          lastName: "Adams",
          email: "jadams@washington.edu",
          school: "University of Washington",
          sport: "Basketball",
          division: "Division I",
          position: "Assistant Coach",
          city: "Seattle",
          state: "WA",
          notes: "",
          status: "Not Contacted",
        },
        {
          firstName: "Kevin",
          lastName: "Thompson",
          email: "kthompson@uky.edu",
          school: "University of Kentucky",
          sport: "Basketball",
          division: "Division I",
          position: "Head Coach",
          city: "Lexington",
          state: "KY",
          notes: "Scheduled call for next week",
          status: "Interested",
        },
        {
          firstName: "Patricia",
          lastName: "Garcia",
          email: "pgarcia@unc.edu",
          school: "University of North Carolina",
          sport: "Basketball",
          division: "Division I",
          position: "Head Coach",
          city: "Chapel Hill",
          state: "NC",
          notes: "",
          status: "Not Contacted",
        },
        {
          firstName: "Thomas",
          lastName: "Wilson",
          email: "twilson@uconn.edu",
          school: "University of Connecticut",
          sport: "Basketball",
          division: "Division I",
          position: "Assistant Coach",
          city: "Storrs",
          state: "CT",
          notes: "",
          status: "Not Contacted",
        },
        // Division II Basketball
        {
          firstName: "Brian",
          lastName: "Martinez",
          email: "bmartinez@rollins.edu",
          school: "Rollins College",
          sport: "Basketball",
          division: "Division II",
          position: "Head Coach",
          city: "Winter Park",
          state: "FL",
          notes: "",
          status: "Not Contacted",
        },
        {
          firstName: "Karen",
          lastName: "Lee",
          email: "klee@wpc.edu",
          school: "Western Pacific College",
          sport: "Basketball",
          division: "Division II",
          position: "Head Coach",
          city: "Sacramento",
          state: "CA",
          notes: "",
          status: "Contacted",
        },
        {
          firstName: "Daniel",
          lastName: "Wright",
          email: "dwright@adelphi.edu",
          school: "Adelphi University",
          sport: "Basketball",
          division: "Division II",
          position: "Assistant Coach",
          city: "Garden City",
          state: "NY",
          notes: "",
          status: "Not Contacted",
        },
        // Division III Basketball
        {
          firstName: "Michelle",
          lastName: "Taylor",
          email: "mtaylor@amherst.edu",
          school: "Amherst College",
          sport: "Basketball",
          division: "Division III",
          position: "Head Coach",
          city: "Amherst",
          state: "MA",
          notes: "",
          status: "Not Contacted",
        },
        {
          firstName: "Christopher",
          lastName: "Anderson",
          email: "canderson@middlebury.edu",
          school: "Middlebury College",
          sport: "Basketball",
          division: "Division III",
          position: "Head Coach",
          city: "Middlebury",
          state: "VT",
          notes: "",
          status: "Not Contacted",
        },
        // Football Coaches
        {
          firstName: "Richard",
          lastName: "Martin",
          email: "rmartin@ohiostate.edu",
          school: "Ohio State University",
          sport: "Football",
          division: "Division I",
          position: "Head Coach",
          city: "Columbus",
          state: "OH",
          notes: "",
          status: "Not Contacted",
        },
        {
          firstName: "Elizabeth",
          lastName: "Clark",
          email: "eclark@usc.edu",
          school: "University of Southern California",
          sport: "Football",
          division: "Division I",
          position: "Assistant Coach",
          city: "Los Angeles",
          state: "CA",
          notes: "",
          status: "Not Contacted",
        },
        {
          firstName: "William",
          lastName: "Rodriguez",
          email: "wrodriguez@alabama.edu",
          school: "University of Alabama",
          sport: "Football",
          division: "Division I",
          position: "Head Coach",
          city: "Tuscaloosa",
          state: "AL",
          notes: "",
          status: "Not Contacted",
        },
        // Soccer Coaches
        {
          firstName: "Susan",
          lastName: "Lewis",
          email: "slewis@unc.edu",
          school: "University of North Carolina",
          sport: "Soccer",
          division: "Division I",
          position: "Head Coach",
          city: "Chapel Hill",
          state: "NC",
          notes: "",
          status: "Not Contacted",
        },
        {
          firstName: "James",
          lastName: "Walker",
          email: "jwalker@ucla.edu",
          school: "UCLA",
          sport: "Soccer",
          division: "Division I",
          position: "Head Coach",
          city: "Los Angeles",
          state: "CA",
          notes: "",
          status: "Not Contacted",
        },
        // Volleyball Coaches
        {
          firstName: "Linda",
          lastName: "Hall",
          email: "lhall@stanford.edu",
          school: "Stanford University",
          sport: "Volleyball",
          division: "Division I",
          position: "Head Coach",
          city: "Stanford",
          state: "CA",
          notes: "",
          status: "Not Contacted",
        },
        {
          firstName: "Michael",
          lastName: "Young",
          email: "myoung@pennstate.edu",
          school: "Penn State University",
          sport: "Volleyball",
          division: "Division I",
          position: "Head Coach",
          city: "State College",
          state: "PA",
          notes: "",
          status: "Not Contacted",
        },
        // Track Coaches
        {
          firstName: "Barbara",
          lastName: "King",
          email: "bking@oregon.edu",
          school: "University of Oregon",
          sport: "Track",
          division: "Division I",
          position: "Head Coach",
          city: "Eugene",
          state: "OR",
          notes: "",
          status: "Not Contacted",
        },
        {
          firstName: "Joseph",
          lastName: "Scott",
          email: "jscott@lsu.edu",
          school: "Louisiana State University",
          sport: "Track",
          division: "Division I",
          position: "Head Coach",
          city: "Baton Rouge",
          state: "LA",
          notes: "",
          status: "Not Contacted",
        },
        // Tennis Coaches
        {
          firstName: "Donna",
          lastName: "Green",
          email: "dgreen@florida.edu",
          school: "University of Florida",
          sport: "Tennis",
          division: "Division I",
          position: "Head Coach",
          city: "Gainesville",
          state: "FL",
          notes: "",
          status: "Not Contacted",
        },
        {
          firstName: "Edward",
          lastName: "Baker",
          email: "ebaker@usc.edu",
          school: "University of Southern California",
          sport: "Tennis",
          division: "Division I",
          position: "Head Coach",
          city: "Los Angeles",
          state: "CA",
          notes: "",
          status: "Not Contacted",
        },
        // Golf Coaches
        {
          firstName: "Margaret",
          lastName: "Adams",
          email: "madams@duke.edu",
          school: "Duke University",
          sport: "Golf",
          division: "Division I",
          position: "Head Coach",
          city: "Durham",
          state: "NC",
          notes: "",
          status: "Not Contacted",
        },
        {
          firstName: "George",
          lastName: "Hill",
          email: "ghill@arizona.edu",
          school: "University of Arizona",
          sport: "Golf",
          division: "Division I",
          position: "Head Coach",
          city: "Tucson",
          state: "AZ",
          notes: "",
          status: "Not Contacted",
        },
        // Swimming Coaches
        {
          firstName: "Sandra",
          lastName: "Morris",
          email: "smorris@texas.edu",
          school: "University of Texas",
          sport: "Swimming",
          division: "Division I",
          position: "Head Coach",
          city: "Austin",
          state: "TX",
          notes: "",
          status: "Not Contacted",
        },
        {
          firstName: "Kenneth",
          lastName: "Rogers",
          email: "krogers@cal.edu",
          school: "University of California, Berkeley",
          sport: "Swimming",
          division: "Division I",
          position: "Head Coach",
          city: "Berkeley",
          state: "CA",
          notes: "",
          status: "Not Contacted",
        },
      ];

      // Generate additional coaches to reach 200 total
      const sports = [
        "Basketball",
        "Football",
        "Soccer",
        "Volleyball",
        "Tennis",
        "Baseball",
        "Softball",
        "Swimming",
        "Track",
        "Golf",
        "Lacrosse",
        "Hockey",
        "Rowing",
        "Wrestling",
        "Gymnastics",
        "Fencing",
        "Skiing",
        "Water Polo",
        "Cross Country",
        "Field Hockey",
      ];
      const divisions = [
        "Division I",
        "Division II",
        "Division III",
        "NAIA",
        "JUCO",
        "NJCAA",
        "USCAA",
      ];
      const positions = [
        "Head Coach",
        "Assistant Coach",
        "Recruiting Coordinator",
        "Position Coach",
        "Director of Operations",
        "Strength Coach",
        "Associate Head Coach",
        "Volunteer Assistant",
      ];
      const statuses = [
        "Not Contacted",
        "Contacted",
        "Interested",
        "Need Info",
        "Not Available",
        "Meeting Scheduled",
        "Follow-up",
        "Pending",
        "Scholarship Offered",
        "Visit Scheduled",
      ];
      const states = [
        "AL",
        "AK",
        "AZ",
        "AR",
        "CA",
        "CO",
        "CT",
        "DE",
        "FL",
        "GA",
        "HI",
        "ID",
        "IL",
        "IN",
        "IA",
        "KS",
        "KY",
        "LA",
        "ME",
        "MD",
        "MA",
        "MI",
        "MN",
        "MS",
        "MO",
        "MT",
        "NE",
        "NV",
        "NH",
        "NJ",
        "NM",
        "NY",
        "NC",
        "ND",
        "OH",
        "OK",
        "OR",
        "PA",
        "RI",
        "SC",
        "SD",
        "TN",
        "TX",
        "UT",
        "VT",
        "VA",
        "WA",
        "WV",
        "WI",
        "WY",
      ];

      const firstNames = [
        "James",
        "John",
        "Robert",
        "Michael",
        "William",
        "David",
        "Richard",
        "Joseph",
        "Thomas",
        "Charles",
        "Mary",
        "Patricia",
        "Jennifer",
        "Linda",
        "Elizabeth",
        "Barbara",
        "Susan",
        "Jessica",
        "Sarah",
        "Karen",
        "Daniel",
        "Matthew",
        "Anthony",
        "Mark",
        "Donald",
        "Steven",
        "Paul",
        "Andrew",
        "Joshua",
        "Kenneth",
        "Nancy",
        "Lisa",
        "Betty",
        "Margaret",
        "Sandra",
        "Ashley",
        "Dorothy",
        "Kimberly",
        "Emily",
        "Donna",
        "George",
        "Ronald",
        "Edward",
        "Brian",
        "Kevin",
        "Jason",
        "Jeffrey",
        "Ryan",
        "Jacob",
        "Gary",
        "Amanda",
        "Melissa",
        "Deborah",
        "Stephanie",
        "Rebecca",
        "Laura",
        "Sharon",
        "Cynthia",
        "Kathleen",
        "Helen",
        "Timothy",
        "Jose",
        "Larry",
        "Justin",
        "Scott",
        "Brandon",
        "Benjamin",
        "Samuel",
        "Frank",
        "Gregory",
        "Ruth",
        "Michelle",
        "Carol",
        "Amanda",
        "Kathleen",
        "Virginia",
        "Judith",
        "Judy",
        "Christina",
        "Marie",
      ];

      const lastNames = [
        "Smith",
        "Johnson",
        "Williams",
        "Brown",
        "Jones",
        "Miller",
        "Davis",
        "Garcia",
        "Rodriguez",
        "Wilson",
        "Martinez",
        "Anderson",
        "Taylor",
        "Thomas",
        "Hernandez",
        "Moore",
        "Martin",
        "Jackson",
        "Thompson",
        "White",
        "Lopez",
        "Lee",
        "Gonzalez",
        "Harris",
        "Clark",
        "Lewis",
        "Robinson",
        "Walker",
        "Perez",
        "Hall",
        "Young",
        "Allen",
        "Sanchez",
        "Wright",
        "King",
        "Scott",
        "Green",
        "Baker",
        "Adams",
        "Nelson",
        "Hill",
        "Ramirez",
        "Campbell",
        "Mitchell",
        "Roberts",
        "Carter",
        "Phillips",
        "Evans",
        "Turner",
        "Torres",
        "Parker",
        "Collins",
        "Edwards",
        "Stewart",
        "Flores",
        "Morris",
        "Nguyen",
        "Murphy",
        "Rivera",
        "Cook",
        "Rogers",
        "Morgan",
        "Peterson",
        "Cooper",
        "Reed",
        "Bailey",
        "Bell",
        "Gomez",
        "Kelly",
        "Howard",
        "Ward",
        "Cox",
        "Diaz",
        "Richardson",
        "Wood",
        "Watson",
        "Brooks",
        "Bennett",
        "Gray",
        "James",
      ];

      const schools = [
        "University of Alabama",
        "Arizona State University",
        "University of Arkansas",
        "Auburn University",
        "Baylor University",
        "Boston College",
        "Clemson University",
        "University of Colorado",
        "Duke University",
        "University of Florida",
        "Georgia Tech",
        "University of Georgia",
        "Harvard University",
        "University of Illinois",
        "Indiana University",
        "University of Iowa",
        "Johns Hopkins University",
        "Kansas State University",
        "University of Kentucky",
        "Louisiana State University",
        "University of Michigan",
        "Michigan State University",
        "University of Minnesota",
        "Mississippi State University",
        "University of Missouri",
        "University of Nebraska",
        "University of Nevada",
        "Northwestern University",
        "University of Notre Dame",
        "Ohio State University",
        "University of Oklahoma",
        "Oregon State University",
        "Pennsylvania State University",
        "Princeton University",
        "Purdue University",
        "Rice University",
        "Rutgers University",
        "Stanford University",
        "Syracuse University",
        "Temple University",
        "University of Tennessee",
        "University of Texas",
        "Texas A&M University",
        "Tulane University",
        "University of Utah",
        "Vanderbilt University",
        "University of Virginia",
        "Virginia Tech",
        "University of Washington",
        "West Virginia University",
        "University of Wisconsin",
        "Yale University",
        "Amherst College",
        "Bowdoin College",
        "Carleton College",
        "Colby College",
        "Davidson College",
        "Grinnell College",
        "Haverford College",
        "Middlebury College",
      ];

      const cities = [
        "Tuscaloosa",
        "Tempe",
        "Fayetteville",
        "Auburn",
        "Waco",
        "Chestnut Hill",
        "Clemson",
        "Boulder",
        "Durham",
        "Gainesville",
        "Atlanta",
        "Athens",
        "Cambridge",
        "Champaign",
        "Bloomington",
        "Iowa City",
        "Baltimore",
        "Manhattan",
        "Lexington",
        "Baton Rouge",
        "Ann Arbor",
        "East Lansing",
        "Minneapolis",
        "Starkville",
        "Columbia",
        "Lincoln",
        "Reno",
        "Evanston",
        "Notre Dame",
        "Columbus",
        "Norman",
        "Corvallis",
        "University Park",
        "Princeton",
        "West Lafayette",
        "Houston",
        "New Brunswick",
        "Stanford",
        "Syracuse",
        "Philadelphia",
        "Knoxville",
        "Austin",
        "College Station",
        "New Orleans",
        "Salt Lake City",
        "Nashville",
        "Charlottesville",
        "Blacksburg",
        "Seattle",
        "Morgantown",
        "Madison",
        "New Haven",
        "Amherst",
        "Brunswick",
        "Northfield",
        "Waterville",
        "Davidson",
        "Grinnell",
        "Haverford",
        "Middlebury",
      ];

      // Update existing coaches with favorite property
      const updatedCoachData = coachData.map((coach, index) => ({
        ...coach,
        favorite: index % 5 === 0, // Every 5th coach is a favorite
      }));

      // Generate additional coaches to reach 200 total
      const remainingCount = 200 - updatedCoachData.length;
      for (let i = 0; i < remainingCount; i++) {
        const randomSport = sports[Math.floor(Math.random() * sports.length)];
        const randomDivision =
          divisions[Math.floor(Math.random() * divisions.length)];
        const randomPosition =
          positions[Math.floor(Math.random() * positions.length)];
        const randomStatus =
          statuses[Math.floor(Math.random() * statuses.length)];
        const randomFirstName =
          firstNames[Math.floor(Math.random() * firstNames.length)];
        const randomLastName =
          lastNames[Math.floor(Math.random() * lastNames.length)];

        const schoolIndex = Math.floor(Math.random() * schools.length);
        const randomSchool = schools[schoolIndex];
        const randomCity =
          cities[schoolIndex < cities.length ? schoolIndex : 0];
        const randomState = states[Math.floor(Math.random() * states.length)];

        const email = `${randomFirstName.charAt(0).toLowerCase()}${randomLastName.toLowerCase()}@${randomSchool.toLowerCase().replace(/\s+/g, "").replace("universityof", "")}.edu`;

        updatedCoachData.push({
          firstName: randomFirstName,
          lastName: randomLastName,
          email: email,
          phone:
            Math.random() > 0.7
              ? `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
              : null,
          school: randomSchool,
          sport: randomSport,
          division: randomDivision,
          position: randomPosition,
          city: randomCity,
          state: randomState,
          notes: Math.random() > 0.7 ? "Follow up soon" : "",
          status: randomStatus,
          favorite: Math.random() > 0.85, // Randomly mark about 15% as favorites
        });
      }

      const coachPromises = updatedCoachData.map((coach) =>
        this.createCoach(coach as InsertCoach),
      );

      Promise.all(coachPromises).then((coaches) => {
        // Create email templates
        const templateData: InsertEmailTemplate[] = [
          {
            userId: user.id,
            name: "Initial Contact",
            subject: "High School Basketball Prospect - Alex Johnson",
            body: "Dear Coach {{lastName}},\n\nMy name is Alex Johnson, a senior point guard at Lincoln High School. I'm writing to express my interest in your basketball program at {{school}}.\n\nI've been following your team for several years and admire your coaching style and program philosophy. I believe my skills and work ethic would be a great fit for your team.\n\nHere are some of my stats:\n- 18.5 points per game\n- 7.2 rebounds\n- 4.3 assists\n\nYou can view my highlight reel here: [LINK]\n\nI would appreciate the opportunity to discuss how I could contribute to your program. I'll be visiting campus next month and would love to meet with you if possible.\n\nThank you for your time and consideration.\n\nSincerely,\nAlex Johnson\nLincoln High School '24",
            isDefault: true,
          },
          {
            userId: user.id,
            name: "Follow-up",
            subject: "Following up - Alex Johnson, Basketball Prospect",
            body: "Dear Coach {{lastName}},\n\nI hope this email finds you well. I wanted to follow up on my previous email regarding my interest in your basketball program at {{school}}.\n\nSince my last email, I've played in the regional tournament where my team finished in the top 4. I averaged 22 points and 6 assists over the tournament.\n\nI'm still very interested in learning more about your program and how I might fit into your team. Would it be possible to schedule a call or visit?\n\nThank you for your consideration.\n\nBest regards,\nAlex Johnson\nLincoln High School '24",
            isDefault: false,
          },
        ];

        Promise.all(
          templateData.map((template) => this.createEmailTemplate(template)),
        );

        // Create emails
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const twoDaysAgo = new Date(now);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const emailData: InsertEmail[] = [
          {
            userId: user.id,
            coachId: coaches[0].id, // Mike Johnson
            subject: "High School Basketball Prospect - Alex Johnson",
            body: "Dear Coach Johnson,\n\nMy name is Alex Johnson, a senior point guard at Lincoln High School...",
            sentAt: now.toISOString(),
            status: "sent",
            templateId: 1,
            isFollowUp: false,
          },
          {
            userId: user.id,
            coachId: coaches[1].id, // Sarah Williams
            subject: "High School Basketball Prospect - Alex Johnson",
            body: "Dear Coach Williams,\n\nMy name is Alex Johnson, a senior point guard at Lincoln High School...",
            sentAt: yesterday.toISOString(),
            status: "replied",
            templateId: 1,
            isFollowUp: false,
          },
          {
            userId: user.id,
            coachId: coaches[3].id, // David Reynolds
            subject: "Following up - Alex Johnson, Basketball Prospect",
            body: "Dear Coach Reynolds,\n\nI hope this email finds you well. I wanted to follow up on my previous email...",
            sentAt: twoDaysAgo.toISOString(),
            status: "sent",
            templateId: 2,
            isFollowUp: true,
          },
        ];

        Promise.all(emailData.map((email) => this.createEmail(email)));

        // Create tasks
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        const taskData: InsertTask[] = [
          {
            userId: user.id,
            coachId: coaches[2].id, // Jason Miller
            title: "Follow up with Coach Jason Miller",
            dueDate: today.toISOString(),
            completed: false,
            type: "follow-up",
          },
          {
            userId: user.id,
            coachId: coaches[5].id, // Lisa Brown
            title: "Send highlight reel to Coach Lisa Brown",
            dueDate: today.toISOString(),
            completed: false,
            type: "send-video",
          },
          {
            userId: user.id,
            coachId: coaches[4].id, // Robert Davis
            title: "Second follow-up with Coach Robert Davis",
            dueDate: tomorrow.toISOString(),
            completed: false,
            type: "follow-up",
          },
          {
            userId: user.id,
            coachId: coaches[6].id, // Jennifer Adams
            title: "Schedule call with Coach Jennifer Adams",
            dueDate: threeDaysFromNow.toISOString(),
            completed: false,
            type: "schedule-call",
          },
        ];

        Promise.all(taskData.map((task) => this.createTask(task)));

        // Create activities
        const activityTimes = [
          new Date(),
          new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
          new Date(yesterday.getTime()),
          new Date(yesterday.getTime() - 2 * 60 * 60 * 1000), // yesterday - 2 hours
          new Date(twoDaysAgo.getTime()),
        ];

        const activityData: InsertActivity[] = [
          {
            userId: user.id,
            coachId: coaches[0].id, // Mike Johnson
            type: "email_sent",
            description: "Email sent to Coach Mike Johnson",
            timestamp: activityTimes[0].toISOString(),
            metaData: {
              subject: "High School Basketball Prospect - Alex Johnson",
              preview:
                "My name is Alex Johnson, a senior point guard at Lincoln High School...",
            },
          },
          {
            userId: user.id,
            coachId: coaches[1].id, // Sarah Williams
            type: "email_received",
            description: "Response from Coach Sarah Williams",
            timestamp: activityTimes[1].toISOString(),
            metaData: {
              subject: "Re: High School Basketball Prospect - Alex Johnson",
              preview:
                "Thanks for reaching out. I'd be interested in seeing your full game footage...",
            },
          },
          {
            userId: user.id,
            coachId: null,
            type: "database_update",
            description: "Added 15 new coaches to database",
            timestamp: activityTimes[2].toISOString(),
            metaData: {
              count: 15,
              sport: "Basketball",
              division: "Division II",
            },
          },
          {
            userId: user.id,
            coachId: coaches[3].id, // David Reynolds
            type: "email_sent",
            description: "Follow-up email sent to Coach David Reynolds",
            timestamp: activityTimes[4].toISOString(),
            metaData: {
              subject: "Following up - Alex Johnson, Basketball Prospect",
              preview:
                "I hope this email finds you well. I wanted to follow up on my previous email...",
            },
          },
        ];

        Promise.all(
          activityData.map((activity) => this.createActivity(activity)),
        );
      });
    });
  }
}

// Try to use Database storage, but fallback to MemStorage if it fails
let storage: IStorage;

try {
  storage = new DatabaseStorage();
  console.log("Using DatabaseStorage for data persistence");
} catch (error) {
  console.error(
    "Error initializing DatabaseStorage, falling back to MemStorage:",
    error,
  );
  storage = new MemStorage();
}

export { storage };
