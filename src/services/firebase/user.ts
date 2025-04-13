import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { User } from "firebase/auth";
import { UserData, UserRole } from "../../types/auth";
import app from "../../config/firebase";

const db = getFirestore(app);

export const createUserData = async (
  user: User,
  role: UserRole = "user"
): Promise<void> => {
  const userData: UserData = {
    uid: user.uid,
    email: user.email,
    role: role,
    displayName: user.displayName,
  };

  await setDoc(doc(db, "users", user.uid), userData);
};

export const getUserData = async (uid: string): Promise<UserData | null> => {
  const userDoc = await getDoc(doc(db, "users", uid));
  return userDoc.exists() ? (userDoc.data() as UserData) : null;
};

export const hasRole = (
  user: UserData | null,
  requiredRole: UserRole | UserRole[]
): boolean => {
  if (!user) return false;

  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(user.role);
  }

  return user.role === requiredRole;
};
