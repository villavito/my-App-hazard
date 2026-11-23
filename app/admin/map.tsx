import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  type MapMarker,
  type MapStartView,
  TileMap,
} from "../../components/TileMap";
import { AGENCIES, AGENCY_COLORS, type Agency } from "../../constants/agencies";
import {
  INCIDENT_STATUSES,
  type IncidentStatusKey,
} from "../../constants/incidentStatus";
import { useAuth } from "../../contexts/AuthContext";
import { subscribeToAgencyIncidents } from "../../services/firestoreService";
import { showAlert } from "../../utils/crossPlatformAlert";
import {
  type Coordinates,
  formatCoordinates,
  formatDistance,
  isCoordinatesText,
  lookupAddress,
  openDirections,
  reportCoordinates,
} from "../../utils/location";

type MapIncident = {
  id: string;
  category?: string;
  situation?: string;
  description?: string;
  location?: string;
  status?: string;
  involvedAgency?: string;
  injuryLevel?: string;
  coordinates?: Coordinates | null;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number | null;
  /** "adjusted" when the reporter moved the pin by hand. */
  locationSource?: string | null;
  createdAt?: { toDate: () => Date };
};

type Located = { incident: MapIncident; coords: Coordinates };
type Filter = "all" | IncidentStatusKey;

const FILTERS: { key: Filter; label: string; color?: string }[] = [
  { key: "all", label: "All" },
  ...INCIDENT_STATUSES.map((s) => ({ key: s.key, label: s.label, color: s.color })),
];

// A report opened from its own page is shown this close.
const FOCUS_ZOOM = 17;
// Room the details card takes at the bottom of the map, so a tapped pin
// can slide up out from under it.
const CARD_SPACE = 240;

function statusOf(incident: MapIncident) {
  return (
    INCIDENT_STATUSES.find((s) => s.key === incident.status) ??
    INCIDENT_STATUSES[0]
  );
}

function titleOf(incident: MapIncident) {
  return incident.category || incident.situation || "Incident Report";
}

