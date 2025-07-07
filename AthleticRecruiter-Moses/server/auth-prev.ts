// import { Express, Request, Response, NextFunction } from "express";
// import { storage } from "./storage";
// import { db } from "./db";
// import { activities } from "@shared/schema";
// import admin from './firebaseAdmin';   // ← default import
// // Initialize Firebase Admin SDK with a fallback for development
// export function initializeFirebaseAdmin() {
//   // In development mode, we'll only initialize Firebase Admin if credentials are available
//   // but we'll still allow the app to run without it for easier development
//   const isDevelopment = process.env.NODE_ENV === 'development';
//   const hasCredentials = true;


//   if (isDevelopment && !hasCredentials) {
//     console.log('Running in development mode - skipping Firebase Admin initialization due to missing credentials');
//     return; // Skip Firebase Admin initialization in development
//   }

//   if (!hasCredentials) {
//     console.log('Missing Firebase Admin credentials, will use fallback authentication');
//     return;
//   }

//   try {
//     // Only initialize if not already initialized
//     if (!admin.apps.length) {
//       // Handle backslash escape in the private key from environment variables
//       let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

//       // When stored in environment variables, newlines can be escaped as \\n, so we need to convert them
//       if (privateKey && privateKey.includes('\\n')) {
//         privateKey = privateKey.replace(/\\n/g, '\n');
//       }

//       admin.initializeApp({
//         credential: admin.credential.cert({
//           projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
//           privateKey: privateKey,
//           clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
//         }),
//         // Add any other Firebase services you need here
//       });

//       console.log('Firebase Admin SDK initialized successfully');
//     }
//   } catch (error) {
//     console.error('Error initializing Firebase Admin SDK:', error);
//   }
// }

// // Helper function to create a user from a Firebase token
// async function createUserFromFirebaseToken(decodedToken: admin.auth.DecodedIdToken) {
//   const { uid, email, name } = decodedToken;

//   console.log('🔑 FULL TOKEN DETAILS:', JSON.stringify(decodedToken, null, 2));

//   // First check if user already exists (double-check to avoid duplicates)
//   try {
//     console.log('Checking if user exists for UID:', uid);
//     const existingUser = await storage.getUserByFirebaseUid(uid);
//     if (existingUser) {
//       console.log('✅ USER ALREADY EXISTS in database, returning user ID:', existingUser.id);
//       return existingUser;
//     } else {
//       console.log('👤 No existing user found for UID:', uid);
//     }
//   } catch (err) {
//     console.error('❌ Error checking for existing user:', err);
//     // Continue with user creation attempt
//   }

//   // Extract first and last name from Firebase name if available
//   let firstName = '';
//   let lastName = '';

//   if (name) {
//     const nameParts = name.split(' ');
//     firstName = nameParts[0] || '';
//     lastName = nameParts.slice(1).join(' ') || '';
//   }

//   // For Google auth, try to get name from other properties if not in name field
//   if (decodedToken.firebase?.sign_in_provider === 'google.com') {
//     console.log('Google auth provider detected, checking for additional profile info');

//     // Try to get name from Firebase claims
//     if (decodedToken.name) {
//       const parts = decodedToken.name.split(' ');
//       firstName = firstName || parts[0] || '';
//       lastName = lastName || parts.slice(1).join(' ') || '';
//     }

//     // Try explicit given/family name fields
//     if (decodedToken.given_name) {
//       firstName = firstName || decodedToken.given_name;
//     }

//     if (decodedToken.family_name) {
//       lastName = lastName || decodedToken.family_name;
//     }

//     // Try picture field for avatar
//     const avatar = decodedToken.picture || null;

//     console.log('Extracted Google profile data:', { firstName, lastName, avatar });
//   }

//   // Generate a unique username from email or UID
//   let username = '';
//   if (email) {
//     // Remove special characters and everything after @
//     username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
//   } else {
//     // Use UID if no email
//     username = `user_${uid.substring(0, 8)}`;
//   }

