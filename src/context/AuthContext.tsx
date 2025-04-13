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
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
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
    // First check local storage for offline mode
    if (!isOnline) {
      const localAuthData = getLocalAuthData();
      if (localAuthData) {
        setUser(localAuthData as User);
        const localUserData = getLocalUserData();
        setUserData(localUserData);
      } else {
        clearLocalAuth();
      }
      setLoading(false);
      return;
    }

    // Online mode: listen to Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const userData = await getUserData(user.uid);
          setUserData(userData);
          // Save to local storage for offline access
          saveAuthToLocal(user);
          saveUserDataToLocal(userData);
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData(null);
        }
      } else {
        setUserData(null);
        clearLocalAuth();
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [isOnline]);

  const signUp = async (
    email: string,
    password: string,
    role: UserRole = "user"
  ) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    await createUserData(userCredential.user, role);
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const userData = await getUserData(userCredential.user.uid);
    if (!userData) {
      await createUserData(userCredential.user, "user");
    }
  };

  const logout = async () => {
    await signOut(auth);
    clearLocalAuth();
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

  if (loading) {
    return <LoadingScreen />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
