import { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { UserData, UserRole } from "../types/auth";
import { createUserData, getUserData } from "../services/firebase/user";
import {
  saveAuthToLocal,
  saveUserDataToLocal,
  getLocalAuthData,
  getLocalUserData,
  clearLocalAuth,
} from "../services/auth/offlineAuth";
import { LoadingScreen } from "@/components/common/LoadingScreen";
import { subscribeToUserData } from "@/services/firebase/user";

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isOnline: boolean;
  signUp: (email: string, password: string, role?: UserRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize with cached data immediately
    const localAuthData = getLocalAuthData();
    return localAuthData as User | null;
  });
  const [userData, setUserData] = useState<UserData | null>(() => {
    // Initialize with cached user data immediately
    return getLocalUserData();
  });
  const [loading, setLoading] = useState(false); // Start with false since we have initial state
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Initialize auth state
  useEffect(() => {
    // If offline, we're already using cached data, no need to do anything
    if (!isOnline) {
      console.log("Offline mode: using cached data");
      return;
    }

    console.log("Setting up auth state listener");
    // Online mode: listen to Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log(
        "Auth state changed:",
        firebaseUser ? "User logged in" : "No user"
      );
      if (firebaseUser) {
        try {
          console.log("Attempting to fetch user data for:", firebaseUser.uid);
          // First, get the initial user data
          const initialUserData = await getUserData(firebaseUser.uid);
          console.log("Received initial user data:", initialUserData);

          if (initialUserData) {
            setUserData(initialUserData);
            saveUserDataToLocal(initialUserData);
          } else {
            console.warn(
              "No user data found in Firestore for uid:",
              firebaseUser.uid
            );
          }

          // Then subscribe to future updates
          const unsubscribeUserData = subscribeToUserData(
            firebaseUser.uid,
            (freshUserData) => {
              console.log("Received user data update:", freshUserData);
              if (freshUserData) {
                // Only update if data is different
                if (
                  JSON.stringify(freshUserData) !== JSON.stringify(userData)
                ) {
                  setUserData(freshUserData);
                  saveUserDataToLocal(freshUserData);
                }
              }
            }
          );

          // Only update if user data is different
          if (JSON.stringify(firebaseUser) !== JSON.stringify(user)) {
            setUser(firebaseUser);
            saveAuthToLocal(firebaseUser);
          }

          // Clean up user data subscription when auth state changes
          return () => unsubscribeUserData();
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Keep using cached data if fetch fails
          if (!userData) {
            setUserData(null);
          }
        }
      } else {
        setUser(null);
        setUserData(null);
        clearLocalAuth();
      }
    });

    return unsubscribe;
  }, [isOnline]);

  const signUp = async (
    email: string,
    password: string,
    role: UserRole = "user"
  ) => {
    setLoading(true);
    try {
      console.log("Creating new user with role:", role);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("User created, creating user data in Firestore");
      await createUserData(userCredential.user, role);
      console.log("User data created in Firestore");
    } catch (error) {
      console.error("Error during sign up:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log("Signing in user");
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("User signed in, fetching user data");
      // Fetch user data immediately after successful sign in
      const userDataResult = await getUserData(userCredential.user.uid);
      console.log("Fetched user data after sign in:", userDataResult);
      if (userDataResult) {
        setUserData(userDataResult);
        saveUserDataToLocal(userDataResult);
      } else {
        console.warn(
          "No user data found after sign in for uid:",
          userCredential.user.uid
        );
      }
    } catch (error) {
      console.error("Error during sign in:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const userData = await getUserData(userCredential.user.uid);
      if (!userData) {
        await createUserData(userCredential.user, "user");
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      clearLocalAuth();
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!userData) return false;

    if (Array.isArray(role)) {
      return role.includes(userData.role);
    }

    return userData.role === role;
  };

  const value = {
    user,
    userData,
    loading,
    isOnline,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    hasRole,
  };

  // Only show loading screen for auth operations, not initial load
  if (loading) {
    return <LoadingScreen />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
