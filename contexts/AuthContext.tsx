import { createUserWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { auth, db } from '../config/firebase';

type UserRole = 'user' | 'admin' | 'super_admin';

interface LocalUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
  avatar?: string;
  phone?: string;
  password?: string;
}

interface LocalAuthResult {
  success: boolean;
  user?: LocalUser;
  error?: string;
}

// Local auth helpers
const getUsers = (): LocalUser[] => {
  try {
    const users = localStorage.getItem('hazard_local_users');
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error('Error getting users from localStorage:', error);
    return [];
  }
};

const saveUsers = (users: LocalUser[]): void => {
  try {
    localStorage.setItem('hazard_local_users', JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users to localStorage:', error);
  }
};

const getCurrentUser = (): LocalUser | null => {
  try {
    const currentUser = localStorage.getItem('hazard_current_user');
    return currentUser ? JSON.parse(currentUser) : null;
  } catch (error) {
    console.error('Error getting current user from localStorage:', error);
    return null;
  }
};

const saveCurrentUser = (user: LocalUser | null): void => {
  try {
    if (user) {
      localStorage.setItem('hazard_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('hazard_current_user');
    }
  } catch (error) {
    console.error('Error saving current user to localStorage:', error);
  }
};

const signInLocalUser = async (email: string, password: string): Promise<LocalAuthResult> => {
  try {
    console.log('🔍 Signing in local user:', email);
    
    const users = getUsers();
    
    // Find user by email
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return { success: false, error: 'No account found with this email' };
    }
    
    // Check password (in a real app, you'd compare hashed passwords)
    if (user.password !== password) {
      return { success: false, error: 'Incorrect password' };
    }
    
    // Check if user is active
    if (!user.isActive) {
      return { success: false, error: 'This account has been disabled' };
    }
    
    // Update last login
    user.lastLogin = new Date().toISOString();
    const userIndex = users.findIndex(u => u.uid === user.uid);
    users[userIndex] = user;
    saveUsers(users);
    
    // Remove password before returning
    const { password: _, ...userWithoutPassword } = user;
    
    // Save current user
    saveCurrentUser(userWithoutPassword as LocalUser);
    
    console.log('✅ Local sign in successful:', userWithoutPassword);
    
    return { success: true, user: userWithoutPassword as LocalUser };
    
  } catch (error: any) {
    console.error('❌ Local sign in error:', error);
    return { success: false, error: error.message || 'Failed to sign in' };
  }
};

const signOutLocalUser = async (): Promise<LocalAuthResult> => {
  try {
    console.log('🔚 Signing out local user');
    
    saveCurrentUser(null);
    
    console.log('✅ Local sign out successful');
    return { success: true };
    
  } catch (error: any) {
    console.error('❌ Local sign out error:', error);
    return { success: false, error: error.message || 'Failed to sign out' };
  }
};

interface User {
  email: string;
  displayName: string;
  uid: string;
  role?: UserRole;
}

type AuthResult = { success: boolean; user?: User; error?: string };
type ForgotPasswordResult = { success: boolean; error?: string };

interface AuthContextProps {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, name: string, role?: UserRole) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<ForgotPasswordResult>;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  userRole: null,
  loading: true,
  signIn: async () => ({success: false}),
  signUp: async () => ({success: false}),
  signOut: async () => {},
  forgotPassword: async () => ({success: false}),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const role = userDoc.exists() ? userDoc.data()?.role : 'user';
          setUser({
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || '',
            uid: firebaseUser.uid,
            role: role as 'user' | 'admin' | 'super_admin'
          });
          setUserRole(role);
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUser(null);
          setUserRole(null);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (typeof window !== 'undefined') {
      // Use local auth on web
      try {
        const localResult = await signInLocalUser(email, password);
        if (localResult.success && localResult.user) {
          // Map LocalUser to User
          const mappedUser: User = {
            email: localResult.user.email,
            displayName: localResult.user.displayName,
            uid: localResult.user.uid,
            role: localResult.user.role
          };
          // Update state manually for local auth
          setUser(mappedUser);
          setUserRole(localResult.user.role);
          return { success: true, user: mappedUser };
        } else {
          return { success: false, error: localResult.error || 'Local sign in failed' };
        }
      } catch (localError: any) {
        console.error('Local auth error:', localError);
        return { success: false, error: localError.message || 'Local auth failed' };
      }
    } else {
      // Use Firebase on mobile
      try {
        await signInWithEmailAndPassword(auth, email, password);
        return { success: true };
      } catch (error: any) {
        console.error('Firebase sign in error:', error);
        return { success: false, error: error.message };
      }
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string, role: UserRole = 'user'): Promise<AuthResult> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        displayName: name,
        role
      });
      return { success: true };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error('Firebase sign out error:', error);
      // If on web and API key invalid, fallback to local auth
      if (Platform.OS === 'web' && error.message.includes('auth/api-key-not-valid')) {
        console.log('Falling back to local sign out for web');
        try {
          await localAuth.signOutLocalUser();
          setUser(null);
          setUserRole(null);
        } catch (localError: any) {
          console.error('Local sign out fallback error:', localError);
        }
      }
    }
  }, []);

  const forgotPassword = useCallback(async (email: string): Promise<ForgotPasswordResult> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      console.error('Forgot password error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  const value = useMemo(
    () => ({ user, userRole, loading, signIn, signUp, signOut, forgotPassword }),
    [user, userRole, loading, signIn, signUp, signOut, forgotPassword]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
