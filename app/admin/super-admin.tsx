import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import IncidentStatusChart from "../../components/IncidentStatusChart";
import IncidentTrendChart from "../../components/IncidentTrendChart";
import {
  AGENCIES,
  AGENCY_COLORS,
  AGENCY_LABELS,
  type Agency,
} from "../../constants/agencies";
import { INCIDENT_STATUSES } from "../../constants/incidentStatus";
import { useAuth } from "../../contexts/AuthContext";
import {
  getAllIncidents,
  getAllUsers,
  setAgencyActive,
  setAgencyInactive,
  updateUserRole,
} from "../../services/firestoreService";
import { showAlert } from "../../utils/crossPlatformAlert";
import { buildStatusData, buildTrendData } from "../../utils/incidentCharts";

const TREND_DAYS = 14;
const USERS_PAGE_SIZE = 10;
const RECENT_INCIDENTS = 5;

type Role = "user" | "admin" | "super_admin";

type AppUser = {
  id: string;
  uid?: string;
  email?: string;
  displayName?: string;
  role?: Role;
  agency?: Agency;
  createdAt?: { toDate: () => Date };
  lastLogin?: { toDate: () => Date };
};

type Incident = {
  id: string;
  status?: string;
  involvedAgency?: Agency;
  location?: string;
  injuryLevel?: string;
  userEmail?: string;
  createdAt?: { toDate: () => Date };
};

const ROLE_OPTIONS: { key: Role; label: string; color: string }[] = [
  { key: "user", label: "Citizen", color: "#8E8E93" },
  { key: "admin", label: "Admin", color: "#007AFF" },
  { key: "super_admin", label: "Super Admin", color: "#FF3B30" },
];

const ROLE_FILTERS: { key: Role | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "user", label: "Citizens" },
  { key: "admin", label: "Admins" },
  { key: "super_admin", label: "Super Admins" },
];

const roleMeta = (role?: Role) =>
  ROLE_OPTIONS.find((r) => r.key === role) ?? ROLE_OPTIONS[0];

const statusMeta = (status?: string) =>
  INCIDENT_STATUSES.find((s) => s.key === (status ?? "pending")) ??
  INCIDENT_STATUSES[0];

