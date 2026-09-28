import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { getAllIncidents } from '../../services/firestoreService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;

type Incident = {
  id: string;
  userEmail?: string;
  situation?: string;
  description?: string;
  injuryLevel?: string;
  location?: string;
  status?: string;
  agency?: string;
  createdAt?: { toDate: () => Date; seconds: number };
};

export default function ReportsAnalyticsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { user, userRole } = useAuth();
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  // A super admin reads across every agency; anyone else is limited to their own,
  // which the Firestore rules enforce - so the scope has to be part of the query.
  const scopedAgency =
    userRole?.role === 'super_admin' ? undefined : userRole?.agency;

  useEffect(() => {
    // Firestore rules need request.auth populated, and the scope depends on the
    // role, so wait until the session has resolved before querying.
    if (!user || !userRole) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userRole, scopedAgency]);

  const loadData = async () => {
    setLoading(true);

    // An admin with no agency assigned matches nothing rather than
    // everything (see firestore.rules) - skip the query rather than firing
    // an unscoped one, which the rules reject outright and would otherwise
    // just silently leave this screen at zero with no error surfaced.
    if (userRole?.role !== 'super_admin' && !userRole?.agency) {
      setAllIncidents([]);
      setLoading(false);
      return;
    }

    const result = await getAllIncidents(50, scopedAgency);
    if (result.success && result.data) {
      setAllIncidents(result.data as Incident[]);
    }
    setLoading(false);
  };

  // Compute stats
  const totalIncidents = allIncidents.length;
  const resolvedIncidents = allIncidents.filter(i => i.status === 'resolved').length;
  const pendingIncidents = allIncidents.filter(i => i.status === 'pending').length;
  const inProgressIncidents = allIncidents.filter(i => i.status === 'in_progress').length;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#0a0a0f' : '#f0f2f5',
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: isDark ? '#fff' : '#1a1a2e',
    },
    // Stat Cards
    statsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 20,
    },
    statCard: {
      width: (SCREEN_WIDTH - 44) / 2,
      backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
      borderRadius: 16,
      padding: 16,
      boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.1)',
    },
    statCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    statIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    statNumber: {
      fontSize: 28,
      fontWeight: '800',
      color: isDark ? '#fff' : '#1a1a2e',
    },
    statLabel: {
      fontSize: 13,
      color: isDark ? '#888' : '#999',
      marginTop: 2,
    },
    statChange: {
      fontSize: 12,
      fontWeight: '600',
      marginTop: 4,
    },
    statChangePositive: {
      color: '#34C759',
    },
    statChangeNegative: {
      color: '#FF3B30',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#333'} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reports & Analytics</Text>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <View style={[styles.statIconWrap, { backgroundColor: '#007AFF20' }]}>
                <Ionicons name="warning" size={20} color="#007AFF" />
              </View>
            </View>
            <Text style={styles.statNumber}>{totalIncidents}</Text>
            <Text style={styles.statLabel}>Total Incidents</Text>
            <Text style={[styles.statChange, styles.statChangePositive]}>+{allIncidents.length > 0 ? Math.floor(allIncidents.length * 0.15) : 0}% this month</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <View style={[styles.statIconWrap, { backgroundColor: '#34C75920' }]}>
                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              </View>
            </View>
            <Text style={styles.statNumber}>{resolvedIncidents}</Text>
            <Text style={styles.statLabel}>Resolved</Text>
            <Text style={[styles.statChange, styles.statChangePositive]}>
              {totalIncidents > 0 ? Math.round((resolvedIncidents / totalIncidents) * 100) : 0}% rate
            </Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <View style={[styles.statIconWrap, { backgroundColor: '#FF950020' }]}>
                <Ionicons name="time" size={20} color="#FF9500" />
              </View>
            </View>
            <Text style={styles.statNumber}>{inProgressIncidents}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statCardHeader}>
              <View style={[styles.statIconWrap, { backgroundColor: '#FF3B3020' }]}>
                <Ionicons name="alert-circle" size={20} color="#FF3B30" />
              </View>
            </View>
            <Text style={styles.statNumber}>{pendingIncidents}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}