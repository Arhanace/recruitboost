import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import nodemailer from "nodemailer";
import multer from "multer";
import {
  insertCoachSchema,
  insertEmailTemplateSchema,
  insertEmailSchema,
  insertTaskSchema,
  insertActivitySchema,
  coaches,
  users,
} from "@shared/schema";
import { db } from "./db";
import { activities, emails } from "@shared/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { ZodError } from "zod";
import { generateEmailTemplate } from "./ai";
import { setupAuthRoutes, authenticateUser } from "./auth";
import { importCoaches } from "./import-coaches";
import { updateCoachConferences } from "./update-coach-conferences";
import { EmailService } from "./email-service";
import { handleInboundEmail } from "./webhook-handlers";
import { z } from "zod";
import admin from "./firebaseAdmin"; // ← default import
import {
  extractTextFromPayload,
  extractHtmlFromPayload,
  createGmailClientForUser,
  stripGmailQuote,
  stripEmailHistory,
} from "./libs/gmail";
import { google } from "googleapis";

// Helper function to validate requests using zod schemas
function validateRequest(schema: any, data: any) {
  try {
    const validatedData = schema.parse(data);
    return { data: validatedData, error: null };
  } catch (error) {
    if (error instanceof ZodError) {
      return { data: null, error: error.flatten().fieldErrors };
    }
    return { data: null, error: { _errors: ["Unknown validation error"] } };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoint to get all distinct sports from coaches database
  app.get(
    "/api/sports",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        // Define a comprehensive set of sports to always include based on our positions map
        const mandatorySports = [
          "Baseball",
          "Beach Volleyball",
          "Field Hockey",
          "Football",
          "Mens Basketball",
          "Mens Golf",
          "Mens Ice Hockey",
          "Mens Lacrosse",
          "Mens Soccer",
          "Mens Tennis",
          "Softball",
          "Womens Basketball",
          "Womens Golf",
          "Womens Ice Hockey",
          "Womens Lacrosse",
          "Womens Soccer",
          "Womens Tennis",
          "Womens Volleyball",
          "Volleyball",
        ];

        // Add these to a Set to ensure uniqueness
        const sportSet = new Set(mandatorySports);

        // Get all distinct sports from the coaches table
        const sports = await db
          .selectDistinct({ sport: coaches.sport })
          .from(coaches);

        // Add any additional sports from the database
        sports.forEach((item) => {
          if (item.sport) {
            sportSet.add(item.sport);
          }
        });

        // Convert back to array and sort alphabetically
        const sportNames = Array.from(sportSet).sort();

        return res.json(sportNames);
      } catch (error) {
        console.error("Error fetching sports:", error);
        return res.status(500).json({ error: "Failed to fetch sports" });
      }
    },
  );

  // API endpoint to get positions for a specific sport
  app.get(
    "/api/positions/:sport",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const { sport } = req.params;

        // Define a comprehensive sport to positions mapping
        const sportPositionsMap: Record<string, string[]> = {
          Baseball: [
            "Pitcher",
            "Catcher",
            "First Base",
            "Second Base",
            "Third Base",
            "Shortstop",
            "Left Field",
            "Center Field",
            "Right Field",
            "Designated Hitter",
          ],
          "Beach Volleyball": ["Blocker", "Defender"],
          "Field Hockey": ["Goalkeeper", "Defender", "Midfielder", "Forward"],
          Football: [
            "Quarterback",
            "Running Back",
            "Wide Receiver",
            "Tight End",
            "Offensive Lineman",
            "Defensive Lineman",
            "Linebacker",
            "Cornerback",
            "Safety",
            "Kicker",
            "Punter",
            "Long Snapper",
          ],
          "Mens Basketball": [
            "Point Guard",
            "Shooting Guard",
            "Small Forward",
            "Power Forward",
            "Center",
          ],
          "Mens Golf": ["Golfer"],
          "Mens Ice Hockey": [
            "Goaltender",
            "Defenseman",
            "Center",
            "Left Wing",
            "Right Wing",
          ],
          "Mens Lacrosse": [
            "Attackman",
            "Midfielder",
            "Defenseman",
            "Goalie",
            "Faceoff Specialist",
            "Long Stick Midfielder",
          ],
          "Mens Soccer": ["Goalkeeper", "Defender", "Midfielder", "Forward"],
          "Mens Tennis": ["Singles Player", "Doubles Player"],
          Softball: [
            "Pitcher",
            "Catcher",
            "First Base",
            "Second Base",
            "Third Base",
            "Shortstop",
            "Left Field",
            "Center Field",
            "Right Field",
            "Designated Player",
          ],
          "Womens Basketball": [
            "Point Guard",
            "Shooting Guard",
            "Small Forward",
            "Power Forward",
            "Center",
          ],
          "Womens Golf": ["Golfer"],
          "Womens Ice Hockey": [
            "Goaltender",
            "Defenseman",
            "Center",
            "Left Wing",
            "Right Wing",
          ],
          "Womens Lacrosse": ["Attack", "Midfield", "Defense", "Goalie"],
          "Womens Soccer": ["Goalkeeper", "Defender", "Midfielder", "Forward"],
          "Womens Tennis": ["Singles Player", "Doubles Player"],
          "Womens Volleyball": [
            "Outside Hitter",
            "Opposite Hitter",
            "Setter",
            "Middle Blocker",
            "Libero",
            "Defensive Specialist",
          ],
          Volleyball: [
            "Outside Hitter",
            "Opposite Hitter",
            "Setter",
            "Middle Blocker",
            "Libero",
            "Defensive Specialist",
          ],
        };

        // Add some sport aliases to handle variations in naming
        const sportAliases: Record<string, string> = {
          "Men's Basketball": "Mens Basketball",
          "Women's Basketball": "Womens Basketball",
          "Men's Golf": "Mens Golf",
          "Women's Golf": "Womens Golf",
          "Men's Ice Hockey": "Mens Ice Hockey",
          "Women's Ice Hockey": "Womens Ice Hockey",
          "Men's Lacrosse": "Mens Lacrosse",
          "Women's Lacrosse": "Womens Lacrosse",
          "Men's Soccer": "Mens Soccer",
          "Women's Soccer": "Womens Soccer",
          "Men's Tennis": "Mens Tennis",
          "Women's Tennis": "Womens Tennis",
          "Women's Volleyball": "Womens Volleyball",
          "Ice Hockey": "Mens Ice Hockey",
        };

        // Normalize the sport name if it's an alias
        const normalizedSport = sportAliases[sport] || sport;

        // If we have defined positions for this sport, return them
        if (sportPositionsMap[normalizedSport]) {
          return res.json(sportPositionsMap[normalizedSport]);
        }

        // For sports not in our mapping, get positions from the database
        const positions = await db
          .select({ position: coaches.position, count: sql<number>`count(*)` })
          .from(coaches)
          .where(and(eq(coaches.sport, sport), sql`${coaches.position} != ''`))
          .groupBy(coaches.position)
          .orderBy(desc(sql<number>`count(*)`))
          .limit(20);

        // Filter out coaching positions
        const filteredPositions = positions
          .map((item) => item.position)
          .filter(
            (pos) =>
              pos &&
              !pos.toLowerCase().includes("coach") &&
              !pos.toLowerCase().includes("director"),
          );

        // If we have no player positions after filtering, provide some generic ones
        if (filteredPositions.length === 0) {
          return res.json(["Player", "Starter", "Captain"]);
        }

        return res.json(filteredPositions);
      } catch (error) {
        console.error("Error fetching positions:", error);
        return res.status(500).json({ error: "Failed to fetch positions" });
      }
    },
  );

  // Set up authentication routes
  setupAuthRoutes(app);

  // Configure multer for handling multipart form data (needed for SendGrid webhook)
  const upload = multer();

  // Add webhook endpoint for receiving emails from SendGrid
  app.post("/api/webhooks/inbound-email", upload.any(), handleInboundEmail);

  // Create a test account on ethereal.email for development
  // In production, you would configure a real SMTP provider
  let testAccount = await nodemailer.createTestAccount();

  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  // Helper function to handle validation errors
  const validateRequest = (schema: any, data: any) => {
    try {
      return { data: schema.parse(data), error: null };
    } catch (error) {
      if (error instanceof ZodError) {
        return { data: null, error: error.format() };
      }
      return { data: null, error };
    }
  };

  // AI Routes

  // User Routes

  // Get current user profile
  app.get(
    "/api/user/profile",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        console.log("Profile fetch request received:", {
          user: req.user,
          headers: {
            authorization: req.headers.authorization
              ? "present"
              : "not present",
            contentType: req.headers["content-type"],
          },
          method: req.method,
          url: req.url,
          query: req.query,
        });

        // Get user ID from the request, with fallbacks for development
        let userId;

        // // Check authorization header for token if no user is present
        // if (!req.user && req.headers.authorization) {
        //   try {
        //     console.log('Authorization header found, attempting to verify token');
        //     const token = req.headers.authorization.split(' ')[1]; // "Bearer TOKEN" format

        //     if (token && admin?.apps?.length) {
        //       try {
        //         const decodedToken = await admin.auth().verifyIdToken(token);
        //         console.log('Valid token received in profile fetch:', decodedToken.uid);

        //         // Look up user by Firebase UID
        //         const user = await storage.getUserByFirebaseUid(decodedToken.uid);

        //         if (user) {
        //           userId = user.id;
        //           console.log('Found user ID from token:', userId);

        //           // Set user on request to follow standard pattern
        //           req.user = {
        //             id: user.id,
        //             firebaseUid: user.firebaseUid,
        //             email: user.email
        //           };
        //         }
        //       } catch (tokenError) {
        //         console.error('Token verification error in profile fetch:', tokenError);
        //       }
        //     }
        //   } catch (headerError) {
        //     console.error('Error processing auth header:', headerError);
        //   }
        // }

        // Only use authenticated user ID - no more fallbacks
        if (!userId && req.user && req.user.id) {
          userId = req.user.id;
          console.log(`Using authenticated user ID: ${userId}`);
        }
        // No fallbacks - require proper authentication
        else if (!userId) {
          console.log("No user ID found - authentication required");
          return res.status(401).json({
            message: "Authentication required to access user profile",
            code: "AUTH_REQUIRED",
          });
        }

        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({
            message: "User profile not found",
            code: "USER_NOT_FOUND",
          });
        }

        // Always remove password from response even though we don't use it
        const { password, ...userWithoutPassword } = user;

        // Log successful profile access for debugging
        console.log(
          `User profile accessed: ID=${user.id}, Email=${user.email}`,
        );

        res.json(userWithoutPassword);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({
          message: "Server error when accessing user profile",
          code: "SERVER_ERROR",
        });
      }
    },
  );

  // Update user profile
  app.patch("/api/user/profile", async (req: Request, res: Response) => {
    try {
      console.log("Profile update request received:", {
        headers: {
          authorization: req.headers.authorization ? "present" : "not present",
          contentType: req.headers["content-type"],
          firebaseUid: req.headers["x-firebase-uid"]
            ? "present"
            : "not present",
        },
        authStatus: req.user ? "authenticated" : "not authenticated",
        method: req.method,
        url: req.url,
        query: req.query,
      });

      // Check authentication status
      let userId = null;
      let requiresAuth = true;

      // Apply the same auth pattern used in authenticateUser middleware
      // Step 1: Check request user
      if (req.user && req.user.id) {
        userId = req.user.id;
        console.log(`Using existing authenticated user ID: ${userId}`);
      }
      // Step 2: Try Firebase token in auth header
      else if (req.headers.authorization) {
        const token = req.headers.authorization.split(" ")[1];
        console.log(
          `Attempting to verify auth token for profile update, length: ${token?.length || 0}`,
        );

        try {
          if (admin.apps.length) {
            // Try to get user from token
            const decodedToken = await admin.auth().verifyIdToken(token);
            const { uid } = decodedToken;
            console.log(`Successfully verified token for Firebase UID: ${uid}`);

            // Get user from database by Firebase UID
            const user = await storage.getUserByFirebaseUid(uid);
            if (user) {
              userId = user.id;
              console.log(`Found user ID ${userId} from Firebase UID: ${uid}`);
            }
          }
        } catch (tokenError) {
          console.error(
            "Token verification error in profile update:",
            tokenError,
          );
        }
      }

      // Step 3: Check for Firebase UID in header (fallback mechanism)
      if (!userId && req.headers["x-firebase-uid"]) {
        const firebaseUid = req.headers["x-firebase-uid"] as string;
        console.log(
          `Attempting fallback authentication with Firebase UID header: ${firebaseUid}`,
        );

        if (firebaseUid) {
          const user = await storage.getUserByFirebaseUid(firebaseUid);
          if (user) {
            userId = user.id;
            console.log(
              `Found user ID ${userId} from X-Firebase-UID header: ${firebaseUid}`,
            );
          }
        }
      }

      // Step 4: Check for dev mode
      const isDevelopment = false;
      const useDevMode = false;

      if (!userId && useDevMode) {
        console.log("Using development mode fallback for profile update");
        // In development mode only, fall back to a known user
        userId = 1; // First user in the database
        console.log(`Using development fallback user: ${userId}`);
      }

      // Require proper authentication
      if (!userId) {
        console.log(
          "No user ID found - authentication required for profile update",
        );

        // Return detailed auth failure information
        return res.status(401).json({
          message:
            "Unauthorized - you must be logged in to update your profile",
          auth_status: req.user ? "authenticated" : "not authenticated",
          auth_header: req.headers.authorization ? "present" : "not present",
          firebase_uid_header: req.headers["x-firebase-uid"]
            ? "present"
            : "not present",
          dev_mode: isDevelopment,
        });
      }

      // Get the user data to update
      const userData = req.body;

      console.log(`Updating user ${userId} with data:`, userData);

      try {
        // Update the user
        const updatedUser = await storage.updateUser(userId, userData);

        if (!updatedUser) {
          console.log(`User ${userId} not found during profile update`);
          return res.status(404).json({ message: "User not found" });
        }

        console.log(`User ${userId} profile updated successfully`);

        // Log profile update activity
        await storage.createActivity({
          userId,
          type: "profile_updated",
          description: "Updated profile information",
          timestamp: new Date(),
          metaData: {},
        });

        // Return the updated user without the password field if it exists
        const userWithoutPassword = { ...updatedUser };
        if ("password" in userWithoutPassword) {
          delete userWithoutPassword.password;
        }

        return res.json(userWithoutPassword);
      } catch (dbError) {
        console.error(`Database error updating user ${userId}:`, dbError);
        return res.status(500).json({
          message: "Database error updating profile",
          error: String(dbError),
        });
      }
    } catch (error) {
      console.error("Error in profile update route:", error);
      res.status(500).json({
        message: "Internal server error processing profile update",
        error: String(error),
      });
    }
  });

  app.get("/api/user", authenticateUser, async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          message: "Authentication required to access user data",
          code: "AUTH_REQUIRED",
        });
      }

      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      // Don't return the password
      const { password, ...userWithoutPassword } = user;

      console.log(
        `User data retrieved for ID=${userId}, Email=${user.email || "none"}`,
      );
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({
        message: "Server error fetching user data",
        code: "SERVER_ERROR",
      });
    }
  });

  app.put("/api/user", async (req, res) => {
    try {
      console.log("User update request received:", {
        headers: {
          authorization: req.headers.authorization ? "present" : "not present",
          contentType: req.headers["content-type"],
          firebaseUid: req.headers["x-firebase-uid"]
            ? "present"
            : "not present",
        },
        authStatus: req.user ? "authenticated" : "not authenticated",
        method: req.method,
        url: req.url,
        query: req.query,
      });

      // Check authentication status
      let userId = null;

      // Step 1: Check request user (added by authenticateUser middleware if it ran before)
      if (req.user && req.user.id) {
        userId = req.user.id;
        console.log(`Using existing authenticated user ID: ${userId}`);
      }
      // Step 2: Try Firebase token in auth header
      else if (req.headers.authorization) {
        const token = req.headers.authorization.split(" ")[1];
        console.log(
          `Attempting to verify auth token for user update, length: ${token?.length || 0}`,
        );

        try {
          if (admin.apps.length) {
            // Try to get user from token
            const decodedToken = await admin.auth().verifyIdToken(token);
            const { uid } = decodedToken;
            console.log(`Successfully verified token for Firebase UID: ${uid}`);

            // Get user from database by Firebase UID
            const user = await storage.getUserByFirebaseUid(uid);
            if (user) {
              userId = user.id;
              console.log(`Found user ID ${userId} from Firebase UID: ${uid}`);
            }
          }
        } catch (tokenError) {
          console.error("Token verification error in user update:", tokenError);
        }
      }

      // Step 3: Check for Firebase UID in header (fallback mechanism)
      if (!userId && req.headers["x-firebase-uid"]) {
        const firebaseUid = req.headers["x-firebase-uid"] as string;
        console.log(
          `Attempting fallback authentication with Firebase UID header: ${firebaseUid}`,
        );

        if (firebaseUid) {
          const user = await storage.getUserByFirebaseUid(firebaseUid);
          if (user) {
            userId = user.id;
            console.log(
              `Found user ID ${userId} from X-Firebase-UID header: ${firebaseUid}`,
            );
          }
        }
      }

      // Step 4: Check for dev mode
      const isDevelopment = false;
      const useDevMode = false;

      if (!userId && useDevMode) {
        console.log("Using development mode fallback for user update");
        // In development mode only, fall back to a known user
        userId = 1; // First user in the database
        console.log(`Using development fallback user: ${userId}`);
      }

      // Require proper authentication
      if (!userId) {
        console.log(
          "No user ID found - authentication required for user update",
        );

        // Return detailed auth failure information
        return res.status(401).json({
          message:
            "Unauthorized - you must be logged in to update your profile",
          auth_status: req.user ? "authenticated" : "not authenticated",
          auth_header: req.headers.authorization ? "present" : "not present",
          firebase_uid_header: req.headers["x-firebase-uid"]
            ? "present"
            : "not present",
          dev_mode: isDevelopment,
        });
      }
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      // Only allow specific fields to be updated, explicitly excluding problematic fields
      const updateData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        gender: req.body.gender,
        // sport is kept from user's original record, don't update it
        graduationYear: req.body.graduationYear,
        position: req.body.position,
        height: req.body.height,
        keyStats: req.body.keyStats,
        highlights: req.body.highlights,
        stats: req.body.stats,
        bio: req.body.bio,
        avatar: req.body.avatar,
        gpa: req.body.gpa,
        testScores: req.body.testScores,
        academicHonors: req.body.academicHonors,
        intendedMajor: req.body.intendedMajor,
        location: req.body.location,
        schoolSize: req.body.schoolSize,
        programLevel: req.body.programLevel,
      };

      // Remove any undefined fields (fields not present in the request)
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      console.log(
        "User update data (cleaned):",
        JSON.stringify(updateData, null, 2),
      );

      const updatedUser = await storage.updateUser(userId, updateData);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Log profile update activity
      await storage.createActivity({
        userId,
        type: "profile_updated",
        description: "Updated profile information",
        timestamp: new Date(),
        metaData: {},
      });

      // Don't return the password
      const { password: pwd, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Error updating user" });
    }
  });

  // Coach Routes

  // Import coaches from CSV file
  app.post("/api/coaches/import", authenticateUser, async (req, res) => {
    try {
      console.log("Starting coach import from CSV...");
      await importCoaches();
      res.status(200).json({ message: "Import process completed" });
    } catch (error) {
      console.error("Error importing coaches:", error);
      res.status(500).json({ message: "Error importing coaches" });
    }
  });

  // Update coach conferences from CSV file
  app.post(
    "/api/coaches/update-conferences",
    authenticateUser,
    async (req, res) => {
      try {
        console.log("Starting coach conference update from CSV...");
        // Use the actual path to the CSV file
        const csvFilePath =
          "./attached_assets/recruitref_dashboard_full_multithreaded.csv";
        const updatedCount = await updateCoachConferences(csvFilePath);
        res.status(200).json({
          message: "Conference update process completed",
          updatedCount,
        });
      } catch (error) {
        console.error("Error updating coach conferences:", error);
        res.status(500).json({ message: "Error updating coach conferences" });
      }
    },
  );

  app.get("/api/coaches", authenticateUser, async (req, res) => {
    try {
      // Require authentication - no more fallback to user 1
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          message: "Authentication required to view coaches",
          code: "AUTH_REQUIRED",
        });
      }

      const userId = req.user.id;
      const sport = req.query.sport as string | undefined;
      const status = req.query.status as string | undefined;
      const division = req.query.division as string | undefined;
      const conference = req.query.conference as string | undefined;
      const region = req.query.region as string | undefined;
      const state = req.query.state as string | undefined;
      const favorite =
        req.query.favorite !== undefined
          ? req.query.favorite === "true"
          : undefined;
      const search = req.query.search as string | undefined;
      const allSports = req.query.allSports === "true"; // New parameter to explicitly request all sports

      // Pagination parameters
      const page = req.query.page
        ? parseInt(req.query.page as string)
        : undefined;
      const limit = req.query.limit
        ? parseInt(req.query.limit as string)
        : undefined;

      console.log(
        `Received request for coaches with pagination: page=${page}, limit=${limit}`,
      );

      // Get user profile to apply sport filter by default
      let userSport: string | undefined;
      if (!allSports && !sport) {
        try {
          const user = await storage.getUser(userId);
          if (user && user.sport) {
            userSport = user.sport;
            console.log(
              `Automatically filtering by user's sport: ${userSport}`,
            );
          }
        } catch (error) {
          console.error("Error fetching user for sport filtering:", error);
        }
      }

      // Pass filters to storage layer
      const coachFilters: {
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
      } = {};

      // Apply sport filter with priority: explicit query param > user profile > no filter
      if (sport) {
        coachFilters.sport = sport;
      } else if (userSport && !allSports) {
        coachFilters.sport = userSport;
      }

      if (status) coachFilters.status = status;
      if (division) coachFilters.division = division;
      if (conference) coachFilters.conference = conference;
      if (region) coachFilters.region = region;
      if (state) coachFilters.state = state;
      if (search) coachFilters.search = search;

      // Add pagination parameters if provided
      if (page !== undefined) coachFilters.page = page;
      if (limit !== undefined) coachFilters.limit = limit;

      // Get coaches based on filters except favorite
      let result = await storage.getCoaches(coachFilters);
      let coaches = result.coaches;
      const total = result.total;

      // If favorite filter is set, handle it via saved coaches
      if (favorite !== undefined) {
        // Get saved coaches for this user
        const savedCoaches = await storage.getSavedCoaches(userId);
        const savedCoachIds = new Set(savedCoaches.map((sc) => sc.coachId));

        // Filter coaches based on saved status
        if (favorite) {
          coaches = coaches.filter((coach) => savedCoachIds.has(coach.id));
        } else {
          coaches = coaches.filter((coach) => !savedCoachIds.has(coach.id));
        }
      }

      // Add virtual favorite property to each coach based on saved status
      if (coaches.length > 0) {
        const savedCoaches = await storage.getSavedCoaches(userId);
        const savedCoachIds = new Set(savedCoaches.map((sc) => sc.coachId));

        coaches = coaches.map((coach) => ({
          ...coach,
          favorite: savedCoachIds.has(coach.id),
        }));
      }

      // Return paginated data with metadata
      res.json({
        coaches,
        pagination: {
          total,
          page: page || 1,
          limit: limit || total,
          pages: limit ? Math.ceil(total / limit) : 1,
        },
      });
    } catch (error) {
      console.error("Error fetching coaches:", error);
      res.status(500).json({ message: "Error fetching coaches" });
    }
  });

  // Toggle favorite status for a coach
  app.patch("/api/coaches/:id/favorite", authenticateUser, async (req, res) => {
    try {
      // Ensure user is authenticated
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const coachId = parseInt(req.params.id);
      const userId = req.user.id;
      const favorite = req.body.favorite;

      const coach = await storage.getCoach(coachId);
      if (!coach) {
        return res.status(404).json({ message: "Coach not found" });
      }

      // Check if coach is already saved by this user
      const existingSaved = await storage.getSavedCoachByUserAndCoach(
        userId,
        coachId,
      );

      if (favorite && !existingSaved) {
        // Save the coach with favorite=true
        await storage.createSavedCoach({
          userId,
          coachId,
          favorite: true,
          status: "Not Contacted",
        });

        // Return coach with virtual favorite flag for compatibility
        return res.json({
          ...coach,
          favorite: true,
        });
      } else if (favorite && existingSaved) {
        // Update the existing record to set favorite=true
        await storage.updateSavedCoach(existingSaved.id, { favorite: true });

        // Return coach with virtual favorite flag for compatibility
        return res.json({
          ...coach,
          favorite: true,
        });
      } else if (!favorite && existingSaved) {
        // Update to set favorite=false if we want to unfavorite but keep the record
        // Or alternatively, delete the saved coach record entirely
        await storage.updateSavedCoach(existingSaved.id, { favorite: false });

        // Return coach with virtual favorite flag for compatibility
        return res.json({
          ...coach,
          favorite: false,
        });
      }

      // No change required
      return res.json({
        ...coach,
        favorite: existingSaved ? !!existingSaved.favorite : false,
      });
    } catch (error) {
      console.error("Error updating saved coach:", error);
      res.status(500).json({ message: "Error updating saved coach status" });
    }
  });

  // Note: Specific routes must be defined before generic routes with params

  // Get saved coaches
  app.get("/api/saved-coaches", authenticateUser, async (req, res) => {
    try {
      // Ensure user is authenticated
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = req.user.id;

      // Get saved coaches for this user
      const savedCoaches = await storage.getSavedCoaches(userId);

      // If no saved coaches, return empty array
      if (!savedCoaches.length) {
        return res.json([]);
      }

      // Get the actual coach objects and merge with saved coach data
      const coaches = await Promise.all(
        savedCoaches.map(async (sc) => {
          const coach = await storage.getCoach(sc.coachId);
          if (!coach) return null;

          return {
            ...coach,
            savedId: sc.id,
            favorite: sc.favorite || false,
            status: sc.status || "Not Contacted",
            notes: sc.notes || "",
          };
        }),
      );

      // Filter out any null values (from coaches that may have been deleted)
      const validCoaches = coaches.filter(Boolean);

      res.json(validCoaches);
    } catch (error) {
      console.error("Error fetching saved coaches:", error);
      res.status(500).json({ message: "Error fetching saved coaches" });
    }
  });

  // Get unique division values
  app.get("/api/coaches/divisions", authenticateUser, async (req, res) => {
    try {
      // Require authentication
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          message: "Authentication required to view divisions",
          code: "AUTH_REQUIRED",
        });
      }

      const userId = req.user.id;
      const allSports = req.query.allSports === "true";

      // Apply user's sport filter by default unless allSports is set
      let filters = {};
      if (!allSports) {
        try {
          const user = await storage.getUser(userId);
          if (user && user.sport) {
            filters = { sport: user.sport };
          }
        } catch (error) {
          console.error("Error fetching user for sport filtering:", error);
        }
      }

      // Fetch coaches with filters and extract unique divisions
      const result = await storage.getCoaches(filters);
      const divisions = [
        ...new Set(
          result.coaches.map((coach) => coach.division).filter(Boolean),
        ),
      ].sort();

      res.json(divisions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching divisions" });
    }
  });

  // Get unique conference values
  app.get("/api/coaches/conferences", authenticateUser, async (req, res) => {
    try {
      // Require authentication
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          message: "Authentication required to view conferences",
          code: "AUTH_REQUIRED",
        });
      }

      const userId = req.user.id;
      const allSports = req.query.allSports === "true";
      const sport = req.query.sport as string | undefined;

      // Apply filters with priority: explicit sport param > user's sport > no filter
      let filters: any = {};

      if (sport) {
        filters.sport = sport;
      } else if (!allSports) {
        try {
          const user = await storage.getUser(userId);
          if (user && user.sport) {
            filters.sport = user.sport;
          }
        } catch (error) {
          console.error("Error fetching user for sport filtering:", error);
        }
      }

      // Fetch coaches with filters and extract unique conferences
      const result = await storage.getCoaches(filters);
      const conferences = [
        ...new Set(
          result.coaches.map((coach) => coach.conference).filter(Boolean),
        ),
      ].sort();

      res.json(conferences);
    } catch (error) {
      res.status(500).json({ message: "Error fetching conferences" });
    }
  });

  // Get unique region values
  app.get("/api/coaches/regions", authenticateUser, async (req, res) => {
    try {
      // Require authentication
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          message: "Authentication required to view regions",
          code: "AUTH_REQUIRED",
        });
      }

      const userId = req.user.id;
      const allSports = req.query.allSports === "true";
      const sport = req.query.sport as string | undefined;

      // Apply filters with priority: explicit sport param > user's sport > no filter
      let filters: any = {};

      if (sport) {
        filters.sport = sport;
      } else if (!allSports) {
        try {
          const user = await storage.getUser(userId);
          if (user && user.sport) {
            filters.sport = user.sport;
          }
        } catch (error) {
          console.error("Error fetching user for sport filtering:", error);
        }
      }

      // Fetch coaches with filters and extract unique regions
      const result = await storage.getCoaches(filters);
      const regions = [
        ...new Set(result.coaches.map((coach) => coach.region).filter(Boolean)),
      ].sort();

      res.json(regions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching regions" });
    }
  });

  // Get unique state values
  app.get("/api/coaches/states", authenticateUser, async (req, res) => {
    try {
      // Require authentication
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          message: "Authentication required to view states",
          code: "AUTH_REQUIRED",
        });
      }

      const userId = req.user.id;
      const allSports = req.query.allSports === "true";
      const sport = req.query.sport as string | undefined;

      // Apply filters with priority: explicit sport param > user's sport > no filter
      let filters: any = {};

      if (sport) {
        filters.sport = sport;
      } else if (!allSports) {
        try {
          const user = await storage.getUser(userId);
          if (user && user.sport) {
            filters.sport = user.sport;
          }
        } catch (error) {
          console.error("Error fetching user for sport filtering:", error);
        }
      }

      // Fetch coaches with filters and extract unique states
      const result = await storage.getCoaches(filters);
      const states = [
        ...new Set(result.coaches.map((coach) => coach.state).filter(Boolean)),
      ].sort();

      res.json(states);
    } catch (error) {
      res.status(500).json({ message: "Error fetching states" });
    }
  });

  // Get a single coach by ID
  app.get("/api/coaches/:id([0-9]+)", authenticateUser, async (req, res) => {
    try {
      // Ensure user is authenticated
      if (!req.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = req.user.id;
      const coachId = parseInt(req.params.id);
      const coach = await storage.getCoach(coachId);

      if (!coach) {
        return res.status(404).json({ message: "Coach not found" });
      }

      // Check if coach is saved by this user
      const savedCoach = await storage.getSavedCoachByUserAndCoach(
        userId,
        coachId,
      );

      // Return coach with saved coach data if available
      if (savedCoach) {
        res.json({
          ...coach,
          savedId: savedCoach.id,
          favorite: savedCoach.favorite || false,
          status: savedCoach.status || "Not Contacted",
          notes: savedCoach.notes || "",
        });
      } else {
        // No saved relationship yet
        res.json({
          ...coach,
          favorite: false,
          status: "Not Contacted",
          notes: "",
        });
      }
    } catch (error) {
      console.error("Error fetching coach:", error);
      res.status(500).json({ message: "Error fetching coach" });
    }
  });

  app.post("/api/coaches", authenticateUser, async (req, res) => {
    try {
      const { data, error } = validateRequest(insertCoachSchema, req.body);

      if (error) {
        return res
          .status(400)
          .json({ message: "Invalid coach data", errors: error });
      }

      const coach = await storage.createCoach(data);

      // Log this activity
      await storage.createActivity({
        userId: 1, // In a real app, this would come from the session
        coachId: coach.id,
        type: "coach_added",
        description: `Added coach ${coach.firstName} ${coach.lastName}`,
        timestamp: new Date().toISOString(),
        metaData: {
          school: coach.school,
          sport: coach.sport,
        },
      });

      res.status(201).json(coach);
    } catch (error) {
      res.status(500).json({ message: "Error creating coach" });
    }
  });

  app.put("/api/coaches/:id", authenticateUser, async (req, res) => {
    try {
      const coachId = parseInt(req.params.id);
      const coach = await storage.getCoach(coachId);

      if (!coach) {
        return res.status(404).json({ message: "Coach not found" });
      }

      const updatedCoach = await storage.updateCoach(coachId, req.body);

      if (!updatedCoach) {
        return res.status(404).json({ message: "Coach not found" });
      }

      res.json(updatedCoach);
    } catch (error) {
      res.status(500).json({ message: "Error updating coach" });
    }
  });

  app.delete("/api/coaches/:id", authenticateUser, async (req, res) => {
    try {
      const coachId = parseInt(req.params.id);
      const success = await storage.deleteCoach(coachId);

      if (!success) {
        return res.status(404).json({ message: "Coach not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting coach" });
    }
  });

  // Email Template Routes
  app.get("/api/email-templates", authenticateUser, async (req, res) => {
    try {
      // Require authentication
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          message: "Authentication required to view email templates",
          code: "AUTH_REQUIRED",
        });
      }

      const userId = req.user.id;

      const templates = await storage.getEmailTemplates(userId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching email templates:", error);
      res.status(500).json({ message: "Error fetching email templates" });
    }
  });

  app.get("/api/email-templates/:id", authenticateUser, async (req, res) => {
    try {
      // Require authentication
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          message: "Authentication required to view email template",
          code: "AUTH_REQUIRED",
        });
      }

      const userId = req.user.id;
      const template = await storage.getEmailTemplate(parseInt(req.params.id));

      if (!template) {
        return res.status(404).json({ message: "Email template not found" });
      }

      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Error fetching email template" });
    }
  });

  app.post("/api/email-templates", authenticateUser, async (req, res) => {
    try {
      // Get the user ID from the authenticated user
      const userId = req.user?.id || 1; // Fallback to 1 for development

      const { data, error } = validateRequest(
        insertEmailTemplateSchema.extend({
          userId: insertEmailTemplateSchema.shape.userId.default(userId),
        }),
        { ...req.body, userId },
      );

      if (error) {
        return res
          .status(400)
          .json({ message: "Invalid email template data", errors: error });
      }

      const template = await storage.createEmailTemplate(data);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating email template:", error);
      res.status(500).json({ message: "Error creating email template" });
    }
  });

  app.put("/api/email-templates/:id", authenticateUser, async (req, res) => {
    try {
      const userId = req.user?.id || 1; // Get the user ID from the authenticated user
      const templateId = parseInt(req.params.id);
      const template = await storage.getEmailTemplate(templateId);

      if (!template) {
        return res.status(404).json({ message: "Email template not found" });
      }

      // Verify the user owns this template
      if (template.userId !== userId) {
        return res.status(403).json({
          message: "You don't have permission to update this template",
        });
      }

      const updatedTemplate = await storage.updateEmailTemplate(
        templateId,
        req.body,
      );

      if (!updatedTemplate) {
        return res.status(404).json({ message: "Email template not found" });
      }

      res.json(updatedTemplate);
    } catch (error) {
      console.error("Error updating email template:", error);
      res.status(500).json({ message: "Error updating email template" });
    }
  });

  app.delete("/api/email-templates/:id", authenticateUser, async (req, res) => {
    try {
      const userId = req.user?.id || 1; // Get the user ID from the authenticated user
      const templateId = parseInt(req.params.id);

      // Get the template first to verify ownership
      const template = await storage.getEmailTemplate(templateId);

      if (!template) {
        return res.status(404).json({ message: "Email template not found" });
      }

      // Verify the user owns this template
      if (template.userId !== userId) {
        return res.status(403).json({
          message: "You don't have permission to delete this template",
        });
      }

      const success = await storage.deleteEmailTemplate(templateId);

      if (!success) {
        return res.status(404).json({ message: "Email template not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting email template:", error);
      res.status(500).json({ message: "Error deleting email template" });
    }
  });

  // AI Email Generation
  app.post("/api/ai/generate-email", authenticateUser, async (req, res) => {
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(400).json({
          message: "ANTHROPIC_API_KEY is required to use AI Email Generation",
          needsApiKey: true,
        });
      }

      const { userProfile, coachInfo, tone, coachId, teamPerformanceData } =
        req.body;

      if (!userProfile) {
        return res.status(400).json({
          message: "Athlete profile information is required",
        });
      }

      // Format the athlete information for the AI
      const athleteInfo = Object.entries(userProfile)
        .filter(([_, value]) => value && String(value).trim() !== "")
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");

      // Format the coach information if available
      let coachDetails = "";
      if (coachInfo && Object.keys(coachInfo).length > 0) {
        coachDetails = Object.entries(coachInfo)
          .filter(([_, value]) => value && String(value).trim() !== "")
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n");
      }
      // If we have a coachId but no coachInfo, try to fetch the coach
      else if (coachId) {
        try {
          const coach = await storage.getCoach(coachId);
          if (coach) {
            coachDetails = `
              name: ${coach.firstName} ${coach.lastName}
              school: ${coach.school || ""}
              sport: ${coach.sport || ""}
              division: ${coach.division || ""}
              conference: ${coach.conference || ""}
              position: ${coach.position || ""}
            `;
          }
        } catch (error) {
          console.error("Error fetching coach for AI email generation:", error);
        }
      }

      // Extract sport from userProfile or default to a generic sport
      const sportInfo = userProfile.sport || "athlete";

      // Format team performance data if provided
      let formattedTeamPerformanceData = "";
      if (teamPerformanceData && typeof teamPerformanceData === "object") {
        formattedTeamPerformanceData = Object.entries(teamPerformanceData)
          .filter(([_, value]) => value && String(value).trim() !== "")
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n");
      } else if (
        typeof teamPerformanceData === "string" &&
        teamPerformanceData.trim() !== ""
      ) {
        formattedTeamPerformanceData = teamPerformanceData;
      }
      if (coachDetails.trim() === "") {
        return res.status(400).json({
          message: "Coach information is required for AI email generation",
        });
      }
      
      const template = await generateEmailTemplate(
        sportInfo,
        athleteInfo,
        coachDetails,
        tone || "professional",
        formattedTeamPerformanceData,
      );

      // Log activity for using AI
      try {
        await storage.createActivity({
          userId: req.user?.id || 1, // Get the user ID from the authenticated user
          type: "ai_email_generated",
          description: "Generated email template using AI",
          timestamp: new Date().toISOString() as any,
          metaData: {
            sportInfo,
            tone: tone || "professional",
            hasTeamPerformanceData: !!formattedTeamPerformanceData,
          } as any,
        });
      } catch (activityError) {
        // Don't let activity logging errors prevent email generation
        console.error("Error logging AI email activity:", activityError);
      }

      res.json(template);
    } catch (error) {
      console.error("Error generating AI email template:", error);
      res.status(500).json({
        message: "Error generating AI email template",
        error: error.message || error || "error",
      });
    }
  });

  // Email Routes
  app.get("/api/emails", authenticateUser, async (req, res) => {
    try {
      // Require authentication
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          message: "Authentication required to view emails",
          code: "AUTH_REQUIRED",
        });
      }

      const userId = req.user.id;
      const coachId = req.query.coachId
        ? parseInt(req.query.coachId as string)
        : undefined;

      const emails = await storage.getEmails({ userId, coachId });
      res.json(emails);
    } catch (error) {
      console.error("Error fetching emails:", error);
      res.status(500).json({ message: "Error fetching emails" });
    }
  });

  // Create email (works for both sent and draft emails)
  // server/routes.ts

  app.post(
    "/api/emails",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        // Payload schema
        const batchSchema = z.object({
          coachIds: z.array(z.number()).nonempty("At least one coach required"),
          subject: z.string().min(1),
          body: z.string().min(1),
          templateId: z.number().optional(),
          isDraft: z.boolean().default(false),
          followUpDays: z.number().optional(),
        });
        const { data, error } = validateRequest(batchSchema, req.body);
        if (error) {
          return res
            .status(400)
            .json({ message: "Invalid payload", errors: error });
        }

        const results: any[] = [];

        for (const coachId of data.coachIds) {
          // fetch coach for logging/activity
          const coach = await storage.getCoach(coachId);
          if (!coach) {
            // skip missing coach
            continue;
          }

          if (data.isDraft) {
            // save draft
            const draft = await storage.createEmail({
              userId,
              coachId,
              subject: data.subject,
              body: data.body,
              sentAt: new Date(),
              status: "draft",
              direction: "outbound",
              templateId: data.templateId,
              isFollowUp: false,
              scheduledFor:
                data.followUpDays != null
                  ? new Date(Date.now() + data.followUpDays * 86400000)
                  : null,
            });
            results.push({ draft });
            continue;
          }

          // real send
          const sendResult = await EmailService.sendEmail({
            from: (await storage.getUser(userId))!.email,
            to: coach.email,
            subject: data.subject,
            html: data.body,
            userId,
            coachId,
            templateId: data.templateId,
            isFollowUp: false,
            followUpDays: data.followUpDays,
          });

          if (!sendResult.success) {
            // push the error for this coach
            results.push({ coachId, error: sendResult.error });
            continue;
          }

          // now record activity just like the single‐send route
          await storage.createActivity({
            userId,
            coachId,
            type: "email_sent",
            description: `Email sent to ${coach.firstName} ${coach.lastName}`,
            timestamp: new Date(),
            metaData: {
              emailId: sendResult.emailId,
              subject: data.subject,
            },
          });

          // schedule follow-up task if desired
          if (data.followUpDays) {
            // create task
            await storage.createTask({
              userId,
              coachId,
              title: `Follow up with ${coach.firstName} ${coach.lastName}`,
              dueDate: new Date(Date.now() + data.followUpDays * 86400000),
              completed: false,
              type: "email-follow-up",
              metaData: {
                emailId: sendResult.emailId,
              },
            });
          }

          // fetch the stored email record + coach info
          const stored = await storage.getEmail(sendResult.emailId!);
          results.push({ ...stored, coach });
        }

        if (results.length === 0) {
          return res
            .status(500)
            .json({ message: "No emails were created or sent" });
        }

        // single‐ vs batch response shape
        res.status(201).json(results.length === 1 ? results[0] : results);
      } catch (err: any) {
        console.error("Batch /api/emails error:", err);
        res.status(500).json({ message: "Internal error", error: err.message });
      }
    },
  );

  // app.post("/api/emails/send", authenticateUser, async (req, res) => {
  //   try {
  //     // Require authentication
  //     if (!req.user || !req.user.id) {
  //       return res.status(401).json({
  //         message: "Authentication required to send emails",
  //         code: "AUTH_REQUIRED",
  //       });
  //     }

  //     const userId = req.user.id;

  //     const { coachIds, subject, body, templateId } = req.body;

  //     if (!coachIds || !Array.isArray(coachIds) || coachIds.length === 0) {
  //       return res
  //         .status(400)
  //         .json({ message: "At least one coach ID is required" });
  //     }

  //     if (!subject || !body) {
  //       return res
  //         .status(400)
  //         .json({ message: "Subject and body are required" });
  //     }

  //     const sentEmails = [];
  //     const activities = [];

  //     for (const coachId of coachIds) {
  //       const coach = await storage.getCoach(parseInt(coachId));

  //       if (!coach) {
  //         continue;
  //       }

  //       try {
  //         // Replace template placeholders
  //         let personalizedBody = body
  //           .replace(/{{firstName}}/g, coach.firstName)
  //           .replace(/{{lastName}}/g, coach.lastName)
  //           .replace(/{{school}}/g, coach.school);

  //         // Send email using Nodemailer
  //         const info = await transporter.sendMail({
  //           from: '"Alex Johnson" <alex.johnson@example.com>',
  //           to: coach.email,
  //           subject: subject,
  //           text: personalizedBody,
  //         });

  //         // Log the email URL provided by Ethereal
  //         console.log("Email sent: %s", nodemailer.getTestMessageUrl(info));

  //         // Save the email in the database
  //         const email = await storage.createEmail({
  //           userId,
  //           coachId: coach.id,
  //           subject,
  //           body: personalizedBody,
  //           sentAt: new Date(),
  //           status: "sent",
  //           templateId: templateId ? parseInt(templateId) : undefined,
  //           isFollowUp: false,
  //         });

  //         sentEmails.push(email);

  //         // Log this activity
  //         const activity = await storage.createActivity({
  //           userId,
  //           coachId: coach.id,
  //           type: "email_sent",
  //           description: `Email sent to Coach ${coach.firstName} ${coach.lastName}`,
  //           timestamp: new Date().toISOString(),
  //           metaData: {
  //             subject,
  //             emailId: email.id,
  //           },
  //         });

  //         activities.push(activity);

  //         // Update the coach status if it's the first contact
  //         if (coach.status === "Not Contacted") {
  //           await storage.updateCoach(coach.id, { status: "Contacted" });
  //         }
  //       } catch (error) {
  //         console.error(`Error sending email to ${coach.email}:`, error);
  //         // Continue with other emails even if one fails
  //       }
  //     }

  //     res
  //       .status(201)
  //       .json({ sent: sentEmails.length, emails: sentEmails, activities });
  //   } catch (error) {
  //     console.error("Error in send emails endpoint:", error);
  //     res.status(500).json({ message: "Error sending emails" });
  //   }
  // });

  // Delete email
  app.delete("/api/emails/:id", authenticateUser, async (req, res) => {
    try {
      // Require authentication
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          message: "Authentication required to delete emails",
          code: "AUTH_REQUIRED",
        });
      }

      const userId = req.user.id;
      const emailId = parseInt(req.params.id);

      // Get the email first to verify ownership
      const email = await storage.getEmail(emailId);

      if (!email) {
        return res.status(404).json({ message: "Email not found" });
      }

      // Verify the user owns this email
      if (email.userId !== userId) {
        return res
          .status(403)
          .json({ message: "You don't have permission to delete this email" });
      }

      // Delete the email
      const success = await storage.deleteEmail(emailId);

      if (!success) {
        return res.status(404).json({ message: "Email not found" });
      }

      res.status(200).json({ message: "Email deleted successfully" });
    } catch (error) {
      console.error("Error deleting email:", error);
      res.status(500).json({ message: "Error deleting email" });
    }
  });

  // Task Routes
  app.get("/api/tasks", authenticateUser, async (req, res) => {
    try {
      // Require authentication
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          message: "Authentication required to view tasks",
          code: "AUTH_REQUIRED",
        });
      }

      const userId = req.user.id;

      // Only filter by completion status if explicitly requested
      const filters: { userId: number; completed?: boolean } = { userId };
      if (req.query.completed !== undefined) {
        filters.completed = req.query.completed === "true";
      }

      const tasks = await storage.getTasks(filters);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Error fetching tasks" });
    }
  });

  app.post("/api/tasks", authenticateUser, async (req, res) => {
    try {
      // Get the user ID from the authenticated user
      const userId = req.user?.id || 1; // Fallback to 1 for development

      console.log("Creating task with userId:", userId);
      console.log("Request body:", req.body);

      // Simplify validation and explicitly add userId
      const taskData = {
        ...req.body,
        userId: userId,
        // Ensure completed is properly set
        completed: req.body.completed || false,
        // Convert dueDate string to Date object if needed
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : new Date(),
      };

      console.log("Final task data:", taskData);

      // Basic validation - only title and dueDate are required
      if (!taskData.title || !taskData.dueDate) {
        return res.status(400).json({
          message: "Invalid task data",
          errors: "Missing required fields (title, dueDate)",
        });
      }

      const task = await storage.createTask(taskData);

      // Log this activity - only include coachId in activity if it exists in the task
      await storage.createActivity({
        userId,
        ...(task.coachId ? { coachId: task.coachId } : {}),
        type: "task_created",
        description: `Created task: ${task.title}`,
        timestamp: new Date(), // Use a Date object, not string
        metaData: {
          dueDate: task.dueDate,
          type: task.type,
        },
      });

      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Error creating task" });
    }
  });

  app.put("/api/tasks/:id", authenticateUser, async (req, res) => {
    try {
      const userId = req.user?.id || 1; // Fallback to 1 for development
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Verify the user owns this task
      if (task.userId !== userId) {
        return res
          .status(403)
          .json({ message: "You don't have permission to update this task" });
      }

      // Make a copy of the request body to transform
      const updateData = { ...req.body };

      // If dueDate is being updated, ensure it's a Date object
      if (updateData.dueDate) {
        updateData.dueDate = new Date(updateData.dueDate);
      }

      const updatedTask = await storage.updateTask(taskId, updateData);

      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      // If the task was marked as completed, log an activity
      if (req.body.completed === true && task.completed === false) {
        await storage.createActivity({
          userId: task.userId,
          coachId: task.coachId,
          type: "task_completed",
          description: `Completed task: ${task.title}`,
          timestamp: new Date(), // Use Date object
          metaData: {
            taskId: task.id,
            type: task.type,
          },
        });
      }

      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Error updating task" });
    }
  });

  app.delete("/api/tasks/:id", authenticateUser, async (req, res) => {
    try {
      const userId = req.user?.id || 1; // Fallback to 1 for development
      const taskId = parseInt(req.params.id);

      // Get the task first to verify ownership
      const task = await storage.getTask(taskId);

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Verify the user owns this task
      if (task.userId !== userId) {
        return res
          .status(403)
          .json({ message: "You don't have permission to delete this task" });
      }

      const success = await storage.deleteTask(taskId);

      if (!success) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Error deleting task" });
    }
  });

  // Activity Routes
  app.get("/api/activities", authenticateUser, async (req, res) => {
    try {
      // Get the user ID from the authenticated user
      const userId = req.user ? req.user.id : undefined;

      console.log("Activities request - user info:", {
        authUser: req.user,
        userId,
        userIdType: typeof userId,
        isAuthenticated: !!req.user,
      });

      // Only use fallback in development mode
      let effectiveUserId = userId;
      if (effectiveUserId === undefined) {
        effectiveUserId = 1; // Fallback to 1 for development only
        console.log("Using fallback userId = 1 for development");
      }

      // If no user ID and not in development, reject the request
      if (effectiveUserId === undefined) {
        console.log("No user ID provided for activities request - rejecting");
        return res.status(401).json({
          message: "Unauthorized - must be logged in to view activities",
        });
      }

      // Parse the limit query parameter safely
      let limit: number | undefined = undefined;
      if (req.query.limit) {
        const parsedLimit = parseInt(req.query.limit as string);
        if (!isNaN(parsedLimit) && parsedLimit > 0) {
          limit = parsedLimit;
        }
      }

      console.log(
        "Fetching activities for userId:",
        effectiveUserId,
        "with limit:",
        limit,
      );

      // Ensure the userId is a number
      const numericUserId = Number(effectiveUserId);
      if (isNaN(numericUserId)) {
        console.error(
          `Invalid userId for activities: ${effectiveUserId} (Not a number)`,
        );
        return res.status(400).json({ message: "Invalid user ID format" });
      }

      const activities = await storage.getActivities({
        userId: numericUserId,
        limit,
      });

      console.log(
        `Retrieved ${activities.length} activities for user ${numericUserId}`,
      );

      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Error fetching activities" });
    }
  });

  // Dashboard Stats
  app.get("/api/stats", authenticateUser, async (req, res) => {
    try {
      // Get the user ID from the authenticated user
      const userId = req.user?.id || 1; // Fallback to 1 for development

      // Get all emails
      const emails = await storage.getEmails({ userId });

      // Filter out draft emails for sent count
      const sentEmails = emails.filter(
        (email) =>
          email.status !== "draft" &&
          email.status !== null &&
          (email.status === "sent" || email.status === "received"),
      );

      // For actual sending count, only count emails with status sent or replied
      const emailsSent = sentEmails.length;

      // Get responses (emails with status = 'replied')
      const responses = emails.filter(
        (email) => email.status === "received",
      ).length;

      // Calculate response rate
      const responseRate =
        sentEmails.length > 0
          ? Math.round((responses / sentEmails.length) * 100)
          : 0;

      // Get coaches contacted (unique coaches who received sent or replied emails)
      const coachIds = new Set(sentEmails.map((email) => email.coachId));
      const coachesContacted = coachIds.size;

      // Get follow-ups due (uncompleted tasks)
      const tasks = await storage.getTasks({ userId, completed: false });
      const followUpsDue = tasks.length;

      // Create the response object with corrected stats
      const statsResponse = {
        emailsSent,
        responses,
        responseRate,
        coachesContacted,
        followUpsDue,
      };

      res.json(statsResponse);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Error fetching stats" });
    }
  });

  // Email Routes

  // 1️⃣ Initiate Gmail OAuth flow
  // 1️⃣ Kick off OAuth
  app.get(
    "/api/gmail/auth",
    authenticateUser,
    async (req: Request, res: Response) => {
      const userId = req.user!.id;

      const host = req.get("host");
      const redirectUri = `https://${host}/api/auth/gmail/callback`;
      const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        redirectUri,
      );

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: [
          "https://www.googleapis.com/auth/gmail.send",
          "https://www.googleapis.com/auth/gmail.readonly",
        ],
        prompt: "consent",
        state: userId.toString(),
        include_granted_scopes: true,
      });

      res.json({ authUrl, isDemo: false });
    },
  );

  // 2️⃣ OAuth callback
  app.get("/api/auth/gmail/callback", async (req: Request, res: Response) => {
    const { code, state } = req.query;
    const userId = parseInt(state as string, 10);
    if (!code || !userId) {
      return res.redirect("/settings?tab=gmail&error=missing_code");
    }

    const host = req.get("host");
    const redirectUri = `https://${host}/api/auth/gmail/callback`;
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      redirectUri,
    );

    try {
      const { tokens } = await oauth2Client.getToken(code as string);
      const { access_token, refresh_token, expiry_date } = tokens;
      if (!access_token || !refresh_token || !expiry_date) {
        throw new Error("Missing tokens");
      }

      // Persist
      await storage.connectGmail(userId, {
        gmailAccessToken: access_token,
        gmailRefreshToken: refresh_token,
        gmailTokenExpiry: new Date(expiry_date),
      });

      await db.insert(activities).values({
        userId,
        type: "gmail_connected",
        description: "Connected Gmail account",
        timestamp: new Date(),
      });

      // back to your settings UI
      // after successful OAuth callback:
      res.redirect(`/settings?tab=gmail&connected=1`);
    } catch (err: any) {
      console.error("Gmail OAuth callback error:", err);
      res.redirect(
        `/settings?tab=gmail?error=${encodeURIComponent(err.message)}`,
      );
    }
  });

  // 3️⃣ Disconnect
  app.post(
    "/api/gmail/disconnect",
    authenticateUser,
    async (req: Request, res: Response) => {
      const userId = req.user!.id;
      try {
        await storage.disconnectGmail(userId);
        await db.insert(activities).values({
          userId,
          type: "gmail_disconnected",
          description: "Disconnected Gmail account",
          timestamp: new Date(),
        });
        res.json({ success: true });
      } catch (e) {
        console.error("Error disconnecting Gmail:", e);
        res.status(500).json({ message: "Error disconnecting Gmail" });
      }
    },
  );

  // Get all emails for a user (both sent and received)
  app.get(
    "/api/emails",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        // Check if we're in development mode (using fixed userID) or have auth req.user
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const direction = req.query.direction as string | undefined;
        const filters: { userId: number; direction?: string } = { userId };

        if (direction) {
          filters.direction = direction;
        }

        // Get emails from storage
        const emails = await storage.getEmails(filters);

        // For each email, fetch the coach information to include in response
        const emailsWithCoaches = await Promise.all(
          emails.map(async (email) => {
            const coach = await storage.getCoach(email.coachId);
            return {
              ...email,
              coach,
            };
          }),
        );

        res.json(emailsWithCoaches);
      } catch (error) {
        console.error("Error fetching emails:", error);
        res.status(500).json({ message: "Error fetching emails" });
      }
    },
  );

  // Get a specific email by ID
  app.get(
    "/api/emails/:id",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const emailId = parseInt(req.params.id);
        const email = await storage.getEmail(emailId);

        if (!email) {
          return res.status(404).json({ message: "Email not found" });
        }

        // Make sure this email belongs to the current user
        if (email.userId !== userId) {
          return res
            .status(403)
            .json({ message: "Not authorized to access this email" });
        }

        // Get the coach information
        const coach = await storage.getCoach(email.coachId);

        res.json({
          ...email,
          coach,
        });
      } catch (error) {
        console.error("Error fetching email:", error);
        res.status(500).json({ message: "Error fetching email" });
      }
    },
  );

  // Send an email to a coach
  app.post(
    "/api/emails/send",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        // Validate the request body
        const emailSchema = z.object({
          coachId: z.number(),
          subject: z.string().min(1, "Subject is required"),
          body: z.string().min(1, "Email body is required"),
          templateId: z.number().optional(),
          isFollowUp: z.boolean().optional(),
          followUpDays: z.number().optional(),
        });

        const { data, error } = validateRequest(emailSchema, req.body);

        if (error) {
          return res
            .status(400)
            .json({ message: "Invalid email data", errors: error });
        }

        // Get the user and coach
        const user = await storage.getUser(userId);
        const coach = await storage.getCoach(data.coachId);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        if (!coach) {
          return res.status(404).json({ message: "Coach not found" });
        }

        // Send the email using our email service
        const result = await EmailService.sendEmail({
          from: user.email,
          to: coach.email,
          subject: data.subject,
          html: data.body,
          userId,
          coachId: coach.id,
          templateId: data.templateId,
          isFollowUp: data.isFollowUp,
          followUpDays: data.followUpDays,
        });

        if (!result.success) {
          return res.status(500).json({
            message: "Failed to send email",
            error: result.error,
          });
        }

        // Create an activity record for this email
        await storage.createActivity({
          userId,
          coachId: coach.id,
          type: "email_sent",
          description: `Email sent to ${coach.firstName} ${coach.lastName}`,
          timestamp: new Date(),
          metaData: {
            emailId: result.emailId,
            subject: data.subject,
          },
        });

        // Update coach status if this is a saved coach
        const savedCoach = await storage.getSavedCoachByUserAndCoach(
          userId,
          coach.id,
        );
        if (savedCoach && savedCoach.status === "Not Contacted") {
          await storage.updateSavedCoach(savedCoach.id, {
            status: "Contacted",
          });
        }

        // Get the newly created email with the coach info
        const email = await storage.getEmail(result.emailId!);

        res.json({
          ...email,
          coach,
          message: "Email sent successfully",
        });
      } catch (error) {
        console.error("Error sending email:", error);
        res
          .status(500)
          .json({ message: "Error sending email", error: String(error) });
      }
    },
  );

  // 1.1: Save as draft
  app.post(
    "/api/emails/draft",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const userId = req.user!.id;
        const { coachId, subject, body, templateId, isFollowUp, followUpDays } =
          req.body;

        // Basic validation
        if (!coachId || !subject || !body) {
          return res.status(400).json({ message: "Missing required fields" });
        }

        const coach = await storage.getCoach(coachId);

        if (!coach) {
          return res.status(404).json({ message: "Coach not found" });
        }

        // Save the draft email in the database
        const email = await storage.createEmail({
          userId,
          coachId,
          subject,
          body,
          sentAt: new Date(),
          status: "draft",
          direction: "outbound",
          templateId: templateId ? parseInt(templateId) : undefined,
          isFollowUp: !!isFollowUp,
          scheduledFor:
            isFollowUp && followUpDays
              ? new Date(Date.now() + followUpDays * 86400000)
              : null,
        });

        // create activity
        await storage.createActivity({
          userId,
          coachId,
          type: "email_drafted",
          description: `Saved draft email to ${coach.firstName} ${coach.lastName}`,
          timestamp: new Date(),
          metaData: {
            emailId: email.id,
            subject,
          },
        });

        return res.status(201).json(email);
      } catch (err: any) {
        console.error("Error saving draft:", err);
        return res
          .status(500)
          .json({ message: "Could not save draft", error: err.message });
      }
    },
  );

  app.post(
    "/api/emails/replies/draft",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const userId = req.user!.id;
        const {
          coachId,
          subject,
          body,
          templateId,
          isFollowUp,
          followUpDays,
          gmailThreadId,
        } = req.body;

        // Basic validation
        if (!coachId || !subject || !body) {
          return res.status(400).json({ message: "Missing required fields" });
        }

        if (!gmailThreadId) {
          return res.status(400).json({ message: "Missing gmailThreadId" });
        }

        const coach = await storage.getCoach(coachId);

        if (!coach) {
          return res.status(404).json({ message: "Coach not found" });
        }

        // Save the draft email in the database
        const [draftEmail] = await db
          .insert(emails)
          .values({
            userId,
            coachId,
            subject,
            body,
            sentAt: new Date(),
            status: "draft",
            direction: "outbound",
            templateId: templateId ? parseInt(templateId) : undefined,
            isFollowUp: !!isFollowUp,
            gmailThreadId,
            scheduledFor:
              isFollowUp && followUpDays
                ? new Date(Date.now() + followUpDays * 86400000)
                : null,
          })
          .returning();

        // create activity
        await storage.createActivity({
          userId,
          coachId,
          type: "email_drafted",
          description: `Saved draft email to ${coach.firstName} ${coach.lastName}`,
          timestamp: new Date(),
          metaData: {
            emailId: draftEmail.id,
            subject,
          },
        });

        return res.status(201).json(draftEmail);
      } catch (err: any) {
        console.error("Error saving draft:", err);
        return res
          .status(500)
          .json({ message: "Could not save draft", error: err.message });
      }
    },
  );

  // server/routes.ts (or wherever your import endpoint lives)

  app.post(
    "/api/emails/import-gmail-responses",
    authenticateUser,
    async (req, res) => {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (
        !user.gmailAccessToken ||
        !user.gmailRefreshToken ||
        !user.gmailTokenExpiry
      ) {
        return res.status(400).json({ message: "Gmail not connected" });
      }

      const gmail = createGmailClientForUser({
        gmailAccessToken: user.gmailAccessToken!,
        gmailRefreshToken: user.gmailRefreshToken!,
        gmailTokenExpiry: user.gmailTokenExpiry!,
      });

      const sentThreads = await storage.getThreads(userId);
      let imported = 0;

      for (const sent of sentThreads) {
        const thread = await gmail.users.threads.get({
          userId: "me",
          id: sent.gmailThreadId!,
        });
        const replies = thread.data.messages?.slice(1) || [];
        const coach = await storage.getCoach(sent.coachId);

        for (const msg of replies) {
          const gmailId = msg.id!;
          const rawHtml = extractHtmlFromPayload(msg.payload!);
          const cleanHtml = stripGmailQuote(rawHtml);
          const rawText = extractTextFromPayload(msg.payload!);
          const cleanText = stripEmailHistory(rawText);
          const subject =
            msg.payload!.headers!.find((h) => h.name === "Subject")?.value ||
            sent.subject;

          console.log("Importing email:", cleanText);

          const result = await EmailService.recordReceivedEmail({
            to: user.email!,
            from: coach?.email || "",
            subject,
            html: cleanHtml,
            text: cleanText,
            userId,
            coachId: sent.coachId,
            receivedAt: new Date(+msg.internalDate!),
            gmailMessageId: gmailId,
            gmailThreadId: sent.gmailThreadId!,
          });

          if (result.success && !result.skipped) {
            imported++;
          }
        }
      }

      res.json({ message: "Imported replies", imported });
    },
  );

  app.post(
    "/api/emails/replies/send",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        // validate payload
        const schema = z.object({
          coachId: z.number(),
          subject: z.string().min(1),
          body: z.string().min(1),
          templateId: z.number().optional(),
          isFollowUp: z.boolean().optional(),
          followUpDays: z.number().optional(),
          gmailThreadId: z.string().min(1),
        });

        const { data, error } = validateRequest(schema, req.body);
        if (error) {
          return res
            .status(400)
            .json({ message: "Invalid data", errors: error });
        }

        // dispatch the reply
        const result = await EmailService.replyEmail({
          from: req.user!.email!,
          to: (await storage.getCoach(data.coachId))?.email!,
          userId,
          coachId: data.coachId,
          subject: data.subject,
          html: data.body,
          templateId: data.templateId,
          isFollowUp: data.isFollowUp,
          followUpDays: data.followUpDays,
          gmailThreadId: data.gmailThreadId,
        });

        if (!result.success) {
          return res
            .status(500)
            .json({ message: "Reply failed", error: result.error });
        }

        // log activity
        await storage.createActivity({
          userId,
          coachId: data.coachId,
          type: "email_reply",
          description: `Replied to ${data.coachId} in thread ${data.gmailThreadId}`,
          timestamp: new Date(),
          metaData: { emailId: result.emailId, threadId: data.gmailThreadId },
        });

        // fetch the saved reply
        const email = await storage.getEmail(result.emailId!);
        res.json({ ...email, message: "Reply sent" });
      } catch (err: any) {
        console.error("Error sending reply:", err);
        res.status(500).json({ message: "Server error", error: err.message });
      }
    },
  );

  // Import email responses (in a real app this would be a webhook)
  app.post(
    "/api/emails/import-responses",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;

        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        // This endpoint would typically be called by an admin or a webhook
        // In a real implementation, add proper authorization beyond just being logged in

        // Validate the request body
        const responseSchema = z.object({
          responses: z.array(
            z.object({
              to: z.string().email("Invalid recipient email"),
              from: z.string().email("Invalid sender email"),
              subject: z.string(),
              body: z.string(),
              textBody: z.string().optional(),
              date: z.string().optional(),
            }),
          ),
        });

        const { data, error } = validateRequest(responseSchema, req.body);

        if (error) {
          return res
            .status(400)
            .json({ message: "Invalid response data", errors: error });
        }

        // Import the email responses
        const result = await EmailService.importEmailResponses(data.responses);

        if (!result.success) {
          return res.status(500).json({
            message: "Failed to import email responses",
            imported: result.imported,
            errors: result.errors,
          });
        }

        res.json({
          message: "Email responses imported successfully",
          imported: result.imported,
          errors: result.errors,
        });
      } catch (error) {
        console.error("Error importing email responses:", error);
        res.status(500).json({
          message: "Error importing email responses",
          error: String(error),
        });
      }
    },
  );

  // Test webhook endpoint - useful for local testing of the webhook functionality
  app.get(
    "/api/webhook-test",
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        console.log("Starting webhook test...");

        // Get the first user and coach from the database for testing
        const usersResult = await db.select().from(users).limit(1);
        const coachesResult = await db.select().from(coaches).limit(1);

        const user = usersResult[0];
        let coach = coachesResult[0];

        console.log("Found test user and coach:", {
          userId: user?.id,
          userEmail: user?.email,
          coachId: coach?.id,
          coachEmail: coach?.email,
          coachName: coach
            ? `${coach.firstName} ${coach.lastName}`
            : "Not found",
        });

        if (!user || !coach) {
          console.log("No users or coaches found for testing");
          return res
            .status(404)
            .json({ message: "No users or coaches found for testing" });
        }

        // Need to make sure the coach has an email
        if (!coach.email) {
          // Update the coach with a test email
          const updatedCoach = await storage.updateCoach(coach.id, {
            email: `${coach.firstName.toLowerCase()}.${coach.lastName.toLowerCase()}@${coach.school.toLowerCase().replace(/\s+/g, "")}.edu`,
          });

          console.log(`Updated coach with email: ${updatedCoach?.email}`);

          // Use the updated coach
          if (updatedCoach) {
            coach = updatedCoach;
          }
        }

        // Create a sample email that would come from SendGrid webhook
        const testEmailData = {
          from: `${coach.firstName} ${coach.lastName} <${coach.email || "coach@example.edu"}>`,
          to: user.email,
          subject: "Test Webhook Response",
          body: `<p>This is a test response from ${coach.firstName} ${coach.lastName} at ${coach.school}.</p>
               <p>Thank you for your interest in our program!</p>`,
          html: `<p>This is a test response from ${coach.firstName} ${coach.lastName} at ${coach.school}.</p>
               <p>Thank you for your interest in our program!</p>`,
          text: `This is a test response from ${coach.firstName} ${coach.lastName} at ${coach.school}.
               Thank you for your interest in our program!`,
          date: new Date(),
        };

        console.log("Created test email data:", testEmailData);

        // Process the test email
        const result = await EmailService.importEmailResponses([testEmailData]);

        console.log("Webhook test result:", result);

        // Return data in the response
        const responseData = {
          message: "Test webhook processed",
          result,
          testEmailData,
        };

        console.log("Sending response:", responseData);

        // Send response with explicit content type
        res.contentType("application/json");
        res.send(JSON.stringify(responseData));
      } catch (error) {
        console.error("Error processing test webhook:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    },
  );

  const httpServer = createServer(app);
  return httpServer;
}
