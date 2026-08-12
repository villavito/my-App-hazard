import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, initializeAuth, type Auth } from "firebase/auth";
// getReactNativePersistence only exists in @firebase/auth's "react-native" build;
// the "firebase" wrapper package's own auth export map has no react-native
// condition, so it must be imported directly from @firebase/auth to resolve.
import {
  // @ts-expect-error not present in @firebase/auth's default (non-RN) type declarations
  getReactNativePersistence,
} from "@firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCJgfoIbGkAKTya1MX7ho670fi-fFbFVlo",
  authDomain: "incident-4a5a6.firebaseapp.com",
  projectId: "incident-4a5a6",
  messagingSenderId: "833458585716",
  appId: "1:833458585716:web:f65978e5ee2e0f2ff35121",
  measurementId: "G-C4BHGRV4CB",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let auth: Auth;
if (Platform.OS === "web") {
  // The web build of @firebase/auth has no getReactNativePersistence export;
  // getAuth() already defaults to browserLocalPersistence on web.
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    if (code === "auth/already-initialized") {
      auth = getAuth(app);
    } else {
      throw error;
    }
  }
}

export function getAuthInstance(): Auth {
  return auth;
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getAnalytics } = require("firebase/analytics");
    getAnalytics(app);
  } catch {
    // Analytics is optional and can fail outside supported browser contexts.
  }
}

export const db = getFirestore(app);

export default app;
