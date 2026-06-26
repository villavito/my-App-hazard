import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import type { AlertButton } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AGENCIES, Agency, AGENCY_COLORS, AGENCY_LABELS } from '../../constants/agencies';
import { getIncidentsByAgency, updateIncidentStatus } from '../../services/firestoreService';

type Incident = {
  id: string;
  userEmail?: string;
  situation?: string;
  description?: string;
  injuryLevel?: string;
  location?: string;
  status?: string;
  imageUrl?: string;
  createdAt?: { toDate: () => Date };
};

const STATUS_OPTIONS = ['pending', 'in_progress', 'resolved'] as const;

function formatDate(createdAt?: { toDate: () => Date }) {
  if (!createdAt?.toDate) return 'Unknown date';
  return createdAt.toDate().toLocaleString();
}

function getStatusColor(status?: string) {
  if (status === 'resolved') return '#34C759';
  if (status === 'in_progress') return '#FF9500';
  return '#FF3B30';
}

export default function AdminIncidentsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const params = useLocalSearchParams<{ agency?: string }>();
  const initialAgency = AGENCIES.includes(params.agency as Agency) ? (params.agency as Agency) : 'PNP';

  const [selectedAgency, setSelectedAgency] = useState<Agency>(initialAgency);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadIncidents = useCallback(async (agency: Agency, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const result = await getIncidentsByAgency(agency);
    if (result.success && result.data) {
      setIncidents(result.data as Incident[]);
    } else {
      setIncidents([]);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadIncidents(selectedAgency);
  }, [selectedAgency, loadIncidents]);

  const handleStatusUpdate = (incident: Incident) => {
    const statusButtons: AlertButton[] = STATUS_OPTIONS.map((status) => ({
      text: status.replace('_', ' ').toUpperCase(),
      onPress: async () => {
        const result = await updateIncidentStatus(incident.id, status);
        if (result.success) {
          loadIncidents(selectedAgency, true);
        } else {
          Alert.alert('Error', 'Failed to update status');
        }
      },
    }));

    statusButtons.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(
      'Update Status',
      `Change status for "${incident.situation || incident.description}"`,
      statusButtons
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#000' : '#fff',
    },
    header: {
      padding: 16,
      paddingTop: 8,
      backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: isDark ? '#fff' : '#000',
      flex: 1,
    },
    agencyTabs: {
      flexDirection: 'row',
      gap: 8,
    },
    agencyTab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    agencyTabText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#fff',
    },
    agencySubtitle: {
      fontSize: 13,
      color: isDark ? '#888' : '#666',
      marginTop: 8,
    },
    listContent: {
      padding: 16,
      paddingBottom: 32,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingTop: 60,
    },
    emptyText: {
      fontSize: 16,
      color: isDark ? '#888' : '#666',
      marginTop: 12,
    },
    card: {
      backgroundColor: isDark ? '#2a2a2a' : '#f8f9fa',
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    situation: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#fff' : '#000',
      flex: 1,
      marginRight: 8,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    statusText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    metaText: {
      fontSize: 13,
      color: isDark ? '#aaa' : '#666',
      marginBottom: 4,
    },
    thumbnail: {
      width: '100%',
      height: 140,
      borderRadius: 8,
      marginTop: 8,
      marginBottom: 8,
    },
    updateButton: {
      marginTop: 8,
      backgroundColor: '#007AFF',
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    updateButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
  });

  const renderIncident = ({ item }: { item: Incident }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.situation}>{item.situation || item.description || 'Incident Report'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{(item.status || 'pending').replace('_', ' ')}</Text>
        </View>
      </View>
      <Text style={styles.metaText}>Reporter: {item.userEmail || 'Unknown'}</Text>
      <Text style={styles.metaText}>Injury Level: {item.injuryLevel || 'Not specified'}</Text>
      <Text style={styles.metaText}>Location: {item.location || 'Not provided'}</Text>
      <Text style={styles.metaText}>Submitted: {formatDate(item.createdAt)}</Text>
      {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} /> : null}
      <TouchableOpacity style={styles.updateButton} onPress={() => handleStatusUpdate(item)}>
        <Text style={styles.updateButtonText}>Update Status</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Incident Reports</Text>
        </View>

        <View style={styles.agencyTabs}>
          {AGENCIES.map((agency) => (
            <TouchableOpacity
              key={agency}
              style={[
                styles.agencyTab,
                {
                  backgroundColor:
                    selectedAgency === agency ? AGENCY_COLORS[agency] : isDark ? '#333' : '#ddd',
                },
              ]}
              onPress={() => setSelectedAgency(agency)}
            >
              <Text
                style={[
                  styles.agencyTabText,
                  selectedAgency !== agency && { color: isDark ? '#ccc' : '#444' },
                ]}
              >
                {agency}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.agencySubtitle}>{AGENCY_LABELS[selectedAgency]}</Text>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={incidents}
          keyExtractor={(item) => item.id}
          renderItem={renderIncident}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadIncidents(selectedAgency, true)}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color={isDark ? '#555' : '#ccc'} />
              <Text style={styles.emptyText}>No {selectedAgency} reports yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