//   // Add random suffix to ensure uniqueness
//   username = `${username}_${Math.floor(Math.random() * 1000)}`;

//   // Log the new user creation
//   console.log('🆕 CREATING NEW USER from Firebase token:', {
//     uid,
//     email,
//     name,
//     extractedName: `${firstName} ${lastName}`,
//     username,
//     provider: decodedToken.firebase?.sign_in_provider
//   });

//   const newUser = {
//     firebaseUid: uid,
//     email: email || '',
//     firstName: firstName || 'New',
//     lastName: lastName || 'User',
//     username: username,
//     sport: null,
//     graduationYear: null,
//     position: null,
//     height: null,
//     gpa: null,
//     testScores: null,
//     academicHonors: null,
//     bio: null,
//     highlights: null,
//     stats: null,
//     intendedMajor: null,
//     location: null,
//     schoolSize: null,
//     programLevel: null,
//     gender: null,
//     keyStats: null,
//     avatar: decodedToken.picture || null
//   };

//   try {
//     // Create the user in the database
//     const user = await storage.createUser(newUser);
//     console.log('New user created successfully:', { id: user.id, email: user.email });

//     // Log the activity
//     try {
//       await db.insert(activities).values({
//         userId: user.id,
//         type: 'account',
//         description: 'Created account',
//         timestamp: new Date(),
//         metaData: { 
//           method: 'social',
//           provider: name ? 'Google' : 'Apple' // Simple heuristic
//         }
//       });
//     } catch (activityError) {
//       console.error('Failed to create activity for new user registration:', activityError);
//       // Non-blocking - continue even if activity creation fails
//     }

//     return user;
//   } catch (createError) {
//     console.error('Error creating new user in database:', createError);
//     throw createError;
//   }
// }

// // Authentication middleware for protected routes
// export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
//   // Check for user data in session or development mode
//   if (req.user) {
//     return next(); // User is already authenticated
//   }

//   try {
//     // Check for fallback authentication header (used for domain not in Firebase allowlist)
//     const isFallbackAuth = req.headers['x-auth-fallback'] === 'true';

//     // Get token from Authorization header
//     const authHeader = req.headers.authorization;
//     const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN" format

//     // In development mode, we'll use a fallback if needed
//     const isDevelopment = process.env.NODE_ENV === 'development';
//     const useDevFallback = isDevelopment && (req.query.dev === 'true' || req.headers['x-dev-mode'] === 'true');

//     // Debug info
//     console.log('Authentication request:', {
//       hasAuthHeader: !!authHeader,
//       hasToken: !!token,
//       isFallbackAuth,
//       isDev: useDevFallback,
//       url: req.url
//     });

//     // CASE 1: Check for token authentication
//     if (token) {
//       // Only try to verify the token if Firebase is initialized
//       if (admin.apps.length) {
//         try {
//           // Normal token verification path
//           const decodedToken = await admin.auth().verifyIdToken(token);
//           const { uid } = decodedToken;

//           // Get user from database
//           const user = await storage.getUserByFirebaseUid(uid);

//           if (!user) {
//             return res.status(401).json({ message: 'User not found' });
//           }

//           // Set user data on request object
//           req.user = {
//             id: user.id,
//             firebaseUid: user.firebaseUid,
//             email: user.email
//           };

//           return next();
//         } catch (tokenError) {
//           // Enhanced error logging for token verification failures
//           console.error('Token verification error:', tokenError);

//           // Cast the unknown error to a more specific type for logging
//           const errorDetails = tokenError as { message?: string; code?: string };

//           console.log('Token verification failed with details:', {
//             error: errorDetails.message || String(tokenError),
//             code: errorDetails.code,
//             tokenLength: token?.length || 0,
//             url: req.url,
//             isReplitDomain: req.hostname.includes('.replit.app') || req.hostname.includes('.replit.dev'),
//             isFallbackAuth
//           });

