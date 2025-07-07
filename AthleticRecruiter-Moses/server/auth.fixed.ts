import { Express, Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import { storage } from "./storage";
import { db } from "./db";
import { activities } from "@shared/schema";

// Initialize Firebase Admin SDK with a fallback for development
export function initializeFirebaseAdmin() {
  // In development mode, we'll only initialize Firebase Admin if credentials are available
  // but we'll still allow the app to run without it for easier development
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasCredentials = process.env.FIREBASE_ADMIN_PRIVATE_KEY && process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  
  if (isDevelopment && !hasCredentials) {
    console.log('Running in development mode - skipping Firebase Admin initialization due to missing credentials');
    return; // Skip Firebase Admin initialization in development
  }
  
  if (!hasCredentials) {
    console.log('Missing Firebase Admin credentials, will use fallback authentication');
    return;
  }
  
  try {
    // Only initialize if not already initialized
    if (!admin.apps.length) {
      // Handle backslash escape in the private key from environment variables
      let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
      
      // When stored in environment variables, newlines can be escaped as \\n, so we need to convert them
      if (privateKey && privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
          privateKey: privateKey,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        }),
        // Add any other Firebase services you need here
      });
      
      console.log('Firebase Admin SDK initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
  }
}

// Helper function to create a user from a Firebase token
async function createUserFromFirebaseToken(decodedToken: admin.auth.DecodedIdToken) {
  const { uid, email, name } = decodedToken;
  
  // Extract first and last name from Firebase name if available
  let firstName = '';
  let lastName = '';
  
  if (name) {
    const nameParts = name.split(' ');
    firstName = nameParts[0] || '';
    lastName = nameParts.slice(1).join(' ') || '';
  }
  
  // Log the new user creation
  console.log('Creating new user from Firebase token:', {
    uid,
    email,
    name,
    extractedName: `${firstName} ${lastName}`
  });
  
  const newUser = {
    firebaseUid: uid,
    email: email || '',
    firstName: firstName,
    lastName: lastName,
    username: email?.split('@')[0] || `user_${Date.now()}`,
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
    avatar: null
  };
  
  try {
    // Create the user in the database
    const user = await storage.createUser(newUser);
    console.log('New user created successfully:', { id: user.id, email: user.email });
    
    // Log the activity
    try {
      await db.insert(activities).values({
        userId: user.id,
        type: 'account',
        description: 'Created account',
        timestamp: new Date(),
        metaData: { 
          method: 'social',
          provider: name ? 'Google' : 'Apple' // Simple heuristic
        }
      });
    } catch (activityError) {
      console.error('Failed to create activity for new user registration:', activityError);
      // Non-blocking - continue even if activity creation fails
    }
    
    return user;
  } catch (createError) {
    console.error('Error creating new user in database:', createError);
    throw createError;
  }
}

