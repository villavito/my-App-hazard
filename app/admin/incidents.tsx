import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, type VideoThumbnail as VideoThumbnailImage } from "expo-video";
import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AGENCY_COLORS } from "../../constants/agencies";
import { useAuth } from "../../contexts/AuthContext";
import { getIncidentsByAgency } from "../../services/firestoreService";

const INBOX_AGENCIES = ["PNP", "BFP", "Barangay"] as const;
type InboxAgency = (typeof INBOX_AGENCIES)[number];

type Incident = {
  id: string;
  userEmail?: string;
  situation?: string;
  description?: string;
  injuryLevel?: string;
  location?: string;
  status?: string;
  videoUrl?: string;
  involvedAgency?: string;
  createdAt?: { toDate: () => Date };
};

const STATUS_FILTERS = ["all", "pending", "in_progress", "resolved"] as const;

function formatDate(createdAt?: { toDate: () => Date }) {
  if (!createdAt?.toDate) return "Unknown date";
  return createdAt.toDate().toLocaleString();
}

function getStatusColor(status?: string) {
  if (status === "resolved") return "#34C759";
  if (status === "in_progress") return "#FF9500";
  return "#FF3B30";
}

const thumbnailLoadingStyle = {
  alignItems: "center" as const,
  justifyContent: "center" as const,
  backgroundColor: "#000",
};

function VideoThumbnail({
  uri,
  style,
  overlayStyle,
  onPress,
}: {
  uri: string;
  style: object;
  overlayStyle: object;
  onPress: () => void;
}) {
  const player = useVideoPlayer(uri);
  const [thumbnail, setThumbnail] = useState<VideoThumbnailImage | null>(null);

  useEffect(() => {
    let cancelled = false;

    // On web, generateThumbnailsAsync can throw synchronously (e.g. a CORS
    // "tainted canvas" error on cross-origin video URLs) instead of rejecting
    // a promise, which would otherwise bypass the .catch() below entirely.
    try {
      Promise.resolve(player.generateThumbnailsAsync(0))
        .then(([frame]) => {
          if (!cancelled) setThumbnail(frame);
        })
        .catch((error) => {
          console.warn("Error generating video thumbnail:", error);
        });
    } catch (error) {
      console.warn("Error generating video thumbnail:", error);
    }

    return () => {
      cancelled = true;
    };
  }, [player]);

  return (
    <TouchableOpacity style={style} onPress={onPress} activeOpacity={0.8}>
      {thumbnail ? (
        <Image
          source={thumbnail}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, thumbnailLoadingStyle]}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      )}
      <View style={overlayStyle}>
        <Ionicons name="play-circle" size={36} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