//           // Check if we're on a known Replit domain that should be authorized
//           const isKnownReplitDomain = req.hostname === 'athletic-recruiter-1-stochast1c.replit.app' || 
//                                      req.hostname === 'athletic-recruiter-1-Stochast1c.replit.app';

//           // For known Replit domains, try to extract the UID from the token if possible
//           if (isKnownReplitDomain && token) {
//             try {
//               // Try to decode the token without verification
//               // This is a fallback mechanism that's only used when regular verification fails
//               console.log('Attempting alternative token handling for known Replit domain');

//               // Get UID from authorization header if available
//               const authHeader = req.headers.authorization;
//               const uidFromHeader = req.headers['x-firebase-uid'] as string;

//               if (uidFromHeader) {
//                 console.log('Using UID from X-Firebase-UID header:', uidFromHeader);
//                 const user = await storage.getUserByFirebaseUid(uidFromHeader);

//                 if (user) {
//                   console.log('User found with UID from header:', user.id);
//                   req.user = {
//                     id: user.id,
//                     firebaseUid: user.firebaseUid,
//                     email: user.email
//                   };
//                   return next();
//                 }
//               }
//             } catch (fallbackError) {
//               console.error('Alternative token handling failed:', fallbackError);
//             }
//           }

//           // In development mode, fall through to development fallbacks
//           if (!isDevelopment && !isFallbackAuth) {
//             return res.status(401).json({ 
//               message: 'Invalid authentication token',
//               error: errorDetails.message || 'Token verification failed',
//               code: errorDetails.code
//             });
//           }
//         }
//       } else if (!isDevelopment) {
//         // In production, Firebase Admin must be initialized unless using fallback auth
//         if (!isFallbackAuth) {
//           return res.status(500).json({ message: 'Authentication service unavailable' });
//         }
//       }
//     } else if (!isFallbackAuth && !useDevFallback) {
//       // No token and not using fallback - require auth
//       return res.status(401).json({ message: 'No authentication token provided' });
//     }

//     // CASE 2: Fallback auth for domains not in Firebase allowlist
//     if (isFallbackAuth) {
//       try {
//         // Extract user info from headers/body (set by client-side fallback)
//         const uid = req.headers['x-auth-uid'] as string || req.body?.uid;

//         if (!uid) {
//           console.error('Missing user identifier for fallback authentication:', {
//             headers: req.headers,
//             url: req.url,
//             method: req.method
//           });

//           // In development mode, we can use a generic fallback
//           if (isDevelopment) {
//             console.log('Using development fallback for missing UID in fallback authentication');
//             const fallbackUid = `dev-fallback-${Date.now()}`;

//             try {
//               // Find any user to use as fallback (this is dev-only)
//               const users = await db.query.users.findMany({
//                 limit: 1,
//               });

//               if (users && users.length > 0) {
//                 const user = users[0];
//                 console.log('Using existing user as development fallback for missing UID:', user.id);

//                 req.user = {
//                   id: user.id,
//                   firebaseUid: user.firebaseUid || fallbackUid,
//                   email: user.email || 'dev@example.com'
//                 };
//                 return next();
//               }
//             } catch (dbError) {
//               console.error('Error fetching fallback user in fallback auth:', dbError);
//             }
//           }

//           return res.status(401).json({ message: 'Missing user identifier for fallback authentication' });
//         }

//         // Log the UID we are looking up
//         console.log('Looking up user by Firebase UID in fallback auth:', uid);

//         // Look up the user by Firebase UID
//         const user = await storage.getUserByFirebaseUid(uid);

//         if (user) {
//           // User found - set request user
//           req.user = {
//             id: user.id,
//             firebaseUid: user.firebaseUid,
//             email: user.email
//           };

//           console.log('Using fallback auth with existing user:', req.user);
//           return next();
//         } else {
//           // If user not found, we need to create a new fallback user
//           console.log('User not found in database, will create fallback user for UID:', uid);

