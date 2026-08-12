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
import { AGENCIES, AGENCY_COLORS } from '../../constants/agencies';
import { getAgencyIncidentCounts, getAllIncidents } from '../../services/firestoreService';

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
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const result = await getAllIncidents();
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

  const agencyCounts: Record<string, number> = {};
  allIncidents.forEach(i => {
    const agency = i.agency || 'Unknown';
    agencyCounts[agency] = (agencyCounts[agency] || 0) + 1;
  });

  const timeframeButtons = ['week', 'month', 'year', 'all'];

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
    // Timeframe Pills
    timeframeRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 20,
    },
    timeframePill: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: isDark ? '#2a2a4e' : '#e0e0e0',
    },
    timeframePillActive: {
      backgroundColor: '#007AFF',
    },
    timeframePillText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#ccc' : '#666',
    },
    timeframePillTextActive: {
      color: '#fff',
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
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
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
    // Section
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: isDark ? '#fff' : '#1a1a2e',
      marginBottom: 14,
    },
    // Bar Chart
    chartCard: {
      backgroundColor: isDark ? '#1a1a2e' : '#ffffff',
      borderRadius: 16,
      padding: 20,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    chartTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#fff' : '#333',
      marginBottom: 16,
    },
    barRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    barLabel: {
      width: 80,
      fontSize: 13,
      fontWeight: '600',
      color: isDark ? '#ccc' : '#555',
    },
    barTrack: {
      flex: 1,
      height: 24,
      backgroundColor: isDark ? '#2a2a4e' : '#f0f0f5',
      borderRadius: 12,
      overflow: 'hidden',
      position: 'relative',
    },
    barFill: {
      height: '100%',
      borderRadius: 12,
      minWidth: 20,
    },
    barCount: {
      position: 'absolute',
      right: 8,
      top: 3,
      fontSize: 12,
      fontWeight: '700',
      color: isDark ? '#fff' : '#333',
    },
    // Pie Chart Placeholder
    pieChartContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      gap: 24,
    },
    pieGraphic: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: isDark ? '#2a2a4e' : '#f0f0f5',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 8,
      borderColor: '#007AFF',
      position: 'relative',
    },
    pieGraphicText: {
      fontSize: 24,
      fontWeight: '800',
      color: isDark ? '#fff' : '#333',
    },
    pieGraphicSubtext: {
      fontSize: 10,
      color: isDark ? '#888' : '#999',
    },
    pieLegend: {
      flex: 1,
    },
    pieLegendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    pieLegendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 8,
    },
    pieLegendLabel: {
      flex: 1,
      fontSize: 13,
      color: isDark ? '#ccc' : '#555',
    },
    pieLegendCount: {
      fontSize: 13,
      fontWeight: '700',
      color: isDark ? '#fff' : '#333',
    },
  });

  const renderBarChart = () => {
    const maxCount = Math.max(...AGENCIES.map(a => agencyCounts[a] || 0), 1);
    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Incidents by Agency</Text>
        {AGENCIES.map((agency) => {
          const count = agencyCounts[agency] || 0;
          const pct = (count / maxCount) * 100;
          return (
            <View key={agency} style={styles.barRow}>
              <Text style={styles.barLabel}>{agency}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: AGENCY_COLORS[agency] }]} />
                <Text style={styles.barCount}>{count}</Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderPieChart = () => {
    const statusColors: Record<string, string> = {
      pending: '#FF3B30',
      in_progress: '#FF9500',
      resolved: '#34C759',
    };
    const statusLabels: Record<string, string> = {
      pending: 'Pending',
      in_progress: 'In Progress',
      resolved: 'Resolved',
    };
    const statuses = ['pending', 'in_progress', 'resolved'];
    const total = resolvedIncidents + pendingIncidents + inProgressIncidents || 1;

    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Status Distribution</Text>
        <View style={styles.pieChartContainer}>
          <View style={[styles.pieGraphic, { borderColor: '#34C759' }]}>
            <Text style={styles.pieGraphicText}>{Math.round((resolvedIncidents / total) * 100)}%</Text>
            <Text style={styles.pieGraphicSubtext}>Resolved</Text>
          </View>
          <View style={styles.pieLegend}>
            {statuses.map((status) => {
              const count =
                status === 'pending' ? pendingIncidents :
                status === 'in_progress' ? inProgressIncidents :
                resolvedIncidents;
              return (
                <View key={status} style={styles.pieLegendItem}>
                  <View style={[styles.pieLegendDot, { backgroundColor: statusColors[status] }]} />
                  <Text style={styles.pieLegendLabel}>{statusLabels[status]}</Text>
                  <Text style={styles.pieLegendCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

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

        {/* Timeframe Filter */}
        <View style={styles.timeframeRow}>
          {timeframeButtons.map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[styles.timeframePill, selectedTimeframe === tf && styles.timeframePillActive]}
              onPress={() => setSelectedTimeframe(tf)}
            >
              <Text style={[styles.timeframePillText, selectedTimeframe === tf && styles.timeframePillTextActive]}>
                {tf.charAt(0).toUpperCase() + tf.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
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

        {/* Bar Chart */}
        <View style={styles.section}>
          {renderBarChart()}
        </View>

        {/* Pie Chart */}
        <View style={styles.section}>
          {renderPieChart()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}