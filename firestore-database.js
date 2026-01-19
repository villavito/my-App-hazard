// Complete Firestore Database Code for Hazard App
// Copy and paste this into your Firebase project

import {
    addDoc,
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
    where,
    writeBatch
} from 'firebase/firestore';
import { getFirebaseDB } from '../config/firebase';

// ==================== USER COLLECTION OPERATIONS ====================

// Create user document
export const createUserDocument = async (userData) => {
  try {
    const db = getFirebaseDB();
    const userRef = doc(db, 'users', userData.uid);
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });
    console.log('User document created successfully');
    return { success: true, data: userData };
  } catch (error) {
    console.error('Error creating user document:', error);
    return { success: false, error: error.message };
  }
};

// Get user document
export const getUserDocument = async (uid) => {
  try {
    const db = getFirebaseDB();
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    console.error('Error getting user document:', error);
    return { success: false, error: error.message };
  }
};

// Update user document
export const updateUserDocument = async (uid, updates) => {
  try {
    const db = getFirebaseDB();
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    console.log('User document updated successfully');
    return { success: true };
  } catch (error) {
    console.error('Error updating user document:', error);
    return { success: false, error: error.message };
  }
};

// Delete user document
export const deleteUserDocument = async (uid) => {
  try {
    const db = getFirebaseDB();
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);
    console.log('User document deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('Error deleting user document:', error);
    return { success: false, error: error.message };
  }
};

// ==================== HAZARD COLLECTION OPERATIONS ====================

// Create hazard document
export const createHazardDocument = async (hazardData) => {
  try {
    const db = getFirebaseDB();
    const hazardRef = doc(db, 'hazards', hazardData.id);
    await setDoc(hazardRef, {
      ...hazardData,
      createdAt: serverTimestamp(),
      status: 'pending',
    });
    console.log('Hazard document created successfully');
    return { success: true, data: hazardData };
  } catch (error) {
    console.error('Error creating hazard document:', error);
    return { success: false, error: error.message };
  }
};