//           try {
//             // Generate a unique username based on the UID
//             const shortUid = uid.split('-')[0] || uid.substring(0, 8);
//             const randomSuffix = Math.floor(Math.random() * 100);
//             const username = `user_${shortUid}_${randomSuffix}`;

//             // Generate a temporary email address based on the UID
//             // This email won't receive messages but satisfies the database constraint
//             const tempEmail = `${username}@example.com`;

//             console.log('CREATING NEW USER - FULL DETAILS:', {
//               firebaseUid: uid,
//               email: tempEmail,
//               firstName: 'New',
//               lastName: 'User',
//               username: username
//             });

//             // Create a fallback user
//             const newUser = await storage.createUser({
//               firebaseUid: uid,
//               email: tempEmail,
//               firstName: 'New',
//               lastName: 'User',
//               username: username
//             });

//             console.log('Created new fallback user:', newUser.id);

//             // Set the user on the request
//             req.user = {
//               id: newUser.id,
//               firebaseUid: newUser.firebaseUid,
//               email: newUser.email
//             };

//             return next();
//           } catch (createError) {
//             console.error('Error creating fallback user:', createError);

//             // In development mode, continue with fallbacks
//             if (isDevelopment) {
//               console.log('Falling back to development user due to create error');
//             } else {
//               return res.status(500).json({ message: 'Failed to create fallback user' });
//             }
//           }
//         }

//         // If no user found with this UID, fall through to dev fallback or fail
//         if (!isDevelopment) {
//           return res.status(401).json({ message: 'User not found for fallback authentication' });
//         }
//       } catch (fallbackError) {
//         console.error('Fallback authentication error:', fallbackError);
//         if (!isDevelopment) {
//           return res.status(500).json({ message: 'Fallback authentication error' });
//         }
//       }
//     }

//     // CASE 3: Development fallback (last resort)
//     if (isDevelopment || useDevFallback) {
//       console.log('Development mode - using fallback user authentication');

//       // Look up the first user in the database or create a fallback user
//       try {
//         // Try to find any user in the database to use as a fallback
//         const users = await db.query.users.findMany({
//           limit: 1,
//         });

//         if (users && users.length > 0) {
//           const user = users[0];
//           console.log('Using existing user as development fallback:', user.id);

//           req.user = {
//             id: user.id,
//             firebaseUid: user.firebaseUid || 'dev-user-id',
//             email: user.email || 'demo@example.com'
//           };
//         } else {
//           // If no users exist, use the default fallback
//           console.log('No users found, using default development user');
//           req.user = {
//             id: 1,
//             firebaseUid: 'dev-user-id',
//             email: 'demo@example.com'
//           };
//         }
//       } catch (dbError) {
//         console.error('Error fetching fallback user:', dbError);
//         // Use default fallback user if database query fails
//         req.user = {
//           id: 1, 
//           firebaseUid: 'dev-user-id',
//           email: 'demo@example.com'
//         };
//       }

//       return next();
//     }

//     // If we got here and nothing worked
//     return res.status(401).json({ message: 'Authentication required' });
//   } catch (error) {
//     console.error('Authentication error:', error);
//     return res.status(500).json({ message: 'Authentication error' });
//   }
// }

// export function setupAuthRoutes(app: Express) {
//   // Verify Firebase token
//   app.post('/api/auth/verify-token', async (req: Request, res: Response) => {
//     try {
//       const { idToken, email, name, uid: providedUid, photo } = req.body;
//       const isDevelopment = process.env.NODE_ENV === 'development';

//       // Check for fallback authentication mode (unauthorized domain workaround)
//       const isFallbackAuth = req.headers['x-auth-fallback'] === 'true';

//       // For automatic dev mode, check for query parameter
//       const isDev = isDevelopment && (req.query.dev === 'true' || req.headers['x-dev-mode'] === 'true');

