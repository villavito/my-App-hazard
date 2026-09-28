import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { createVideoPlayer, type VideoThumbnail as VideoThumbnailImage } from "expo-video";
import * as React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AGENCIES, AGENCY_COLORS, type Agency } from "../../constants/agencies";
import { INCIDENT_CATEGORIES } from "../../constants/incidentCategories";
import { useAuth } from "../../contexts/AuthContext";
import {
  deleteIncidentReport,
  getIncidentsByAgency,
} from "../../services/firestoreService";
import { showAlert } from "../../utils/crossPlatformAlert";

const INBOX_AGENCIES = AGENCIES;
type InboxAgency = Agency;

type Incident = {
  id: string;
  userEmail?: string;
  situation?: string;
  description?: string;
  injuryLevel?: string;
  category?: string;
  location?: string;
  status?: string;
  videoUrl?: string;
  involvedAgency?: string;
  createdAt?: { toDate: () => Date };
};

const ALL_CATEGORIES = "all";

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

// A report saved before video upload was restored (or one saved from a
// device that never reached the backend) can have a file:// path that only
// ever existed on the reporting phone. That's not a "this admin can't play
// it" situation - createVideoPlayer() can throw synchronously trying to open a
// path that doesn't exist here at all, which without a guard would crash
// this list item's render and could blank the whole screen.
function isRemoteVideoUrl(uri: string): boolean {
  return uri.startsWith("http://") || uri.startsWith("https://");
}

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
  if (!isRemoteVideoUrl(uri)) {
    return (
      <View style={[style, thumbnailLoadingStyle]}>
        <Ionicons name="alert-circle-outline" size={28} color="#fff" />
      </View>
    );
  }

  return <RemoteVideoThumbnail uri={uri} style={style} overlayStyle={overlayStyle} onPress={onPress} />;
}

