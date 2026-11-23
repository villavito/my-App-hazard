import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IncidentVideoPlayer } from "../../components/IncidentVideoPlayer";
import { LocationMap } from "../../components/LocationMap";
import { useAuth } from "../../contexts/AuthContext";
import {
  addIncidentComment,
  getIncidentById,
  updateIncidentStatus,
} from "../../services/firestoreService";
import { showAlert } from "../../utils/crossPlatformAlert";
import {
  formatCoordinates,
  formatDistance,
  isCoordinatesText,
  lookupAddress,
  reportCoordinates,
} from "../../utils/location";
import { isStoredVideoUrl } from "../../utils/videoStore";


// A report saved before video upload was restored (or one that never
// reached the backend) can have a file:// path that only ever existed on
// the reporting phone. Passing that into useVideoPlayer() can throw
// synchronously trying to open a path that doesn't exist on this device at
// all, so only ever hand it a fetchable URL - or a video stored in Firestore.
function isPlayableVideoUrl(uri: string): boolean {
  return (
    uri.startsWith("http://") ||
    uri.startsWith("https://") ||
    isStoredVideoUrl(uri)
  );
}

type Incident = {
  id: string;
  userEmail?: string;
  situation?: string;
  description?: string;
  injuryLevel?: string;
  category?: string;
  location?: string;
  status?: string;
  agency?: string;
  involvedAgency?: string;
  videoUrl?: string;
  latitude?: number;
  longitude?: number;
  coordinates?: { latitude: number; longitude: number } | null;
  /** Meters the reporter's position may be off by (newer reports only). */
  locationAccuracy?: number | null;
  /** "adjusted" when the reporter moved the pin by hand. */
  locationSource?: string | null;
  createdAt?: { toDate: () => Date; seconds: number };
};