//       // Debug the token and environment - add even more detail
//       console.log('🔐 TOKEN VERIFICATION REQUEST:', {
//         hasToken: !!idToken,
//         tokenLength: idToken ? idToken.length : 0,
//         isDevelopment,
//         isDev,
//         isFallbackAuth,
//         firebaseInitialized: !!admin.apps.length,
//         url: req.url,
//         appsLength: admin.apps.length,
//         query: req.query,
//         headers: {
//           fallback: req.headers['x-auth-fallback'],
//           uid: req.headers['x-auth-uid'],
//           authorization: req.headers.authorization ? 'present' : 'missing'
//         },
//         body: {
//           hasEmail: !!email,
//           hasName: !!name,
//           hasProvidedUid: !!providedUid,
//           hasPhoto: !!photo,
//           emailValue: email ? `${email.substring(0, 2)}...` : undefined,
//           nameValue: name || undefined
//         }
//       });

//       // CASE 1: Standard Firebase token verification
//       if (idToken && admin.apps.length && !isFallbackAuth) {
//         try {
//           console.log('🔒 Attempting to verify Firebase token...');
//           const decodedToken = await admin.auth().verifyIdToken(idToken);
//           console.log('✅ Successfully verified token for UID:', decodedToken.uid);

//           // Try/catch separate blocks to get more detailed error logging
//           try {
//             // Check if user exists in our database - added debug information
//             console.log('👤 Looking up user by Firebase UID:', decodedToken.uid);
//             let user = await storage.getUserByFirebaseUid(decodedToken.uid);

//             if (!user) {
//               // Create a new user if they don't exist
//               console.log('🆕 No existing user found, creating new user for UID:', decodedToken.uid);

//               // Add additional user information from the request body as a backup
//               // This helps in case the token doesn't have all fields
//               if (email && !decodedToken.email) {
//                 console.log('Using email from request body:', email);
//                 decodedToken.email = email;
//               }

//               if (name && !decodedToken.name) {
//                 console.log('Using name from request body:', name);
//                 decodedToken.name = name;
//               }

//               if (photo && !decodedToken.picture) {
//                 console.log('Using photo from request body:', photo);
//                 decodedToken.picture = photo;
//               }

//               // Create the user
//               user = await createUserFromFirebaseToken(decodedToken);
//               console.log('✅ User creation successful, user ID:', user.id);
//             } else {
//               console.log('✅ Found existing user in database for UID:', decodedToken.uid, 'ID:', user.id);
//             }

//             if (!user || !user.id) {
//               throw new Error('User object is invalid after creation/lookup');
//             }

//             // Always store the current token for future API calls
//             // This ensures the client has a valid authorization token
//             res.setHeader('X-Auth-Token', idToken);

//             return res.status(200).json(user);
//           } catch (dbError) {
//             console.error('❌ Database error during user lookup/creation:', dbError);
//             // If in development, continue to fallbacks
//             if (!isDevelopment) {
//               return res.status(500).json({ 
//                 message: 'Failed to create or retrieve user account',
//                 error: String(dbError)
//               });
//             }
//           }
//         } catch (error: any) {
//           console.error('Error verifying Firebase token:', error.message);
//           // For development, we'll fall through to the fallbacks below
//           // In production and not using fallback auth, we'll fail here
//           if (!isDevelopment && !isFallbackAuth) {
//             return res.status(401).json({ 
//               message: 'Invalid authentication token',
//               error: error.message
//             });
//           }
//         }
//       }

//       // CASE 2: Fallback authentication for unauthorized domain
//       if (isFallbackAuth) {
//         console.log('Using fallback authentication (for unauthorized domain)');
//         try {
//           // Create a simulated decoded token that's similar to a Firebase token
//           // Use a consistent UID from the provided UID to ensure stability
//           const actualUid = providedUid || `fallback-${Date.now()}`;

//           console.log('Fallback auth with UID:', actualUid);

