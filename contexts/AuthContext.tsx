import { onAuthStateChanged } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuthInstance } from '../config/firebase';
import { getUserRole, UserRole } from '../services/authService';

interface AuthContextType {
  user: any;
  userRole: UserRole | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  loading: true,
  isAdmin: false,
  isSuperAdmin: false,
  refreshUserRole: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserRole = async () => {
    const auth = getAuthInstance();
    if (!auth.currentUser) {
      setUserRole(null);
      return;
    }

    const role = await getUserRole(auth.currentUser.uid);
    setUserRole(role);
  };

  useEffect(() => {
    const auth = getAuthInstance();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const role = await getUserRole(firebaseUser.uid);
        setUserRole(role);
      } else {
        setUserRole(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isAdmin = userRole ? (userRole.role === 'admin' || userRole.role === 'super_admin') : false;
  const isSuperAdmin = userRole ? userRole.role === 'super_admin' : false;

  return (
    <AuthContext.Provider value={{
      user,
      userRole,
      loading,
      isAdmin,
      isSuperAdmin,
      refreshUserRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