function RemoteVideoThumbnail({
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
  const [thumbnail, setThumbnail] = useState<VideoThumbnailImage | null>(null);

  useEffect(() => {
    let cancelled = false;

    // The player is created and released here rather than via useVideoPlayer:
    // that hook memoizes the player but releases it in effect cleanup, so when
    // the effect re-runs (Fast Refresh, FlatList remounting rows) it hands back
    // an already-released native object and generateThumbnailsAsync fails with
    // "Cannot use shared object that was already released". Owning the
    // lifecycle also frees each row's native decoder once its frame is taken,
    // instead of holding one ExoPlayer open per list item.
    let player: ReturnType<typeof createVideoPlayer> | null = null;
    const releasePlayer = () => {
      try {
        player?.release();
      } catch {
        // Already released - nothing to do.
      }
      player = null;
    };

    // On web, generateThumbnailsAsync can throw synchronously (e.g. a CORS
    // "tainted canvas" error on cross-origin video URLs) instead of rejecting
    // a promise, which would otherwise bypass the .catch() below entirely.
    try {
      player = createVideoPlayer(uri);
      Promise.resolve(player.generateThumbnailsAsync(0, { maxWidth: 320 }))
        .then(([frame]) => {
          if (!cancelled) setThumbnail(frame);
        })
        .catch((error) => {
          // A row that unmounted mid-generation released its player on
          // purpose; that rejection isn't worth a warning.
          if (!cancelled) {
            console.warn("Error generating video thumbnail:", error);
          }
        })
        .finally(releasePlayer);
    } catch (error) {
      console.warn("Error generating video thumbnail:", error);
      releasePlayer();
    }

    return () => {
      cancelled = true;
      releasePlayer();
    };
  }, [uri]);

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

  // Only super admins see every agency's inbox. An agency admin sees strictly
  // their own. An admin with no agency assigned sees nothing rather than
  // everything - failing open here is what let one agency read another's
  // reports whenever the user doc was missing its `agency` field.
  const restrictedAgency = userRole?.agency;
  const isSuperAdmin = userRole?.role === "super_admin";
  const visibleAgencies = useMemo<readonly InboxAgency[]>(() => {
    if (isSuperAdmin) return INBOX_AGENCIES;
    return restrictedAgency ? [restrictedAgency] : [];
  }, [isSuperAdmin, restrictedAgency]);

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
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

      results.forEach((result, i) => {
        const agency = visibleAgencies[i];
        if (result.success) {
          console.log(
            `[admin/incidents] ${agency}: ${result.data?.length ?? 0} doc(s)`,
          );
        } else {
          console.warn(`[admin/incidents] ${agency} query failed:`, result.error);
        }
      });

      const failed = results.filter((result) => !result.success);
      setLoadError(
        failed.length > 0
          ? `Couldn't load ${failed.length} of ${results.length} agency inbox(es). Pull to refresh to retry.`
          : null,
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

  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES);

  // An agency admin gets their agency's full category list, so every type is
  // filterable even before the first report of it arrives. A super admin spans
  // all agencies, so they only get the categories actually present in reports.
  const categoryOptions = useMemo<readonly string[]>(() => {
    if (!isSuperAdmin && restrictedAgency) {
      return INCIDENT_CATEGORIES[restrictedAgency];
    }
    return [
      ...new Set(
        incidents.map((i) => i.category).filter((c): c is string => !!c),
      ),
    ].sort();
  }, [incidents, isSuperAdmin, restrictedAgency]);

  // A super admin's options are derived from the loaded reports, so deleting
  // the last report of the selected category removes its pill (or the whole
  // row) - fall back to "All" instead of leaving an invisible, unresettable
  // filter that hides every report.
  const activeCategoryFilter =
    categoryFilter === ALL_CATEGORIES || categoryOptions.includes(categoryFilter)
      ? categoryFilter
      : ALL_CATEGORIES;

  const filteredIncidents = useMemo(
    () =>
      incidents.filter(
        (i) =>
          (statusFilter === "all" || i.status === statusFilter) &&
          (activeCategoryFilter === ALL_CATEGORIES ||
            i.category === activeCategoryFilter),
      ),
    [incidents, statusFilter, activeCategoryFilter],
  );

  // Firestore rules already scope delete to the caller's own agency (or
  // super_admin), so this can only ever act on an incident already visible
  // in this admin's inbox - no separate agency check needed client-side.
  const deleteIncident = async (id: string) => {
    setIncidents((prev) => prev.filter((i) => i.id !== id));

    const result = await deleteIncidentReport(id);
    if (!result.success) {
      // Re-fetch instead of restoring a snapshot taken before the optimistic
      // update - a snapshot can be stale by the time this resolves (e.g. a
      // concurrent pull-to-refresh already replaced it), and restoring it
      // would silently discard that newer data.
      await loadIncidents(true);
      showAlert("Delete Failed", "Couldn't delete this incident report. Please try again.");
      return;
    }

    // A concurrent refresh that resolved while this delete was still in
    // flight could have reintroduced this incident (server hadn't processed
    // the delete yet when that refresh read the list) - re-sync so the
    // now-genuinely-deleted incident doesn't linger until the next manual pull.
    await loadIncidents(true);
  };

  const confirmDelete = (item: Incident) => {
    showAlert(
      "Delete Incident Report",
      `Delete this ${item.involvedAgency ?? ""} incident report? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteIncident(item.id),
        },
      ],
    );
  };

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
      boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.1)",
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
    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: isDark ? "#3a1a1a" : "#fdecea",
      borderRadius: 8,
      padding: 8,
      marginTop: 10,
    },
    errorBannerText: {
      flex: 1,
      fontSize: 12,
      color: "#FF3B30",
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
    categoryFilterRow: {
      gap: 6,
      marginTop: 8,
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
      boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.08)",
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
      ...StyleSheet.absoluteFill,
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
    deleteButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: isDark ? "#3a1a1a" : "#fdecea",
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 8,
    },
    deleteText: {
      color: "#FF3B30",
      fontSize: 13,
      fontWeight: "600",
    },
  });

  const renderIncident = ({ item }: { item: Incident }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.situation}>
          {item.category ||
            item.situation ||
            item.description ||
            "Incident Report"}
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
      {/* Only reports made before Incident replaced Injury Level have one. */}
      {item.injuryLevel ? (
        <Text style={styles.metaText}>Injury: {item.injuryLevel}</Text>
      ) : null}
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
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => confirmDelete(item)}
        >
          <Ionicons name="trash-outline" size={16} color="#FF3B30" />
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

        {loadError && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={16} color="#FF3B30" />
            <Text style={styles.errorBannerText}>{loadError}</Text>
          </View>
        )}

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

        {/* Category Filter - scrolls sideways since agencies have 6-7 types */}
        {categoryOptions.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryFilterRow}
          >
            {[ALL_CATEGORIES, ...categoryOptions].map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.statusPill,
                  activeCategoryFilter === category && styles.statusPillActive,
                ]}
                onPress={() => setCategoryFilter(category)}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    activeCategoryFilter === category && styles.statusPillTextActive,
                  ]}
                >
                  {category === ALL_CATEGORIES ? "All incidents" : category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
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
                name={
                  visibleAgencies.length === 0
                    ? "alert-circle-outline"
                    : "document-text-outline"
                }
                size={48}
                color={isDark ? "#555" : "#ccc"}
              />
              <Text style={styles.emptyText}>
                {visibleAgencies.length === 0
                  ? "This admin account has no agency assigned, so it has no inbox to show."
                  : "No reports yet"}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
