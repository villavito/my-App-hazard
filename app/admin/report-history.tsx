import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../contexts/AuthContext';

interface IncidentReport {
  id: string;
  user: {
    name: string;
    email: string;
  };
  description: string;
  timestamp: string;
  status: 'pending' | 'reviewed' | 'declined' | 'resolved';
  adminNotes?: string;
  location?: any;
  image?: string;
  likedBySuperAdmin?: boolean;
  superAdminLikeTimestamp?: string;
}

export default function ReportHistory() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'declined'>('all');

  useEffect(() => {
    loadReportHistory();
  }, []);

  const loadReportHistory = () => {
    try {
      setLoading(true);
      
      // Get all reports from localStorage
      const allReports = JSON.parse(localStorage.getItem('incident_reports') || '[]');
      
      // Filter only approved and declined reports
      const historyReports = allReports.filter((report: IncidentReport) => 
        report.status === 'reviewed' || report.status === 'declined' || report.status === 'resolved'
      );
      
      // Sort by timestamp (newest first)
      historyReports.sort((a: IncidentReport, b: IncidentReport) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setReports(historyReports);
      console.log(`📋 Loaded ${historyReports.length} reports from history`);
    } catch (error) {
      console.error('❌ Error loading report history:', error);
      Alert.alert('Error', 'Failed to load report history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reviewed':
        return '#4CAF50';
      case 'declined':
        return '#FF9800';
      case 'resolved':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'reviewed':
        return 'Approved';
      case 'declined':
        return 'Declined';
      case 'resolved':
        return 'Resolved';
      default:
        return status;
    }
  };

  const getFilteredReports = () => {
    switch (filter) {
      case 'approved':
        return reports.filter(report => report.status === 'reviewed');
      case 'declined':
        return reports.filter(report => report.status === 'declined' || report.status === 'resolved');
      default:
        return reports;
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
          <Text style={[styles.imageIndicator, { color: isDark ? '#888' : '#666' }]}>
            📷 Image attached
          </Text>
        )}
        
        {item.location && (
          <View style={[styles.locationSection, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }]}>
            <Text style={[styles.locationTitle, { color: isDark ? '#fff' : '#000' }]}>
              📍 Location Details
            </Text>
            <View style={styles.locationDetails}>
              {item.location.latitude && (
                <Text style={[styles.locationText, { color: isDark ? '#888' : '#666' }]}>
                  <Text style={styles.locationLabel}>Latitude:</Text> {item.location.latitude}
                </Text>
              )}
              {item.location.longitude && (
                <Text style={[styles.locationText, { color: isDark ? '#888' : '#666' }]}>
                  <Text style={styles.locationLabel}>Longitude:</Text> {item.location.longitude}
                </Text>
              )}
              {item.location.address && (
                <Text style={[styles.locationText, { color: isDark ? '#888' : '#666' }]}>
                  <Text style={styles.locationLabel}>Address:</Text> {item.location.address}
                </Text>
              )}
              {item.location.accuracy && (
                <Text style={[styles.locationText, { color: isDark ? '#888' : '#666' }]}>
                  <Text style={styles.locationLabel}>Accuracy:</Text> ±{item.location.accuracy}m
                </Text>
              )}
            </View>
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
      </View>
    </View>
  );

  const FilterButton = ({ filterType, label }: { filterType: 'all' | 'approved' | 'declined'; label: string }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        { backgroundColor: filter === filterType ? '#007AFF' : (isDark ? '#2a2a2a' : '#f0f0f0') }
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[
        styles.filterButtonText,
        { color: filter === filterType ? '#fff' : (isDark ? '#fff' : '#000') }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const getReportStats = () => {
    const approved = reports.filter(r => r.status === 'reviewed').length;
    const declined = reports.filter(r => r.status === 'declined' || r.status === 'resolved').length;
    const total = reports.length;
    
    return { approved, declined, total };
  };

  const stats = getReportStats();

  if (loading) {
    return (
      <AdminLayout title="Report History" userRole="super_admin">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[{ color: isDark ? '#fff' : '#000', marginTop: 16 }]}>
            Loading report history...
          </Text>
        </View>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Report History" userRole="super_admin">
      <View style={styles.container}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
            <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{stats.approved}</Text>
            <Text style={[styles.statLabel, { color: isDark ? '#888' : '#666' }]}>Approved</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
            <Text style={[styles.statNumber, { color: '#FF9800' }]}>{stats.declined}</Text>
            <Text style={[styles.statLabel, { color: isDark ? '#888' : '#666' }]}>Declined</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
            <Text style={[styles.statNumber, { color: '#007AFF' }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: isDark ? '#888' : '#666' }]}>Total</Text>
          </View>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <FilterButton filterType="all" label={`All (${stats.total})`} />
          <FilterButton filterType="approved" label={`Approved (${stats.approved})`} />
          <FilterButton filterType="declined" label={`Declined (${stats.declined})`} />
        </View>

        {/* Reports List */}
        {getFilteredReports().length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="document-text-outline" 
              size={64} 
              color={isDark ? '#444' : '#ccc'} 
              style={styles.emptyIcon}
            />
            <Text style={[styles.emptyTitle, { color: isDark ? '#fff' : '#000' }]}>
              No Reports Found
            </Text>
            <Text style={[styles.emptyDescription, { color: isDark ? '#888' : '#666' }]}>
              {filter === 'all' 
                ? 'No reports have been processed yet.' 
                : `No ${filter} reports found.`
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={getFilteredReports()}
            renderItem={renderReport}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
      gap: 12,
    },
    statCard: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
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
      fontWeight: '500',
    },
    filterContainer: {
      flexDirection: 'row',
      marginBottom: 20,
      gap: 8,
    },
    filterButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    filterButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    reportCard: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
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
      flex: 1,
    },
    description: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 12,
    },
    imageIndicator: {
      fontSize: 12,
      fontStyle: 'italic',
      marginBottom: 4,
    },
    locationIndicator: {
      fontSize: 12,
      fontStyle: 'italic',
      marginBottom: 4,
    },
    locationSection: {
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
      borderLeftWidth: 3,
      borderLeftColor: '#007AFF',
    },
    locationTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    locationDetails: {
      gap: 4,
    },
    locationText: {
      fontSize: 13,
      lineHeight: 18,
    },
    locationLabel: {
      fontWeight: '600',
      color: '#007AFF',
    },
    adminNotes: {
      backgroundColor: 'rgba(0, 122, 255, 0.1)',
      padding: 8,
      borderRadius: 6,
      marginBottom: 8,
    },
    adminNotesLabel: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 4,
    },
    adminNotesText: {
      fontSize: 13,
      lineHeight: 18,
    },
    superAdminLikeNotification: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 59, 48, 0.1)',
      padding: 8,
      borderRadius: 6,
      marginTop: 8,
    },
    superAdminLikeText: {
      fontSize: 12,
      color: '#FF3B30',
      fontWeight: '600',
      marginLeft: 4,
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
      marginBottom: 8,
    },
    emptyDescription: {
      fontSize: 16,
      textAlign: 'center',
    },
  });
