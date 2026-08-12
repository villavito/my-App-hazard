import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, getAuthInstance } from '../config/firebase';

export interface UserRole {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin' | 'super_admin';
  // Which agency's inbox this admin can see. Unset (e.g. for super_admin) means no agency is restricted.
  agency?: 'PNP' | 'BFP' | 'Barangay';
  createdAt: any;
  lastLogin: any;
}

// Create user with role
export const createUserWithRole = async (
  email: string,
  password: string,
  displayName: string,
  role: 'user' | 'admin' | 'super_admin' = 'user',
  agency?: 'PNP' | 'BFP' | 'Barangay'
) => {
  try {
    const auth = getAuthInstance();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName });

    // Create user document in Firestore with role
    const userRole: UserRole = {
      uid: user.uid,
      email: user.email ?? email,
      displayName,
      role,
      ...(agency ? { agency } : {}),
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', user.uid), userRole);
    
    return { success: true, user: userRole };
  } catch (error: any) {
    console.error('Auth service error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    return { success: false, error: error.message || 'Failed to create account' };
  }
};

// Sign in user
export const signInUser = async (email: string, password: string) => {
  try {
    const auth = getAuthInstance();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user role from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserRole;

      // Update last login
      await setDoc(doc(db, 'users', user.uid), {
        ...userData,
        lastLogin: serverTimestamp(),
      }, { merge: true });

      return { success: true, user: userData };
    } else {
      return { success: false, error: 'User role not found' };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const signOutUser = async () => {
  try {
    const auth = getAuthInstance();
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to sign out' };
  }
};

// Get user role
export const getUserRole = async (uid: string): Promise<UserRole | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserRole;
    }
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

// Check if user is admin or super admin
export const isAdmin = (userRole: UserRole): boolean => {
  return userRole.role === 'admin' || userRole.role === 'super_admin';
};

// Check if user is super admin
export const isSuperAdmin = (userRole: UserRole): boolean => {
  return userRole.role === 'super_admin';
};
