import {
    createUserWithEmailAndPassword,
    User as FirebaseUser,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDB } from '../config/firebase';

export interface UserRole {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin' | 'super_admin';
  createdAt: any;
  lastLogin: any;
  avatar?: string;
  phone?: string;
}

export interface AuthResult {
  success: boolean;
  user?: UserRole;
  error?: string;
}

// Create user with role and complete profile
export const createUserWithRole = async (
  email: string,
  password: string,
  displayName: string,
  role: 'user' | 'admin' | 'super_admin' = 'user'
): Promise<AuthResult> => {
  try {
    const auth = getFirebaseAuth();
    const db = getFirebaseDB();
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Update display name in Firebase Auth
    await updateProfile(firebaseUser, { displayName });

    // Create user document in Firestore with complete profile
    const userRole: UserRole = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName,
      role,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    };

    // Remove undefined fields to prevent Firestore errors
    const cleanedUserRole = Object.fromEntries(
      Object.entries(userRole).filter(([_, value]) => value !== undefined)
    );

    await setDoc(doc(db, 'users', firebaseUser.uid), cleanedUserRole);
    
    console.log('User created successfully:', userRole);
    return { success: true, user: userRole };
  } catch (error: any) {
    console.error('Auth service error:', error);
    let errorMessage = 'Registration failed';
    
    // Handle specific Firebase errors
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'An account with this email already exists. Please sign in instead.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password should be at least 6 characters';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your connection';
        break;
      default:
        errorMessage = error.message || errorMessage;
    }
    
    return { success: false, error: errorMessage };
  }
};

// Sign in user with comprehensive error handling
export const signInUser = async (email: string, password: string): Promise<AuthResult> => {
  try {
    const auth = getFirebaseAuth();
    const db = getFirebaseDB();
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Get user role from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserRole;
      
      // Update last login
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLogin: serverTimestamp(),
      });

      console.log('User signed in successfully:', userData);
      return { success: true, user: userData };
    } else {
      // Create user document if it doesn't exist (fallback)
      const fallbackRole: UserRole = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        role: 'user',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      };
      
      await setDoc(doc(db, 'users', firebaseUser.uid), fallbackRole);
      console.log('Created fallback user document:', fallbackRole);
      return { success: true, user: fallbackRole };
    }
  } catch (error: any) {
    console.error('Sign in error:', error);
    let errorMessage = 'Sign in failed';
    
    // Handle specific Firebase errors
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address';
        break;
      case 'auth/user-disabled':
        errorMessage = 'This account has been disabled';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many failed attempts. Try again later';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your connection';
        break;
      default:
        errorMessage = error.message || errorMessage;
    }
    
    return { success: false, error: errorMessage };
  }
};

// Get user role with caching
export const getUserRole = async (uid: string): Promise<UserRole | null> => {
  try {
    const db = getFirebaseDB();
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

// Update user profile
export const updateUserProfile = async (uid: string, updates: Partial<UserRole>): Promise<AuthResult> => {
  try {
    const db = getFirebaseDB();
    const userRef = doc(db, 'users', uid);
    
    await updateDoc(userRef, {
      ...updates,
    });
    
    // Get updated user data
    const updatedUser = await getUserRole(uid);
    
    console.log('Profile updated successfully:', updatedUser);
    return { success: true, user: updatedUser || undefined };
  } catch (error: any) {
    console.error('Profile update error:', error);
    return { success: false, error: error.message || 'Failed to update profile' };
  }
};

// Password reset
export const resetPassword = async (email: string): Promise<AuthResult> => {
  try {
    const auth = getFirebaseAuth();
    await sendPasswordResetEmail(auth, email);
    
    console.log('Password reset email sent to:', email);
    return { success: true };
  } catch (error: any) {
    console.error('Password reset error:', error);
    let errorMessage = 'Failed to send reset email';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address';
        break;
      default:
        errorMessage = error.message || errorMessage;
    }
    
    return { success: false, error: errorMessage };
  }
};

// Sign out user
export const signOutUser = async (): Promise<AuthResult> => {
  try {
    const auth = getFirebaseAuth();
    await signOut(auth);
    
    console.log('User signed out successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Sign out error:', error);
    return { success: false, error: error.message || 'Failed to sign out' };
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

// Get current authenticated user
export const getCurrentUser = (): FirebaseUser | null => {
  const auth = getFirebaseAuth();
  return auth.currentUser;
};

// Check if user is authenticated
export const isUserAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};
