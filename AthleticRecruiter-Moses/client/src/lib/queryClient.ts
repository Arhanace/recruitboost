import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Function to get the current Firebase ID token - centralized to avoid duplication
async function getAuthToken(): Promise<string | null> {
  try {
    // First, check session storage for a cached token to reduce token refresh calls
    const cachedToken = sessionStorage.getItem('auth_token');
    const tokenExpiry = sessionStorage.getItem('auth_token_expiry');
    
    // If we have a cached token that's not expired, use it
    if (cachedToken && tokenExpiry && parseInt(tokenExpiry) > Date.now()) {
      console.log("Using cached auth token - expires in:", 
        Math.round((parseInt(tokenExpiry) - Date.now()) / 1000), "seconds");
      return cachedToken;
    }
    
    // No valid cached token, get a fresh one
    // Check if we can import the Firebase auth module - use dynamic import to avoid circular dependencies
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      console.log("Getting fresh ID token for user:", { 
        uid: currentUser.uid,
        email: currentUser.email,
        isAnonymous: currentUser.isAnonymous,
        emailVerified: currentUser.emailVerified
      });
      
      try {
        // Force refresh token to ensure it's valid
        const token = await currentUser.getIdToken(true); 
        console.log("Successfully retrieved fresh auth token - length:", token?.length || 0);
        
        // Cache the token in session storage with a 55-minute expiry (tokens last 1 hour)
        // This gives us a 5-minute buffer before the actual expiry
        const expiryTime = Date.now() + (55 * 60 * 1000);
        sessionStorage.setItem('auth_token', token);
        sessionStorage.setItem('auth_token_expiry', expiryTime.toString());
        
        return token;
      } catch (tokenError) {
        console.error("Error getting Firebase ID token:", tokenError);
        
        // Clear any invalid cached tokens
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token_expiry');
        
        return null;
      }
    } else {
      console.log("No current user found in Firebase auth");
      
      // Clear any cached tokens since there's no current user
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token_expiry');
      
      return null;
    }
  } catch (error) {
    console.error("Error accessing Firebase auth:", error);
    
    // Clear any cached tokens on error
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token_expiry');
    
    return null;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get auth token if available
  const token = await getAuthToken();
  
  // Check if we need to use fallback auth mechanism for domains not in Firebase allowlist
  const useFallbackAuth = sessionStorage.getItem('use_auth_fallback') === 'true';
  const firebaseUid = sessionStorage.getItem('firebase_uid');
  
  // Set up headers with auth token if available
  const headers: HeadersInit = {
    'Accept': 'application/json'
  };
  
  if (data) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Add fallback auth headers if we're using that mechanism
  if (useFallbackAuth) {
    headers['X-Auth-Fallback'] = 'true';
    if (firebaseUid) {
      headers['X-Auth-Uid'] = firebaseUid;
    }
    console.log(`Using fallback auth mechanism for ${method} ${url} with UID:`, firebaseUid);
    
    // For Replit domains that aren't in Firebase authorized domains list
    // Make sure we have special logging for these important profile operations
    if (url.includes('/api/user/profile')) {
      console.log('IMPORTANT: Using fallback auth for profile operation', {
        method,
        url,
        firebaseUid,
        useFallbackAuth: true,
        headers
      });
    }
  }
  
  // Prepare URL with auth params if needed
  let finalUrl = url;
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log(`Using auth token for ${method} ${url} (token length: ${token.length})`);
    
    // Add Firebase UID if available to help with fallback auth
    const firebaseUser = sessionStorage.getItem('firebase_uid');
    if (firebaseUser) {
      headers['X-Firebase-UID'] = firebaseUser;
    }
    
    // For debugging auth issues
    if (url.includes('/api/user/profile') || url.includes('/api/auth/verify-token')) {
      console.log(`Auth debugging for ${url}:`, {
        tokenStart: token.substring(0, 10) + '...',
        tokenEnd: '...' + token.substring(token.length - 10),
        headers: headers,
        useFallbackAuth,
        firebaseUid: firebaseUser
      });
    }
  } else {
    console.log(`No auth token for ${method} ${url}`);
    // Only use dev mode in development environment, never in production
    if (import.meta.env.DEV) {
      finalUrl = finalUrl.includes('?') 
        ? `${finalUrl}&dev=true` 
        : `${finalUrl}?dev=true`;
      console.log(`Using development mode: ${finalUrl}`);
    }
  }
  
  // Prepare request options
  const fetchOptions: RequestInit = {
    method,
    headers,
    credentials: "include",
  };
  
  // Only add body for non-GET requests that have data
  if (method !== 'GET' && data !== undefined) {
    fetchOptions.body = JSON.stringify(data);
  }
  
  try {
    console.log(`Making ${method} request to ${finalUrl}`);
    const res = await fetch(finalUrl, fetchOptions);
    
    // Clone the response before we try to read its body
    // This prevents the "Body is disturbed or locked" error
    const resClone = res.clone();

    if (!res.ok) {
      // Enhanced error reporting for auth issues
      if (res.status === 401) {
        console.error(`Authentication error (401) for ${method} ${finalUrl}`, {
          hasAuthToken: !!token,
          headers: Object.keys(headers).join(', '),
          status: res.status,
          statusText: res.statusText
        });
        
        try {
          // Use the cloned response for error text
          const errorText = await resClone.text();
          console.error('Error response details:', errorText);
        } catch (e) {
          console.error('Could not get error response text');
        }
        
        // Throw specific authentication error
        throw new Error(`Authentication failed: ${res.status} ${res.statusText}`);
      }
      
      // For other errors, throw a general error
      await throwIfResNotOk(res);
    }
    
    return res;
  } catch (error) {
    console.error(`Error with ${method} request to ${finalUrl}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get auth token if available
    const token = await getAuthToken();
    
    // Check if we need to use fallback auth mechanism for domains not in Firebase allowlist
    const useFallbackAuth = sessionStorage.getItem('use_auth_fallback') === 'true';
    const firebaseUid = sessionStorage.getItem('firebase_uid');
    
    // Base URL from query key
    let finalUrl = queryKey[0] as string;
    
    // Set up headers with auth token if available
    const headers: HeadersInit = {
      'Accept': 'application/json'
    };
    
    // Add fallback auth headers if we're using that mechanism
    if (useFallbackAuth) {
      headers['X-Auth-Fallback'] = 'true';
      if (firebaseUid) {
        headers['X-Auth-Uid'] = firebaseUid;
      }
      console.log(`Using fallback auth mechanism for query: ${finalUrl} with UID:`, firebaseUid);
      
      // Add special handling for profile operations in Replit domains
      if (finalUrl.includes('/api/user/profile')) {
        console.log('IMPORTANT: Using fallback auth for profile query operation', {
          url: finalUrl,
          firebaseUid,
          useFallbackAuth: true,
          headers
        });
      }
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log(`Using auth token for query: ${finalUrl} (token length: ${token.length})`);
      
      // Add Firebase UID if available to help with fallback auth
      const firebaseUser = sessionStorage.getItem('firebase_uid');
      if (firebaseUser) {
        headers['X-Firebase-UID'] = firebaseUser;
      }
      
      // For debugging auth issues
      if (finalUrl.includes('/api/user/profile')) {
        console.log(`Auth debugging for query ${finalUrl}:`, {
          tokenStart: token.substring(0, 10) + '...',
          tokenEnd: '...' + token.substring(token.length - 10),
          headers: headers,
          useFallbackAuth,
          firebaseUid: firebaseUser
        });
      }
    } else {
      console.log(`No auth token for query: ${finalUrl}`);
      // Only use dev mode in development environment, never in production
      if (import.meta.env.DEV) {
        finalUrl = finalUrl.includes('?') 
          ? `${finalUrl}&dev=true` 
          : `${finalUrl}?dev=true`;
        console.log(`Using development mode for query: ${finalUrl}`);
      }
    }
    
    try {
      console.log(`Making GET request to ${finalUrl}`);
      const res = await fetch(finalUrl, {
        credentials: "include",
        headers
      });
      
      // Clone the response before we try to read its body
      // This prevents the "Body is disturbed or locked" error
      const resClone = res.clone();

      if (!res.ok) {
        // Enhanced error reporting for auth issues
        if (res.status === 401) {
          console.error(`Authentication error (401) for query: ${finalUrl}`, {
            hasAuthToken: !!token,
            headers: Object.keys(headers).join(', '),
            status: res.status,
            statusText: res.statusText
          });
          
          if (unauthorizedBehavior === "returnNull") {
            console.log(`Returning null for unauthorized query: ${finalUrl}`);
            return null;
          }
          
          try {
            // Use cloned response for error text
            const errorText = await resClone.text();
            console.error('Error response details:', errorText);
          } catch (e) {
            console.error('Could not get error response text');
          }
        }
      }

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`Returning null for unauthorized query: ${finalUrl}`);
        return null;
      }

      await throwIfResNotOk(res);
      // Use the original response for the JSON data
      return await res.json();
    } catch (error) {
      console.error(`Error with query to ${finalUrl}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
