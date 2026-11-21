import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  Vibration,
  View,
} from "react-native";
import { AGENCY_COLORS, type Agency } from "../constants/agencies";
import {
  subscribeToNewIncidents,
  type NewIncidentAlert,
} from "../services/firestoreService";

// Pops up over every admin page the moment a report arrives for the admin's
// agency (every agency for super admins): a card with the report's details,
// plus a sound on the web or a vibration on phones. When the browser tab is
// in the background it also shows a desktop notification, if the admin
// allowed them. It listens to Firestore directly - no server or push service,
// which the free plan doesn't have - so it alerts while the dashboard is open.

type Props = {
  /** Agencies to watch; null means all of them (super admin), [] none. */
  agencies: readonly string[] | null;
  /** Called for each new report, e.g. to refresh the pending badge. */
  onNewReport?: () => void;
};

type PermissionState = NotificationPermission | "unsupported";

const canNotify = () =>
  Platform.OS === "web" && typeof Notification !== "undefined";

function summary(incident: NewIncidentAlert): string {
  const what = incident.description
    ? `${incident.category ?? "Other"} - ${incident.description}`
    : incident.category ?? "Incident";
  return [what, incident.location || null, incident.injuryLevel || null]
    .filter(Boolean)
    .join(" • ");
}

let audioContext: AudioContext | null = null;

// Two short beeps on the web; a vibration on phones. Best-effort: browsers
// only allow sound once the page has been clicked, which an admin who signed
// in already has.
function playAlert() {
  if (Platform.OS !== "web") {
    Vibration.vibrate([0, 400, 200, 400]);
    return;
  }
  try {
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    audioContext ??= new AudioCtx();
    const ctx = audioContext;
    void ctx.resume();
    for (const offset of [0, 0.25]) {
      const start = ctx.currentTime + offset;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.22);
    }
  } catch {
    // No sound - the card still shows.
  }
}

export function NewReportAlert({ agencies, onNewReport }: Props) {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";
  const [queue, setQueue] = useState<NewIncidentAlert[]>([]);
  const [permission, setPermission] = useState<PermissionState>(() =>
    canNotify() ? Notification.permission : "unsupported",
  );

  // Kept in refs so a new callback or route doesn't restart the listener.
  const onNewReportRef = useRef(onNewReport);
  const routerRef = useRef(router);
  useEffect(() => {
    onNewReportRef.current = onNewReport;
    routerRef.current = router;
  });

  const openReport = (id: string) => {
    setQueue((current) => current.filter((incident) => incident.id !== id));
    routerRef.current.push({
      pathname: "/admin/incident-detail",
      params: { id },
    } as never);
  };

  const agencyKey = agencies === null ? "*" : agencies.join(",");
  useEffect(() => {
    if (agencyKey === "") return;
    return subscribeToNewIncidents(
      agencyKey === "*" ? null : agencyKey.split(","),
      (incident) => {
        setQueue((current) =>
          current.some((queued) => queued.id === incident.id)
            ? current
            : [...current, incident],
        );
        playAlert();
        onNewReportRef.current?.();

        // A desktop notification only when the admin isn't looking at the tab.
        if (
          canNotify() &&
          Notification.permission === "granted" &&
          document.visibilityState === "hidden"
        ) {
          try {
            const notification = new Notification(
              incident.involvedAgency
                ? `New ${incident.involvedAgency} incident report`
                : "New incident report",
              { body: summary(incident), tag: incident.id },
            );
            notification.onclick = () => {
              window.focus();
              notification.close();
              setQueue((current) => current.filter((queued) => queued.id !== incident.id));
              routerRef.current.push({
                pathname: "/admin/incident-detail",
                params: { id: incident.id },
              } as never);
            };
          } catch {
            // Phone browsers only allow notifications from a service worker.
          }
        }
      },
    );
  }, [agencyKey]);

  // "(2) New reports" in the tab title while reports are waiting, so a
  // background tab stands out even without desktop notifications. The title
  // from before the first alert comes back once they're all handled.
  const titleBeforeAlerts = useRef<string | null>(null);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (queue.length > 0) {
      titleBeforeAlerts.current ??= document.title;
      document.title = `(${queue.length}) New report${queue.length > 1 ? "s" : ""}`;
    } else if (titleBeforeAlerts.current !== null) {
      document.title = titleBeforeAlerts.current;
      titleBeforeAlerts.current = null;
    }
  }, [queue.length]);

  const incident = queue[0];
  if (!incident) return null;

  const agencyColor =
    AGENCY_COLORS[incident.involvedAgency as Agency] ?? "#FF3B30";
  const reportedAt = incident.createdAt?.toDate?.();
  const colors = {
    card: isDark ? "#1c1c1e" : "#fff",
    text: isDark ? "#fff" : "#111",
    muted: isDark ? "#aaa" : "#555",
    line: isDark ? "#333" : "#eee",
  };

  return (
    <View style={styles.backdrop} accessibilityViewIsModal>
      <View
        style={[styles.card, { backgroundColor: colors.card, borderTopColor: agencyColor }]}
        accessibilityRole="alert"
        accessibilityLiveRegion="assertive"
      >
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: agencyColor }]}>
            <Ionicons name="alert" size={22} color="#fff" />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]}>
              New incident report
            </Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              {incident.involvedAgency ?? "Agency"}
              {reportedAt
                ? ` • ${reportedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
                : ""}
            </Text>
          </View>
        </View>

        <View style={[styles.details, { borderColor: colors.line }]}>
          <Detail label="Incident" color={colors}>
            {incident.description
              ? `${incident.category ?? "Other"} - ${incident.description}`
              : incident.category || "Not specified"}
          </Detail>
          <Detail label="Injury" color={colors}>
            {incident.injuryLevel || "Not specified"}
          </Detail>
          <Detail label="Location" color={colors}>
            {incident.location || "Not provided"}
          </Detail>
          <Detail label="Reported by" color={colors}>
            {incident.userEmail || "Anonymous"}
          </Detail>
        </View>

        {queue.length > 1 ? (
          <Text style={[styles.more, { color: agencyColor }]}>
            +{queue.length - 1} more new report{queue.length > 2 ? "s" : ""}
          </Text>
        ) : null}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, { borderColor: colors.line }]}
            onPress={() =>
              setQueue((current) => current.filter((queued) => queued.id !== incident.id))
            }
            accessibilityRole="button"
          >
            <Text style={[styles.secondaryText, { color: colors.text }]}>Dismiss</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: agencyColor }]}
            onPress={() => openReport(incident.id)}
            accessibilityRole="button"
          >
            <Text style={styles.primaryText}>View report</Text>
          </TouchableOpacity>
        </View>

        {permission === "default" ? (
          <TouchableOpacity
            onPress={() => {
              void Notification.requestPermission().then(setPermission);
            }}
            accessibilityRole="button"
          >
            <Text style={styles.enableLink}>
              Also alert me when this tab is in the background
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function Detail({
  label,
  color,
  children,
}: {
  label: string;
  color: { text: string; muted: string };
  children: ReactNode;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: color.muted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: color.text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    borderTopWidth: 6,
    padding: 20,
    boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.3)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  details: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    gap: 10,
  },
  detailLabel: {
    width: 88,
    fontSize: 13,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  more: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryButton: {
    borderWidth: 1,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: "600",
  },
  primaryText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  enableLink: {
    marginTop: 14,
    fontSize: 13,
    color: "#007AFF",
    textAlign: "center",
  },
});
