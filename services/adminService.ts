import { createUserWithRole } from './authService';

// Utility functions to create admin users
// These should be used in a secure environment or by existing super admins

export const createAdminUser = async (email: string, password: string, displayName: string) => {
  return await createUserWithRole(email, password, displayName, 'admin');
};

export const createSuperAdminUser = async (email: string, password: string, displayName: string) => {
  return await createUserWithRole(email, password, displayName, 'super_admin');
};

// Example usage - These should be called from a secure admin panel or script
// Uncomment and modify with actual admin credentials when needed

/*
// Create initial super admin (run this once during setup)
export const setupInitialSuperAdmin = async () => {
  const result = await createSuperAdminUser(
    'superadmin@hazard.com',
    'SuperAdmin123!',
    'Super Admin'
  );
  
  if (result.success) {
    console.log('Super admin created successfully');
  } else {
    console.error('Failed to create super admin:', result.error);
  }
  
  return result;
};

// Create regular admin
export const setupAdminUser = async () => {
  const result = await createAdminUser(
    'admin@hazard.com',
    'Admin123!',
    'Admin User'
  );
  
  if (result.success) {
    console.log('Admin created successfully');
  } else {
    console.error('Failed to create admin:', result.error);
  }
  
  return result;
};
*/
