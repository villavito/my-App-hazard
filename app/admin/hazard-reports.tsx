import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { createNotification } from '../../contexts/NotificationContext';
import { getHazardReports, updateHazardStatus } from '../../services/firestoreService';

interface HazardReport {
  id: string;
  userId: string;
  userEmail: string;
  description: string;
  location: string;
  status: 'pending' | 'approved' | 'declined';
  createdAt: any;
  imageUrl?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export default function HazardReportsScreen() {
  const { userRole } = useAuth();
  const [reports, setReports] = useState<HazardReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const result = await getHazardReports();
      if (result.success && result.data) {
        setReports(result.data);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reportId: string, report: HazardReport) => {
    try {
      const result = await updateHazardStatus(reportId, 'approved');
      if (result.success) {
        // Create notification for the user
        await createNotification(
          report.userId,
          'report_approved',
          'Report Approved! ✅',
          `Your hazard report at "${report.location}" has been approved by an admin.`,
          { reportId, location: report.location }
        );
        
        Alert.alert('Success', 'Report approved successfully');
        loadReports(); // Refresh the list
      } else {
        Alert.alert('Error', result.error || 'Failed to approve report');
      }
    } catch (error) {
      console.error('Error approving report:', error);
      Alert.alert('Error', 'Failed to approve report');
    }
  };

  const handleDecline = async (reportId: string, report: HazardReport) => {
    try {
      const result = await updateHazardStatus(reportId, 'declined');
      if (result.success) {
        // Create notification for the user
        await createNotification(
          report.userId,
          'report_declined',
          'Report Declined ❌',
          `Your hazard report at "${report.location}" has been declined by an admin.`,
          { reportId, location: report.location }
        );
        
        Alert.alert('Success', 'Report declined successfully');
        loadReports(); // Refresh the list
      } else {
        Alert.alert('Error', result.error || 'Failed to decline report');
      }
    } catch (error) {
      console.error('Error declining report:', error);
      Alert.alert('Error', 'Failed to decline report');
    }
  };

  const getCurrentLocation = async () => {
    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        Alert.alert('Error', 'Geolocation is not supported by your browser');
        return;
      }

      // Get current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      });

      const { latitude, longitude } = position.coords;
      
      // Create Google Maps URL with coordinates
      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      await Linking.openURL(mapsUrl);
      
      Alert.alert('Location Opened', `Opening your current location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Unable to get your current location. Please check your GPS permissions.');
    }
  };

  const openLocation = async (location: string) => {
    try {
      // Try to open in device's native maps app
      const encodedLocation = encodeURIComponent(location);
      
      // Try different URL schemes for various platforms
      const urls = [
        // Apple Maps (iOS)
        `maps://?q=${encodedLocation}`,
        // Google Maps (Android/Web)
        `https://maps.google.com/?q=${encodedLocation}`,
        // Fallback to Google Maps web
        `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`
      ];
      
      // Try each URL until one works
      for (const url of urls) {
        try {
          await Linking.openURL(url);
          console.log('Opened location with URL:', url);
          return; // Success, exit the loop
        } catch (error) {
          console.log('Failed to open with URL:', url, error);
          continue; // Try next URL
        }
      }
      
      // If all URLs fail, show error
      Alert.alert('Error', 'Unable to open location in maps app');
    } catch (error) {
      console.error('Error opening location:', error);
      Alert.alert('Error', 'Failed to open location');
    }
  };

  const shareLocation = async (location: string, report: HazardReport) => {
    try {
      const shareText = `Hazard Report\n\nLocation: ${location}\nDescription: ${report.description}\nStatus: ${report.status}\nReported by: ${report.userEmail}`;
      
      // Use Web Share API if available, otherwise fallback
      if (navigator.share) {
        await navigator.share({
          title: 'Hazard Report Location',
          text: shareText,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareText);
        Alert.alert('Copied', 'Location details copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing location:', error);
      Alert.alert('Error', 'Failed to share location');
    }
  };

  const renderReport = ({ item }: { item: HazardReport }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportEmail}>{item.userEmail}</Text>
        <Text style={[styles.status, { 
          color: item.status === 'approved' ? '#4CAF50' : 
                 item.status === 'declined' ? '#F44336' : '#FF9800' 
        }]}>
          {item.status.toUpperCase()}
        </Text>
      </View>
      
      <Text style={styles.reportDescription}>{item.description}</Text>
      <View style={styles.locationContainer}>
        <Text style={styles.reportLocation}>📍 {item.location}</Text>
        <View style={styles.locationButtons}>
          <TouchableOpacity 
            style={styles.locationButton} 
            onPress={() => openLocation(item.location)}
          >
            <Text style={styles.locationButtonText}>🗺️ Open</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.locationButton} 
            onPress={() => shareLocation(item.location, item)}
          >
            <Text style={styles.locationButtonText}>📤 Share</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {userRole === 'admin' && item.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.button, styles.approveButton]} 
            onPress={() => handleApprove(item.id, item)}
          >
            <Text style={styles.buttonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.declineButton]} 
            onPress={() => handleDecline(item.id, item)}
          >
            <Text style={styles.buttonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {userRole === 'super_admin' && (
        <View style={styles.adminInfo}>
          <Text style={styles.adminInfoText}>
            {item.status === 'pending' && 'Awaiting admin review'}
            {item.status === 'approved' && `Approved by admin`}
            {item.status === 'declined' && `Declined by admin`}
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Hazard Reports</Text>
        <TouchableOpacity 
          style={styles.myLocationButton} 
          onPress={getCurrentLocation}
        >
          <Text style={styles.myLocationButtonText}>📍 My Location</Text>
        </TouchableOpacity>
      </View>
      
      {reports.length === 0 && !loading && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hazard reports found</Text>
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  myLocationButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  myLocationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  reportEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
    marginBottom: 8,
  },
  locationContainer: {
    marginBottom: 10,
  },
  locationButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
  },
  locationButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  locationButtonText: {
    fontSize: 12,
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    marginHorizontal: 5,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  declineButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  adminInfo: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  adminInfoText: {
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
  },
  listContainer: {
    paddingBottom: 20,
  },
});
