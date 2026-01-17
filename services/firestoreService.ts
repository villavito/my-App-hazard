import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from '../config/firebase';

// User Services
export const createUserDocument = async (userData: any) => {
  try {
    const userRef = doc(db, 'users', userData.uid);
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error creating user document:', error);
    return { success: false, error };
  }
};

export const getUserDocument = async (uid: string) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    }
    return { success: false, error: 'User not found' };
  } catch (error) {
    console.error('Error getting user document:', error);
    return { success: false, error };
  }
};

export const updateUserLastLogin = async (uid: string) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      lastLogin: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating last login:', error);
    return { success: false, error };
  }
};

// Hazard Services
export const createHazardReport = async (hazardData: any) => {
  try {
    const hazardId = `${hazardData.userId}_${Date.now()}`;
    const hazardRef = doc(db, 'hazards', hazardId);
    
    const completeHazardData = {
      ...hazardData,
      id: hazardId,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(hazardRef, completeHazardData);
    return { success: true, data: completeHazardData };
  } catch (error) {
    console.error('Error creating hazard report:', error);
    return { success: false, error };
  }
};

export const getUserHazards = async (userId: string) => {
  try {
    const hazardsQuery = query(
      collection(db, 'hazards'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(hazardsQuery);
    
    const hazards = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { success: true, data: hazards };
  } catch (error) {
    console.error('Error getting user hazards:', error);
    return { success: false, error };
  }
};

export const getAllHazards = async (limitCount = 50) => {
  try {
    const hazardsQuery = query(
      collection(db, 'hazards'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(hazardsQuery);
    
    const hazards = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { success: true, data: hazards };
  } catch (error) {
    console.error('Error getting all hazards:', error);
    return { success: false, error };
  }
};

export const updateHazardStatus = async (hazardId: string, status: string) => {
  try {
    const hazardRef = doc(db, 'hazards', hazardId);
    await updateDoc(hazardRef, {
      status,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating hazard status:', error);
    return { success: false, error };
  }
};

export const deleteHazardReport = async (hazardId: string) => {
  try {
    const hazardRef = doc(db, 'hazards', hazardId);
    await deleteDoc(hazardRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting hazard report:', error);
    return { success: false, error };
  }
};

// Admin Services
export const getAllUsers = async () => {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(usersQuery);
    
    const users = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { success: true, data: users };
  } catch (error) {
    console.error('Error getting all users:', error);
    return { success: false, error };
  }
};

export const updateUserRole = async (uid: string, role: string) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { role });
    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error };
  }
};

// Statistics Services
export const getHazardStatistics = async () => {
  try {
    const allHazardsResult = await getAllHazards(1000);
    if (!allHazardsResult.success) {
      return { success: false, error: allHazardsResult.error };
    }
    
    const hazards = allHazardsResult.data;
    
    const stats = {
      total: hazards.length,
      pending: hazards.filter((h: any) => h.status === 'pending').length,
      inProgress: hazards.filter((h: any) => h.status === 'in_progress').length,
      resolved: hazards.filter((h: any) => h.status === 'resolved').length,
      thisMonth: hazards.filter((h: any) => {
        const createdAt = h.createdAt.toDate();
        const now = new Date();
        return createdAt.getMonth() === now.getMonth() && 
               createdAt.getFullYear() === now.getFullYear();
      }).length
    };
    
    return { success: true, data: stats };
  } catch (error) {
    console.error('Error getting hazard statistics:', error);
    return { success: false, error };
  }
};