export default function AdminIncidentsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const params = useLocalSearchParams<{ status?: string }>();
  const { user, userRole } = useAuth();

  // Agency-scoped admins (e.g. the PNP admin account) can only ever see their own
  // agency's inbox. Admins with no assigned agency (e.g. super_admin) can see both.
  const restrictedAgency = userRole?.agency;
  const visibleAgencies = useMemo<readonly InboxAgency[]>(
    () => (restrictedAgency ? [restrictedAgency] : INBOX_AGENCIES),
    [restrictedAgency],
  );

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>(
    params.status || "all",
  );

  const loadIncidents = useCallback(
    async (isRefresh = false) => {
      // Firestore rules require request.auth to be populated; querying before
      // Firebase Auth has restored the session returns a permission error even
      // for a valid admin, so wait until the session is confirmed.
      if (!user) return;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const results = await Promise.all(
        visibleAgencies.map((agency) => getIncidentsByAgency(agency)),
      );
      const merged = results
        .filter((result) => result.success && result.data)
        .flatMap((result) => result.data as Incident[])
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate?.().getTime() ?? 0;
          const bTime = b.createdAt?.toDate?.().getTime() ?? 0;
          return bTime - aTime;
        });
      setIncidents(merged);

      setLoading(false);
      setRefreshing(false);
    },
    [visibleAgencies, user],
  );

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  const filteredIncidents = useMemo(() => {
    if (statusFilter === "all") return incidents;
    return incidents.filter((i) => i.status === statusFilter);
  }, [incidents, statusFilter]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#0a0a0f" : "#f0f2f5",
    },
    header: {
      padding: 16,
      paddingBottom: 12,
      backgroundColor: isDark ? "#1a1a2e" : "#ffffff",
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: isDark ? "#fff" : "#1a1a2e",
      flex: 1,
    },
    // Status Filter
    statusFilterRow: {
      flexDirection: "row",
      gap: 6,
      marginTop: 10,
    },
    statusPill: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: isDark ? "#2a2a4e" : "#f0f0f5",
    },
    statusPillActive: {
      backgroundColor: "#007AFF",
    },
    statusPillText: {
      fontSize: 12,
      fontWeight: "600",
      color: isDark ? "#ccc" : "#666",
    },
    statusPillTextActive: {
      color: "#fff",
    },
    // List
    listContent: {
      padding: 16,
      paddingBottom: 32,
    },
    emptyContainer: {
      alignItems: "center",
      paddingTop: 60,
    },
    emptyText: {
      fontSize: 16,
      color: isDark ? "#888" : "#666",
      marginTop: 12,
    },
    // Card
    card: {
      backgroundColor: isDark ? "#1a1a2e" : "#ffffff",
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 8,
    },
    situation: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
      flex: 1,
      marginRight: 8,
    },
    cardBadges: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    agencyTag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    agencyTagText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "700",
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    statusText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    metaText: {
      fontSize: 13,
      color: isDark ? "#aaa" : "#666",
      marginBottom: 4,
    },
    thumbnail: {
      width: "100%",
      height: 140,
      borderRadius: 8,
      marginTop: 8,
      marginBottom: 8,
      overflow: "hidden",
    },
    thumbnailPlayOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.15)",
    },
    cardActions: {
      flexDirection: "row",
      gap: 8,
      marginTop: 8,
    },
    viewDetailButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: isDark ? "#2a2a4e" : "#e8f0fe",
      paddingVertical: 10,
      borderRadius: 8,
    },
    viewDetailText: {
      color: "#007AFF",
      fontSize: 13,
      fontWeight: "600",
    },
  });

  const renderIncident = ({ item }: { item: Incident }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.situation}>
          {item.situation || item.description || "Incident Report"}
        </Text>
        <View style={styles.cardBadges}>
          {item.involvedAgency && (
            <View
              style={[
                styles.agencyTag,
                {
                  backgroundColor:
                    AGENCY_COLORS[
                      item.involvedAgency as keyof typeof AGENCY_COLORS
                    ] || "#999",
                },
              ]}
            >
              <Text style={styles.agencyTagText}>{item.involvedAgency}</Text>
            </View>
          )}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>
              {(item.status || "pending").replace("_", " ")}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.metaText}>
        Reporter: {item.userEmail || "Unknown"}
      </Text>
      <Text style={styles.metaText}>
        Injury: {item.injuryLevel || "Not specified"}
      </Text>
      <Text style={styles.metaText}>
        Location: {item.location || "Not provided"}
      </Text>
      <Text style={styles.metaText}>
        Submitted: {formatDate(item.createdAt)}
      </Text>
      {item.videoUrl ? (
        <VideoThumbnail
          uri={item.videoUrl}
          style={styles.thumbnail}
          overlayStyle={styles.thumbnailPlayOverlay}
          onPress={() =>
            router.push({
              pathname: "/admin/incident-detail",
              params: { id: item.id },
            } as any)
          }
        />
      ) : null}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.viewDetailButton}
          onPress={() =>
            router.push({
              pathname: "/admin/incident-detail",
              params: { id: item.id },
            } as any)
          }
        >
          <Ionicons name="eye-outline" size={16} color="#007AFF" />
          <Text style={styles.viewDetailText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>

        {/* Status Filter */}
        <View style={styles.statusFilterRow}>
          {STATUS_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.statusPill,
                statusFilter === filter && styles.statusPillActive,
              ]}
              onPress={() => setStatusFilter(filter)}
            >
              <Text
                style={[
                  styles.statusPillText,
                  statusFilter === filter && styles.statusPillTextActive,
                ]}
              >
                {filter === "all" ? "All" : filter.replace("_", " ")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={filteredIncidents}
          keyExtractor={(item) => item.id}
          renderItem={renderIncident}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadIncidents(true)}
              tintColor="#007AFF"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color={isDark ? "#555" : "#ccc"}
              />
              <Text style={styles.emptyText}>No reports yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
