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

// Incident Services
export const createIncidentReport = async (incidentData: any) => {
  try {
    const incidentId = `${incidentData.userId}_${Date.now()}`;
    const incidentRef = doc(db, 'incidents', incidentId);

    const completeIncidentData = {
      ...incidentData,
      id: incidentId,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(incidentRef, completeIncidentData);
    return { success: true, data: completeIncidentData };
  } catch (error) {
    console.error('Error creating incident report:', error);
    return { success: false, error };
  }
};

export const getUserIncidents = async (userId: string) => {
  try {
    const hazardsQuery = query(
      collection(db, 'incidents'),
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
    console.error('Error getting user incidents:', error);
    return { success: false, error };
  }
};

export const getAllIncidents = async (limitCount = 50) => {
  try {
    const hazardsQuery = query(
      collection(db, 'incidents'),
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
    console.error('Error getting all incidents:', error);
    return { success: false, error };
  }
};

export const getIncidentsByAgency = async (agency: string, limitCount = 50) => {
  try {
    const incidentsQuery = query(
      collection(db, 'incidents'),
      where('agency', '==', agency)
    );
    const querySnapshot = await getDocs(incidentsQuery);

    const incidents = querySnapshot.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.toDate?.()?.getTime() ?? 0;
        const bTime = b.createdAt?.toDate?.()?.getTime() ?? 0;
        return bTime - aTime;
      })
      .slice(0, limitCount);

    return { success: true, data: incidents };
  } catch (error) {
    console.error('Error getting incidents by agency:', error);
    return { success: false, error };
  }
};

export const getAgencyIncidentCounts = async () => {
  try {
    const allIncidentsResult = await getAllIncidents(1000);
    if (!allIncidentsResult.success) {
      return { success: false, error: allIncidentsResult.error };
    }

    const incidents = allIncidentsResult.data ?? [];
    const counts: Record<string, number> = {
      PNP: 0,
      BFP: 0,
      RHU: 0,
      BDRRMC: 0,
    };

    incidents.forEach((incident: any) => {
      if (incident.agency && counts[incident.agency] !== undefined) {
        counts[incident.agency] += 1;
      }
    });

    return { success: true, data: counts };
  } catch (error) {
    console.error('Error getting agency incident counts:', error);
    return { success: false, error };
  }
};

export const updateIncidentStatus = async (incidentId: string, status: string) => {
  try {
    const incidentRef = doc(db, 'incidents', incidentId);
    await updateDoc(incidentRef, {
      status,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating incident status:', error);
    return { success: false, error };
  }
};

export const deleteIncidentReport = async (incidentId: string) => {
  try {
    const incidentRef = doc(db, 'incidents', incidentId);
    await deleteDoc(incidentRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting incident report:', error);
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
export const getIncidentStatistics = async () => {
  try {
    const allIncidentsResult = await getAllIncidents(1000);
    if (!allIncidentsResult.success) {
      return { success: false, error: allIncidentsResult.error };
    }

    const hazards = allIncidentsResult.data ?? [];
    
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
    console.error('Error getting incident statistics:', error);
    return { success: false, error };
  }
};