//           const fallbackToken = {
//             uid: actualUid,
//             email: email || 'user@example.com',
//             name: name || 'User',
//             // Add firebase provider info to simulate Google auth
//             firebase: {
//               sign_in_provider: 'google.com',
//               identities: {
//                 'google.com': [actualUid]
//               }
//             },
//             // Add minimum required fields for DecodedIdToken compatibility
//             aud: 'fallback',
//             auth_time: Math.floor(Date.now() / 1000),
//             exp: Math.floor(Date.now() / 1000) + 3600,
//             iat: Math.floor(Date.now() / 1000),
//             sub: actualUid,
//             iss: 'fallback'
//           } as unknown as admin.auth.DecodedIdToken;

//           // Check if user already exists with this UID
//           let user = await storage.getUserByFirebaseUid(fallbackToken.uid);

//           if (!user) {
//             // Create a new user
//             console.log('Creating new user with fallback authentication:', {
//               uid: fallbackToken.uid,
//               email: fallbackToken.email,
//               name: fallbackToken.name
//             });
//             user = await createUserFromFirebaseToken(fallbackToken);
//             console.log('Fallback user creation successful, user ID:', user.id);
//           } else {
//             console.log('Using existing user for fallback auth:', user.id);
//           }

//           if (!user || !user.id) {
//             throw new Error('User object is invalid after fallback creation/lookup');
//           }

//           return res.status(200).json(user);
//         } catch (error) {
//           console.error('Error with fallback authentication:', error);

//           if (!isDevelopment) {
//             return res.status(500).json({ 
//               message: 'Error processing fallback authentication',
//               error: String(error)
//             });
//           }
//           // In development mode, fall through to development fallbacks
//         }
//       }

//       // DEVELOPMENT FALLBACKS - Only used if token verification failed
//       if (isDevelopment) {
//         console.log('Using development fallback authentication');

//         // For development, we'll use the provided UID or a default
//         const uid = req.body.uid || 'dev-user-id';

//         try {
//           // Try to get existing user
//           let user = await storage.getUserByFirebaseUid(uid);

//           if (!user) {
//             // If database query fails or user doesn't exist, use in-memory mock
//             console.log(`Creating new demo user with uid: ${uid}`);

//             // Create a new development user
//             const newUser = {
//               firebaseUid: uid,
//               email: 'demo@example.com',
//               firstName: 'Demo',
//               lastName: 'Athlete',
//               username: `demo_${Date.now()}`,
//               sport: 'Basketball',
//               graduationYear: 2025,
//               position: 'Point Guard',
//               height: '6\'1"',
//               gpa: '3.8',
//               testScores: '1400 SAT',
//               academicHonors: 'Honor Roll',
//               bio: 'Demo athlete for testing',
//               highlights: 'Captain of JV team',
//               stats: { 'PPG': '15.5', 'APG': '4.2' },
//               intendedMajor: 'Computer Science',
//               location: 'Los Angeles, CA',
//               schoolSize: 'Medium',
//               gender: null,
//               programLevel: null
//             };

//             // In case database is working, try to persist the user
//             try {
//               user = await storage.createUser(newUser);
//             } catch (dbError) {
//               console.error('Database error during user creation:', dbError);
//               // Continue with a mock user object
//               user = {
//                 id: 1,
//                 firebaseUid: uid,
//                 email: newUser.email,
//                 username: newUser.username,
//                 firstName: newUser.firstName,
//                 lastName: newUser.lastName,
//                 gender: newUser.gender,
//                 sport: newUser.sport,
//                 graduationYear: newUser.graduationYear,
//                 position: newUser.position,
//                 height: newUser.height,
//                 gpa: newUser.gpa,
//                 testScores: newUser.testScores,
//                 academicHonors: newUser.academicHonors,
//                 bio: newUser.bio,
//                 highlights: newUser.highlights,
//                 stats: newUser.stats,
//                 intendedMajor: newUser.intendedMajor,
//                 location: newUser.location,
//                 schoolSize: newUser.schoolSize,
//                 programLevel: newUser.programLevel,
//                 keyStats: null,
//                 avatar: null,
//                 createdAt: new Date()
//               };
//             }
//           }

