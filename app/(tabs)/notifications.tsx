import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import {
  deleteNotification,
  getUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/firestoreService';
import { showAlert } from '../../utils/crossPlatformAlert';

function formatNotificationDate(createdAt?: { toDate: () => Date }) {
  if (!createdAt?.toDate) return 'Unknown date';
  return createdAt.toDate().toLocaleString();
}

type AppNotification = {
  id: string;
  title: string;
  message: string;
  status?: string;
  read: boolean;
  createdAt?: { toDate: () => Date };
};

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const result = await getUserNotifications(user.uid);
    if (result.success && result.data) {
      setNotifications(result.data as AppNotification[]);
    }
  }, [user]);

  // Re-fetch every time this tab regains focus, not just on first mount -
  // otherwise a notification created while the user is elsewhere in the app
  // (e.g. an admin comment) never shows up until a full app restart.
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    markAllNotificationsRead(user.uid);
  };

  const openNotification = (id: string) => {
    router.push({ pathname: '/notification-detail', params: { id } });
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    markNotificationRead(id);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    deleteNotification(id);
  };

  const handleLongPress = (item: AppNotification) => {
    showAlert(item.title, 'What would you like to do with this notification?', [
      ...(!item.read
        ? [{ text: 'Mark as read', onPress: () => markAsRead(item.id) }]
        : []),
      {
        text: 'Delete',
        style: 'destructive' as const,
        onPress: () => removeNotification(item.id),
      },
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const getStatusStyle = (status?: string) => {
    switch (status) {
      case 'resolved':
        return { bg: isDark ? '#1a3a1a' : '#E8F5E9', icon: 'checkmark-circle-outline' as const, color: '#4CAF50' };
      case 'in_progress':
        return { bg: isDark ? '#1a3a5c' : '#E3F2FD', icon: 'refresh-outline' as const, color: '#2196F3' };
      case 'pending':
        return { bg: isDark ? '#3a1a1a' : '#FFEBEE', icon: 'warning-outline' as const, color: '#F44336' };
      default:
        return { bg: isDark ? '#2a2a2a' : '#F5F5F5', icon: 'information-circle-outline' as const, color: '#607D8B' };
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000' : '#f5f5f5',
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 12,
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: isDark ? '#fff' : '#000',
    },
    badgeContainer: {
      backgroundColor: '#007AFF',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      minWidth: 24,
      alignItems: 'center',
    },
    badgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '700',
    },
    headerSubtitle: {
      fontSize: 14,
      color: isDark ? '#888' : '#666',
      marginTop: 4,
    },
    filterRow: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 10,
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isDark ? '#1f1f1f' : '#fff',
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#e0e0e0',
    },
    filterButtonActive: {
      backgroundColor: '#007AFF',
      borderColor: '#007AFF',
    },
    filterText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#fff' : '#333',
    },
    filterTextActive: {
      color: '#fff',
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    notificationItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
      padding: 16,
      borderRadius: 14,
      marginBottom: 10,
      boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.08)',
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#007AFF',
      position: 'absolute',
      top: 16,
      left: 16,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      marginTop: 2,
    },
    notificationContent: {
      flex: 1,
    },
    notificationTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
    },
    notificationMessage: {
      fontSize: 13,
      color: isDark ? '#888' : '#666',
      marginTop: 4,
      lineHeight: 18,
    },
    notificationTime: {
      fontSize: 11,
      color: isDark ? '#666' : '#999',
      marginTop: 6,
    },
    markAllButton: {
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    markAllText: {
      fontSize: 14,
      color: '#007AFF',
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 16,
      color: isDark ? '#888' : '#999',
      marginTop: 12,
    },
    emptySubtext: {
      fontSize: 13,
      color: isDark ? '#666' : '#bbb',
      marginTop: 4,
    },
  });

  const listHeader = (
    <>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'unread' && styles.filterButtonActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>Unread</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderNotification = ({ item }: { item: AppNotification }) => {
    const typeStyle = getStatusStyle(item.status);
    return (
      <TouchableOpacity
        style={styles.notificationItem}
        onPress={() => openNotification(item.id)}
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.8}
      >
        {!item.read && <View style={styles.unreadDot} />}
        <View style={[styles.iconContainer, { backgroundColor: typeStyle.bg }]}>
          <Ionicons name={typeStyle.icon} size={22} color={typeStyle.color} />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.notificationTime}>{formatNotificationDate(item.createdAt)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={isDark ? '#666' : '#ccc'} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>Stay Informed</Text>
          </View>
          {unreadCount > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: 8 }} onPress={markAllRead}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={56} color={isDark ? '#444' : '#ccc'} />
            <Text style={styles.emptyText}>All caught up!</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}