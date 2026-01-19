import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getUserHazards } from '../services/firestoreService';

interface HazardReport {
  id: string;
  userId: string;
  userEmail: string;
  description: string;
  location: string;
  status: 'pending' | 'approved' | 'declined';
  createdAt: any;
  imageUrl?: string;
}

export default function MyReportsScreen() {
  const { user } = useAuth();
  const [reports, setReports] = useState<HazardReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMyReports();
    }
  }, [user]);

  const loadMyReports = async () => {
    if (!user) return;
    
    try {
      const result = await getUserHazards(user.uid);
      if (result.success && result.data) {
        setReports(result.data);
      }
    } catch (error) {
      console.error('Error loading my reports:', error);
      Alert.alert('Error', 'Failed to load your reports');
    } finally {
      setLoading(false);
    }
  };

  const renderReport = ({ item }: { item: HazardReport }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportDate}>
          {item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString() : 'Unknown date'}
        </Text>
        <Text style={[styles.status, { 
          color: item.status === 'approved' ? '#4CAF50' : 
                 item.status === 'declined' ? '#F44336' : '#FF9800' 
        }]}>
          {item.status.toUpperCase()}
        </Text>
      </View>
      
      <Text style={styles.reportDescription}>{item.description}</Text>
      <Text style={styles.reportLocation}>📍 {item.location}</Text>
      
      <View style={styles.statusInfo}>
        <Text style={styles.statusText}>
          {item.status === 'pending' && '⏳ Your report is under review by admin'}
          {item.status === 'approved' && '✅ Your report has been approved'}
          {item.status === 'declined' && '❌ Your report has been declined'}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Hazard Reports</Text>
      
      {reports.length === 0 && !loading && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You haven't submitted any reports yet</Text>
        </View>
      )}
      
      <FlatList
        data={reports}
        renderItem={renderReport}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  reportCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reportDate: {
    fontSize: 14,
    color: '#666',
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  reportDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  reportLocation: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 10,
  },
  statusInfo: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
});