export default function IncidentMapScreen() {
  const isDark = useColorScheme() === "dark";
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const { user, userRole } = useAuth();

  // Same scoping as the Notifications inbox: super admins see every agency,
  // an agency admin only their own, and an admin with no agency nothing.
  const isSuperAdmin = userRole?.role === "super_admin";
  const restrictedAgency = userRole?.agency;
  const visibleAgencies = useMemo<readonly Agency[]>(
    () => (isSuperAdmin ? AGENCIES : restrictedAgency ? [restrictedAgency] : []),
    [isSuperAdmin, restrictedAgency],
  );

  const [incidents, setIncidents] = useState<MapIncident[] | null>(null);
  const [startView, setStartView] = useState<MapStartView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [selection, setSelection] = useState<{ ids: string[]; index: number } | null>(null);
  // Reports that came in while the map was open: ringed until looked at.
  const [newIds, setNewIds] = useState<string[]>([]);
  // Every report already on the map, to tell which ones are new.
  const knownIds = useRef<Set<string> | null>(null);

  // Firestore refuses the reads until the restored sign-in (and with it the
  // admin's role and agency) has loaded.
  const ready = Boolean(user && userRole);

  // Live: Firestore sends the whole list again whenever a report for these
  // agencies is added, changes status or is deleted, so the map is never
  // out of date and needs no refresh button.
  useEffect(() => {
    if (!ready) return;
    knownIds.current = null;
    return subscribeToAgencyIncidents(visibleAgencies, (docs, failed) => {
      const list = docs as MapIncident[];
      const ids = list.map((incident) => incident.id);
      const previous = knownIds.current;
      knownIds.current = new Set(ids);
      if (previous) {
        const added = ids.filter((id) => !previous.has(id));
        if (added.length > 0) setNewIds((current) => [...current, ...added]);
      }

      setIncidents(list);
      setLoadError(
        failed > 0
          ? `Couldn't load ${failed} of ${visibleAgencies.length} agency inbox(es). Reopen this page to try again.`
          : null,
      );

      // The first answer decides where the map starts. Opened from a
      // report's page: start on that report, already chosen.
      if (!previous) {
        const target = focus ? list.find((i) => i.id === focus) : undefined;
        const targetCoords = target ? reportCoordinates(target) : null;
        setStartView(
          (current) =>
            current ??
            (targetCoords
              ? { center: targetCoords, zoom: FOCUS_ZOOM }
              : {
                  fit: list
                    .map(reportCoordinates)
                    .filter((c): c is Coordinates => c !== null),
                }),
        );
        if (target && targetCoords) {
          setSelection((current) => current ?? { ids: [target.id], index: 0 });
        }
      }
    });
  }, [ready, visibleAgencies, focus]);

  const located: Located[] = (incidents ?? []).flatMap((incident) => {
    const coords = reportCoordinates(incident);
    return coords ? [{ incident, coords }] : [];
  });
  const withoutLocation = (incidents?.length ?? 0) - located.length;
  const countFor = (key: Filter) =>
    key === "all"
      ? located.length
      : located.filter(({ incident }) => statusOf(incident).key === key).length;
  const shown = located.filter(
    ({ incident }) => filter === "all" || statusOf(incident).key === filter,
  );
  const markers: MapMarker[] = shown.map(({ incident, coords }) => {
    const status = statusOf(incident);
    const isNew = newIds.includes(incident.id);
    return {
      id: incident.id,
      coords,
      color: status.color,
      rank: INCIDENT_STATUSES.indexOf(status),
      label: `${titleOf(incident)}, ${status.label}${isNew ? ", new" : ""}`,
      highlighted: isNew,
    };
  });

  // The chosen report(s) - a filter can hide them.
  const selectedIds = (selection?.ids ?? []).filter((id) =>
    shown.some(({ incident }) => incident.id === id),
  );
  const selectedIndex = Math.min(selection?.index ?? 0, Math.max(selectedIds.length - 1, 0));
  const current = shown.find(({ incident }) => incident.id === selectedIds[selectedIndex]);

  // Older web reports saved only "lat, lng" - look the address up for the card.
  const needsAddress = Boolean(current && isCoordinatesText(current.incident.location));
  const latitude = current?.coords.latitude;
  const longitude = current?.coords.longitude;
  const [foundAddress, setFoundAddress] = useState<{ key: string; address: string | null } | null>(null);
  useEffect(() => {
    if (!needsAddress || latitude == null || longitude == null) return;
    let cancelled = false;
    lookupAddress({ latitude, longitude }).then((address) => {
      if (!cancelled) setFoundAddress({ key: `${latitude},${longitude}`, address });
    });
    return () => {
      cancelled = true;
    };
  }, [needsAddress, latitude, longitude]);
  const lookedUp =
    foundAddress?.key === `${latitude},${longitude}` ? foundAddress.address : null;
  const address = current
    ? (needsAddress ? lookedUp : current.incident.location) ||
      current.incident.location ||
      formatCoordinates(current.coords)
    : "";

  const notice =
    incidents === null
      ? null
      : visibleAgencies.length === 0
        ? "This admin account has no agency assigned, so it has no reports to show."
        : located.length === 0
          ? "No reports with a location yet."
          : shown.length === 0
            ? `No ${FILTERS.find((f) => f.key === filter)?.label.toLowerCase()} reports on the map.`
            : null;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#0a0a0f" : "#f0f2f5",
    },
    header: {
      padding: 16,
      paddingBottom: 12,
      backgroundColor: isDark ? "#1a1a2e" : "#ffffff",
      boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.1)",
      zIndex: 1,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: "bold",
      color: isDark ? "#fff" : "#1a1a2e",
    },
    liveBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: isDark ? "#123a22" : "#e6f7ec",
    },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#34C759",
    },
    liveText: {
      fontSize: 12,
      fontWeight: "700",
      color: isDark ? "#7ee2a0" : "#1e8e3e",
    },
    subtitle: {
      fontSize: 13,
      color: isDark ? "#aaa" : "#666",
      marginTop: 2,
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
    filterRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 10,
    },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 16,
      backgroundColor: isDark ? "#2a2a4e" : "#f0f0f5",
    },
    pillActive: {
      backgroundColor: "#007AFF",
    },
    pillText: {
      fontSize: 12,
      fontWeight: "600",
      color: isDark ? "#ccc" : "#666",
    },
    pillTextActive: {
      color: "#fff",
    },
    pillDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: "#fff",
    },
    mapArea: {
      flex: 1,
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    notice: {
      position: "absolute",
      top: 12,
      left: 12,
      right: 66,
      alignItems: "flex-start",
    },
    noticeBox: {
      backgroundColor: isDark ? "rgba(26, 26, 46, 0.95)" : "rgba(255, 255, 255, 0.95)",
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.2)",
    },
    noticeText: {
      fontSize: 13,
      color: isDark ? "#ddd" : "#333",
    },
    card: {
      position: "absolute",
      left: 12,
      right: 12,
      bottom: 26 + insets.bottom,
      alignSelf: "center",
      maxWidth: 520,
      marginHorizontal: "auto",
      backgroundColor: isDark ? "#1a1a2e" : "#ffffff",
      borderRadius: 16,
      padding: 14,
      boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.25)",
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: isDark ? "#fff" : "#1a1a2e",
    },
    badges: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 6,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    badgeText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    closeButton: {
      padding: 4,
    },
    cardLine: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 6,
      marginTop: 8,
    },
    cardText: {
      flex: 1,
      fontSize: 13,
      color: isDark ? "#ccc" : "#444",
      lineHeight: 18,
    },
    pager: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      marginTop: 10,
    },
    pagerText: {
      fontSize: 13,
      fontWeight: "600",
      color: isDark ? "#ccc" : "#444",
    },
    cardActions: {
      flexDirection: "row",
      gap: 8,
      marginTop: 12,
    },
    primaryButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: "#007AFF",
      paddingVertical: 10,
      borderRadius: 10,
    },
    primaryButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "700",
    },
    secondaryButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: isDark ? "#2a2a4e" : "#e8f0fe",
      paddingVertical: 10,
      borderRadius: 10,
    },
    secondaryButtonText: {
      color: "#007AFF",
      fontSize: 14,
      fontWeight: "700",
    },
  });

  const subtitle =
    incidents === null
      ? "Loading reports..."
      : `${located.length} report${located.length === 1 ? "" : "s"} on the map` +
        (withoutLocation > 0 ? ` · ${withoutLocation} without a location` : "");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Incident Map</Text>
          {/* Only once reports have loaded. (No icon font here: an icon in
              the first render broke the web page's hand-over from its
              pre-built HTML, React error #418, if the font loaded mid-way.) */}
          {incidents !== null && !loadError ? (
            <View style={styles.liveBadge} accessibilityLabel="Updates live">
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {loadError && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={16} color="#FF3B30" />
            <Text style={styles.errorBannerText}>{loadError}</Text>
          </View>
        )}

        {/* Four short pills: they wrap onto a second line on narrow phones. */}
        <View style={styles.filterRow}>
          {FILTERS.map(({ key, label, color }) => {
            const active = filter === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setFilter(key)}
              >
                {color ? (
                  <View style={[styles.pillDot, { backgroundColor: color }]} />
                ) : null}
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                  {`${label} (${countFor(key)})`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.mapArea}>
        {startView ? (
          <TileMap
            markers={markers}
            startView={startView}
            selectedIds={selectedIds}
            onSelect={(ids) => {
              setSelection(ids ? { ids, index: 0 } : null);
              // Looked at: no longer new.
              if (ids) setNewIds((current) => current.filter((id) => !ids.includes(id)));
            }}
            bottomInset={CARD_SPACE + insets.bottom}
            isDark={isDark}
          />
        ) : (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}

        {notice ? (
          <View style={styles.notice} pointerEvents="none">
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          </View>
        ) : null}

        {current ? (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{titleOf(current.incident)}</Text>
                <View style={styles.badges}>
                  <View style={[styles.badge, { backgroundColor: statusOf(current.incident).color }]}>
                    <Text style={styles.badgeText}>{statusOf(current.incident).label}</Text>
                  </View>
                  {current.incident.involvedAgency ? (
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor:
                            AGENCY_COLORS[current.incident.involvedAgency as Agency] ?? "#999",
                        },
                      ]}
                    >
                      <Text style={styles.badgeText}>{current.incident.involvedAgency}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelection(null)}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={22} color={isDark ? "#aaa" : "#666"} />
              </TouchableOpacity>
            </View>

            <View style={styles.cardLine}>
              <Ionicons name="location-outline" size={15} color="#34C759" />
              <Text style={styles.cardText}>
                {address}
                {current.incident.locationSource === "adjusted"
                  ? " (pin placed by the reporter)"
                  : current.incident.locationAccuracy
                    ? ` (±${formatDistance(current.incident.locationAccuracy)})`
                    : ""}
              </Text>
            </View>
            <View style={styles.cardLine}>
              <Ionicons name="time-outline" size={15} color="#FF9500" />
              <Text style={styles.cardText}>
                {current.incident.createdAt?.toDate?.()?.toLocaleString() ?? "Unknown date"}
                {current.incident.injuryLevel ? ` · Injury: ${current.incident.injuryLevel}` : ""}
              </Text>
            </View>

            {selectedIds.length > 1 ? (
              <View style={styles.pager}>
                <TouchableOpacity
                  onPress={() =>
                    setSelection({
                      ids: selectedIds,
                      index: (selectedIndex - 1 + selectedIds.length) % selectedIds.length,
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Previous report here"
                >
                  <Ionicons name="chevron-back" size={20} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.pagerText}>
                  {`${selectedIndex + 1} of ${selectedIds.length} reports here`}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setSelection({
                      ids: selectedIds,
                      index: (selectedIndex + 1) % selectedIds.length,
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Next report here"
                >
                  <Ionicons name="chevron-forward" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() =>
                  router.push({
                    pathname: "/admin/incident-detail",
                    params: { id: current.incident.id },
                  } as any)
                }
              >
                <Ionicons name="document-text-outline" size={16} color="#fff" />
                <Text style={styles.primaryButtonText}>Open report</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() =>
                  openDirections(current.coords).catch(() =>
                    showAlert("Error", "Could not open Google Maps."),
                  )
                }
              >
                <Ionicons name="navigate-outline" size={16} color="#007AFF" />
                <Text style={styles.secondaryButtonText}>Directions</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}
