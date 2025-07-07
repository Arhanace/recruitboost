import { eq, and, desc, sql, isNull, or, not } from "drizzle-orm";
import { db } from "./db";
import { IStorage } from "./storage";
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

// Helper function to initialize the database with demo data
export async function initializeDatabaseWithDemoData() {
  try {
    // Check if we have any users
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log("Database already has data, skipping initialization");
      return;
    }

    // Create demo user
    const demoUser = {
      firebaseUid: "demo_firebase_uid_123",
      email: "alex.johnson@example.com",
      username: "alexjohnson",
      firstName: "Alex",
      lastName: "Johnson",
      sport: "Basketball",
      graduationYear: 2024,
      position: "Point Guard",
      height: "6'2\"",
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
      location: "Los Angeles, CA",
      schoolSize: "Medium",
    };

    const [user] = await db.insert(users).values(demoUser).returning();

    // Create demo coaches
    const coachData = [
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
    ];

    const insertedCoaches = await Promise.all(
      coachData.map((coach) => db.insert(coaches).values(coach).returning()),
    );

    const createdCoaches = insertedCoaches.map((coach) => coach[0]);

    // Create email templates
    const templateData = [
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

    await Promise.all(
      templateData.map((template) =>
        db.insert(emailTemplates).values(template),
      ),
    );

    // Create some emails
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(now);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const emailData = [
      {
        userId: user.id,
        coachId: createdCoaches[0].id,
        subject: "High School Basketball Prospect - Alex Johnson",
        body: "Dear Coach Johnson,\n\nMy name is Alex Johnson, a senior point guard at Lincoln High School...",
        sentAt: now,
        status: "sent",
        templateId: 1,
        isFollowUp: false,
      },
      {
        userId: user.id,
        coachId: createdCoaches[1].id,
        subject: "High School Basketball Prospect - Alex Johnson",
        body: "Dear Coach Williams,\n\nMy name is Alex Johnson, a senior point guard at Lincoln High School...",
        sentAt: yesterday,
        status: "replied",
        templateId: 1,
        isFollowUp: false,
      },
    ];

    await Promise.all(
      emailData.map((email) => db.insert(emails).values(email)),
    );

    // Create some tasks
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date(now);
    nextMonth.setDate(nextMonth.getDate() + 30);

    const taskData = [
      {
        userId: user.id,
        coachId: createdCoaches[0].id,
        title: "Follow up with Coach Johnson",
        dueDate: nextWeek,
        completed: false,
        type: "Follow-up",
      },
      {
        userId: user.id,
        coachId: createdCoaches[1].id,
        title: "Send updated stats to Coach Williams",
        dueDate: nextMonth,
        completed: false,
        type: "Update",
      },
    ];

    await Promise.all(taskData.map((task) => db.insert(tasks).values(task)));

    // Create some activities
    const activityData = [
      {
        userId: user.id,
        coachId: createdCoaches[0].id,
        type: "email_sent",
        description: "Sent introduction email to Coach Johnson",
        timestamp: now,
        metaData: { emailId: 1 },
      },
      {
        userId: user.id,
        coachId: createdCoaches[1].id,
        type: "email_sent",
        description: "Sent introduction email to Coach Williams",
        timestamp: yesterday,
        metaData: { emailId: 2 },
      },
      {
        userId: user.id,
        coachId: createdCoaches[1].id,
        type: "email_received",
        description: "Received reply from Coach Williams",
        timestamp: yesterday,
        metaData: { emailId: 2 },
      },
    ];

    await Promise.all(
      activityData.map((activity) => db.insert(activities).values(activity)),
    );

    console.log("Database initialized with demo data");
  } catch (error) {
    console.error("Error initializing database with demo data:", error);
  }
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, firebaseUid));
    return user || undefined;
  }

  async createUser(
    insertUser: InsertUser & {
      firebaseUid?: string;
      gmailAccessToken?: string;
      gmailRefreshToken?: string;
      gmailTokenExpiry?: Date;
    },
  ): Promise<User> {
    // Log the user creation attempt with full details
    console.log(
      "CREATING NEW USER - FULL DETAILS:",
      JSON.stringify(
        {
          firebaseUid: insertUser.firebaseUid,
          email: insertUser.email,
          firstName: insertUser.firstName,
          lastName: insertUser.lastName,
          username: insertUser.username,
        },
        null,
        2,
      ),
    );

    // Verify required fields
    if (!insertUser.firebaseUid) {
      console.error(
        "CRITICAL ERROR: Attempted to create user without firebaseUid!",
      );
      throw new Error("firebaseUid is required to create a user");
    }

    if (!insertUser.email) {
      console.error("CRITICAL ERROR: Attempted to create user without email!");
      throw new Error("email is required to create a user");
    }

    try {
      // First, check if a user with this Firebase UID already exists
      const existingUser = await this.getUserByFirebaseUid(
        insertUser.firebaseUid,
      );
      if (existingUser) {
        console.log(
          "USER ALREADY EXISTS with firebaseUid:",
          insertUser.firebaseUid,
        );
        return existingUser;
      }

      // Insert the user into the database
      console.log("Inserting user into database with values:", insertUser);
      const [user] = await db.insert(users).values(insertUser).returning();

      if (!user || !user.id) {
        throw new Error(
          "User creation failed - no user returned from database",
        );
      }

      console.log("✅ USER CREATED SUCCESSFULLY:", {
        id: user.id,
        email: user.email,
        firebaseUid: user.firebaseUid,
      });

      return user;
    } catch (error) {
      console.error("💥 ERROR CREATING USER:", error);

      // Try to provide more specific error information
      const errorMessage = String(error);
      if (errorMessage.includes("duplicate key")) {
        if (errorMessage.includes("firebase_uid")) {
          console.error(
            "User with this Firebase UID already exists - retrying lookup",
          );
          const existingUser = await this.getUserByFirebaseUid(
            insertUser.firebaseUid,
          );
          if (existingUser) {
            return existingUser;
          }
        } else if (errorMessage.includes("email")) {
          console.error("User with this email already exists");
        } else if (errorMessage.includes("username")) {
          console.error("User with this username already exists");
        }
      }

      throw new Error(`Failed to create user: ${error}`);
    }
  }

  async updateUser(
    id: number,
    userData: Partial<InsertUser>,
  ): Promise<User | undefined> {
    try {
      // Remove createdAt if it's in the userData to avoid type conversion errors
      const { createdAt, ...cleanedUserData } = userData as any;

      const [user] = await db
        .update(users)
        .set(cleanedUserData)
        .where(eq(users.id, id))
        .returning();
      return user || undefined;
    } catch (error) {
      console.error("Error updating user:", error);
      throw new Error("Error updating user");
    }
  }

  async connectGmail(
    userId: number,
    tokens: {
      gmailAccessToken: string;
      gmailRefreshToken: string;
      gmailTokenExpiry: Date;
    },
  ): Promise<User | undefined> {
    try {
      const [user] = await db
        .update(users)
        .set({
          gmailAccessToken: tokens.gmailAccessToken,
          gmailRefreshToken: tokens.gmailRefreshToken,
          gmailTokenExpiry: tokens.gmailTokenExpiry,
        })
        .where(eq(users.id, userId))
        .returning();
      return user || undefined;
    } catch (error) {
      console.error("Error connecting Gmail:", error);
      throw new Error("Error connecting Gmail");
    }
  }

  async disconnectGmail(userId: number): Promise<User | undefined>{
    try {
      const [user] = await db
        .update(users)
        .set({
          gmailAccessToken: null,
          gmailRefreshToken: null,
          gmailTokenExpiry: null,
        })
        .where(eq(users.id, userId))
        .returning();
      return user || undefined;
    } catch (error) {
      console.error("Error disconnecting Gmail:", error);
      throw new Error("Error disconnecting Gmail");
    }
  }

  async addAccessToken(
    userId: number,
    gmailAccessToken: string,
  ): Promise<User | undefined> {
    try {
      const [user] = await db
        .update(users)
        .set({
          gmailAccessToken: gmailAccessToken,
        })
        .where(eq(users.id, userId))
        .returning();
      return user || undefined;
    } catch (error) {
      console.error("Error adding Gmail access token:", error);
      throw new Error("Error adding Gmail access token");
    }
  }

  // Coach methods
  async getCoach(id: number): Promise<Coach | undefined> {
    const [coach] = await db.select().from(coaches).where(eq(coaches.id, id));
    return coach || undefined;
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
    let conditions = [];

    if (filters?.sport) {
      // Handle different cases based on the sport name
      if (filters.sport.toLowerCase() === "basketball") {
        // Generic "Basketball" should match both "Mens Basketball" and "Womens Basketball"
        conditions.push(
          or(
            sql`${coaches.sport} ILIKE ${"%" + filters.sport + "%"}`,
            sql`${coaches.sport} ILIKE ${"%Basketball%"}`,
          ),
        );
      } else if (filters.sport.toLowerCase() === "mens basketball") {
        // Men's Basketball should only match men's coaches
        conditions.push(eq(coaches.sport, "Mens Basketball"));
      } else if (filters.sport.toLowerCase() === "womens basketball") {
        // Women's Basketball should only match women's coaches
        conditions.push(eq(coaches.sport, "Womens Basketball"));
      } else {
        // For other sports, use exact matching to ensure gender specificity
        // For example, "Mens Soccer" should not match "Womens Soccer"
        conditions.push(eq(coaches.sport, filters.sport));
      }
    }

    if (filters?.status) {
      conditions.push(eq(coaches.status, filters.status));
    }

    if (filters?.division) {
      conditions.push(eq(coaches.division, filters.division));
    }

    if (filters?.conference) {
      conditions.push(eq(coaches.conference, filters.conference));
    }

    if (filters?.region) {
      conditions.push(eq(coaches.region, filters.region));
    }

    if (filters?.state) {
      conditions.push(eq(coaches.state, filters.state));
    }

    if (filters?.favorite !== undefined) {
      conditions.push(eq(coaches.favorite, filters.favorite));
    }

    // First, get total count for pagination
    let countQuery;
    if (conditions.length > 0) {
      countQuery = db
        .select({ count: sql`count(*)` })
        .from(coaches)
        .where(and(...conditions));
    } else {
      countQuery = db.select({ count: sql`count(*)` }).from(coaches);
    }

    // Get all results first (for search filtering)
    let allResults;
    if (conditions.length > 0) {
      allResults = await db
        .select()
        .from(coaches)
        .where(and(...conditions));
    } else {
      allResults = await db.select().from(coaches);
    }

    // Handle search separately since it requires more complex filtering
    if (filters?.search && filters.search.trim() !== "") {
      const searchLower = filters.search.toLowerCase();
      allResults = allResults.filter(
        (coach) =>
          coach.firstName?.toLowerCase().includes(searchLower) ||
          coach.lastName?.toLowerCase().includes(searchLower) ||
          coach.school?.toLowerCase().includes(searchLower) ||
          coach.sport?.toLowerCase().includes(searchLower) ||
          coach.division?.toLowerCase().includes(searchLower) ||
          coach.city?.toLowerCase().includes(searchLower) ||
          coach.state?.toLowerCase().includes(searchLower) ||
          coach.email?.toLowerCase().includes(searchLower),
      );
    }

    // Get total count after search filtering
    const total = allResults.length;

    // Apply pagination if requested
    let paginatedResults = allResults;
    if (filters?.page !== undefined && filters?.limit !== undefined) {
      const page = Math.max(1, filters.page);
      const limit = Math.max(1, filters.limit);
      const offset = (page - 1) * limit;

      paginatedResults = allResults.slice(offset, offset + limit);
      console.log(
        `Applying pagination: page ${page}, limit ${limit}, offset ${offset}, returning ${paginatedResults.length} of ${total} coaches`,
      );
    }

    return {
      coaches: paginatedResults,
      total,
    };
  }

  async createCoach(insertCoach: InsertCoach): Promise<Coach> {
    const [coach] = await db.insert(coaches).values(insertCoach).returning();
    return coach;
  }

  async updateCoach(
    id: number,
    coachData: Partial<InsertCoach>,
  ): Promise<Coach | undefined> {
    const [coach] = await db
      .update(coaches)
      .set(coachData)
      .where(eq(coaches.id, id))
      .returning();
    return coach || undefined;
  }

  async deleteCoach(id: number): Promise<boolean> {
    const result = await db
      .delete(coaches)
      .where(eq(coaches.id, id))
      .returning({ id: coaches.id });
    return result.length > 0;
  }

  // Saved Coach methods
  async getSavedCoach(id: number): Promise<SavedCoach | undefined> {
    const [savedCoach] = await db
      .select()
      .from(savedCoaches)
      .where(eq(savedCoaches.id, id));
    return savedCoach || undefined;
  }

  async getSavedCoaches(userId: number): Promise<SavedCoach[]> {
    return await db
      .select()
      .from(savedCoaches)
      .where(eq(savedCoaches.userId, userId));
  }

  async getSavedCoachByUserAndCoach(
    userId: number,
    coachId: number,
  ): Promise<SavedCoach | undefined> {
    const [savedCoach] = await db
      .select()
      .from(savedCoaches)
      .where(
        and(eq(savedCoaches.userId, userId), eq(savedCoaches.coachId, coachId)),
      );
    return savedCoach || undefined;
  }

  async createSavedCoach(
    insertSavedCoach: InsertSavedCoach,
  ): Promise<SavedCoach> {
    const [savedCoach] = await db
      .insert(savedCoaches)
      .values(insertSavedCoach)
      .returning();
    return savedCoach;
  }

  async updateSavedCoach(
    id: number,
    savedCoachData: Partial<InsertSavedCoach>,
  ): Promise<SavedCoach | undefined> {
    const [savedCoach] = await db
      .update(savedCoaches)
      .set(savedCoachData)
      .where(eq(savedCoaches.id, id))
      .returning();
    return savedCoach || undefined;
  }

  async deleteSavedCoach(id: number): Promise<boolean> {
    const result = await db
      .delete(savedCoaches)
      .where(eq(savedCoaches.id, id))
      .returning({ id: savedCoaches.id });
    return result.length > 0;
  }

  // Email Template methods
  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id));
    return template || undefined;
  }

  async getEmailTemplates(userId: number): Promise<EmailTemplate[]> {
    return await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.userId, userId));
  }

  async createEmailTemplate(
    insertTemplate: InsertEmailTemplate,
  ): Promise<EmailTemplate> {
    const [template] = await db
      .insert(emailTemplates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  async updateEmailTemplate(
    id: number,
    templateData: Partial<InsertEmailTemplate>,
  ): Promise<EmailTemplate | undefined> {
    const [template] = await db
      .update(emailTemplates)
      .set(templateData)
      .where(eq(emailTemplates.id, id))
      .returning();
    return template || undefined;
  }

  async deleteEmailTemplate(id: number): Promise<boolean> {
    const result = await db
      .delete(emailTemplates)
      .where(eq(emailTemplates.id, id))
      .returning({ id: emailTemplates.id });
    return result.length > 0;
  }

  // Email methods
  async getEmail(id: number): Promise<Email | undefined> {
    const [email] = await db.select().from(emails).where(eq(emails.id, id));
    return email || undefined;
  }

  async getEmails(filters?: {
    userId?: number;
    coachId?: number;
  }): Promise<Email[]> {
    let conditions = [];

    if (filters?.userId !== undefined) {
      conditions.push(eq(emails.userId, filters.userId));
    }

    if (filters?.coachId !== undefined) {
      conditions.push(eq(emails.coachId, filters.coachId));
    }

    if (conditions.length > 0) {
      return await db
        .select()
        .from(emails)
        .where(and(...conditions))
        .orderBy(desc(emails.sentAt));
    } else {
      return await db.select().from(emails).orderBy(desc(emails.sentAt));
    }
  }

  async createEmail(insertEmail: InsertEmail): Promise<Email> {
    const [email] = await db.insert(emails).values(insertEmail).returning();
    return email;
  }

  async updateEmail(
    id: number,
    emailData: Partial<InsertEmail>,
  ): Promise<Email | undefined> {
    const [email] = await db
      .update(emails)
      .set(emailData)
      .where(eq(emails.id, id))
      .returning();
    return email || undefined;
  }

  async deleteEmail(id: number): Promise<boolean> {
    const result = await db
      .delete(emails)
      .where(eq(emails.id, id))
      .returning({ id: emails.id });
    return result.length > 0;
  }

  async getThreads(userId: number): Promise<Email[]> {
    // 1) Fetch all of this user’s emails
    const threads = await db
      .select()
      .from(emails)
      .where(eq(emails.userId, userId));

    // 2) In “normal” JS, just drop any with a null/undefined thread ID
    return threads.filter((t) => t.gmailThreadId != null);
  }

  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async getTasks(filters?: {
    userId?: number;
    coachId?: number;
    completed?: boolean;
  }): Promise<Task[]> {
    let conditions = [];

    if (filters?.userId !== undefined) {
      conditions.push(eq(tasks.userId, filters.userId));
    }

    if (filters?.coachId !== undefined) {
      conditions.push(eq(tasks.coachId, filters.coachId));
    }

    if (filters?.completed !== undefined) {
      conditions.push(eq(tasks.completed, filters.completed));
    }

    if (conditions.length > 0) {
      return await db
        .select()
        .from(tasks)
        .where(and(...conditions))
        .orderBy(tasks.dueDate);
    } else {
      return await db.select().from(tasks).orderBy(tasks.dueDate);
    }
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    // Ensure dueDate is properly converted to a Date object
    const taskData = {
      ...insertTask,
      dueDate:
        insertTask.dueDate instanceof Date
          ? insertTask.dueDate
          : new Date(insertTask.dueDate as string),
    };

    console.log("Creating task with data:", taskData);
    console.log("dueDate type:", typeof taskData.dueDate);
    console.log("dueDate instanceof Date:", taskData.dueDate instanceof Date);

    try {
      const [task] = await db.insert(tasks).values(taskData).returning();
      return task;
    } catch (error) {
      console.error("Error in database insert:", error);
      throw error;
    }
  }

  async updateTask(
    id: number,
    taskData: Partial<InsertTask>,
  ): Promise<Task | undefined> {
    // Ensure dueDate is properly converted to a Date object if present
    const updatedData = { ...taskData };

    if (updatedData.dueDate) {
      updatedData.dueDate =
        updatedData.dueDate instanceof Date
          ? updatedData.dueDate
          : new Date(updatedData.dueDate as string);
    }

    console.log("Updating task with data:", updatedData);

    try {
      const [task] = await db
        .update(tasks)
        .set(updatedData)
        .where(eq(tasks.id, id))
        .returning();
      return task || undefined;
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning({ id: tasks.id });
    return result.length > 0;
  }

  // Activity methods
  async getActivity(id: number): Promise<Activity | undefined> {
    const [activity] = await db
      .select()
      .from(activities)
      .where(eq(activities.id, id));
    return activity || undefined;
  }

  async getActivities(filters?: {
    userId?: number;
    coachId?: number;
    limit?: number;
  }): Promise<Activity[]> {
    let conditions: any[] = [];

    // Always filter by userId if provided
    if (filters?.userId !== undefined) {
      const userId = Number(filters.userId);
      console.log(
        `Adding userId filter for activities query: ${userId} (original: ${filters.userId}, type: ${typeof filters.userId})`,
      );

      if (isNaN(userId)) {
        console.error(
          `Invalid userId provided: ${filters.userId} - cannot convert to number`,
        );
        return [];
      }

      conditions.push(eq(activities.userId, userId));
    } else {
      // If no userId provided, return an empty array for security
      console.warn(
        "getActivities called without userId filter - returning empty array",
      );
      return [];
    }

    if (filters?.coachId !== undefined) {
      conditions.push(eq(activities.coachId, filters.coachId));
    }

    let query = db
      .select()
      .from(activities)
      .where(and(...conditions))
      .orderBy(desc(activities.timestamp));

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    return await query;
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    // Ensure timestamp is properly converted to a Date object
    const activityData = {
      ...insertActivity,
      timestamp:
        insertActivity.timestamp instanceof Date
          ? insertActivity.timestamp
          : new Date(insertActivity.timestamp as string),
    };

    console.log("Creating activity with data:", activityData);

    try {
      const [activity] = await db
        .insert(activities)
        .values(activityData)
        .returning();
      return activity;
    } catch (error) {
      console.error("Error creating activity:", error);
      throw error;
    }
  }
}
