import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getNotificationById,
  markNotificationRead,
} from '../services/firestoreService';

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

export default function NotificationDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [notification, setNotification] = useState<AppNotification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getNotificationById(id).then((result) => {
      if (result.success && result.data) {
        setNotification(result.data as AppNotification);
      }
      setLoading(false);
    });
  }, [id]);

  const handleMarkAsRead = () => {
    if (!notification) return;
    setNotification({ ...notification, read: true });
    markNotificationRead(notification.id);
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000' : '#f5f5f5',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingTop: 20,
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
      gap: 8,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#fff' : '#000',
    },
    content: {
      padding: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: isDark ? '#fff' : '#000',
      marginBottom: 8,
    },
    time: {
      fontSize: 13,
      color: isDark ? '#888' : '#999',
      marginBottom: 20,
    },
    message: {
      fontSize: 16,
      lineHeight: 24,
      color: isDark ? '#ddd' : '#333',
      marginBottom: 32,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
    },
    markReadButton: {
      backgroundColor: isDark ? '#1a3a5c' : '#E3F2FD',
    },
    markReadButtonText: {
      color: '#2196F3',
      fontSize: 15,
      fontWeight: '600',
    },
    emptyText: {
      fontSize: 16,
      color: isDark ? '#888' : '#999',
      marginTop: 12,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#333'} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : !notification ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="notifications-off-outline" size={48} color={isDark ? '#555' : '#ccc'} />
          <Text style={styles.emptyText}>Notification not found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: getStatusStyle(notification.status).bg }]}>
            <Ionicons
              name={getStatusStyle(notification.status).icon}
              size={28}
              color={getStatusStyle(notification.status).color}
            />
          </View>

          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.time}>{formatNotificationDate(notification.createdAt)}</Text>
          <Text style={styles.message}>{notification.message}</Text>

          {!notification.read && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.markReadButton]}
                onPress={handleMarkAsRead}
              >
                <Ionicons name="checkmark-outline" size={18} color="#2196F3" />
                <Text style={styles.markReadButtonText}>Mark as read</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