const formatDate = (value?: { toDate: () => Date }) => {
  const date = value?.toDate?.();
  if (!date) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function SuperAdminDashboard() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { user, userRole, loading: authLoading } = useAuth();
  const isSuperAdmin = userRole?.role === "super_admin";

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [visibleUsers, setVisibleUsers] = useState(USERS_PAGE_SIZE);

  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [draftRole, setDraftRole] = useState<Role>("user");
  const [draftAgency, setDraftAgency] = useState<Agency | null>(null);
  const [saving, setSaving] = useState(false);

  const applyResults = useCallback(
    (
      incidentsResult: Awaited<ReturnType<typeof getAllIncidents>>,
      usersResult: Awaited<ReturnType<typeof getAllUsers>>,
    ) => {
      if (incidentsResult.success && incidentsResult.data) {
        setIncidents(incidentsResult.data as Incident[]);
      }
      if (usersResult.success && usersResult.data) {
        setUsers(usersResult.data as AppUser[]);
      }
      setLoadError(
        incidentsResult.success && usersResult.success
          ? null
          : "Some data could not be loaded. Pull down to try again.",
      );
    },
    [],
  );

  useEffect(() => {
    // Firestore rules need request.auth populated, so wait for the restored
    // session before querying (same as the other admin screens).
    if (!user || !isSuperAdmin) return;

    let cancelled = false;
    Promise.all([getAllIncidents(1000), getAllUsers()]).then(
      ([incidentsResult, usersResult]) => {
        if (cancelled) return;
        applyResults(incidentsResult, usersResult);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [user, isSuperAdmin, applyResults]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const [incidentsResult, usersResult] = await Promise.all([
      getAllIncidents(1000),
      getAllUsers(),
    ]);
    applyResults(incidentsResult, usersResult);
    setRefreshing(false);
  };

  // ---- Derived data -------------------------------------------------------

  const statusCounts = useMemo(() => {
    const counts = { pending: 0, in_progress: 0, resolved: 0 };
    incidents.forEach((i) => {
      const key = (i.status ?? "pending") as keyof typeof counts;
      if (key in counts) counts[key] += 1;
    });
    return counts;
  }, [incidents]);

  const userCounts = useMemo(() => {
    const counts = { user: 0, admin: 0, super_admin: 0 };
    users.forEach((u) => {
      const key = (u.role ?? "user") as keyof typeof counts;
      if (key in counts) counts[key] += 1;
    });
    return counts;
  }, [users]);

  const trendData = useMemo(
    () => buildTrendData(incidents, TREND_DAYS),
    [incidents],
  );
  const statusData = useMemo(() => buildStatusData(incidents), [incidents]);

  const agencyStats = useMemo(
    () =>
      AGENCIES.map((agency) => {
        const agencyIncidents = incidents.filter(
          (i) => i.involvedAgency === agency,
        );
        const resolved = agencyIncidents.filter(
          (i) => i.status === "resolved",
        ).length;
        const pending = agencyIncidents.filter(
          (i) => (i.status ?? "pending") === "pending",
        ).length;
        const admins = users.filter(
          (u) => u.role === "admin" && u.agency === agency,
        ).length;
        return {
          agency,
          total: agencyIncidents.length,
          pending,
          resolved,
          admins,
          resolvedRate:
            agencyIncidents.length > 0 ? resolved / agencyIncidents.length : 0,
        };
      }),
    [incidents, users],
  );

  const recentIncidents = useMemo(
    () =>
      [...incidents]
        .sort(
          (a, b) =>
            (b.createdAt?.toDate?.().getTime() ?? 0) -
            (a.createdAt?.toDate?.().getTime() ?? 0),
        )
        .slice(0, RECENT_INCIDENTS),
    [incidents],
  );

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && (u.role ?? "user") !== roleFilter) {
        return false;
      }
      if (!term) return true;
      return (
        (u.displayName ?? "").toLowerCase().includes(term) ||
        (u.email ?? "").toLowerCase().includes(term)
      );
    });
  }, [users, search, roleFilter]);

  // ---- User role editing --------------------------------------------------

  const startEditing = (target: AppUser) => {
    setEditingUid(target.id);
    setDraftRole(target.role ?? "user");
    setDraftAgency(target.agency ?? null);
  };

  const cancelEditing = () => {
    setEditingUid(null);
    setDraftAgency(null);
  };

  const saveRole = (target: AppUser) => {
    if (draftRole === "admin" && !draftAgency) {
      showAlert("Select an agency", "An admin must be assigned to an agency.");
      return;
    }

    const unchanged =
      draftRole === (target.role ?? "user") &&
      (draftRole !== "admin" || draftAgency === target.agency);
    if (unchanged) {
      cancelEditing();
      return;
    }

    const newLabel =
      draftRole === "admin"
        ? `${draftAgency} Admin`
        : roleMeta(draftRole).label;

    showAlert(
      "Change role?",
      `${target.displayName || target.email} will become ${newLabel}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => applyRoleChange(target),
        },
      ],
    );
  };

  const applyRoleChange = async (target: AppUser) => {
    setSaving(true);
    const agency = draftRole === "admin" ? draftAgency ?? undefined : undefined;
    const result = await updateUserRole(target.id, draftRole, agency);
    setSaving(false);

    if (!result.success) {
      showAlert("Error", "Could not update this user's role.");
      return;
    }

    const updatedUsers = users.map((u) =>
      u.id === target.id ? { ...u, role: draftRole, agency } : u,
    );
    setUsers(updatedUsers);
    cancelEditing();

    // Keep the agencies collection in sync so the report screen only offers
    // agencies that still have someone watching the inbox.
    const affected = new Set<Agency>();
    if (target.role === "admin" && target.agency) affected.add(target.agency);
    if (agency) affected.add(agency);
    // Re-read users so an admin added since this screen loaded isn't missed
    // (which would wrongly hide their agency from the report screen).
    const freshUsers = await getAllUsers();
    const currentUsers =
      freshUsers.success && freshUsers.data
        ? (freshUsers.data as AppUser[])
        : updatedUsers;
    await Promise.all(
      [...affected].map((a) =>
        currentUsers.some((u) => u.role === "admin" && u.agency === a)
          ? setAgencyActive(a)
          : setAgencyInactive(a),
      ),
    );
  };

  // ---- Styles -------------------------------------------------------------

  const surface = isDark ? "#1a1a2e" : "#ffffff";
  const subtle = isDark ? "#24243a" : "#f5f6f8";
  const border = isDark ? "#2a2a40" : "#eef0f3";
  const text = isDark ? "#fff" : "#1a1a2e";
  const muted = isDark ? "#888" : "#666";

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#0a0a0f" : "#f0f2f5",
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 20,
      backgroundColor: surface,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    welcomeText: {
      fontSize: 24,
      fontWeight: "800",
      color: text,
    },
    welcomeSubtext: {
      fontSize: 14,
      color: muted,
      marginTop: 4,
    },
    badge: {
      backgroundColor: "#FF3B30",
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
    },
    badgeText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "700",
    },
    dateText: {
      fontSize: 13,
      color: isDark ? "#888" : "#999",
      marginTop: 12,
    },
    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginHorizontal: 20,
      marginTop: 16,
      padding: 12,
      borderRadius: 12,
      backgroundColor: isDark ? "#3a1a1a" : "#fdecea",
    },
    errorText: {
      flex: 1,
      color: "#FF3B30",
      fontSize: 13,
    },
    section: {
      paddingHorizontal: 20,
      marginTop: 20,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: text,
    },
    sectionLink: {
      fontSize: 13,
      fontWeight: "600",
      color: "#007AFF",
    },
    card: {
      backgroundColor: surface,
      borderRadius: 16,
      padding: 16,
      boxShadow: "0px 1px 6px rgba(0, 0, 0, 0.08)",
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    statTile: {
      flexGrow: 1,
      flexBasis: "30%",
      minWidth: 96,
      backgroundColor: surface,
      borderRadius: 14,
      padding: 12,
      boxShadow: "0px 1px 6px rgba(0, 0, 0, 0.08)",
    },
    statIcon: {
      width: 30,
      height: 30,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    statValue: {
      fontSize: 22,
      fontWeight: "800",
      color: text,
    },
    statLabel: {
      fontSize: 12,
      color: muted,
      marginTop: 2,
    },
    actionsRow: {
      flexDirection: "row",
      gap: 10,
    },
    actionButton: {
      flex: 1,
      alignItems: "center",
      gap: 6,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: subtle,
    },
    actionLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: text,
      textAlign: "center",
    },
    subsectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: muted,
      marginBottom: 10,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    divider: {
      height: 1,
      backgroundColor: border,
      marginVertical: 20,
    },
    agencyRow: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
    agencyTop: {
      flexDirection: "row",
      alignItems: "center",
    },
    agencyDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 10,
    },
    agencyName: {
      flex: 1,
      fontSize: 15,
      fontWeight: "700",
      color: text,
    },
    agencyFullName: {
      fontSize: 12,
      color: muted,
      marginTop: 2,
      marginLeft: 20,
    },
    agencyTotal: {
      fontSize: 15,
      fontWeight: "700",
      color: text,
    },
    agencyMeta: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 12,
      marginTop: 8,
      marginLeft: 20,
    },
    agencyMetaText: {
      fontSize: 12,
      color: muted,
    },
    noAdminPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: isDark ? "#3a2a10" : "#fff4e5",
    },
    noAdminText: {
      fontSize: 11,
      fontWeight: "600",
      color: "#FF9500",
    },
    progressTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: border,
      marginTop: 8,
      marginLeft: 20,
      overflow: "hidden",
    },
    progressFill: {
      height: 6,
      borderRadius: 3,
      backgroundColor: "#34C759",
    },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: subtle,
      borderRadius: 12,
      paddingHorizontal: 12,
      marginBottom: 12,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 8,
      fontSize: 14,
      color: text,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 8,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: subtle,
      borderWidth: 1,
      borderColor: "transparent",
    },
    chipActive: {
      backgroundColor: isDark ? "#1a1a3e" : "#e8f0fe",
      borderColor: "#007AFF",
    },
    chipText: {
      fontSize: 12,
      fontWeight: "600",
      color: muted,
    },
    chipTextActive: {
      color: "#007AFF",
    },
    userRow: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
    userTop: {
      flexDirection: "row",
      alignItems: "center",
    },
    avatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    avatarText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "700",
    },
    userInfo: {
      flex: 1,
      marginRight: 8,
    },
    userName: {
      fontSize: 14,
      fontWeight: "700",
      color: text,
    },
    userEmail: {
      fontSize: 12,
      color: muted,
      marginTop: 2,
    },
    rolePill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    rolePillText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "700",
    },
    editButton: {
      padding: 6,
      marginLeft: 6,
    },
    youText: {
      fontSize: 11,
      color: muted,
      marginLeft: 8,
    },
    editor: {
      marginTop: 12,
      padding: 12,
      borderRadius: 12,
      backgroundColor: subtle,
    },
    editorLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: muted,
      marginBottom: 8,
      marginTop: 4,
    },
    editorActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 10,
      marginTop: 8,
    },
    cancelButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
    },
    cancelText: {
      color: muted,
      fontWeight: "600",
    },
    saveButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: "#007AFF",
      minWidth: 80,
      alignItems: "center",
    },
    saveText: {
      color: "#fff",
      fontWeight: "700",
    },
    showMore: {
      alignItems: "center",
      paddingTop: 14,
    },
    emptyText: {
      textAlign: "center",
      color: muted,
      paddingVertical: 20,
      fontSize: 13,
    },
    incidentRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
    statusDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 12,
    },
    incidentInfo: {
      flex: 1,
      marginRight: 8,
    },
    incidentTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: text,
    },
    agencyPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      marginRight: 6,
    },
    deniedTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: text,
      marginTop: 12,
    },
    deniedText: {
      fontSize: 14,
      color: muted,
      textAlign: "center",
      marginTop: 6,
    },
  });

  // ---- Render -------------------------------------------------------------

  if (authLoading || (user && !userRole)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!isSuperAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Ionicons name="lock-closed-outline" size={40} color={muted} />
          <Text style={styles.deniedTitle}>Super admins only</Text>
          <Text style={styles.deniedText}>
            You don&apos;t have permission to view this dashboard.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const statTiles = [
    {
      key: "total",
      label: "Total Reports",
      value: incidents.length,
      icon: "document-text-outline" as const,
      color: "#007AFF",
      route: "/admin/incidents",
    },
    ...INCIDENT_STATUSES.map((s) => ({
      key: s.key,
      label: s.label,
      value: statusCounts[s.key as keyof typeof statusCounts],
      icon: s.icon,
      color: s.color,
      route: `/admin/incidents?status=${s.key}`,
    })),
    {
      key: "citizens",
      label: "Citizens",
      value: userCounts.user,
      icon: "people-outline" as const,
      color: "#5856D6",
      filter: "user" as const,
    },
    {
      key: "admins",
      label: "Admins",
      value: userCounts.admin,
      icon: "shield-checkmark-outline" as const,
      color: "#AF52DE",
      filter: "admin" as const,
    },
  ];

  const renderUser = (item: AppUser) => {
    const meta = roleMeta(item.role);
    const isSelf = item.id === user?.uid;
    const isEditing = editingUid === item.id;
    const initial = (item.displayName || item.email || "?")
      .charAt(0)
      .toUpperCase();

    return (
      <View key={item.id} style={styles.userRow}>
        <View style={styles.userTop}>
          <View style={[styles.avatar, { backgroundColor: meta.color }]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.displayName || "Unnamed user"}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {item.email} · Joined {formatDate(item.createdAt)}
            </Text>
          </View>
          <View style={[styles.rolePill, { backgroundColor: meta.color }]}>
            <Text style={styles.rolePillText}>
              {item.role === "admin" && item.agency
                ? `${item.agency} ADMIN`
                : meta.label.toUpperCase()}
            </Text>
          </View>
          {isSelf ? (
            <Text style={styles.youText}>You</Text>
          ) : (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() =>
                isEditing ? cancelEditing() : startEditing(item)
              }
              accessibilityLabel={`Change role for ${item.displayName || item.email}`}
            >
              <Ionicons
                name={isEditing ? "close-outline" : "create-outline"}
                size={20}
                color="#007AFF"
              />
            </TouchableOpacity>
          )}
        </View>

        {isEditing && (
          <View style={styles.editor}>
            <Text style={styles.editorLabel}>ROLE</Text>
            <View style={styles.chipRow}>
              {ROLE_OPTIONS.map((option) => {
                const active = draftRole === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setDraftRole(option.key)}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {draftRole === "admin" && (
              <>
                <Text style={styles.editorLabel}>AGENCY</Text>
                <View style={styles.chipRow}>
                  {AGENCIES.map((agency) => {
                    const active = draftAgency === agency;
                    return (
                      <TouchableOpacity
                        key={agency}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setDraftAgency(agency)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            active && styles.chipTextActive,
                          ]}
                        >
                          {agency}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            <View style={styles.editorActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={cancelEditing}
                disabled={saving}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, saving && { opacity: 0.7 }]}
                onPress={() => saveRole(item)}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.welcomeText}>
                Welcome back,{"\n"}
                {userRole?.displayName?.split(" ")[0] || "Super Admin"}
              </Text>
              <Text style={styles.welcomeSubtext}>
                System-wide overview of every agency
              </Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>SUPER ADMIN</Text>
            </View>
          </View>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        {loadError && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={18} color="#FF3B30" />
            <Text style={styles.errorText}>{loadError}</Text>
          </View>
        )}

        {loading ? (
          <View style={[styles.center, { paddingTop: 60 }]}>
            <ActivityIndicator color="#007AFF" />
          </View>
        ) : (
          <>
            {/* KPI tiles */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>
                Overview
              </Text>
              <View style={styles.statsGrid}>
                {statTiles.map((tile) => (
                  <TouchableOpacity
                    key={tile.key}
                    style={styles.statTile}
                    activeOpacity={0.7}
                    onPress={() => {
                      if ("route" in tile && tile.route) {
                        router.push(tile.route as any);
                      } else if ("filter" in tile && tile.filter) {
                        setRoleFilter(tile.filter);
                        setVisibleUsers(USERS_PAGE_SIZE);
                      }
                    }}
                  >
                    <View
                      style={[
                        styles.statIcon,
                        { backgroundColor: `${tile.color}22` },
                      ]}
                    >
                      <Ionicons name={tile.icon} size={17} color={tile.color} />
                    </View>
                    <Text style={styles.statValue}>{tile.value}</Text>
                    <Text style={styles.statLabel}>{tile.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Quick actions */}
            <View style={styles.section}>
              <View style={styles.card}>
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push("/admin/incidents")}
                  >
                    <Ionicons
                      name="file-tray-full-outline"
                      size={22}
                      color="#007AFF"
                    />
                    <Text style={styles.actionLabel}>All Incidents</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() =>
                      router.push("/admin/incidents?status=pending" as any)
                    }
                  >
                    <Ionicons name="time-outline" size={22} color="#FF3B30" />
                    <Text style={styles.actionLabel}>Pending Queue</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => router.push("/admin/reports")}
                  >
                    <Ionicons
                      name="bar-chart-outline"
                      size={22}
                      color="#34C759"
                    />
                    <Text style={styles.actionLabel}>Reports</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Charts */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>
                Incident Activity
              </Text>
              <View style={styles.card}>
                <Text style={styles.subsectionTitle}>
                  All agencies - last {TREND_DAYS} days
                </Text>
                <IncidentTrendChart data={trendData} isDark={isDark} />
                <View style={styles.divider} />
                <Text style={styles.subsectionTitle}>By status</Text>
                <IncidentStatusChart data={statusData} isDark={isDark} />
              </View>
            </View>

            {/* Agency performance */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>
                Agency Performance
              </Text>
              <View style={[styles.card, { paddingVertical: 4 }]}>
                {agencyStats.map((stat, index) => (
                  <View
                    key={stat.agency}
                    style={[
                      styles.agencyRow,
                      index === agencyStats.length - 1 && {
                        borderBottomWidth: 0,
                      },
                    ]}
                  >
                    <View style={styles.agencyTop}>
                      <View
                        style={[
                          styles.agencyDot,
                          { backgroundColor: AGENCY_COLORS[stat.agency] },
                        ]}
                      />
                      <Text style={styles.agencyName}>{stat.agency}</Text>
                      <Text style={styles.agencyTotal}>{stat.total}</Text>
                    </View>
                    <Text style={styles.agencyFullName} numberOfLines={1}>
                      {AGENCY_LABELS[stat.agency]}
                    </Text>
                    <View style={styles.agencyMeta}>
                      <Text style={styles.agencyMetaText}>
                        {stat.pending} pending
                      </Text>
                      <Text style={styles.agencyMetaText}>
                        {Math.round(stat.resolvedRate * 100)}% resolved
                      </Text>
                      {stat.admins > 0 ? (
                        <Text style={styles.agencyMetaText}>
                          {stat.admins} admin{stat.admins === 1 ? "" : "s"}
                        </Text>
                      ) : (
                        <View style={styles.noAdminPill}>
                          <Ionicons
                            name="alert-circle-outline"
                            size={12}
                            color="#FF9500"
                          />
                          <Text style={styles.noAdminText}>No admin</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${stat.resolvedRate * 100}%` },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Recent incidents */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Reports</Text>
                <TouchableOpacity
                  onPress={() => router.push("/admin/incidents")}
                >
                  <Text style={styles.sectionLink}>View all</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.card, { paddingVertical: 4 }]}>
                {recentIncidents.length === 0 ? (
                  <Text style={styles.emptyText}>No reports yet</Text>
                ) : (
                  recentIncidents.map((incident, index) => {
                    const status = statusMeta(incident.status);
                    return (
                      <TouchableOpacity
                        key={incident.id}
                        style={[
                          styles.incidentRow,
                          index === recentIncidents.length - 1 && {
                            borderBottomWidth: 0,
                          },
                        ]}
                        onPress={() =>
                          router.push({
                            pathname: "/admin/incident-detail",
                            params: { id: incident.id },
                          } as any)
                        }
                      >
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: status.color },
                          ]}
                        />
                        <View style={styles.incidentInfo}>
                          <Text style={styles.incidentTitle} numberOfLines={1}>
                            {incident.location || "Unknown location"}
                          </Text>
                        </View>
                        {incident.involvedAgency && (
                          <View
                            style={[
                              styles.agencyPill,
                              {
                                backgroundColor:
                                  AGENCY_COLORS[incident.involvedAgency] ??
                                  "#8E8E93",
                              },
                            ]}
                          >
                            <Text style={styles.rolePillText}>
                              {incident.involvedAgency}
                            </Text>
                          </View>
                        )}
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={muted}
                        />
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </View>

            {/* User management */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>
                User Management
              </Text>
              <View style={styles.card}>
                <View style={styles.searchBox}>
                  <Ionicons name="search-outline" size={18} color={muted} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name or email"
                    placeholderTextColor={muted}
                    value={search}
                    onChangeText={(value) => {
                      setSearch(value);
                      setVisibleUsers(USERS_PAGE_SIZE);
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch("")}>
                      <Ionicons name="close-circle" size={18} color={muted} />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.chipRow}>
                  {ROLE_FILTERS.map((filter) => {
                    const active = roleFilter === filter.key;
                    return (
                      <TouchableOpacity
                        key={filter.key}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => {
                          setRoleFilter(filter.key);
                          setVisibleUsers(USERS_PAGE_SIZE);
                        }}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            active && styles.chipTextActive,
                          ]}
                        >
                          {filter.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {filteredUsers.length === 0 ? (
                  <Text style={styles.emptyText}>No users match</Text>
                ) : (
                  filteredUsers.slice(0, visibleUsers).map(renderUser)
                )}

                {filteredUsers.length > visibleUsers && (
                  <TouchableOpacity
                    style={styles.showMore}
                    onPress={() =>
                      setVisibleUsers((count) => count + USERS_PAGE_SIZE)
                    }
                  >
                    <Text style={styles.sectionLink}>
                      Show more ({filteredUsers.length - visibleUsers} left)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
