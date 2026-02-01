import { initializeApp } from 'firebase/app';
import {
    createUserWithEmailAndPassword,
    getAuth,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from 'firebase/auth';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

// Direct Firebase initialization to bypass config issues
const firebaseConfig = {
  apiKey: "AIzaSyCMz8fLrVUG-ujxt1SSjiN537p_yCMQnPg",
  authDomain: "thehazard-75651.firebaseapp.com",
  databaseURL: "https://thehazard-75651-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "thehazard-75651",
  storageBucket: "thehazard-75651.firebasestorage.app",
  messagingSenderId: "203788333932",
  appId: "1:203788333932:web:3e4794421129e0f73d3949",
  measurementId: "G-E3CBCE8VXV"
};

// Initialize Firebase directly
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('🔥 Firebase initialized directly in authService');
console.log('📱 Project:', firebaseConfig.projectId);
console.log('🔑 API Key:', firebaseConfig.apiKey.substring(0, 20) + '...');

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
    console.log('🔥 Starting user creation process...');
    console.log('📧 Email:', email);
    console.log('👤 Name:', displayName);
    
    const firebaseUser = await createUserWithEmailAndPassword(auth, email, password);
    console.log('✅ User created in Firebase Auth:', firebaseUser.user.uid);
    
    await updateProfile(firebaseUser.user, { displayName });
    console.log('✅ Profile updated successfully');

    console.log('📄 Creating user document in Firestore...');
    const userRole: UserRole = {
      uid: firebaseUser.user.uid,
      email: firebaseUser.user.email!,
      displayName,
      role,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    };

    const cleanedUserRole = Object.fromEntries(
      Object.entries(userRole).filter(([_, value]) => value !== undefined)
    );

    console.log('💾 Saving user data to Firestore:', cleanedUserRole);
    await setDoc(doc(db, 'users', firebaseUser.user.uid), cleanedUserRole);
    console.log('✅ User document saved successfully');
    
    console.log('🎉 User creation completed successfully:', userRole);
    return { success: true, user: userRole };
  } catch (error: any) {
    console.error('❌ Auth service error details:', {
      code: error.code,
      message: error.message,
      email: error.email,
      credential: error.credential,
      stack: error.stack
    });
    
    let errorMessage = 'Registration failed';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'An account with this email already exists. Please sign in instead.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password must be at least 6 characters';
        break;
      case 'auth/password-does-not-meet-requirements':
        errorMessage = 'Password must contain uppercase letter, lowercase letter, number, and special character';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address';
        break;
      case 'auth/api-key-not-valid':
        errorMessage = 'Firebase API key is invalid. Please check your configuration.';
        break;
      case 'auth/project-not-found':
        errorMessage = 'Firebase project not found. Please check your project ID.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your internet connection.';
        break;
      default:
        errorMessage = error.message || 'An error occurred during registration';
    }
    
    console.log('🚫 Returning error:', errorMessage);
    return { success: false, error: errorMessage };
  }
};

// Sign in user with comprehensive error handling
export const signInUser = async (email: string, password: string): Promise<AuthResult> => {
  try {
    console.log('🔍 Starting sign in process for:', email);
    
    console.log('📱 Firebase Auth instance:', auth ? 'Available' : 'Not available');
    console.log('🔥 Firebase DB instance:', db ? 'Available' : 'Not available');
    
    console.log('🔐 Attempting Firebase sign in...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    console.log('✅ Firebase sign in successful:', {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName
    });

    // Get user role from Firestore
    console.log('📄 Fetching user role from Firestore...');
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as UserRole;
      console.log('📋 User data found:', userData);
      
      // Update last login
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLogin: serverTimestamp(),
      });

      console.log('✅ Sign in completed successfully');
      return { success: true, user: userData };
    } else {
      console.log('⚠️ No user document found, creating fallback...');
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
      console.log('✅ Created fallback user document:', fallbackRole);
      return { success: true, user: fallbackRole };
    }
  } catch (error: any) {
    console.error('❌ Sign in error details:', {
      code: error.code,
      message: error.message,
      email: error.email,
      credential: error.credential
    });
    
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
    
    console.log('🚫 Returning error:', errorMessage);
    return { success: false, error: errorMessage };
  }
};

// Get user role with caching
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

// Update user profile
export const updateUserProfile = async (uid: string, updates: Partial<UserRole>): Promise<AuthResult> => {
  try {
    await updateDoc(doc(db, 'users', uid), {
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
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your connection';
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
export const getCurrentUser = (): any | null => {
  return auth.currentUser;
};

// Check if user is authenticated
export const isUserAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};
