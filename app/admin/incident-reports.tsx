import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Platform, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AdminLayout from '../../components/AdminLayout';
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

export default function HazardReportsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { user, userRole } = useAuth();
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('pending');

  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      // Get all reports from localStorage
      const allReports = JSON.parse(localStorage.getItem('incident_reports') || '[]');
      
      // Sort by timestamp (newest first)
      allReports.sort((a: IncidentReport, b: IncidentReport) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setReports(allReports);
      console.log('📋 Loaded reports from localStorage:', allReports.length);
    } catch (error) {
      console.error('❌ Error loading reports:', error);
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reportId: string, report: IncidentReport) => {
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
        loadReports(); // Refresh the list
      } else {
        Alert.alert('Error', 'Report not found');
      }
    } catch (error) {
      console.error('Error approving report:', error);
      Alert.alert('Error', 'Failed to approve report');
    }
  };

  const handleDecline = async (reportId: string, report: IncidentReport) => {
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
        loadReports(); // Refresh the list
      } else {
        Alert.alert('Error', 'Report not found');
      }
    } catch (error) {
      console.error('Error declining report:', error);
      Alert.alert('Error', 'Failed to decline report');
    }
  };

  const openLocation = async (location: string) => {
    try {
      const encodedLocation = encodeURIComponent(location);
      const urls = [
        `maps://?q=${encodedLocation}`,
        `https://maps.google.com/?q=${encodedLocation}`,
        `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`
      ];
      
      for (const url of urls) {
        try {
          await Linking.openURL(url);
          return;
        } catch (error) {
          continue;
        }
      }
      
      Alert.alert('Error', 'Unable to open location in maps app');
    } catch (error) {
      console.error('Error opening location:', error);
      Alert.alert('Error', 'Failed to open location');
    }
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    return report.status === filter;
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      marginBottom: 24,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: 16,
      color: isDark ? '#888' : '#666',
    },
    userReportsButton: {
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      borderWidth: 1,
      borderColor: isDark ? '#444' : '#e0e0e0',
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginBottom: 16,
      alignSelf: 'flex-start',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    userReportsButtonText: {
      color: '#007AFF',
      fontSize: 13,
      fontWeight: '600',
    },
    filterContainer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 20,
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
    },
    filterButtonActive: {
      backgroundColor: '#007AFF',
    },
    filterButtonText: {
      fontSize: 14,
      color: isDark ? '#fff' : '#000',
      fontWeight: '500',
    },
    filterButtonTextActive: {
      color: '#fff',
    },
    statsContainer: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 24,
    },
    statCard: {
      backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
      padding: 16,
      borderRadius: 8,
      flex: 1,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: isDark ? '#888' : '#666',
      textAlign: 'center',
    },
    pendingStat: {
      color: '#FF9800',
    },
    approvedStat: {
      color: '#4CAF50',
    },
    declinedStat: {
      color: '#F44336',
    },
    reportCard: {
      backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
      padding: 16,
      marginBottom: 16,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    reportHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    reportEmail: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
    },
    status: {
      fontSize: 12,
      fontWeight: 'bold',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    statusPending: {
      backgroundColor: '#FF980020',
      color: '#FF9800',
    },
    statusApproved: {
      backgroundColor: '#4CAF5020',
      color: '#4CAF50',
    },
    statusDeclined: {
      backgroundColor: '#F4433620',
      color: '#F44336',
    },
    reportDescription: {
      fontSize: 14,
      color: isDark ? '#ccc' : '#666',
      marginBottom: 12,
      lineHeight: 20,
    },
    locationContainer: {
      marginBottom: 12,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    locationText: {
      fontSize: 14,
      color: '#007AFF',
      flex: 1,
    },
    locationButton: {
      backgroundColor: isDark ? '#333' : '#f0f0f0',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
      marginLeft: 8,
    },
    locationButtonText: {
      fontSize: 12,
      color: isDark ? '#fff' : '#000',
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 6,
      alignItems: 'center',
    },
    approveButton: {
      backgroundColor: '#4CAF50',
    },
    declineButton: {
      backgroundColor: '#F44336',
    },
    actionButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    adminActivityContainer: {
      backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
      padding: 12,
      borderRadius: 6,
      marginTop: 12,
      borderLeftWidth: 3,
      borderLeftColor: '#FF3B30',
    },
    adminActivityTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      marginBottom: 6,
    },
    adminActivityText: {
      fontSize: 12,
      color: isDark ? '#ccc' : '#666',
      marginBottom: 2,
    },
    adminActivityHighlight: {
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: isDark ? '#888' : '#666',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      color: isDark ? '#888' : '#666',
      textAlign: 'center',
    },
  });

  const renderReport = ({ item }: { item: HazardReport }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportEmail}>{item.userEmail}</Text>
        <Text style={[
          styles.status,
          item.status === 'pending' && styles.statusPending,
          item.status === 'approved' && styles.statusApproved,
          item.status === 'declined' && styles.statusDeclined
        ]}>
          {item.status.toUpperCase()}
        </Text>
      </View>
      
      <Text style={styles.reportDescription}>{item.description}</Text>
      
      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <Text style={styles.locationText}>📍 {item.location}</Text>
          <TouchableOpacity 
            style={styles.locationButton} 
            onPress={() => openLocation(item.location)}
          >
            <Text style={styles.locationButtonText}>🗺️ Open</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Show admin activity info for super admins */}
      {userRole === 'super_admin' && item.status !== 'pending' && (
        <View style={styles.adminActivityContainer}>
          <Text style={styles.adminActivityTitle}>👤 Admin Activity</Text>
          <Text style={styles.adminActivityText}>
            Processed by: <Text style={styles.adminActivityHighlight}>{item.processedBy || 'Unknown'}</Text>
          </Text>
          {item.processedAt && (
            <Text style={styles.adminActivityText}>
              Processed at: <Text style={styles.adminActivityHighlight}>
                {new Date(item.processedAt.toDate?.() || item.processedAt).toLocaleString()}
              </Text>
            </Text>
          )}
          {item.adminNotes && (
            <Text style={styles.adminActivityText}>
              Notes: <Text style={styles.adminActivityHighlight}>{item.adminNotes}</Text>
            </Text>
          )}
        </View>
      )}
      
      {/* Show action buttons only for admins and only on pending reports */}
      {userRole === 'admin' && item.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.approveButton]} 
            onPress={() => handleApprove(item.id, item)}
          >
            <Text style={styles.actionButtonText}>✅ Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.declineButton]} 
            onPress={() => handleDecline(item.id, item)}
          >
            <Text style={styles.actionButtonText}>❌ Decline</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const HazardReportsContent = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Hazard Reports</Text>
          <Text style={styles.headerSubtitle}>Review and manage user-submitted hazard reports</Text>
        </View>
        <TouchableOpacity 
          style={styles.userReportsButton}
          onPress={() => router.push('/my-reports')}
        >
          <Text style={styles.userReportsButtonText}>📋 User Reports</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {(['all', 'pending', 'approved', 'declined'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              filter === status && styles.filterButtonActive
            ]}
            onPress={() => setFilter(status)}
          >
            <Text style={[
              styles.filterButtonText,
              filter === status && styles.filterButtonTextActive
            ]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, styles.pendingStat]}>
            {reports.filter(r => r.status === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, styles.approvedStat]}>
            {reports.filter(r => r.status === 'approved').length}
          </Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, styles.declinedStat]}>
            {reports.filter(r => r.status === 'declined').length}
          </Text>
          <Text style={styles.statLabel}>Declined</Text>
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      ) : filteredReports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {filter === 'all' ? 'No hazard reports found' : `No ${filter} reports found`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          renderItem={renderReport}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );

  if (isWeb) {
    return (
      <AdminLayout title="Hazard Reports" userRole="admin">
        <HazardReportsContent />
      </AdminLayout>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000' : '#fff' }}>
      <HazardReportsContent />
    </SafeAreaView>
  );
}
