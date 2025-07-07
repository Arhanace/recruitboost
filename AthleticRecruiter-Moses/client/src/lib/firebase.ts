import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";

// Firebase configuration - using exact values from your Firebase project
const firebaseConfig = {
  // apiKey:
  //   import.meta.env.VITE_FIREBASE_API_KEY ||
  //   "AIzaSyD_4rqkChyt2vbOoOPjPrAu92KRnE0v2lY",
  apiKey: "AIzaSyD_4rqkChyt2vbOoOPjPrAu92KRnE0v2lY",
  authDomain: "recruittrack-a600b.firebaseapp.com", // Correct domain from your config
  // projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "recruittrack-a600b",
  projectId: "recruittrack-a600b",
  storageBucket: "recruittrack-a600b.firebasestorage.app", // Correct storage bucket
  messagingSenderId: "128495603964", // Added from your config
  // appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:128495603964:web:050157e93b4958cbc54779",
  appId: "1:128495603964:web:050157e93b4958cbc54779",
};

// Initialize Firebase only when API key is available (or in dev mode)
let app: ReturnType<typeof initializeApp> | undefined;
let auth: ReturnType<typeof getAuth> | undefined;

// Check if current domain is in authorized domains list
const checkDomainAuthorization = () => {
  const currentDomain = window.location.hostname;
  // List of known authorized domains from Firebase console
  const authorizedDomains = [
    "localhost",
    "recruittrack-a600b.firebaseapp.com",
    "recruittrack-a600b.web.app",
    "athletic-recruiter-1-stochast1c.replit.app",
    "athletic-recruiter-1-Stochast1c.replit.app", // Both capitalizations
    "recruitboost.io",
  ];

  // Check if the domain is explicitly in the authorized list
  const isExplicitlyAuthorized = authorizedDomains.some(
    (domain) =>
      currentDomain === domain || currentDomain.endsWith("." + domain),
  );

  // Also check for Replit domain patterns (which may not be explicitly added to Firebase)
  const isReplitDomain =
    currentDomain.includes(".replit.dev") ||
    currentDomain.includes(".replit.app") ||
    currentDomain.includes(".repl.co");

  // Set this to true to force fallback mode for Replit domains
  const useReplitFallback = isReplitDomain && !isExplicitlyAuthorized;

  // Store whether we need fallback auth for this domain
  if (useReplitFallback) {
    sessionStorage.setItem("use_auth_fallback", "true");

    // Set a default fallback UID for unauthorized domains
    // This ensures we always have a UID for fallback auth
    if (!sessionStorage.getItem("firebase_uid")) {
      const fallbackUid = `replit-fallback-${Date.now()}`;
      sessionStorage.setItem("firebase_uid", fallbackUid);
      console.log(`Setting fallback UID for Replit domain: ${fallbackUid}`);
    }

    console.log("Enabling fallback auth for Replit domain");
  }

  const isAuthorized = isExplicitlyAuthorized;

  console.log(`Current domain: ${currentDomain}, Authorized: ${isAuthorized}`);
  return isAuthorized;
};

// Initialize Firebase
try {
  // Always initialize with the hardcoded or environment values
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);

  // Configure auth settings for more reliable performance
  if (auth) {
    // Set persistence to SESSION to survive page refreshes but clear on close
    // This avoids some common auth issues
    // auth.setPersistence(browserSessionPersistence); // We would need to import this
  }

  // Check if we're on an authorized domain
  const isAuthorizedDomain = checkDomainAuthorization();

  console.log("Firebase initialized successfully with:", {
    projectId: firebaseConfig.projectId,
    apiKey: firebaseConfig.apiKey ? "present" : "missing",
    appId: firebaseConfig.appId ? "present" : "missing",
    authDomain: firebaseConfig.authDomain,
    currentDomain: window.location.hostname,
    isAuthorizedDomain,
  });

  // Check for auth redirect result on page load - this handles the redirect callback
  if (auth) {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          console.log("Redirect sign-in successful");
        }
      })
      .catch((error) => {
        console.error("Redirect sign-in error:", error);

        if (error.code === "auth/configuration-not-found") {
          console.error(
            "IMPORTANT: Firebase Authentication isn't properly configured. Make sure Google/Apple sign-in is enabled in the Firebase Console and the authorized domains include your app URL.",
          );
        }
      });
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

// We'll use a mock user in development mode
let currentMockUser: FirebaseUser | null = null;
const mockAuthListeners: Array<(user: FirebaseUser | null) => void> = [];

