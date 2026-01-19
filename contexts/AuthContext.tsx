import { onAuthStateChanged, User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getFirebaseAuth } from '../config/firebase';
import { AuthResult, createUserWithRole, getUserRole, resetPassword, signInUser, signOutUser, updateUserProfile, UserRole } from '../services/authService';

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  loading: boolean;
  navigationLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  // Auth functions
  signUp: (email: string, password: string, displayName: string, role?: 'user' | 'admin' | 'super_admin') => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  forgotPassword: (email: string) => Promise<AuthResult>;
  updateProfile: (updates: Partial<UserRole>) => Promise<AuthResult>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  navigationLoading: false,
  isAdmin: false,
  isSuperAdmin: false,
  signUp: async () => ({ success: false, error: 'AuthContext not initialized' }),
  signIn: async () => ({ success: false, error: 'AuthContext not initialized' }),
  signOut: async () => ({ success: false, error: 'AuthContext not initialized' }),
  forgotPassword: async () => ({ success: false, error: 'AuthContext not initialized' }),
  updateProfile: async () => ({ success: false, error: 'AuthContext not initialized' }),
  isAuthenticated: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [navigationLoading, setNavigationLoading] = useState(false);

  console.log('AuthProvider initializing...');

  // Auth functions
  const signUp = async (email: string, password: string, displayName: string, role: 'user' | 'admin' | 'super_admin' = 'user'): Promise<AuthResult> => {
    console.log('AuthContext signUp called with:', { email, displayName, role });
    setLoading(true);
    setNavigationLoading(true);
    try {
      const result = await createUserWithRole(email, password, displayName, role);
      console.log('AuthContext signUp result:', result);
      if (result.success && result.user) {
        setUserRole(result.user);
      }
      return result;
    } catch (error: any) {
      console.error('AuthContext signUp error:', error);
      return { success: false, error: error.message || 'Signup failed' };
    } finally {
      setLoading(false);
      setNavigationLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    console.log('AuthContext signIn called with:', { email });
    setLoading(true);
    setNavigationLoading(true);
    try {
      const result = await signInUser(email, password);
      console.log('AuthContext signIn result:', result);
      if (result.success && result.user) {
        setUserRole(result.user);
      }
      return result;
    } catch (error: any) {
      console.error('AuthContext signIn error:', error);
      return { success: false, error: error.message || 'Sign in failed' };
    } finally {
      setLoading(false);
      setNavigationLoading(false);
    }
  };

  const signOut = async (): Promise<AuthResult> => {
    setLoading(true);
    try {
      const result = await signOutUser();
      if (result.success) {
        setUser(null);
        setUserRole(null);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<AuthResult> => {
    return await resetPassword(email);
  };

  const updateProfile = async (updates: Partial<UserRole>): Promise<AuthResult> => {
    if (!user) {
      return { success: false, error: 'No authenticated user' };
    }
    
    setLoading(true);
    try {
      const result = await updateUserProfile(user.uid, updates);
      if (result.success && result.user) {
        setUserRole(result.user);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser);
      console.log('User email from auth:', firebaseUser?.email);
      console.log('User display name from auth:', firebaseUser?.displayName);
      
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const role = await getUserRole(firebaseUser.uid);
          console.log('User role from Firestore:', role);
          
          if (role) {
            setUserRole(role);
          } else {
            // Fallback: Create userRole from Firebase Auth if no Firestore document
            console.log('No Firestore document found, using Firebase Auth data');
            const fallbackRole: UserRole = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              role: 'user',
              createdAt: new Date(),
              lastLogin: new Date(),
              avatar: undefined,
              phone: undefined,
            };
            console.log('Created fallbackRole:', fallbackRole);
            setUserRole(fallbackRole);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          // Fallback on error
          const fallbackRole: UserRole = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            role: 'user',
            createdAt: new Date(),
            lastLogin: new Date(),
            avatar: undefined,
            phone: undefined,
          };
          console.log('Created error fallbackRole:', fallbackRole);
          setUserRole(fallbackRole);
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isAdmin = userRole ? (userRole.role === 'admin' || userRole.role === 'super_admin') : false;
  const isSuperAdmin = userRole ? userRole.role === 'super_admin' : false;
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      userRole,
      loading,
      navigationLoading,
      isAdmin,
      isSuperAdmin,
      signUp,
      signIn,
      signOut,
      forgotPassword,
      updateProfile,
      isAuthenticated,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
