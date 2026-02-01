import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

interface IncidentReport {
  id: string;
  user: {
    name: string;
    email: string;
    uid: string;
  };
  description: string;
  image: string | null;
  location: { latitude: number; longitude: number } | null;
  timestamp: string;
  status: 'pending' | 'reviewed' | 'resolved';
  adminNotes: string | null;
}

export default function PendingReportsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { user } = useAuth();
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReachUserModal, setShowReachUserModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');

  useEffect(() => {
    loadPendingReports();
  }, []);

  const loadPendingReports = () => {
    try {
      setLoading(true);
      
      // Get all reports from localStorage
      const allReports = JSON.parse(localStorage.getItem('incident_reports') || '[]');
      
      // Filter only pending reports
      const pendingReports = allReports.filter((report: IncidentReport) => 
        report.status === 'pending'
      );
      
      // Sort by timestamp (newest first)
      pendingReports.sort((a: IncidentReport, b: IncidentReport) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setReports(pendingReports);
      console.log(`📋 Loaded ${pendingReports.length} pending reports`);
    } catch (error) {
      console.error('❌ Error loading pending reports:', error);
      Alert.alert('Error', 'Failed to load pending reports');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReachUser = (report: IncidentReport) => {
    setSelectedReport(report);
    setNotificationMessage(`Hi ${report.user.name}, I'm reviewing your incident report submitted on ${formatDate(report.timestamp)}. I wanted to reach out personally about this matter. Thank you for bringing this to our attention. ❤️`);
    setShowReachUserModal(true);
  };

  const sendNotificationToUser = () => {
    if (!selectedReport || !notificationMessage.trim()) {
      Alert.alert('Error', 'Please enter a message for the user');
      return;
    }

    try {
      // Get existing user notifications
      const existingNotifications = JSON.parse(localStorage.getItem('user_notifications') || '[]');
      
      // Create new notification
      const newNotification = {
        id: 'notification_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        type: 'admin_reach_out',
        reportId: selectedReport.id,
        fromAdmin: {
          name: user?.displayName || 'Admin',
          email: user?.email || 'No email',
          uid: user?.uid || 'unknown'
        },
        toUser: selectedReport.user,
        message: notificationMessage.trim(),
        timestamp: new Date().toISOString(),
        status: 'unread',
        reportDetails: {
          description: selectedReport.description,
          submittedAt: selectedReport.timestamp,
          currentStatus: selectedReport.status
        }
      };

      // Add to notifications
      existingNotifications.push(newNotification);
      
      // Save to localStorage
      localStorage.setItem('user_notifications', JSON.stringify(existingNotifications));
      
      console.log('✅ Notification sent to user:', newNotification.id);

      Alert.alert(
        '✅ Message Sent!',
        `Your message has been sent to ${selectedReport.user.name}. They will receive your notification.`,
        [{ text: 'OK' }]
      );

      // Close modal and reset
      setShowReachUserModal(false);
      setSelectedReport(null);
      setNotificationMessage('');
      
    } catch (error: any) {
      console.error('❌ Error sending notification:', error);
      Alert.alert('Error', 'Failed to send notification. Please try again.');
    }
  };

  const handleApprove = async (reportId: string) => {
    try {
      // Get all reports from localStorage
      const allReports = JSON.parse(localStorage.getItem('incident_reports') || '[]');
      
      // Find and update the report
      const reportIndex = allReports.findIndex((r: IncidentReport) => r.id === reportId);
      if (reportIndex !== -1) {
        allReports[reportIndex] = {
          ...allReports[reportIndex],
          status: 'reviewed' as const,
          adminNotes: 'Approved by admin'
        };
        
        // Save back to localStorage
        localStorage.setItem('incident_reports', JSON.stringify(allReports));
        
        console.log('✅ Report approved:', reportId);
        Alert.alert('Success', 'Report approved successfully');
        loadPendingReports(); // Refresh the list
      } else {
        Alert.alert('Error', 'Report not found');
      }
    } catch (error) {
      console.error('Error approving report:', error);
      Alert.alert('Error', 'Failed to approve report');
    }
  };

  const handleDecline = async (reportId: string) => {
    try {
      // Get all reports from localStorage
      const allReports = JSON.parse(localStorage.getItem('incident_reports') || '[]');
      
      // Find and update the report
      const reportIndex = allReports.findIndex((r: IncidentReport) => r.id === reportId);
      if (reportIndex !== -1) {
        allReports[reportIndex] = {
          ...allReports[reportIndex],
          status: 'declined' as const,
          adminNotes: 'Declined by admin'
        };
        
        // Save back to localStorage
        localStorage.setItem('incident_reports', JSON.stringify(allReports));
        
        console.log('✅ Report declined:', reportId);
        Alert.alert('Success', 'Report declined successfully');
        loadPendingReports(); // Refresh the list
      } else {
        Alert.alert('Error', 'Report not found');
      }
    } catch (error) {
      console.error('Error declining report:', error);
      Alert.alert('Error', 'Failed to decline report');
    }
  };

  const renderReport = ({ item }: { item: IncidentReport }) => (
    <View style={[styles.reportCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
      <View style={styles.reportHeader}>
        <View style={styles.reportInfo}>
          <Text style={[styles.reportId, { color: isDark ? '#fff' : '#000' }]}>
            {item.user.name}
          </Text>
          <Text style={[styles.reportDate, { color: isDark ? '#888' : '#666' }]}>
            {formatDate(item.timestamp)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: '#FF9500' }]}>
          <Text style={styles.statusText}>Pending</Text>
        </View>
      </View>

      <View style={styles.reportContent}>
        <View style={styles.userInfo}>
          <Ionicons name="person-outline" size={16} color={isDark ? '#888' : '#666'} />
          <Text style={[styles.userName, { color: isDark ? '#fff' : '#000' }]}>
            {item.user.name}
          </Text>
          <Text style={[styles.userEmail, { color: isDark ? '#888' : '#666' }]}>
            {item.user.email}
          </Text>
        </View>

        <Text style={[styles.description, { color: isDark ? '#fff' : '#000' }]}>
          {item.description}
        </Text>
        
        {item.image && (
          <Image source={{ uri: item.image }} style={styles.reportImage} />
        )}
        
        {item.location && (
          <View style={styles.locationInfo}>
            <Ionicons name="location-outline" size={16} color={isDark ? '#888' : '#666'} />
            <Text style={[styles.locationText, { color: isDark ? '#888' : '#666' }]}>
              Location data available
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.approveButton]} 
          onPress={() => handleApprove(item.id)}
        >
          <Text style={styles.actionButtonText}>✅ Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.declineButton]} 
          onPress={() => handleDecline(item.id)}
        >
          <Text style={styles.actionButtonText}>❌ Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.heartButton]} 
          onPress={() => handleReachUser(item)}
        >
          <Text style={styles.actionButtonText}>❤️ Reach User</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000' : '#f8f9fa',
    },
    header: {
      padding: 20,
      paddingTop: 40,
      backgroundColor: isDark ? '#1a1a1a' : '#fff',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#e0e0e0',
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
    },
    backButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
    },
    content: {
      flex: 1,
      padding: 20,
    },
    reportCard: {
      padding: 16,
      marginBottom: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#444' : '#e0e0e0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    reportHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    reportInfo: {
      flex: 1,
    },
    reportId: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    reportDate: {
      fontSize: 14,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    reportContent: {
      gap: 12,
      marginBottom: 12,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      marginRight: 8,
    },
    userEmail: {
      fontSize: 14,
    },
    description: {
      fontSize: 16,
      lineHeight: 22,
    },
    reportImage: {
      width: '100%',
      height: 200,
      borderRadius: 8,
      resizeMode: 'cover',
    },
    locationInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    locationText: {
      fontSize: 14,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
    },
    approveButton: {
      backgroundColor: '#34C759',
    },
    declineButton: {
      backgroundColor: '#FF3B30',
    },
    heartButton: {
      backgroundColor: '#FF3B5C',
    },
    actionButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 400,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
    },
    modalCloseButton: {
      padding: 4,
      borderRadius: 4,
    },
    modalDescription: {
      fontSize: 16,
      color: isDark ? '#888' : '#666',
      marginBottom: 20,
      lineHeight: 22,
    },
    textInput: {
      backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
      borderWidth: 1,
      borderColor: isDark ? '#444' : '#e0e0e0',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: isDark ? '#fff' : '#000',
      minHeight: 100,
      textAlignVertical: 'top',
      marginBottom: 20,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      borderWidth: 1,
      borderColor: isDark ? '#444' : '#e0e0e0',
      paddingVertical: 12,
      borderRadius: 8,
    },
    cancelButtonText: {
      color: isDark ? '#fff' : '#000',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    sendButton: {
      flex: 1,
      backgroundColor: '#007AFF',
      paddingVertical: 12,
      borderRadius: 8,
    },
    sendButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 8,
    },
    emptyDescription: {
      fontSize: 16,
      color: isDark ? '#888' : '#666',
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[{ color: isDark ? '#fff' : '#000', marginTop: 16 }]}>
            Loading pending reports...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={styles.title}>Pending Reports</Text>
          <View style={styles.backButton} />
        </View>
      </View>

      <View style={styles.content}>
        {reports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="checkmark-circle-outline" 
              size={64} 
              color={isDark ? '#444' : '#ccc'} 
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No Pending Reports</Text>
            <Text style={styles.emptyDescription}>
              Great! All reports have been reviewed. No pending reports to process.
            </Text>
          </View>
        ) : (
          <FlatList
            data={reports}
            renderItem={renderReport}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>

      {/* Reach User Modal */}
      <Modal
        visible={showReachUserModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReachUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>❤️ Reach User</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton} 
                onPress={() => setShowReachUserModal(false)}
              >
                <Ionicons name="close" size={24} color={isDark ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Send a heartfelt message to the user about their pending report. They'll receive your personal message and know you're reviewing their incident.
            </Text>

            <Text style={[{ color: isDark ? '#fff' : '#000', marginBottom: 8, fontWeight: '600' }]}>
              Your Message:
            </Text>
            <TextInput
              style={styles.textInput}
              value={notificationMessage}
              onChangeText={setNotificationMessage}
              placeholder="Type your message to the user..."
              placeholderTextColor={isDark ? '#888' : '#999'}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowReachUserModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.sendButton} 
                onPress={sendNotificationToUser}
              >
                <Text style={styles.sendButtonText}>Send Message</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