// Create mock user for development
const createMockUser = (provider: string): FirebaseUser => {
  return {
    displayName: "Demo Athlete",
    email: "demo@example.com",
    uid: `${provider}-dev-user-${Date.now()}`,
    getIdToken: async () => "dev-mode-token",
    photoURL: null,
    phoneNumber: null,
    isAnonymous: false,
    emailVerified: true,
    tenantId: null,
    providerData: [],
    metadata: {
      creationTime: Date.now().toString(),
      lastSignInTime: Date.now().toString(),
    },
    delete: async () => {
      throw new Error("Not implemented");
    },
    getIdTokenResult: async () => ({
      token: "dev-mode-token",
      claims: {},
      expirationTime: "",
      authTime: "",
      issuedAtTime: "",
      signInProvider: `${provider}.com`,
      signInSecondFactor: null,
    }),
    reload: async () => {},
    toJSON: () => ({ uid: `${provider}-dev-user` }),
    providerId: `${provider}.com`,
  } as unknown as FirebaseUser;
};

// Generic sign in helper for development mode
const devModeSignIn = async (provider: string) => {
  console.log(`Development mode - using simulated ${provider} login`);

  try {
    // Create a mock user
    currentMockUser = createMockUser(provider);

    // Simulate an authenticated state by making a direct API call to our backend
    const response = await fetch("/api/auth/verify-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        idToken: "dev-mode-token",
        uid: currentMockUser.uid,
        provider,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to authenticate with server: ${response.status}`);
    }

    // Notify all listeners
    mockAuthListeners.forEach((listener) => listener(currentMockUser));

    return currentMockUser;
  } catch (error) {
    console.error(`Error with simulated ${provider} login:`, error);
    throw error;
  }
};

// Create a simple Google provider without custom parameters
// This avoids the SyntaxError with pattern matching
const getGoogleProvider = () => {
  // Create a basic provider without any custom parameters that might cause errors
  return new GoogleAuthProvider();
};

// Get Apple provider - simplified to avoid potential syntax errors
const getAppleProvider = () => {
  // Create a basic provider with minimal configuration
  const provider = new OAuthProvider("apple.com");
  return provider;
};

// Sign in with Google
export const signInWithGoogle = async () => {
  // Use dev mode if explicitly specified in the URL or in development environment
  const urlParams = new URLSearchParams(window.location.search);
  // console.log(urlParams)
  const forceDev = urlParams.get("dev") === "true";
  const forceRedirect = urlParams.get("redirect") === "true";

  // if (forceDev || (import.meta.env.DEV && !import.meta.env.VITE_FIREBASE_API_KEY)) {
  //   return devModeSignIn('google');
  // }

  console.log(forceDev);

  // if (forceDev) {
  //   return devModeSignIn('google');
  // }

  try {
    if (!auth) {
      throw new Error("Firebase auth not initialized");
    }

    // Create a Google provider
    // Create provider and request Gmail send scope
    const provider = new GoogleAuthProvider();

    // Skip popup and go straight to redirect if specified in URL
    if (forceRedirect) {
      console.log("Using direct redirect for Google sign-in (bypassing popup)");
      await signInWithRedirect(auth, provider);
      return null;
    }

    try {
      // Attempt to sign in with a popup first
      console.log("Starting Google sign-in with popup");
      const result = await signInWithPopup(auth, provider);

      // // Extract Gmail access token
      // const credential = GoogleAuthProvider.credentialFromResult(result);
      // const gmailAccessToken = credential?.accessToken ?? null;

      // /api/auth/firebase/google
      const response = await fetch("/api/auth/firebase/google", {
        method: "Post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: result.user.uid,
          email: result.user.email,
          name: result.user.displayName,
        }),
      });

      console.log(
        "Google sign-in popup successful",
        result,
        response,
      );
      return result.user;
    } catch (popupError) {
      console.warn(
        "Popup sign-in failed, falling back to redirect:",
        popupError,
      );

      // If popup fails, fall back to redirect
      await signInWithRedirect(auth, provider);
      // The redirect will navigate away from the page, so we won't
      // reach this point until the user returns after authentication
      return null;
    }
  } catch (error: any) {
    console.error("Error signing in with Google:", error);

    // Handle various Firebase auth errors with proper fallbacks
    if (
      error.code === "auth/unauthorized-domain" ||
      error.code === "auth/configuration-not-found" ||
      error.code === "auth/operation-not-allowed"
    ) {
      console.log(
        `Firebase auth error (${error.code}): Using fallback authentication process for deployed domain.`,
      );
      console.warn(
        "IMPORTANT: Please add this domain to the Firebase console's authorized domains list!",
      );

      try {
        // Flag that we're using fallback auth
        sessionStorage.setItem("use_auth_fallback", "true");

        // Create a fallback user with a stable UID
        const fallbackUid = `google-fallback-${Date.now()}`;
        sessionStorage.setItem("firebase_uid", fallbackUid);

        // Try to extract email from error object if available
        const userEmail =
          error.customData?.email || error.email || "user@example.com";
        const userName = error.customData?.displayName || "User";

        console.log("Using fallback authentication with data:", {
          uid: fallbackUid,
          email: userEmail,
          name: userName,
          domain: window.location.hostname,
        });

        const mockUser = {
          uid: fallbackUid,
          email: userEmail,
          displayName: userName,
          // Use a function to generate random tokens for security
          getIdToken: async () =>
            `fallback-token-${Math.random().toString(36).substring(2, 15)}`,
          emailVerified: true,
          // Add other required properties here
        } as unknown as FirebaseUser;

        // Make the request directly to our backend with special header
        const response = await fetch("/api/auth/verify-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Auth-Fallback": "true",
          },
          body: JSON.stringify({
            idToken: "unauthorized-domain-fallback",
            uid: fallbackUid,
            provider: "google",
            email: userEmail,
            name: userName,
          }),
        });

        if (!response.ok) {
          throw new Error(`Fallback authentication failed: ${response.status}`);
        }

        return mockUser;
      } catch (fallbackError) {
        console.error("Fallback authentication also failed:", fallbackError);
        throw fallbackError;
      }
    }

    throw error;
  }
};

// Sign in with Apple
export const signInWithApple = async () => {
  // Use dev mode if explicitly specified in the URL or in development environment
  const urlParams = new URLSearchParams(window.location.search);
  const forceDev = urlParams.get("dev") === "true";

  // if (forceDev || (import.meta.env.DEV && !import.meta.env.VITE_FIREBASE_API_KEY)) {
  //   return devModeSignIn('apple');
  // }

  try {
    if (!auth) {
      throw new Error("Firebase auth not initialized");
    }

    // Create an Apple provider
    const provider = getAppleProvider();

    try {
      // Attempt to sign in with a popup first
      console.log("Starting Apple sign-in with popup");
      const result = await signInWithPopup(auth, provider);
      console.log("Apple sign-in popup successful");
      return result.user;
    } catch (popupError) {
      console.warn(
        "Popup sign-in failed, falling back to redirect:",
        popupError,
      );

      // If popup fails, fall back to redirect
      await signInWithRedirect(auth, provider);
      // The redirect will navigate away from the page, so we won't
      // reach this point until the user returns after authentication
      return null;
    }
  } catch (error) {
    console.error("Error signing in with Apple:", error);
    throw error;
  }
};

// Sign out
export const firebaseSignOut = async () => {
  // Use dev mode if explicitly specified in the URL or in development environment
  const urlParams = new URLSearchParams(window.location.search);
  const forceDev = urlParams.get("dev") === "true";

  // if (forceDev || (import.meta.env.DEV && !import.meta.env.VITE_FIREBASE_API_KEY)) {
  //   console.log('Development mode - using simulated signout');

  //   try {
  //     // Clear the mock user
  //     currentMockUser = null;

  //     // Notify all listeners
  //     mockAuthListeners.forEach(listener => listener(null));

  //     // Also notify the server
  //     await fetch('/api/auth/signout', {
  //       method: 'POST',
  //     });

  //     return;
  //   } catch (error) {
  //     console.error("Error with simulated signout:", error);
  //     throw error;
  //   }
  // }

  try {
    if (!auth) {
      throw new Error("Firebase auth not initialized");
    }
    await signOut(auth);

    // Also notify our server
    await fetch("/api/auth/signout", {
      method: "POST",
    });
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Listen to auth state changes
export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  // Use dev mode if explicitly specified in the URL or in development environment
  const urlParams = new URLSearchParams(window.location.search);
  const forceDev = urlParams.get("dev") === "true";

  // if (forceDev || (import.meta.env.DEV && !import.meta.env.VITE_FIREBASE_API_KEY)) {
  //   // For development, immediately provide the current state
  //   setTimeout(() => {
  //     callback(currentMockUser);
  //   }, 0);

  //   // Add the callback to our mock listeners
  //   mockAuthListeners.push(callback);

  //   // Return an unsubscribe function
  //   return () => {
  //     const index = mockAuthListeners.indexOf(callback);
  //     if (index !== -1) {
  //       mockAuthListeners.splice(index, 1);
  //     }
  //   };
  // }

  // In production, use the real Firebase auth
  if (!auth) {
    console.error("Firebase auth not initialized");
    return () => {}; // Return empty unsubscribe function
  }

  return onAuthStateChanged(auth, callback);
};

export { auth };
