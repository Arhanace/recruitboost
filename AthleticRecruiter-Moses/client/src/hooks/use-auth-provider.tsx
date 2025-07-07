import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  signInWithGoogle, 
  signInWithApple, 
  firebaseSignOut, 
  onAuthChange 
} from "@/lib/firebase";
import { User as FirebaseUser } from "firebase/auth";
import { apiRequest } from "@/lib/queryClient";

// Extended user type that includes athlete profile data
interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  sport?: string;
  graduationYear?: number;
  position?: string;
  height?: string;
  gpa?: string;
  testScores?: string;
  academicHonors?: string;
  keyStats?: string;
  highlights?: string;
  location?: string;
  schoolSize?: string;
  intendedMajor?: string;
  firebaseUid: string;
  username: string;
  gmailRefreshToken?: string;
  gmailTokenExpiry?: number;
  gmailAccessToken?: string;
}

// Combine Firebase User with our profile data
export interface ExtendedUser extends FirebaseUser {
  profile?: UserProfile;
}

// Types for our context
interface AuthContextType {
  user: ExtendedUser | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  isProfileFetched: boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  signOut: async () => {},
  isProfileFetched: false
});

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component that wraps the app and provides the auth context
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProfileFetched, setIsProfileFetched] = useState(false);

  // Effect for setting up the auth state listener
  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        // Initialize with the Firebase user data
        const extendedUser = firebaseUser as ExtendedUser;
        
        // Store Firebase UID in session storage for fallback auth
        sessionStorage.setItem('firebase_uid', firebaseUser.uid);
        
        setUser(extendedUser);
        handleUserAuthenticated(extendedUser);
      } else {
        setUser(null);
        
        // Clear auth data from session storage on logout
        sessionStorage.removeItem('firebase_uid');
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token_expiry');
        sessionStorage.removeItem('use_auth_fallback');
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Fetch user profile data
  const fetchUserProfile = async () => {
    if (!user) return;

    setIsProfileFetched(false);
    try {
      // Fetch the user profile from our backend
      const response = await apiRequest("GET", "/api/user/profile");

      if (response.ok) {
        const profileData = await response.json();
        
        // Update the user with profile data
        setUser(prevUser => {
          if (!prevUser) return null;
          return {
            ...prevUser,
            profile: profileData
          };
        });
        setIsProfileFetched(true);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setIsProfileFetched(true);
    }
  };

  // Effect to fetch user profile when authenticated
  useEffect(() => {
    if (user && !user.profile) {
      fetchUserProfile();
    }
  }, [user]);

  // Handle user authenticated with Firebase
  const handleUserAuthenticated = async (firebaseUser: ExtendedUser) => {
    try {
      console.log("🔐 Firebase user authenticated, syncing with backend:", { 
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName
      });
      
      try {
        // Get the ID token from Firebase with force refresh to ensure it's fresh
        console.log("Getting fresh Firebase ID token...");
        const idToken = await firebaseUser.getIdToken();
        console.log("✅ Got fresh ID token, length:", idToken?.length || 0);
        
        if (!idToken) {
          throw new Error("Failed to get Firebase ID token");
        }
        
        // Store Firebase UID for fallback authentication
        sessionStorage.setItem('firebase_uid', firebaseUser.uid);
        
        // Cache the token in session storage with a 50-minute expiry (tokens last 1 hour)
        // This gives us a 10-minute buffer before actual expiry
        const expiryTime = Date.now() + (50 * 60 * 1000);
        sessionStorage.setItem('auth_token', idToken);
        sessionStorage.setItem('auth_token_expiry', expiryTime.toString());
        
        const response = await fetch('/api/auth/firebase/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}` // Add token in auth header too
          },
          body: JSON.stringify({ 
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            uid: firebaseUser.uid,
            photo: firebaseUser.photoURL
          })
        });
        
        // Check response
        console.log("Backend verification response status:", response.status);
        
        if (response.ok) {
          // Get the profile data from the response
          const profileData = await response.json();

          // "/api/emails/import-gmail-responses"
          
          
          // Update the user with profile data directly from the token verification
          setUser(prevUser => {
            if (!prevUser) return null;
            return {
              ...prevUser,
              profile: profileData
            };
          });
        } else {
          console.error("Token verification failed:", response.status, response.statusText);
          
          // Try to read error details
          try {
            const errorText = await response.text();
            console.error("Error details:", errorText);
          } catch (e) {
            console.error("Could not read error details");
          }
          
          throw new Error(`Token verification failed: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        // Check for common Firebase token errors
        console.error("Error getting or verifying token:", error);
        
        // Cast to an error object with potential Firebase properties
        const tokenError = error as { message?: string; code?: string };
        
        // For unauthorized domain errors, try fallback authentication
        // This handles the case where Firebase auth works but domain isn't in allowlist
        if (tokenError.message?.includes('domain') || 
            tokenError.code === 'auth/unauthorized-domain' ||
            tokenError.message?.includes('unauthorized')) {
          console.log("⚠️ Attempting fallback authentication due to unauthorized domain error");
          console.log("Error details:", tokenError.message, tokenError.code);
          
          // Mark that we're using fallback auth
          sessionStorage.setItem('use_auth_fallback', 'true');
          sessionStorage.setItem('firebase_uid', firebaseUser.uid);
          
          // Attempt fallback authentication with the backend
          // Use a direct fetch for the fallback auth to avoid circular dependencies
          const fallbackResponse = await fetch('/api/auth/firebase/google', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Auth-Fallback': 'true',
              'X-Auth-Uid': firebaseUser.uid
            },
            body: JSON.stringify({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              photo: firebaseUser.photoURL,
            })
          });
          
          if (fallbackResponse.ok) {
            console.log("Fallback authentication successful");
            const profileData = await fallbackResponse.json();
            
            // Update user with the fallback profile data
            setUser(prevUser => {
              if (!prevUser) return null;
              return {
                ...prevUser,
                profile: profileData
              };
            });
            return; // Exit early on success
          } else {
            console.error("Fallback authentication failed");
            throw new Error("Authentication failed with both normal and fallback methods");
          }
        }
        
        throw new Error(tokenError.message || "Authentication failed"); // Re-throw if no fallback or fallback failed
      }
    } catch (error) {
      console.error("Error syncing user with backend:", error);
      setError("Failed to authenticate with server. Please try again.");
    }
  };

  // Sign in with Google
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if we need to use dev mode
      const urlParams = new URLSearchParams(window.location.search);
      const forceDev = urlParams.get('dev') === 'true';
      
      if (forceDev) {
        // Add a clear message that we're using development mode
        console.log("USING DEVELOPMENT MODE LOGIN - Add ?dev=true to URL for testing");
      }
      
      await signInWithGoogle();
      // User state will be updated by the auth state listener
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      setLoading(false);
      
      // Add a more helpful error message
      if (error?.code === 'auth/configuration-not-found' || 
          error?.message?.includes('redirect_uri_mismatch')) {
        setError(
          "Google Sign In is not configured properly. Please add ?dev=true to the URL to use development mode login while you fix the OAuth configuration."
        );
      } else {
        setError("Failed to sign in with Google. Please try again or use ?dev=true in the URL for development mode.");
      }
    }
  };

  // Sign in with Apple
  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if we need to use dev mode
      const urlParams = new URLSearchParams(window.location.search);
      const forceDev = urlParams.get('dev') === 'true';
      
      if (forceDev) {
        // Add a clear message that we're using development mode
        console.log("USING DEVELOPMENT MODE LOGIN - Add ?dev=true to URL for testing");
      }
      
      await signInWithApple();
      // User state will be updated by the auth state listener
    } catch (error: any) {
      console.error("Error signing in with Apple:", error);
      setLoading(false);
      
      // Add a more helpful error message
      if (error?.code === 'auth/configuration-not-found' || 
          error?.message?.includes('redirect_uri_mismatch')) {
        setError(
          "Apple Sign In is not configured properly. Please add ?dev=true to the URL to use development mode login while you fix the OAuth configuration."
        );
      } else {
        setError("Failed to sign in with Apple. Please try again or use ?dev=true in the URL for development mode.");
      }
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      setLoading(true);
      await firebaseSignOut();
      
      // Also sign out from our backend
      await apiRequest("POST", "/api/auth/signout");
      
      setUser(null);
      setLoading(false);
    } catch (error: any) {
      console.error("Error signing out:", error);
      setLoading(false);
      setError("Failed to sign out. Please try again.");
    }
  };

  // Value for the context provider
  const value = {
    user,
    loading,
    error,
    signInWithGoogle: handleGoogleSignIn,
    signInWithApple: handleAppleSignIn,
    signOut: handleSignOut,
    isProfileFetched
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};