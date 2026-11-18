import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AGENCIES } from "../../constants/agencies";
import { useAuth } from "../../contexts/AuthContext";
import {
  countIncidentsInRange,
  getIncidentsInRange,
} from "../../services/firestoreService";
import { showAlert } from "../../utils/crossPlatformAlert";
import {
  buildReportXlsx,
  buildReportHtml,
  type CountRow,
  exportReportXlsx,
  exportReportPdf,
  formatRange,
  getReportRanges,
  REPORT_PERIODS,
  reportFileName,
  type ReportIncident,
  type ReportPeriodKey,
  summarizeIncidents,
} from "../../utils/incidentReport";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ALL_AGENCIES = "All agencies";

export default function ReportsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { user, userRole, loading: authLoading } = useAuth();
  const isSuperAdmin = userRole?.role === "super_admin";
  const canViewReports = Boolean(
    user && userRole && (isSuperAdmin || userRole.agency),
  );

  const [period, setPeriod] = useState<ReportPeriodKey>("thisMonth");
  // Only a super admin can pick; everyone else is locked to their agency,
  // which the Firestore rules enforce - so the scope has to be in the query.
  const [agencyFilter, setAgencyFilter] = useState<string>(ALL_AGENCIES);
  const scopedAgency = isSuperAdmin
    ? agencyFilter === ALL_AGENCIES
      ? undefined
      : agencyFilter
    : userRole?.agency;
  const requestKey = useMemo(
    () => JSON.stringify([user?.uid ?? null, scopedAgency ?? null, period]),
    [period, scopedAgency, user?.uid],
  );

  const [incidents, setIncidents] = useState<ReportIncident[]>([]);
  const [previousTotal, setPreviousTotal] = useState(0);
  const [loadedRequestKey, setLoadedRequestKey] = useState<string | null>(null);
  const loading =
    authLoading || (canViewReports && loadedRequestKey !== requestKey);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null);

  const ranges = useMemo(() => getReportRanges(period), [period]);

  useEffect(() => {
    // Firestore rules need request.auth populated, and the scope depends on the
    // role, so wait until the session has resolved before querying.
    if (authLoading || !canViewReports) return;

    let cancelled = false;
    const loadReports = async () => {
      try {
        const [current, previous] = await Promise.all([
          getIncidentsInRange(
            ranges.current.start,
            ranges.current.end,
            scopedAgency,
          ),
          countIncidentsInRange(
            ranges.previous.start,
            ranges.previous.end,
            scopedAgency,
          ),
        ]);
        if (cancelled) return;
        if (
          !current.success ||
          !current.data ||
          !previous.success ||
          typeof previous.data !== "number"
        ) {
          const error = !current.success
            ? current.error
            : !previous.success
              ? previous.error
              : new Error("Report query returned incomplete data.");
          console.error("Error loading report data:", error);
          setIncidents([]);
          setPreviousTotal(0);
          setLoadError("Couldn't load reports for this period.");
          return;
        }
        setIncidents(current.data as ReportIncident[]);
        setPreviousTotal(previous.data);
        setLoadError(null);
      } catch (error) {
        if (cancelled) return;
        console.error("Error loading report data:", error);
        setIncidents([]);
        setPreviousTotal(0);
        setLoadError("Couldn't load reports for this period.");
      } finally {
        if (!cancelled) setLoadedRequestKey(requestKey);
      }
    };
    void loadReports();
    // A newer filter selection supersedes an in-flight load.
    return () => {
      cancelled = true;
    };
  }, [
    authLoading,
    canViewReports,
    isSuperAdmin,
    requestKey,
    scopedAgency,
    ranges,
  ]);

  const summary = useMemo(
    () => summarizeIncidents(incidents, previousTotal),
    [incidents, previousTotal],
  );

  const scopeLabel = scopedAgency ?? ALL_AGENCIES;

  const runExport = async (kind: "pdf" | "xlsx") => {
    setExporting(kind);
    try {
      const meta = {
        range: ranges.current,
        previousLabel: ranges.previous.label,
        scope: scopeLabel,
        generatedBy: user?.email ?? "admin",
      };
      if (kind === "pdf") {
        const html = buildReportHtml(incidents, summary, meta);
        await exportReportPdf(html, reportFileName(ranges.current, "pdf"));
      } else {
        await exportReportXlsx(
          buildReportXlsx(incidents, summary, meta),
          reportFileName(ranges.current, "xlsx"),
        );
      }
    } catch (error) {
      console.error(`Error exporting ${kind} report:`, error);
      showAlert(
        "Export failed",
        error instanceof Error ? error.message : "Couldn't create the report.",
      );
    } finally {
      setExporting(null);
    }
  };

  const colors = {
    text: isDark ? "#fff" : "#1a1a2e",
    muted: isDark ? "#888" : "#777",
    card: isDark ? "#1a1a2e" : "#ffffff",
    track: isDark ? "#2a2a3e" : "#eef0f3",
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#0a0a0f" : "#f0f2f5",
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    backButton: {
      padding: 8,
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
    },
    pillRow: {
      gap: 8,
      paddingBottom: 10,
    },
    pill: {
      paddingVertical: 7,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#dde1e6",
    },
    pillActive: {
      backgroundColor: "#007AFF",
      borderColor: "#007AFF",
    },
    pillText: {
      fontSize: 13,
      color: colors.text,
    },
    pillTextActive: {
      color: "#fff",
      fontWeight: "600",
    },
    rangeText: {
      fontSize: 13,
      color: colors.muted,
      marginBottom: 16,
    },
    statsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: 16,
    },
    statCard: {
      width: (SCREEN_WIDTH - 44) / 2,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.1)",
    },
    statIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    statNumber: {
      fontSize: 28,
      fontWeight: "800",
      color: colors.text,
    },
    statLabel: {
      fontSize: 13,
      color: colors.muted,
      marginTop: 2,
    },
    statChange: {
      fontSize: 12,
      fontWeight: "600",
      marginTop: 4,
      color: colors.muted,
    },
    section: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.1)",
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 12,
    },
    barRow: {
      marginBottom: 10,
    },
    barLabelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    barLabel: {
      fontSize: 13,
      color: colors.text,
      flex: 1,
      marginRight: 8,
    },
    barValue: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
    },
    barTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.track,
      overflow: "hidden",
    },
    barFill: {
      height: 8,
      borderRadius: 4,
      backgroundColor: "#007AFF",
    },
    exportRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 4,
    },
    exportButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: "#007AFF",
    },
    exportButtonExcel: {
      backgroundColor: "#34C759",
    },
    exportButtonDisabled: {
      opacity: 0.5,
    },
    exportButtonText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "600",
    },
    centered: {
      paddingVertical: 40,
      alignItems: "center",
    },
    emptyText: {
      fontSize: 14,
      color: colors.muted,
      textAlign: "center",
    },
  });

  const renderPills = (
    options: { key: string; label: string }[],
    selected: string,
    onSelect: (key: string) => void,
  ) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.pillRow}
    >
      {options.map((option) => {
        const active = option.key === selected;
        return (
          <TouchableOpacity
            key={option.key}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => onSelect(option.key)}
          >
            <Text style={[styles.pillText, active && styles.pillTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderBreakdown = (title: string, rows: CountRow[]) => {
    if (rows.length === 0) return null;
    const max = Math.max(...rows.map((r) => r.value), 1);
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {rows.map((row) => (
          <View key={row.label} style={styles.barRow}>
            <View style={styles.barLabelRow}>
              <Text style={styles.barLabel} numberOfLines={1}>
                {row.label}
              </Text>
              <Text style={styles.barValue}>
                {row.value} ·{" "}
                {Math.round((row.value / Math.max(summary.total, 1)) * 100)}%
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { width: `${(row.value / max) * 100}%` },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    );
  };

  const changeText =
    summary.change === null
      ? `None in ${ranges.previous.label}`
      : `${summary.change >= 0 ? "+" : ""}${summary.change}% vs ${ranges.previous.label}`;
  const statusValue = (label: string) =>
    summary.byStatus.find((s) => s.label === label)?.value ?? 0;

  const canExport = !loading && !loadError && exporting === null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reports</Text>
        </View>

        {renderPills(REPORT_PERIODS, period, (key) =>
          setPeriod(key as ReportPeriodKey),
        )}
        {isSuperAdmin &&
          renderPills(
            [ALL_AGENCIES, ...AGENCIES].map((a) => ({ key: a, label: a })),
            agencyFilter,
            setAgencyFilter,
          )}
        <Text style={styles.rangeText}>
          {formatRange(ranges.current)} · {scopeLabel}
        </Text>

        {authLoading || (canViewReports && loading) ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : !user ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Sign in to view reports.</Text>
          </View>
        ) : !canViewReports ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>
              Your account has no agency assigned yet, so there are no reports
              to show.
            </Text>
          </View>
        ) : loadError ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>{loadError}</Text>
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIconWrap,
                    { backgroundColor: "#007AFF20" },
                  ]}
                >
                  <Ionicons name="warning" size={20} color="#007AFF" />
                </View>
                <Text style={styles.statNumber}>{summary.total}</Text>
                <Text style={styles.statLabel}>Total Incidents</Text>
                <Text style={styles.statChange}>{changeText}</Text>
              </View>
              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIconWrap,
                    { backgroundColor: "#34C75920" },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                </View>
                <Text style={styles.statNumber}>{statusValue("Resolved")}</Text>
                <Text style={styles.statLabel}>Resolved</Text>
                <Text style={[styles.statChange, { color: "#34C759" }]}>
                  {summary.resolutionRate}% rate
                </Text>
              </View>
              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIconWrap,
                    { backgroundColor: "#FF950020" },
                  ]}
                >
                  <Ionicons name="time" size={20} color="#FF9500" />
                </View>
                <Text style={styles.statNumber}>
                  {statusValue("In Progress")}
                </Text>
                <Text style={styles.statLabel}>In Progress</Text>
              </View>
              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIconWrap,
                    { backgroundColor: "#FF3B3020" },
                  ]}
                >
                  <Ionicons name="alert-circle" size={20} color="#FF3B30" />
                </View>
                <Text style={styles.statNumber}>{statusValue("Pending")}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>

            {summary.total === 0 ? (
              <View style={[styles.section, styles.centered]}>
                <Text style={styles.emptyText}>
                  No incidents were reported in this period.
                </Text>
              </View>
            ) : (
              <>
                {renderBreakdown("By incident type", summary.byCategory)}
                {renderBreakdown("By injury level", summary.byInjury)}
                {!scopedAgency &&
                  renderBreakdown("By agency", summary.byAgency)}
              </>
            )}

            <View style={styles.exportRow}>
              <TouchableOpacity
                style={[
                  styles.exportButton,
                  !canExport && styles.exportButtonDisabled,
                ]}
                onPress={() => runExport("pdf")}
                disabled={!canExport}
              >
                {exporting === "pdf" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Ionicons name="document-text" size={20} color="#fff" />
                )}
                <Text style={styles.exportButtonText}>Export PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.exportButton,
                  styles.exportButtonExcel,
                  !canExport && styles.exportButtonDisabled,
                ]}
                onPress={() => runExport("xlsx")}
                disabled={!canExport}
              >
                {exporting === "xlsx" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Ionicons name="grid" size={20} color="#fff" />
                )}
                <Text style={styles.exportButtonText}>Export Excel</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