// Authentication middleware for protected routes
export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  // Check for user data in session or development mode
  if (req.user) {
    return next(); // User is already authenticated
  }
  
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN" format
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token provided' });
    }
    
    // In development mode, we'll use a fallback if Firebase Admin isn't initialized
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!admin.apps.length) {
      if (isDevelopment) {
        // For development, we'll use a fallback user
        req.user = {
          id: 1,
          firebaseUid: 'dev-user-id',
          email: 'demo@example.com'
        };
        
        return next();
      } else {
        // In production, Firebase Admin must be initialized
        return res.status(500).json({ message: 'Authentication service unavailable' });
      }
    }
    
    // Verify token with Firebase Admin
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const { uid } = decodedToken;
      
      // Get user from database
      const user = await storage.getUserByFirebaseUid(uid);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Set user data on request object
      req.user = {
        id: user.id,
        firebaseUid: user.firebaseUid,
        email: user.email
      };
      
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      
      // In development mode, we'll use a fallback if token verification fails
      if (isDevelopment) {
        console.log('Development mode - using fallback user authentication');
        
        req.user = {
          id: 1,
          firebaseUid: 'dev-user-id',
          email: 'demo@example.com'
        };
        
        return next();
      }
      
      return res.status(401).json({ message: 'Invalid authentication token' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
}

export function setupAuthRoutes(app: Express) {
  // Verify Firebase token
  app.post('/api/auth/verify-token', async (req: Request, res: Response) => {
    try {
      const { idToken } = req.body;
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      // For automatic dev mode, check for query parameter
      const isDev = isDevelopment && (req.query.dev === 'true' || req.headers['x-dev-mode'] === 'true');
      
      // Debug the token and environment
      console.log('Token verification request:', {
        hasToken: !!idToken,
        tokenLength: idToken ? idToken.length : 0,
        isDevelopment,
        isDev,
        firebaseInitialized: !!admin.apps.length,
        url: req.url,
        query: req.query
      });
      
      // If we got a valid token, always try to use it first regardless of environment
      if (idToken && admin.apps.length) {
        try {
          console.log('Attempting to verify Firebase token...');
          const decodedToken = await admin.auth().verifyIdToken(idToken);
          console.log('Successfully verified token for UID:', decodedToken.uid);
          
          // Check if user exists in our database
          let user = await storage.getUserByFirebaseUid(decodedToken.uid);
          
          if (!user) {
            // Create a new user if they don't exist
            console.log('No existing user found for UID:', decodedToken.uid);
            user = await createUserFromFirebaseToken(decodedToken);
          } else {
            console.log('Found existing user in database for UID:', decodedToken.uid);
          }
          
          return res.status(200).json(user);
        } catch (error: any) {
          console.error('Error verifying Firebase token:', error.message);
          // If we're in production, we'll fail here
          // In development, we'll fall through to the fallbacks below
          if (!isDevelopment) {
            return res.status(401).json({ 
              message: 'Invalid authentication token',
              error: error.message
            });
          }
        }
      }
      
      // DEVELOPMENT FALLBACKS - Only used if token verification failed
      if (isDevelopment) {
        console.log('Using development fallback authentication');
        
        // For development, we'll use the provided UID or a default
        const uid = req.body.uid || 'dev-user-id';
        
        try {
          // Try to get existing user
          let user = await storage.getUserByFirebaseUid(uid);
          
          if (!user) {
            // If database query fails or user doesn't exist, use in-memory mock
            console.log(`Creating new demo user with uid: ${uid}`);
            
            // Create a new development user
            const newUser = {
              firebaseUid: uid,
              email: 'demo@example.com',
              firstName: 'Demo',
              lastName: 'Athlete',
              username: `demo_${Date.now()}`,
              sport: 'Basketball',
              graduationYear: 2025,
              position: 'Point Guard',
              height: '6\'1"',
              gpa: '3.8',
              testScores: '1400 SAT',
              academicHonors: 'Honor Roll',
              bio: 'Demo athlete for testing',
              highlights: 'Captain of JV team',
              stats: { 'PPG': '15.5', 'APG': '4.2' },
              intendedMajor: 'Computer Science',
              location: 'Los Angeles, CA',
              schoolSize: 'Medium',
              gender: null,
              programLevel: null
            };
            
            // In case database is working, try to persist the user
            try {
              user = await storage.createUser(newUser);
            } catch (dbError) {
              console.error('Database error during user creation:', dbError);
              // Continue with a mock user object
              user = {
                id: 1,
                firebaseUid: uid,
                email: newUser.email,
                username: newUser.username,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                gender: newUser.gender,
                sport: newUser.sport,
                graduationYear: newUser.graduationYear,
                position: newUser.position,
                height: newUser.height,
                gpa: newUser.gpa,
                testScores: newUser.testScores,
                academicHonors: newUser.academicHonors,
                bio: newUser.bio,
                highlights: newUser.highlights,
                stats: newUser.stats,
                intendedMajor: newUser.intendedMajor,
                location: newUser.location,
                schoolSize: newUser.schoolSize,
                programLevel: newUser.programLevel,
                keyStats: null,
                avatar: null,
                createdAt: new Date()
              };
            }
          }
          
          // Return user info
          return res.status(200).json(user);
        } catch (error) {
          console.error('Error during mock authentication:', error);
          
          // Even if database fails, provide a fallback user
          const fallbackUser = {
            id: 1,
            firebaseUid: uid,
            email: 'demo@example.com',
            firstName: 'Demo',
            lastName: 'Athlete'
          };
          
          return res.status(200).json(fallbackUser);
        }
      } 
      
      // If we get here, we're in production and nothing worked
      return res.status(401).json({ message: 'Invalid token or missing authentication credentials' });
    } catch (error) {
      console.error('General authentication error:', error);
      return res.status(500).json({ message: 'Authentication error' });
    }
  });
  
  // Sign out
  app.post('/api/auth/signout', (req: Request & { session?: any }, res: Response) => {
    if (req.session) {
      req.session.destroy((err: Error) => {
        if (err) {
          return res.status(500).json({ message: 'Failed to sign out' });
        }
        res.clearCookie('connect.sid');
        return res.status(200).json({ message: 'Signed out successfully' });
      });
    } else {
      // If no session exists (development mode fallback)
      return res.status(200).json({ message: 'Signed out successfully' });
    }
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