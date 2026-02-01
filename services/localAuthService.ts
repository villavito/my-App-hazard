// Local Authentication Service - Bypass Firebase completely
// This works immediately without any API key issues

export interface LocalUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin' | 'super_admin';
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
  avatar?: string;
  phone?: string;
  password?: string; // Add password for internal storage
}

export interface LocalAuthResult {
  success: boolean;
  user?: LocalUser;
  error?: string;
}

// Get users from localStorage
const getUsers = (): LocalUser[] => {
  try {
    const users = localStorage.getItem('hazard_local_users');
    return users ? JSON.parse(users) : [];
  } catch (error) {
    console.error('Error getting users from localStorage:', error);
    return [];
  }
};

// Save users to localStorage
const saveUsers = (users: LocalUser[]): void => {
  try {
    localStorage.setItem('hazard_local_users', JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users to localStorage:', error);
  }
};

// Get current user from localStorage
const getCurrentUser = (): LocalUser | null => {
  try {
    const currentUser = localStorage.getItem('hazard_current_user');
    return currentUser ? JSON.parse(currentUser) : null;
  } catch (error) {
    console.error('Error getting current user from localStorage:', error);
    return null;
  }
};

// Save current user to localStorage
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

// Generate unique ID
const generateUid = (): string => {
  return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Create user with role
export const createLocalUser = async (
  email: string,
  password: string,
  displayName: string,
  role: string = 'admin'
): Promise<LocalAuthResult> => {
  try {
    console.log('🔥 Creating local user:', { email, displayName, role });
    
    const users = getUsers();
    
    // Check if user already exists
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'An account with this email already exists' };
    }
    
    // Validate input
    if (!email || !password || !displayName) {
      return { success: false, error: 'Please fill in all fields' };
    }
    
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }
    
    // Create new user
    const newUser: LocalUser = {
      uid: generateUid(),
      email: email.toLowerCase(),
      displayName: displayName.trim(),
      role: role as 'user' | 'admin' | 'super_admin',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      isActive: true
    };
    
    // Save user with password (in a real app, you'd hash this)
    const userWithPassword = { ...newUser, password };
    users.push(userWithPassword);
    saveUsers(users);
    
    console.log('✅ Local user created successfully:', newUser);
    
    // Auto-login after registration
    saveCurrentUser(newUser);
    
    return { success: true, user: newUser };
    
  } catch (error: any) {
    console.error('❌ Local user creation error:', error);
    return { success: false, error: error.message || 'Failed to create user' };
  }
};

// Sign in user
export const signInLocalUser = async (email: string, password: string): Promise<LocalAuthResult> => {
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

// Sign out user
export const signOutLocalUser = async (): Promise<LocalAuthResult> => {
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

// Get current user
export const getCurrentLocalUser = (): LocalUser | null => {
  return getCurrentUser();
};

// Check if user is authenticated
export const isLocalUserAuthenticated = (): boolean => {
  return getCurrentUser() !== null;
};

// Update user profile
export const updateLocalUserProfile = async (uid: string, updates: Partial<LocalUser>): Promise<LocalAuthResult> => {
  try {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.uid === uid);
    
    if (userIndex === -1) {
      return { success: false, error: 'User not found' };
    }
    
    // Update user
    users[userIndex] = { ...users[userIndex], ...updates };
    saveUsers(users);
    
    // Update current user if it's the same user
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.uid === uid) {
      saveCurrentUser({ ...currentUser, ...updates });
    }
    
    const updatedUser = users[userIndex];
    const { password: _, ...userWithoutPassword } = updatedUser;
    
    console.log('✅ Local profile updated successfully:', userWithoutPassword);
    return { success: true, user: userWithoutPassword as LocalUser };
    
  } catch (error: any) {
    console.error('❌ Local profile update error:', error);
    return { success: false, error: error.message || 'Failed to update profile' };
  }
};

// Password reset (simplified - just shows the password)
export const resetLocalPassword = async (email: string): Promise<LocalAuthResult> => {
  try {
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return { success: false, error: 'No account found with this email' };
    }
    
    console.log('🔑 Password reset for local user:', email);
    console.log('⚠️ In production, you would send a reset email. For now, password is:', user.password);
    
    return { success: true, error: 'Password reset functionality not implemented in local mode' };
    
  } catch (error: any) {
    console.error('❌ Local password reset error:', error);
    return { success: false, error: error.message || 'Failed to reset password' };
  }
};

// Check if user is admin or super admin
export const isLocalAdmin = (userRole: LocalUser): boolean => {
  return userRole.role === 'admin' || userRole.role === 'super_admin';
};

// Check if user is super admin
export const isLocalSuperAdmin = (userRole: LocalUser): boolean => {
  return userRole.role === 'super_admin';
};

// Get user by UID
export const getLocalUserByUid = async (uid: string): Promise<LocalUser | null> => {
  try {
    const users = getUsers();
    const user = users.find(u => u.uid === uid);
    
    if (!user) {
      return null;
    }
    
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as LocalUser;
    
  } catch (error) {
    console.error('Error getting local user by UID:', error);
    return null;
  }
};

// Initialize with some default users if empty
export const initializeDefaultUsers = (): void => {
  try {
    const users = getUsers();
    
    // Always ensure super admin exists
    const superAdminExists = users.some(user => user.email === 'superadmin@hazard.local');
    
    if (!superAdminExists) {
      console.log('🔥 Creating super admin account...');
      
      const superAdmin = {
        uid: 'local_super_admin_default',
        email: 'superadmin@hazard.local',
        displayName: 'Super Admin',
        password: 'SuperAdmin123!',
        role: 'super_admin' as const,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isActive: true
      };
      
      users.push(superAdmin);
      saveUsers(users);
      console.log('✅ Super admin account created');
    }
    
    // If no users at all, create all defaults
    if (users.length === 0) {
      console.log('🔥 Initializing default local users...');
      
      const defaultUsers = [
        {
          uid: 'local_super_admin_default',
          email: 'superadmin@hazard.local',
          displayName: 'Super Admin',
          password: 'SuperAdmin123!',
          role: 'super_admin' as const,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          isActive: true
        },
        {
          uid: 'local_admin_default',
          email: 'admin@hazard.local',
          displayName: 'Default Admin',
          password: 'Admin123!',
          role: 'admin' as const,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          isActive: true
        },
        {
          uid: 'local_user_default',
          email: 'user@hazard.local',
          displayName: 'Default User',
          password: 'User123!',
          role: 'user' as const,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          isActive: true
        }
      ];
      
      saveUsers(defaultUsers);
      console.log('✅ Default local users created');
    }
    
  } catch (error) {
    console.error('Error initializing default users:', error);
  }
};

// Auto-initialize
initializeDefaultUsers();
