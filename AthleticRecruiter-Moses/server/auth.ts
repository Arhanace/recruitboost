import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { activities } from "@shared/schema";
import admin from "./firebaseAdmin";

// Helper function to create a user from a Firebase token
async function createUserFromFirebaseToken(
  decodedToken: admin.auth.DecodedIdToken,
) {
  const { uid, email, name } = decodedToken;

  console.log("🔑 FULL TOKEN DETAILS:", JSON.stringify(decodedToken, null, 2));

  // First check if user already exists (double-check to avoid duplicates)
  try {
    console.log("Checking if user exists for UID:", uid);
    const existingUser = await storage.getUserByFirebaseUid(uid);
    if (existingUser) {
      console.log(
        "✅ USER ALREADY EXISTS in database, returning user ID:",
        existingUser.id,
      );
      return existingUser;
    } else {
      console.log("👤 No existing user found for UID:", uid);
    }
  } catch (err) {
    console.error("❌ Error checking for existing user:", err);
    // Continue with user creation attempt
  }

  // Extract first and last name from Firebase name if available
  let firstName = "";
  let lastName = "";

  if (name) {
    const nameParts = name.split(" ");
    firstName = nameParts[0] || "";
    lastName = nameParts.slice(1).join(" ") || "";
  }

  // For Google auth, try to get name from other properties if not in name field
  if (decodedToken.firebase?.sign_in_provider === "google.com") {
    console.log(
      "Google auth provider detected, checking for additional profile info",
    );

    // Try to get name from Firebase claims
    if (decodedToken.name) {
      const parts = decodedToken.name.split(" ");
      firstName = firstName || parts[0] || "";
      lastName = lastName || parts.slice(1).join(" ") || "";
    }

    // Try explicit given/family name fields
    if (decodedToken.given_name) {
      firstName = firstName || decodedToken.given_name;
    }

    if (decodedToken.family_name) {
      lastName = lastName || decodedToken.family_name;
    }

    // Try picture field for avatar
    const avatar = decodedToken.picture || null;

    console.log("Extracted Google profile data:", {
      firstName,
      lastName,
      avatar,
    });
  }

  // Generate a unique username from email or UID
  let username = "";
  if (email) {
    // Remove special characters and everything after @
    username = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
  } else {
    // Use UID if no email
    username = `user_${uid.substring(0, 8)}`;
  }

  // Add random suffix to ensure uniqueness
  username = `${username}_${Math.floor(Math.random() * 1000)}`;

  // Log the new user creation
  console.log("🆕 CREATING NEW USER from Firebase token:", {
    uid,
    email,
    name,
    extractedName: `${firstName} ${lastName}`,
    username,
    provider: decodedToken.firebase?.sign_in_provider,
  });

  const newUser = {
    firebaseUid: uid,
    email: email || "",
    firstName: firstName || "New",
    lastName: lastName || "User",
    username: username,
    sport: null,
    graduationYear: null,
    position: null,
    height: null,
    gpa: null,
    testScores: null,
    academicHonors: null,
    bio: null,
    highlights: null,
    stats: null,
    intendedMajor: null,
    location: null,
    schoolSize: null,
    programLevel: null,
    gender: null,
    keyStats: null,
    avatar: decodedToken.picture || null,
  };

  try {
    // Create the user in the database
    const user = await storage.createUser(newUser);
    console.log("New user created successfully:", {
      id: user.id,
      email: user.email,
    });

    // Log the activity
    try {
      await db.insert(activities).values({
        userId: user.id,
        type: "account",
        description: "Created account",
        timestamp: new Date(),
        metaData: {
          method: "social",
          provider: name ? "Google" : "Apple", // Simple heuristic
        },
      });
    } catch (activityError) {
      console.error(
        "Failed to create activity for new user registration:",
        activityError,
      );
      // Non-blocking - continue even if activity creation fails
    }

    return user;
  } catch (createError) {
    console.error("Error creating new user in database:", createError);
    throw createError;
  }
}

// Authentication middleware for protected routes
export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No auth token provided" });
  }

  const token = authHeader.replace(/^Bearer\s+/, "");
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const user = await storage.getUserByFirebaseUid(decoded.uid);
    if (!user) {
      // createUserFromFirebaseToken can live here
      const newUser = await createUserFromFirebaseToken(decoded);

      req.user = {
        id: newUser.id,
        firebaseUid: newUser.firebaseUid,
        email: newUser.email,
      };
    } else {
      req.user = {
        id: user.id,
        firebaseUid: user.firebaseUid,
        email: user.email,
      };
    }
    return next();
  } catch (err) {
    console.error("❌ Token verification failed:", err);
    return res.status(401).json({ message: "Invalid auth token" });
  }
}

export function setupAuthRoutes(app: Express) {
  app.post("/api/auth/verify-token", authenticateUser, (req, res) => {
    // At this point req.user is populated
    res.status(200).json(req.user);
  });

  app.post("/api/auth/signout", (req, res) => {
    req.session?.destroy((err) => {
      if (err) return res.status(500).json({ message: "Sign-out failed" });
      res.clearCookie("connect.sid");
      res.json({ message: "Signed out" });
    });
  });

  app.post("/api/auth/firebase/google", async (req, res) => {
    // This just creates or returns your user by UID/email/name
    const { uid, email, name, photo } = req.body;
    if (!uid || !email || !name) {
      return res.status(400).json({ message: "Missing uid/email/name" });
    }
    let user = await storage.getUserByFirebaseUid(uid);
    if (!user) {
      user = await storage.createUser({
        firebaseUid: uid,
        email,
        firstName: name.split(" ")[0],
        lastName: name.split(" ").slice(1).join(" "),
        avatar: photo,
        // gmailAccessToken,
        // gmailRefreshToken,
        // gmailTokenExpiry: expiry,
      });
      await db.insert(activities).values({
        userId: user.id,
        type: "account",
        description: "Created via Google",
        timestamp: new Date(),
      });
    } else {
      // user = await storage.addAccessToken(user.id, gmailAccessToken);
    }
    res.json(user);
  });
}

// Add type definition for the user object on the request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        firebaseUid: string;
        email?: string;
      };
      session?: any;
    }
  }
}
