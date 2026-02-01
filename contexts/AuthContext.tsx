import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createLocalUser,
  resetLocalPassword,
  signInLocalUser,
  signOutLocalUser
} from '../services/localAuthService';

interface User {
  email: string;
  displayName: string;
  uid: string;
  role?: 'user' | 'admin' | 'super_admin';
}

interface AuthContextProps {
  user: User | null;
  userRole: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{success: boolean, user?: User, error?: string}>;
  signUp: (email: string, password: string, name: string, role?: string) => Promise<{success: boolean, user?: User, error?: string}>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{success: boolean, error?: string}>;
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
  const [userRole, setUserRole] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing user session on mount
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      console.log('🔍 Checking user session...');
      
      // Check if user data exists in localStorage (for web) or AsyncStorage (for mobile)
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('hazard_user');
        const storedRole = localStorage.getItem('hazard_userRole');
        
        if (storedUser && storedRole) {
          const userData = JSON.parse(storedUser);
          const roleData = JSON.parse(storedRole);
          
          console.log('✅ Found stored user session:', userData);
          setUser(userData);
          setUserRole(roleData);
        } else {
          console.log('❌ No stored user session found');
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Session check error:', error);
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInLocalUser(email, password);
      if (result.success && result.user) {
        setUser({
          email: result.user.email,
          displayName: result.user.displayName,
          uid: result.user.uid,
          role: result.user.role
        });
        setUserRole(result.user.role);
        
        // Store in localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('hazard_user', JSON.stringify(result.user));
          localStorage.setItem('hazard_userRole', JSON.stringify(result.user.role));
        }
      }
      return result;
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  };

  const signUp = async (email: string, password: string, name: string, role: string = 'admin') => {
    try {
      const result = await createLocalUser(email, password, name, role);
      if (result.success && result.user) {
        setUser({
          email: result.user.email,
          displayName: result.user.displayName,
          uid: result.user.uid,
          role: result.user.role
        });
        setUserRole(result.user.role);
        
        // Store in localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('hazard_user', JSON.stringify(result.user));
          localStorage.setItem('hazard_userRole', JSON.stringify(result.user.role));
        }
      }
      return result;
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await signOutLocalUser();
      setUser(null);
      setUserRole(null);
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hazard_user');
        localStorage.removeItem('hazard_userRole');
      }
    } catch (error: any) {
      console.error('Sign out error:', error);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const result = await resetLocalPassword(email);
      return result;
    } catch (error: any) {
      console.error('Forgot password error:', error);
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, signIn, signUp, signOut, forgotPassword }}>
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
