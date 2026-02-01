import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'hazard_approved' | 'hazard_declined' | 'new_hazard' | 'system_alert';
  read: boolean;
  createdAt: any;
  data?: any;
}

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000' : '#fff',
    },
    header: {
      padding: 20,
      paddingTop: 40,
      backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: isDark ? '#888' : '#666',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    notificationCard: {
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#007AFF',
    },
    unreadCard: {
      borderLeftColor: '#FF3B30',
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    notificationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    notificationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      flex: 1,
    },
    notificationTime: {
      fontSize: 12,
      color: isDark ? '#888' : '#666',
    },
    notificationMessage: {
      fontSize: 14,
      color: isDark ? '#ccc' : '#666',
      lineHeight: 20,
      marginBottom: 8,
    },
    notificationFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    typeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      fontSize: 12,
      fontWeight: '600',
    },
    approvedBadge: {
      backgroundColor: '#4CAF50',
      color: '#fff',
    },
    declinedBadge: {
      backgroundColor: '#F44336',
      color: '#fff',
    },
    infoBadge: {
      backgroundColor: '#2196F3',
      color: '#fff',
    },
    warningBadge: {
      backgroundColor: '#FF9800',
      color: '#fff',
    },
    markAsReadButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: '#007AFF',
      borderRadius: 6,
    },
    markAsReadText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyIcon: {
      fontSize: 64,
      color: isDark ? '#444' : '#ccc',
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 18,
      color: isDark ? '#888' : '#666',
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: isDark ? '#666' : '#999',
      textAlign: 'center',
    },
    backButton: {
      position: 'absolute',
      top: 40,
      left: 20,
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#2a2a2a' : '#e9ecef',
    },
    actionButton: {
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    settingIcon: {
      fontSize: 24,
      marginRight: 16,
      color: '#007AFF',
    },
    buttonText: {
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
      marginLeft: 16,
      flex: 1,
    },
  });

  // Mock notifications data
  const mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'Hazard Report Approved! ✅',
      message: 'Your hazard report at "Main Street Intersection" has been approved by an admin.',
      type: 'hazard_approved',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      data: { location: 'Main Street Intersection' }
    },
    {
      id: '2',
      title: 'New Hazard Reported Nearby',
      message: 'A new hazard has been reported within 2 miles of your current location.',
      type: 'new_hazard',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      id: '3',
      title: 'Report Declined ❌',
      message: 'Your hazard report at "Parking Lot A" has been declined. Please review our guidelines.',
      type: 'hazard_declined',
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      data: { location: 'Parking Lot A' }
    },
    {
      id: '4',
      title: 'System Maintenance',
      message: 'The hazard reporting system will be under maintenance tonight from 2-4 AM.',
      type: 'system_alert',
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    },
  ];

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // TODO: Replace with actual API call
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // TODO: Replace with actual API call
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case 'hazard_approved':
        return styles.approvedBadge;
      case 'hazard_declined':
        return styles.declinedBadge;
      case 'new_hazard':
        return styles.warningBadge;
      case 'system_alert':
        return styles.infoBadge;
      default:
        return styles.infoBadge;
    }
  };

  const getTypeBadgeText = (type: string) => {
    switch (type) {
      case 'hazard_approved':
        return 'APPROVED';
      case 'hazard_declined':
        return 'DECLINED';
      case 'new_hazard':
        return 'NEW';
      case 'system_alert':
        return 'SYSTEM';
      default:
        return 'INFO';
    }
  };

  const formatTime = (date: any) => {
    const now = new Date();
    const notificationDate = date.toDate ? date.toDate() : new Date(date);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={[
        styles.notificationCard,
        !item.read && styles.unreadCard
      ]}
      onPress={() => !item.read && markAsRead(item.id)}
    >
      <View style={styles.notificationHeader}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationTime}>{formatTime(item.createdAt)}</Text>
      </View>
      
      <Text style={styles.notificationMessage}>{item.message}</Text>
      
      <View style={styles.notificationFooter}>
        <View style={[styles.typeBadge, getTypeBadgeStyle(item.type)]}>
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
            {getTypeBadgeText(item.type)}
          </Text>
        </View>
        
        {!item.read && (
          <TouchableOpacity 
            style={styles.markAsReadButton}
            onPress={() => markAsRead(item.id)}
          >
            <Text style={styles.markAsReadText}>Mark as read</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </Text>
      </View>

      <View style={styles.content}>
        {notifications.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>You'll see updates about your hazard reports here</Text>
          </View>
        ) : (
          <>
            {unreadCount > 0 && (
              <TouchableOpacity 
                style={[styles.actionButton, { marginBottom: 16 }]}
                onPress={markAllAsRead}
              >
                <Ionicons name="checkmark-done" style={styles.settingIcon} />
                <Text style={styles.buttonText}>Mark all as read</Text>
              </TouchableOpacity>
            )}
            
            <FlatList
              data={notifications}
              renderItem={renderNotification}
              keyExtractor={(item) => item.id}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