//           // Return user info
//           return res.status(200).json(user);
//         } catch (error) {
//           console.error('Error during mock authentication:', error);

//           // Even if database fails, provide a fallback user
//           const fallbackUser = {
//             id: 1,
//             firebaseUid: uid,
//             email: 'demo@example.com',
//             firstName: 'Demo',
//             lastName: 'Athlete'
//           };

//           return res.status(200).json(fallbackUser);
//         }
//       } 

//       // If we get here, we're in production and nothing worked
//       return res.status(401).json({ message: 'Invalid token or missing authentication credentials' });
//     } catch (error) {
//       console.error('General authentication error:', error);
//       return res.status(500).json({ message: 'Authentication error' });
//     }
//   });

//   // Sign out
//   app.post('/api/auth/signout', (req: Request & { session?: any }, res: Response) => {
//     if (req.session) {
//       req.session.destroy((err: Error) => {
//         if (err) {
//           return res.status(500).json({ message: 'Failed to sign out' });
//         }
//         res.clearCookie('connect.sid');
//         return res.status(200).json({ message: 'Signed out successfully' });
//       });
//     } else {
//       // If no session exists (development mode fallback)
//       return res.status(200).json({ message: 'Signed out successfully' });
//     }
//   });

//   // firebase google sign in
//    app.post('/api/auth/firebase/google', async (req: Request, res: Response) =>
//      {
//         try {
//           const { email, name, uid: providedUid, photo } = req.body;

//           if (!providedUid || !email || !name) {
//             return res.status(400).json({ message: 'Missing required fields' });
//           }

//           // First try to find the user by uui
//            let user = await storage.getUserByFirebaseUid(providedUid);

//            if (!user) {
//              // Create a new user if they don't exist
//              console.log('🆕 No existing user found, creating new user for UID:', providedUid);
//              let firstName = '';
//              let lastName = '';

//              const nameParts = name.split(' ');
//              firstName = nameParts[0] || '';
//              lastName = nameParts.slice(1).join(' ') || '';

//              // Generate a unique username from email or UID
//              let username = '';
//              if (email) {
//                // Remove special characters and everything after @
//                username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
//              } else {
//                // Use UID if no email
//                username = `user_${providedUid.substring(0, 8)}`;
//              }

//              // Add random suffix to ensure uniqueness
//              username = `${username}_${Math.floor(Math.random() * 1000)}`;

//              const newUser = {
//                firebaseUid: providedUid,
//                email: email || '',
//                firstName: firstName || 'New',
//                lastName: lastName || 'User',
//                username: username,
//                sport: null,
//                graduationYear: null,
//                position: null,
//                height: null,
//                gpa: null,
//                testScores: null,
//                academicHonors: null,
//                bio: null,
//                highlights: null,
//                stats: null,
//                intendedMajor: null,
//                location: null,
//                schoolSize: null,
//                programLevel: null,
//                gender: null,
//                keyStats: null,
//                avatar: photo || null,
//              };

//              user = await storage.createUser(newUser);
//              console.log('✅ User creation successful, user ID:', user.id);

//              await db.insert(activities).values({
//                userId: user.id,
//                type: 'account',
//                description: 'Created account',
//                timestamp: new Date(),
//                metaData: { 
//                  method: 'social',
//                  provider: name ? 'Google' : 'Apple' // Simple heuristic
//                }
//              });

//              return res.status(200).json(user);
//            }

//           return res.status(200).json(user);
//         } catch (error) {
//           console.error('Error during Google sign-in:', error);
//           return res.status(500).json({ message: 'Google sign-in error' });
//         }
//      }) 
// }

// // Add type definition for the user object on the request
// declare global {
//   namespace Express {
//     interface Request {
//       user?: {
//         id: number;
//         firebaseUid: string;
//         email?: string;
//       };
//       session?: any;
//     }
//   }
// }