export default function IncidentDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loading: authLoading } = useAuth();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const playableVideoUrl =
    incident?.videoUrl && isPlayableVideoUrl(incident.videoUrl)
      ? incident.videoUrl
      : null;
  useEffect(() => {
    // After a browser refresh the sign-in is still being restored, and
    // Firestore's rules refuse the read until it is - so wait for it.
    if (id && !authLoading) {
      loadIncident();
    }
  }, [id, authLoading]);

  const loadIncident = async () => {
    setLoading(true);
    const result = await getIncidentById(id);
    if (result.success && result.data) {
      setIncident(result.data as Incident);
    }
    setLoading(false);
  };

  // Reports sent from the web before it could look up addresses saved only
  // "lat, lng" as their location, so find the address to show instead.
  const coords = incident ? reportCoordinates(incident) : null;
  const latitude = coords?.latitude;
  const longitude = coords?.longitude;
  const needsAddress = Boolean(coords && isCoordinatesText(incident?.location));
  const [foundAddress, setFoundAddress] = useState<{
    key: string;
    address: string | null;
  } | null>(null);
  const pointKey = `${latitude},${longitude}`;
  useEffect(() => {
    if (!needsAddress || latitude == null || longitude == null) return;
    let cancelled = false;
    lookupAddress({ latitude, longitude }).then((address) => {
      if (!cancelled) {
        setFoundAddress({ key: `${latitude},${longitude}`, address });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [needsAddress, latitude, longitude]);
  const addressForPoint =
    foundAddress?.key === pointKey ? foundAddress.address : null;

  const handleStatusUpdate = (newStatus: string) => {
    if (!incident) return;
    showAlert(
      "Update Status",
      `Change status to "${newStatus.replace("_", " ")}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            const result = await updateIncidentStatus(incident.id, newStatus);
            if (result.success) {
              loadIncident();
            } else {
              showAlert("Error", "Failed to update status");
            }
          },
        },
      ],
    );
  };

  const handleComment = async () => {
    if (!comment.trim() || !incident) return;

    setPostingComment(true);
    const result = await addIncidentComment(incident.id, comment.trim());
    setPostingComment(false);

    if (result.success) {
      showAlert("Sent", "The reporter has been notified.");
      setComment("");
    } else {
      showAlert("Error", "Failed to send the comment. Please try again.");
    }
  };

  const getStatusColor = (status?: string) => {
    if (status === "resolved") return "#34C759";
    if (status === "in_progress") return "#FF9500";
    return "#FF3B30";
  };

  const getInjuryBadge = (level?: string) => {
    // Match on the first word so "Minor (First Aid)" etc. from INJURY_LEVELS
    // hit the same colors as older plain values like "minor".
    switch (level?.toLowerCase().split(/[\s(]/)[0]) {
      case "fatality":
      case "critical":
      case "serious":
      case "severe":
        return { bg: "#FF3B3020", text: "#FF3B30", label: level };
      case "moderate":
        return { bg: "#FF950020", text: "#FF9500", label: level };
      case "minor":
      case "mild":
        return { bg: "#FFD60A20", text: "#FFD60A", label: level };
      default:
        return {
          bg: "#34C75920",
          text: "#34C759",
          label: level || "Not specified",
        };
    }
  };

  const STATUS_OPTIONS = [
    {
      key: "pending",
      label: "Pending",
      icon: "time-outline" as const,
      color: "#FF3B30",
    },
    {
      key: "in_progress",
      label: "In Progress",
      icon: "refresh-outline" as const,
      color: "#FF9500",
    },
    {
      key: "resolved",
      label: "Resolved",
      icon: "checkmark-circle-outline" as const,
      color: "#34C759",
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#0a0a0f" : "#f0f2f5",
    },
    scrollContent: {
      paddingBottom: 40,
    },
    // Header
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: isDark ? "#1a1a2e" : "#ffffff",
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: isDark ? "#fff" : "#1a1a2e",
      flex: 1,
    },
    headerStatus: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 8,
    },
    headerStatusText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    // Image
    imageBanner: {
      width: "100%",
      height: 220,
      backgroundColor: isDark ? "#1a1a2e" : "#ddd",
    },
    // On the admin web the full-width banner stretched with the browser and
    // cropped the footage, so use a fixed 16:9 player centered on the page.
    imageBannerWeb: {
      width: 640,
      maxWidth: "100%",
      height: 360,
      alignSelf: "center",
      backgroundColor: "#000",
    },
    imagePlaceholder: {
      width: "100%",
      height: 220,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "#1a1a2e" : "#f0f0f5",
    },
    // Tabs
    tabBar: {
      flexDirection: "row",
      backgroundColor: isDark ? "#1a1a2e" : "#ffffff",
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 8,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: "center",
      backgroundColor: isDark ? "#2a2a4e" : "#f0f0f5",
    },
    tabActive: {
      backgroundColor: "#007AFF",
    },
    tabText: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#888" : "#666",
    },
    tabTextActive: {
      color: "#fff",
    },
    // Content
    content: {
      padding: 16,
    },
    // Info Card
    infoCard: {
      backgroundColor: isDark ? "#1a1a2e" : "#ffffff",
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.1)",
    },
    infoTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: isDark ? "#fff" : "#1a1a2e",
      marginBottom: 6,
    },
    infoDescription: {
      fontSize: 15,
      color: isDark ? "#ccc" : "#555",
      lineHeight: 22,
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    infoIcon: {
      width: 28,
      marginTop: 2,
    },
    infoLabel: {
      fontSize: 13,
      color: isDark ? "#888" : "#999",
    },
    infoValue: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#fff" : "#333",
      marginTop: 1,
    },
    // Injury Badge
    injuryBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      alignSelf: "flex-start",
    },
    injuryBadgeText: {
      fontSize: 12,
      fontWeight: "700",
    },
    // Status Actions
    statusActions: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 16,
    },
    statusButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      borderWidth: 2,
    },
    statusButtonActive: {
      backgroundColor: undefined,
    },
    statusButtonText: {
      fontSize: 11,
      fontWeight: "700",
      marginTop: 4,
      textTransform: "uppercase",
    },
    // Comment Section
    commentSection: {
      backgroundColor: isDark ? "#1a1a2e" : "#ffffff",
      borderRadius: 16,
      padding: 16,
      boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.1)",
    },
    commentTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: isDark ? "#fff" : "#333",
      marginBottom: 12,
    },
    commentInput: {
      backgroundColor: isDark ? "#2a2a4e" : "#f5f5fa",
      borderRadius: 12,
      padding: 14,
      fontSize: 14,
      color: isDark ? "#fff" : "#333",
      minHeight: 80,
      textAlignVertical: "top",
      marginBottom: 10,
    },
    commentButton: {
      backgroundColor: "#007AFF",
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",
    },
    commentButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "700",
    },
    // Timeline
    timelineCard: {
      backgroundColor: isDark ? "#1a1a2e" : "#ffffff",
      borderRadius: 16,
      padding: 20,
      boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.1)",
    },
    timelineTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: isDark ? "#fff" : "#333",
      marginBottom: 16,
    },
    timelineItem: {
      flexDirection: "row",
      marginBottom: 16,
    },
    timelineLine: {
      alignItems: "center",
      width: 24,
      marginRight: 12,
    },
    timelineDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: "#007AFF",
    },
    timelineConnector: {
      width: 2,
      flex: 1,
      backgroundColor: isDark ? "#2a2a4e" : "#e0e0e0",
      marginVertical: 4,
    },
    timelineContent: {
      flex: 1,
      paddingBottom: 8,
    },
    timelineText: {
      fontSize: 14,
      color: isDark ? "#fff" : "#333",
    },
    timelineMeta: {
      fontSize: 12,
      color: isDark ? "#888" : "#999",
      marginTop: 4,
    },
    // Action buttons
    actionRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    actionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#fff",
    },
    // Map preview
    locationMap: {
      marginTop: 12,
    },
    mapCaption: {
      fontSize: 12,
      color: isDark ? "#888" : "#999",
      marginTop: 6,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!incident) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
          }}
        >
          <Ionicons
            name="document-text-outline"
            size={64}
            color={isDark ? "#555" : "#ccc"}
          />
          <Text
            style={{
              color: isDark ? "#888" : "#999",
              marginTop: 12,
              fontSize: 16,
            }}
          >
            Incident not found
          </Text>
          <TouchableOpacity
            style={{ marginTop: 16 }}
            onPress={() => router.back()}
          >
            <Text style={{ color: "#007AFF", fontWeight: "600" }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const injuryBadge = getInjuryBadge(incident.injuryLevel);
  const locationText =
    (needsAddress && addressForPoint) || incident.location || "Not provided";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDark ? "#fff" : "#333"}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Incident Details
          </Text>
          <View
            style={[
              styles.headerStatus,
              { backgroundColor: getStatusColor(incident.status) },
            ]}
          >
            <Text style={styles.headerStatusText}>
              {(incident.status || "pending").replace("_", " ")}
            </Text>
          </View>
        </View>

        {/* Banner Video */}
        {playableVideoUrl ? (
          <IncidentVideoPlayer
            uri={playableVideoUrl}
            style={
              Platform.OS === "web" ? styles.imageBannerWeb : styles.imageBanner
            }
            contentFit="contain"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons
              name="videocam-outline"
              size={48}
              color={isDark ? "#555" : "#ccc"}
            />
            <Text
              style={{
                color: isDark ? "#555" : "#ccc",
                marginTop: 8,
                fontSize: 14,
              }}
            >
              {incident.videoUrl
                ? "Video isn't available on this device"
                : "No video attached"}
            </Text>
          </View>
        )}

        <View style={styles.content}>
          {/* Status Actions */}
          <View style={styles.statusActions}>
            {STATUS_OPTIONS.map((option) => {
              const isCurrent = incident.status === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.statusButton,
                    { borderColor: option.color },
                    isCurrent && { backgroundColor: option.color + "20" },
                  ]}
                  onPress={() => !isCurrent && handleStatusUpdate(option.key)}
                  disabled={isCurrent}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={isCurrent ? option.color : isDark ? "#888" : "#666"}
                  />
                  <Text
                    style={[
                      styles.statusButtonText,
                      {
                        color: isCurrent
                          ? option.color
                          : isDark
                            ? "#888"
                            : "#666",
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Incident Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              {incident.category || incident.situation || "Incident Report"}
            </Text>
            {incident.description && (
              <Text style={styles.infoDescription}>{incident.description}</Text>
            )}

            <View style={styles.infoRow}>
              <Ionicons
                name="person-outline"
                size={18}
                color="#007AFF"
                style={styles.infoIcon}
              />
              <View>
                <Text style={styles.infoLabel}>Reported by</Text>
                <Text style={styles.infoValue}>
                  {incident.userEmail || "Anonymous"}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color="#FF9500"
                style={styles.infoIcon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Incident</Text>
                <Text style={styles.infoValue}>
                  {incident.category || "Not specified"}
                </Text>
              </View>
            </View>

            {incident.injuryLevel ? (
              <View style={styles.infoRow}>
                <Ionicons
                  name="medkit-outline"
                  size={18}
                  color="#FF3B30"
                  style={styles.infoIcon}
                />
                <View>
                  <Text style={styles.infoLabel}>Injury Level</Text>
                  <View
                    style={[
                      styles.injuryBadge,
                      { backgroundColor: injuryBadge.bg, marginTop: 2 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.injuryBadgeText,
                        { color: injuryBadge.text },
                      ]}
                    >
                      {injuryBadge.label}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            <View style={styles.infoRow}>
              <Ionicons
                name="location-outline"
                size={18}
                color="#34C759"
                style={styles.infoIcon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{locationText}</Text>
                {coords && (
                  <>
                    <LocationMap
                      coords={coords}
                      accuracy={incident.locationAccuracy}
                      label={locationText}
                      height={200}
                      isDark={isDark}
                      style={styles.locationMap}
                      actionLabel="View on map"
                      onPress={() =>
                        router.push({
                          pathname: "/admin/map",
                          params: { focus: incident.id },
                        } as any)
                      }
                    />
                    <Text style={styles.mapCaption}>
                      {formatCoordinates(coords)}
                      {incident.locationSource === "adjusted"
                        ? " · pin placed by the reporter"
                        : incident.locationAccuracy
                          ? ` · accurate to about ${formatDistance(incident.locationAccuracy)}`
                          : ""}
                    </Text>
                  </>
                )}
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color="#FF9500"
                style={styles.infoIcon}
              />
              <View>
                <Text style={styles.infoLabel}>Submitted</Text>
                <Text style={styles.infoValue}>
                  {incident.createdAt?.toDate?.()?.toLocaleString() ||
                    "Unknown date"}
                </Text>
              </View>
            </View>

            {(incident.agency || incident.involvedAgency) && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="shield-outline"
                  size={18}
                  color="#AF52DE"
                  style={styles.infoIcon}
                />
                <View>
                  <Text style={styles.infoLabel}>Involved Agency</Text>
                  <Text style={styles.infoValue}>
                    {incident.involvedAgency || incident.agency}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Message to reporting user */}
          <View style={styles.commentSection}>
            <Text style={styles.commentTitle}>Message to User</Text>
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Write a message to the reporter..."
              placeholderTextColor={isDark ? "#666" : "#999"}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.commentButton,
                (postingComment || !comment.trim()) && { opacity: 0.5 },
              ]}
              onPress={handleComment}
              disabled={postingComment || !comment.trim()}
            >
              <Text style={styles.commentButtonText}>
                {postingComment ? "Sending..." : "Send Message"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
