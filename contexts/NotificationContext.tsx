import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getFirebaseDB } from '../config/firebase';
import { useAuth } from './AuthContext';

interface Notification {
  id: string;
  userId: string;
  type: 'report_approved' | 'report_declined' | 'system' | 'new_hazard_report';
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
  data?: any; // Additional data like reportId, etc.
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;

    // Temporarily disabled to fix permission issues
    // TODO: Fix Firestore rules and re-enable
    console.log('Notification listener temporarily disabled');
    
    return () => {};
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      const db = getFirebaseDB();
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const db = getFirebaseDB();
      const unreadNotifications = notifications.filter(n => !n.read);
      
      const batch = writeBatch(db);
      unreadNotifications.forEach(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.update(notificationRef, { read: true });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearNotifications = async () => {
    try {
      const db = getFirebaseDB();
      const userNotificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', user?.uid)
      );
      
      const snapshot = await getDocs(userNotificationsQuery);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Helper function to create notifications
export const createNotification = async (
  userId: string,
  type: 'report_approved' | 'report_declined' | 'system' | 'new_hazard_report',
  title: string,
  message: string,
  data?: any
) => {
  try {
    const db = getFirebaseDB();
    const notificationsCollection = collection(db, 'notifications');
    
    const notification = {
      userId,
      type,
      title,
      message,
      read: false,
      createdAt: serverTimestamp(),
      data
    };
    
    await addDoc(notificationsCollection, notification);
    console.log('Notification created successfully:', { userId, type, title });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Helper function to notify all admins
export const notifyAdmins = async (
  type: 'report_approved' | 'report_declined' | 'system' | 'new_hazard_report',
  title: string,
  message: string,
  data?: any
) => {
  try {
    const db = getFirebaseDB();
    const usersCollection = collection(db, 'users');
    const usersQuery = query(usersCollection, where('role', 'in', ['admin', 'super_admin']));
    
    const snapshot = await getDocs(usersQuery);
    const notificationsCollection = collection(db, 'notifications');
    
    const batch = writeBatch(db);
    
    snapshot.docs.forEach(userDoc => {
      const notification = {
        userId: userDoc.id,
        type,
        title,
        message,
        read: false,
        createdAt: serverTimestamp(),
        data
      };
      
      const notificationRef = doc(notificationsCollection);
      batch.set(notificationRef, notification);
    });
    
    await batch.commit();
    console.log('Admin notifications sent successfully:', { type, title, adminCount: snapshot.size });
  } catch (error) {
    console.error('Error notifying admins:', error);
  }
};