// Get user's hazards
export const getUserHazards = async (userId) => {
  try {
    const db = getFirebaseDB();
    const hazardsRef = collection(db, 'hazards');
    const q = query(
      hazardsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const hazards = [];
    querySnapshot.forEach((doc) => {
      hazards.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: hazards };
  } catch (error) {
    console.error('Error getting user hazards:', error);
    return { success: false, error: error.message };
  }
};

// Get all hazards (for admin)
export const getAllHazards = async () => {
  try {
    const db = getFirebaseDB();
    const hazardsRef = collection(db, 'hazards');
    const q = query(hazardsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const hazards = [];
    querySnapshot.forEach((doc) => {
      hazards.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: hazards };
  } catch (error) {
    console.error('Error getting all hazards:', error);
    return { success: false, error: error.message };
  }
};

// Update hazard status
export const updateHazardStatus = async (hazardId, status) => {
  try {
    const db = getFirebaseDB();
    const hazardRef = doc(db, 'hazards', hazardId);
    await updateDoc(hazardRef, {
      status,
      updatedAt: serverTimestamp(),
    });
    console.log('Hazard status updated successfully');
    return { success: true };
  } catch (error) {
    console.error('Error updating hazard status:', error);
    return { success: false, error: error.message };
  }
};

// Delete hazard
export const deleteHazardDocument = async (hazardId) => {
  try {
    const db = getFirebaseDB();
    const hazardRef = doc(db, 'hazards', hazardId);
    await deleteDoc(hazardRef);
    console.log('Hazard document deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('Error deleting hazard document:', error);
    return { success: false, error: error.message };
  }
};

// ==================== REPORT COLLECTION OPERATIONS ====================

// Create report document
export const createReportDocument = async (reportData) => {
  try {
    const db = getFirebaseDB();
    const reportsRef = collection(db, 'reports');
    const docRef = await addDoc(reportsRef, {
      ...reportData,
      createdAt: serverTimestamp(),
      status: 'pending',
    });
    console.log('Report document created successfully');
    return { success: true, data: { id: docRef.id, ...reportData } };
  } catch (error) {
    console.error('Error creating report document:', error);
    return { success: false, error: error.message };
  }
};

// Get hazard reports
export const getHazardReports = async (hazardId) => {
  try {
    const db = getFirebaseDB();
    const reportsRef = collection(db, 'reports');
    const q = query(
      reportsRef,
      where('hazardId', '==', hazardId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const reports = [];
    querySnapshot.forEach((doc) => {
      reports.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: reports };
  } catch (error) {
    console.error('Error getting hazard reports:', error);
    return { success: false, error: error.message };
  }
};

// ==================== COMMENT COLLECTION OPERATIONS ====================

// Create comment document
export const createCommentDocument = async (commentData) => {
  try {
    const db = getFirebaseDB();
    const commentsRef = collection(db, 'comments');
    const docRef = await addDoc(commentsRef, {
      ...commentData,
      createdAt: serverTimestamp(),
    });
    console.log('Comment document created successfully');
    return { success: true, data: { id: docRef.id, ...commentData } };
  } catch (error) {
    console.error('Error creating comment document:', error);
    return { success: false, error: error.message };
  }
};

// Get hazard comments
export const getHazardComments = async (hazardId) => {
  try {
    const db = getFirebaseDB();
    const commentsRef = collection(db, 'comments');
    const q = query(
      commentsRef,
      where('hazardId', '==', hazardId),
      orderBy('createdAt', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    const comments = [];
    querySnapshot.forEach((doc) => {
      comments.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: comments };
  } catch (error) {
    console.error('Error getting hazard comments:', error);
    return { success: false, error: error.message };
  }
};

// ==================== NOTIFICATION COLLECTION OPERATIONS ====================

// Create notification document
export const createNotificationDocument = async (notificationData) => {
  try {
    const db = getFirebaseDB();
    const notificationsRef = collection(db, 'notifications');
    const docRef = await addDoc(notificationsRef, {
      ...notificationData,
      createdAt: serverTimestamp(),
      read: false,
    });
    console.log('Notification document created successfully');
    return { success: true, data: { id: docRef.id, ...notificationData } };
  } catch (error) {
    console.error('Error creating notification document:', error);
    return { success: false, error: error.message };
  }
};

// Get user notifications
export const getUserNotifications = async (userId) => {
  try {
    const db = getFirebaseDB();
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const querySnapshot = await getDocs(q);
    
    const notifications = [];
    querySnapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: notifications };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return { success: false, error: error.message };
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    const db = getFirebaseDB();
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp(),
    });
    console.log('Notification marked as read');
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
};

// ==================== ADMIN OPERATIONS ====================

// Get admin statistics
export const getAdminStatistics = async () => {
  try {
    const db = getFirebaseDB();
    const stats = {};
    
    // Get total users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    stats.totalUsers = usersSnapshot.size;
    
    // Get total hazards
    const hazardsRef = collection(db, 'hazards');
    const hazardsSnapshot = await getDocs(hazardsRef);
    stats.totalHazards = hazardsSnapshot.size;
    
    // Get hazards by status
    const pendingQuery = query(hazardsRef, where('status', '==', 'pending'));
    const pendingSnapshot = await getDocs(pendingQuery);
    stats.pendingHazards = pendingSnapshot.size;
    
    const resolvedQuery = query(hazardsRef, where('status', '==', 'resolved'));
    const resolvedSnapshot = await getDocs(resolvedQuery);
    stats.resolvedHazards = resolvedSnapshot.size;
    
    return { success: true, data: stats };
  } catch (error) {
    console.error('Error getting admin statistics:', error);
    return { success: false, error: error.message };
  }
};

// ==================== BATCH OPERATIONS ====================

// Batch update multiple documents
export const batchUpdateDocuments = async (updates) => {
  try {
    const db = getFirebaseDB();
    const batch = writeBatch(db);
    
    updates.forEach(({ collection, docId, data }) => {
      const docRef = doc(db, collection, docId);
      batch.update(docRef, { ...data, updatedAt: serverTimestamp() });
    });
    
    await batch.commit();
    console.log('Batch update completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error in batch update:', error);
    return { success: false, error: error.message };
  }
};

// ==================== UTILITY FUNCTIONS ====================

// Get document by ID (any collection)
export const getDocumentById = async (collectionName, docId) => {
  try {
    const db = getFirebaseDB();
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    } else {
      return { success: false, error: 'Document not found' };
    }
  } catch (error) {
    console.error('Error getting document:', error);
    return { success: false, error: error.message };
  }
};

// Search documents by field
export const searchDocuments = async (collectionName, field, value) => {
  try {
    const db = getFirebaseDB();
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, where(field, '==', value));
    const querySnapshot = await getDocs(q);
    
    const documents = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: documents };
  } catch (error) {
    console.error('Error searching documents:', error);
    return { success: false, error: error.message };
  }
};

console.log('Firestore Database operations loaded successfully!');
