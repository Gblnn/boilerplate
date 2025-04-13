import { User } from "firebase/auth";
import { UserData } from "../../types/auth";

const AUTH_STORAGE_KEY = "auth_user_data";
const USER_DATA_STORAGE_KEY = "user_data";

export const saveAuthToLocal = (user: User | null) => {
  if (user) {
    const authData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
};

export const saveUserDataToLocal = (userData: UserData | null) => {
  if (userData) {
    localStorage.setItem(USER_DATA_STORAGE_KEY, JSON.stringify(userData));
  } else {
    localStorage.removeItem(USER_DATA_STORAGE_KEY);
  }
};

export const getLocalAuthData = () => {
  const authData = localStorage.getItem(AUTH_STORAGE_KEY);
  return authData ? JSON.parse(authData) : null;
};

export const getLocalUserData = () => {
  const userData = localStorage.getItem(USER_DATA_STORAGE_KEY);
  return userData ? JSON.parse(userData) : null;
};

export const clearLocalAuth = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(USER_DATA_STORAGE_KEY);
};
