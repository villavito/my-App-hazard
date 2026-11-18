import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  doc,
  enableNetwork,
  getDocFromServer,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db, getAuthInstance } from "../config/firebase";
import { inferAgencyFromEmail, type Agency } from "../constants/agencies";
import { setAgencyActive } from "./firestoreService";

// Waits between attempts to read the user doc: ~7.5s in total.
const SERVER_READ_RETRY_DELAYS_MS = [500, 1000, 2000, 4000];

// getDocFromServer fails straight away with "client is offline"
// (code "unavailable") whenever Firestore hasn't (re)connected yet - e.g. just
// after the app opens or returns from the background, even on a working
// connection, since the long-polling transport takes a moment to come up.
// Retry a few times, nudging the network back on, before giving up. Still
// server-only: the role/agency must never come from a stale local cache.
async function getUserDocFromServer(uid: string) {
  const ref = doc(db, "users", uid);
  for (let attempt = 0; ; attempt++) {
    try {
      return await getDocFromServer(ref);
    } catch (error: any) {
      const delay = SERVER_READ_RETRY_DELAYS_MS[attempt];
      if (error?.code !== "unavailable" || delay === undefined) throw error;
      console.warn(
        `Firestore offline reading user ${uid}, retrying in ${delay}ms...`,
      );
      await enableNetwork(db).catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

export interface UserRole {
  uid: string;
  email: string;
  displayName: string;
  role: "user" | "admin" | "super_admin";
  // Which agency's inbox this admin can see. Unset (e.g. for super_admin) means no agency is restricted.
  agency?: Agency;
  // Philippine mobile number in +639XXXXXXXXX form, so responders can call
  // the reporter back. Missing on accounts created before it was collected.
  phoneNumber?: string;
  createdAt: any;
  lastLogin: any;
}

// Turn a Firebase Auth error code into something a user should see, instead of
// the raw "Firebase: Error (auth/invalid-credential)." string. Firebase now
// collapses wrong-password and unknown-email into the single
// `auth/invalid-credential` code (email-enumeration protection), so the message
// deliberately can't say which one it was.
export const friendlyAuthError = (
  code: string | undefined,
  fallback = "Something went wrong. Please try again.",
): string => {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "Incorrect email or password.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email. Sign in using its existing method.";
    // Firestore still offline after the retries above.
    case "unavailable":
      return "Can't reach the server. Check your internet connection and try again.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password is too weak. Use at least 8 characters with an uppercase letter, a lowercase letter, and a number.";
    default:
      return fallback;
  }
};

const syncUserRole = async (
  user: User,
  createIfMissing = false,
): Promise<
  | { success: true; user: UserRole }
  | { success: false; error: string }
> => {
  const userDoc = await getUserDocFromServer(user.uid);
  let userData: UserRole;

  if (userDoc.exists()) {
    userData = userDoc.data() as UserRole;
    await setDoc(
      doc(db, "users", user.uid),
      { ...userData, lastLogin: serverTimestamp() },
      { merge: true },
    );
  } else {
    if (!createIfMissing || !user.email) {
      return { success: false, error: "User role not found" };
    }

    const email = user.email;
    const role: UserRole["role"] = email.toLowerCase().endsWith("@superadmin.com")
      ? "super_admin"
      : email.toLowerCase().endsWith("@admin.com")
        ? "admin"
        : "user";
    const agency = role === "admin" ? inferAgencyFromEmail(email) : undefined;
    userData = {
      uid: user.uid,
      email,
      displayName: user.displayName || email.split("@")[0],
      role,
      ...(agency ? { agency } : {}),
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    };
    await setDoc(doc(db, "users", user.uid), userData);
  }

  if (userData.role === "admin" && !userData.agency) {
    const inferred = inferAgencyFromEmail(userData.email ?? user.email ?? "");
    if (inferred) {
      try {
        await updateDoc(doc(db, "users", user.uid), { agency: inferred });
        userData.agency = inferred;
      } catch (error) {
        console.warn("Could not assign agency from email:", error);
      }
    }
  }

  if (userData.role === "admin" && userData.agency) {
    await setAgencyActive(userData.agency);
  }

  return { success: true, user: userData };
};

// Create user with role
export const createUserWithRole = async (
  email: string,
  password: string,
  displayName: string,
  role: "user" | "admin" | "super_admin" = "user",
  agency?: Agency,
  phoneNumber?: string,
) => {
  try {
    const auth = getAuthInstance();
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    await updateProfile(user, { displayName });

    // Create user document in Firestore with role
    const userRole: UserRole = {
      uid: user.uid,
      email: user.email ?? email,
      displayName,
      role,
      ...(agency ? { agency } : {}),
      ...(phoneNumber ? { phoneNumber } : {}),
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    };

    await setDoc(doc(db, "users", user.uid), userRole);

    // Mark this agency as having an active admin so the report-incident
    // screen shows a submit button for it.
    if (role === "admin" && agency) {
      await setAgencyActive(agency);
    }

    return { success: true, user: userRole };
  } catch (error: any) {
    console.error("Auth service error:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    return {
      success: false,
      error: error.message || "Failed to create account",
    };
  }
};

// Sign in user
export const signInUser = async (email: string, password: string) => {
  try {
    const auth = getAuthInstance();
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    return await syncUserRole(userCredential.user);
  } catch (error: any) {
    // `error` is the user-facing message; `code` is the raw Firebase code, kept
    // for callers that want to branch on it (e.g. network failure vs bad login).
    return {
      success: false as const,
      error: friendlyAuthError(error.code, "Login failed. Please try again."),
      code: error.code,
    };
  }
};

export const signInWithGoogleToken = async (idToken: string) => {
  try {
    const auth = getAuthInstance();
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    return await syncUserRole(userCredential.user, true);
  } catch (error: any) {
    return {
      success: false as const,
      error: friendlyAuthError(
        error.code,
        "Google sign-in failed. Please try again.",
      ),
      code: error.code,
    };
  }
};

export const signInWithGooglePopup = async () => {
  try {
    const auth = getAuthInstance();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const userCredential = await signInWithPopup(auth, provider);
    return await syncUserRole(userCredential.user, true);
  } catch (error: any) {
    return {
      success: false as const,
      error: friendlyAuthError(
        error.code,
        "Google sign-in failed. Please try again.",
      ),
      code: error.code,
    };
  }
};

export const signOutUser = async () => {
  try {
    const auth = getAuthInstance();
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to sign out" };
  }
};

// Get user role
export const getUserRole = async (uid: string): Promise<UserRole | null> => {
  try {
    // getDocFromServer - see the comment in signInUser for why this must
    // never be served from a stale local cache.
    const userDoc = await getUserDocFromServer(uid);
    if (userDoc.exists()) {
      return userDoc.data() as UserRole;
    }
    return null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
};

// Check if user is admin or super admin
export const isAdmin = (userRole: UserRole): boolean => {
  return userRole.role === "admin" || userRole.role === "super_admin";
};

// Check if user is super admin
export const isSuperAdmin = (userRole: UserRole): boolean => {
  return userRole.role === "super_admin";
};
