import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

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
  status: 'pending' | 'reviewed' | 'resolved' | 'declined';
  adminNotes: string | null;
  likedBySuperAdmin?: boolean;
  superAdminLikeTimestamp?: string;
}

export default function MyReportsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { user } = useAuth();
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReachAdminModal, setShowReachAdminModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Check if user is admin or super admin
  const isAdminOrSuperAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    loadUserReports();
  }, []);

  const loadUserReports = () => {
    try {
      setLoading(true);
      
      // Get all reports from localStorage
      const allReports = JSON.parse(localStorage.getItem('incident_reports') || '[]');
      
      // Filter reports for current user
      const userReports = allReports.filter((report: IncidentReport) => 
        report.user.uid === user?.uid
      );
      
      // Sort by timestamp (newest first)
      userReports.sort((a: IncidentReport, b: IncidentReport) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setReports(userReports);
      console.log(`📋 Loaded ${userReports.length} reports for user: ${user?.displayName}`);
    } catch (error) {
      console.error('❌ Error loading user reports:', error);
      Alert.alert('Error', 'Failed to load your reports');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9500';
      case 'reviewed':
        return '#007AFF';
      case 'resolved':
        return '#34C759';
      case 'declined':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'reviewed':
        return 'Under Review';
      case 'resolved':
        return 'Resolved';
      case 'declined':
        return 'Declined';
      default:
        return 'Unknown';
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

  const handleSuperAdminLike = (reportId: string) => {
    try {
      // Get all reports from localStorage
      const allReports = JSON.parse(localStorage.getItem('incident_reports') || '[]');
      
      // Update the report with super admin like
      const updatedReports = allReports.map((report: IncidentReport) => {
        if (report.id === reportId) {
          return {
            ...report,
            likedBySuperAdmin: true,
            superAdminLikeTimestamp: new Date().toISOString()
          };
        }
        return report;
      });
      
      // Save back to localStorage
      localStorage.setItem('incident_reports', JSON.stringify(updatedReports));
      
      // Update local state
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, likedBySuperAdmin: true, superAdminLikeTimestamp: new Date().toISOString() }
          : report
      ));
      
      // Show notification
      Alert.alert(
        '👍 Super Admin Liked!',
        'The Super Admin has liked your report and appreciates your contribution to community safety.',
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('Error updating super admin like:', error);
      Alert.alert('Error', 'Failed to update like status');
    }
  };

  const handleReachAdmin = (report: IncidentReport) => {
    setSelectedReport(report);
    setNotificationMessage(`Hi ${report.user.name}, I'm reviewing your incident report submitted on ${formatDate(report.timestamp)}. I wanted to reach out personally about this matter. Thank you for bringing this to our attention. ❤️`);
    setShowReachAdminModal(true);
  };

  const handleMessageSuperAdmin = (report: IncidentReport) => {
    setSelectedReport(report);
    setNotificationMessage(`  ${formatDate(report.timestamp)}. ${report.description.substring(0, 100)}${report.description.length > 100 ? '...' : ''}.`);
    setShowReachAdminModal(true);
  };

  const handleDeleteReport = (report: IncidentReport) => {
    console.log('🗑️ Delete button pressed for report:', report.id);
    setSelectedReport(report);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!selectedReport) return;
    
    console.log('🗑️ Proceeding with delete for report:', selectedReport.id);
    try {
      // Get all reports from localStorage
      const allReports = JSON.parse(localStorage.getItem('incident_reports') || '[]');
      console.log('📋 Current reports count:', allReports.length);
      
      // Filter out the report to be deleted
      const updatedReports = allReports.filter((r: IncidentReport) => r.id !== selectedReport.id);
      console.log('📋 Updated reports count:', updatedReports.length);
      
      // Save back to localStorage
      localStorage.setItem('incident_reports', JSON.stringify(updatedReports));
      console.log('💾 Report removed from localStorage');
      
      // Update local state
      const userReports = updatedReports.filter((r: IncidentReport) => r.user.uid === user?.uid);
      setReports(userReports);
      console.log('🔄 Updated local state with', userReports.length, 'reports');
      
      // Close modal and show success
      setShowDeleteModal(false);
      setSelectedReport(null);
      
      // Show success message
      setTimeout(() => {
        Alert.alert('Success', 'Report deleted successfully!');
      }, 100);
      
    } catch (error: any) {
      console.error('❌ Error deleting report:', error);
      Alert.alert('Error', 'Failed to delete report. Please try again.');
    }
  };

  const sendNotificationToAdmin = () => {
    if (!selectedReport || !notificationMessage.trim()) {
      Alert.alert('Error', 'Please enter a message for the admin');
      return;
    }

    try {
      // Get existing admin notifications
      const existingNotifications = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
      
      // Create new notification
      const newNotification = {
        id: 'notification_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        type: 'user_follow_up',
        reportId: selectedReport.id,
        fromUser: {
          name: user?.displayName || 'Anonymous User',
          email: user?.email || 'No email',
          uid: user?.uid || 'unknown'
        },
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
      localStorage.setItem('admin_notifications', JSON.stringify(existingNotifications));
      
      console.log('✅ Notification sent to admin:', newNotification.id);

      Alert.alert(
        '✅ Notification Sent!',
        'Your message has been sent to the admin. They will review your report and respond soon.',
        [{ text: 'OK' }]
      );

      // Close modal and reset
      setShowReachAdminModal(false);
      setSelectedReport(null);
      setNotificationMessage('');
      
    } catch (error: any) {
      console.error('❌ Error sending notification:', error);
      Alert.alert('Error', 'Failed to send notification. Please try again.');
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
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.reportContent}>
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
        
        {item.adminNotes && (
          <View style={styles.adminNotes}>
            <Text style={[styles.adminNotesLabel, { color: isDark ? '#888' : '#666' }]}>
              Admin Notes:
            </Text>
            <Text style={[styles.adminNotesText, { color: isDark ? '#fff' : '#000' }]}>
              {item.adminNotes}
            </Text>
          </View>
        )}
        
        {item.likedBySuperAdmin && (
          <View style={styles.superAdminLikeNotification}>
            <Ionicons name="heart" size={16} color="#FF3B30" />
            <Text style={styles.superAdminLikeText}>
              Liked by Super Admin {item.superAdminLikeTimestamp ? `• ${formatDate(item.superAdminLikeTimestamp)}` : ''}
            </Text>
          </View>
        )}
        
        {item.status === 'pending' && isAdminOrSuperAdmin && (
          <TouchableOpacity 
            style={styles.reachAdminButton} 
            onPress={() => handleReachAdmin(item)}
          >
            <Ionicons name="heart" size={20} color="#fff" />
            <Text style={styles.reachAdminButtonText}>Reach Admin</Text>
          </TouchableOpacity>
        )}
        
        {/* Message Super Admin Button for regular users */}
        {!isAdminOrSuperAdmin && (
          <TouchableOpacity 
            style={styles.messageSuperAdminButton} 
            onPress={() => handleMessageSuperAdmin(item)}
          >
            <Ionicons name="mail-outline" size={20} color="#fff" />
            <Text style={styles.messageSuperAdminButtonText}>Message Super Admin</Text>
          </TouchableOpacity>
        )}
        
        {/* Super Admin Like Button */}
        {user?.role === 'super_admin' && !item.likedBySuperAdmin && (
          <TouchableOpacity 
            style={styles.superAdminLikeButton} 
            onPress={() => handleSuperAdminLike(item.id)}
          >
            <Ionicons name="heart" size={20} color="#FF3B30" />
            <Text style={styles.superAdminLikeButtonText}>Like Report</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={() => {
            console.log('🗑️ Delete button pressed!');
            console.log('🗑️ Report data:', item);
            console.log('🗑️ Report ID:', item.id);
            console.log('🗑️ About to call handleDeleteReport');
            
            try {
              handleDeleteReport(item);
              console.log('🗑️ handleDeleteReport called successfully');
            } catch (error) {
              console.error('🗑️ Error calling handleDeleteReport:', error);
              Alert.alert('Error', 'Delete function failed: ' + error.message);
            }
          }}
        >
          <Ionicons name="trash-outline" size={16} color="#FF3B30" />
          <Text style={styles.deleteButtonText}>Delete</Text>
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
    adminNotes: {
      padding: 12,
      backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: '#007AFF',
    },
    adminNotesLabel: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 4,
    },
    adminNotesText: {
      fontSize: 14,
      lineHeight: 20,
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
      marginBottom: 24,
    },
    submitButton: {
      backgroundColor: '#007AFF',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
    },
    submitButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    reachAdminButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FF3B5C',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginTop: 12,
      gap: 8,
    },
    reachAdminButtonText: {
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
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      borderWidth: 1,
      borderColor: '#FF3B30',
      borderRadius: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginTop: 12,
    },
    deleteButtonText: {
      color: '#FF3B30',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    reportInfo: {
      fontSize: 14,
      color: isDark ? '#888' : '#666',
      marginBottom: 8,
    },
    deleteModalButton: {
      flex: 1,
      backgroundColor: '#FF3B30',
      paddingVertical: 12,
      borderRadius: 8,
    },
    deleteModalButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    superAdminLikeNotification: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#FF3B3020' : '#FFE5E5',
      padding: 8,
      borderRadius: 6,
      marginTop: 8,
      marginBottom: 8,
    },
    superAdminLikeText: {
      fontSize: 12,
      color: '#FF3B30',
      fontWeight: '600',
      marginLeft: 4,
    },
    superAdminLikeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#FF3B30',
      borderRadius: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginTop: 8,
    },
    superAdminLikeButtonText: {
      color: '#FF3B30',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    messageSuperAdminButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#007AFF',
      borderRadius: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginTop: 8,
    },
    messageSuperAdminButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[{ color: isDark ? '#fff' : '#000', marginTop: 16 }]}>
            Loading your reports...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>My Reports</Text>
          <View style={styles.backButton} />
        </View>
      </View>

      <View style={styles.content}>
        {reports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="document-text-outline" 
              size={64} 
              color={isDark ? '#444' : '#ccc'} 
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No Reports Yet</Text>
            <Text style={styles.emptyDescription}>
              You haven't submitted any incident reports yet. Start by reporting an incident to see it here.
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

      {/* Reach Admin Modal */}
      <Modal
        visible={showReachAdminModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReachAdminModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Message Super Admin</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton} 
                onPress={() => setShowReachAdminModal(false)}
              >
                <Ionicons name="close" size={24} color={isDark ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Send a message to the Super Admin about your incident report. Your message will be reviewed and you'll receive a response about your report.
            </Text>

            <Text style={[{ color: isDark ? '#fff' : '#000', marginBottom: 8, fontWeight: '600' }]}>
              Your Message:
            </Text>
            <TextInput
              style={styles.textInput}
              value={notificationMessage}
              onChangeText={setNotificationMessage}
              placeholder="Type your message to the Super Admin..."
              placeholderTextColor={isDark ? '#888' : '#999'}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowReachAdminModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.sendButton} 
                onPress={sendNotificationToAdmin}
              >
                <Text style={styles.sendButtonText}>Send Message</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🗑️ Delete Report</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton} 
                onPress={() => setShowDeleteModal(false)}
              >
                <Ionicons name="close" size={24} color={isDark ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Are you sure you want to delete this report? This action cannot be undone and the report will be permanently removed.
            </Text>

            <Text style={[styles.reportInfo, { marginBottom: 20 }]}>
              Report ID: {selectedReport?.id}
            </Text>
            <Text style={[styles.reportInfo, { marginBottom: 20 }]}>
              Submitted by: {selectedReport?.user.name}
            </Text>
            <Text style={[styles.reportInfo, { marginBottom: 20 }]}>
              Date: {selectedReport ? formatDate(selectedReport.timestamp) : ''}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteModalButton} 
                onPress={confirmDelete}
              >
                <Text style={styles.deleteModalButtonText}>Delete Forever</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
