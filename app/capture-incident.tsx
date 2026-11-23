import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    Linking,
    Modal,
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
import { isEmailJsConfigured, sendAgencyEmail } from "../config/agencyEmail";
import { HAS_BACKEND, postToBackend } from "../config/api";
import { db } from "../config/firebase";
import { AGENCIES, type Agency } from "../constants/agencies";
import { INCIDENT_CATEGORIES } from "../constants/incidentCategories";
import { INJURY_LEVELS } from "../constants/injuryLevels";
import { useAuth } from "../contexts/AuthContext";
import { subscribeToActiveAgencies } from "../services/firestoreService";
import { showAlert } from "../utils/crossPlatformAlert";
import { copyVideoToCache, resolveLocalFile } from "../utils/localVideoFile";
import {
  deleteIncidentVideo,
  MAX_VIDEO_BYTES,
  saveIncidentVideo,
  videoTooLargeMessage,
} from "../utils/videoStore";

// Each option row is ~48px (14px padding top/bottom + text + divider). Capping
// the list at 4.5 rows makes it scroll as soon as there are more than four
// options, and the half-cut last row signals that there is more below.
const DROPDOWN_ROW_HEIGHT = 48;
const DROPDOWN_VISIBLE_ROWS = 4.5;

type DropdownFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  onSelect: (value: string) => void;
  isDark: boolean;
  /** Options listed but greyed out and not selectable, with a reason shown. */
  disabledOptions?: Record<string, string>;
};

function DropdownField({
  label,
  value,
  placeholder,
  options,
  onSelect,
  isDark,
  disabledOptions = {},
}: DropdownFieldProps) {
  const [visible, setVisible] = useState(false);

  const styles = StyleSheet.create({
    inputGroup: {
      marginBottom: 10,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
      marginBottom: 4,
    },
    dropdownButton: {
      backgroundColor: isDark ? "#3a3a3a" : "#fff",
      borderWidth: 1,
      borderColor: isDark ? "#4a4a4a" : "#dee2e6",
      borderRadius: 6,
      padding: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    dropdownButtonText: {
      fontSize: 14,
      color: value ? (isDark ? "#fff" : "#000") : isDark ? "#888" : "#999",
      flex: 1,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      backgroundColor: isDark ? "#1a1a1a" : "#fff",
      borderRadius: 12,
      width: "90%",
      maxHeight: "70%",
      padding: 20,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#333" : "#eee",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: isDark ? "#fff" : "#000",
    },
    closeButton: {
      fontSize: 24,
      color: isDark ? "#fff" : "#000",
      fontWeight: "bold",
    },
    optionsList: {
      // A fixed pixel cap rather than relying on the container's 70% maxHeight:
      // a ScrollView sizes to its content, so a short list never overflowed
      // that percentage and never scrolled. flexShrink still keeps it inside
      // the modal on very small screens.
      maxHeight: DROPDOWN_ROW_HEIGHT * DROPDOWN_VISIBLE_ROWS,
      flexShrink: 1,
    },
    optionItem: {
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#2a2a2a" : "#f0f0f0",
    },
    optionText: {
      fontSize: 14,
      color: isDark ? "#fff" : "#000",
    },
    selectedOptionText: {
      color: "#007AFF",
      fontWeight: "600",
    },
    optionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    disabledOptionText: {
      color: isDark ? "#555" : "#bbb",
    },
    disabledHint: {
      fontSize: 12,
      color: isDark ? "#666" : "#999",
      fontStyle: "italic",
    },
  });

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setVisible(true)}
      >
        <Text style={styles.dropdownButtonText}>{value || placeholder}</Text>
        <Ionicons
          name="chevron-down"
          size={16}
          color={isDark ? "#888" : "#666"}
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={styles.closeButton}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.optionsList}
              showsVerticalScrollIndicator
              persistentScrollbar
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {options.map((option) => {
                const disabledReason = disabledOptions[option];
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.optionItem, styles.optionRow]}
                    disabled={Boolean(disabledReason)}
                    onPress={() => {
                      onSelect(option);
                      setVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        value === option && styles.selectedOptionText,
                        disabledReason ? styles.disabledOptionText : null,
                      ]}
                    >
                      {option}
                    </Text>
                    {disabledReason ? (
                      <Text style={styles.disabledHint}>{disabledReason}</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function CaptureIncidentScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const [video, setVideo] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [submittingAgency, setSubmittingAgency] = useState<Agency | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  const [activeAgencies, setActiveAgencies] = useState<Agency[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<Agency | "">("");
  const [category, setCategory] = useState("");
  // Free-text description typed by the reporter when the incident is "Other".
  const [otherCategory, setOtherCategory] = useState("");
  const isOtherCategory = category === "Other";
  const [injuryLevel, setInjuryLevel] = useState("");

  useEffect(() => {
    // Firebase Auth restores the session asynchronously on app start, so
    // wait for a signed-in user before querying - the agencies read rule
    // requires request.auth != null and would otherwise silently fail here
    // before the session finishes loading.
    if (!user) return;
    // Live listener, so an agency whose first admin was just added appears
    // here right away (and one whose last admin was removed disappears).
    return subscribeToActiveAgencies((agencies) => {
      setActiveAgencies(agencies);
      setSelectedAgency((current) =>
        current && !agencies.includes(current) ? "" : current,
      );
    });
  }, [user]);

  useEffect(() => {
    if (params.videoUri) {
      setVideo(params.videoUri as string);
    }
  }, [params.videoUri]);

  // The recorded video's URI arrives via router params, which can decode it,
  // and in Expo Go the app's folder name itself contains "%" characters
  // ("%40anonymous%2F..."), so the exact spelling the player needs varies.
  // Try the resolved file first, then the other spellings, moving on
  // whenever the player reports it can't load one.
  const videoCandidates = useMemo(() => {
    if (!video) return [];
    if (Platform.OS === "web") return [video];
    const candidates = [
      resolveLocalFile(video)?.uri,
      video,
      video.replace(/%/g, "%25"),
    ];
    try {
      candidates.push(decodeURI(video));
    } catch {
      // Not valid percent-encoding - skip that spelling.
    }
    return [...new Set(candidates.filter((c): c is string => !!c))];
  }, [video]);
  // Keyed by video so a new recording/upload starts again from the first
  // candidate without resetting state in an effect.
  const [failedAttempts, setFailedAttempts] = useState<{
    video: string | null;
    count: number;
    error?: string;
  }>({ video: null, count: 0 });
  const attemptIndex =
    failedAttempts.video === video ? failedAttempts.count : 0;
  const playableVideo = videoCandidates[attemptIndex] ?? null;
  const videoLoadError =
    video && failedAttempts.video === video && !playableVideo
      ? failedAttempts.error
      : undefined;

  const videoPlayer = useVideoPlayer(playableVideo, (player) => {
    player.loop = false;
  });

  useEffect(() => {
    if (!playableVideo) return;
    console.log("Video preview trying:", playableVideo);
    const startMutedPreview = () => {
      videoPlayer.muted = true;
      videoPlayer.play();
    };
    if (videoPlayer.status === "readyToPlay") {
      startMutedPreview();
    }
    const statusSub = videoPlayer.addListener(
      "statusChange",
      ({ status, error }) => {
        if (status === "readyToPlay") {
          console.log("Video preview loaded:", playableVideo);
          startMutedPreview();
        } else if (status === "error") {
          console.warn("Video preview failed:", playableVideo, error?.message);
          setFailedAttempts({
            video,
            count: attemptIndex + 1,
            error: `${error?.message ?? "Unknown error"}\n${video}`,
          });
        }
      },
    );
    return () => statusSub.remove();
  }, [videoPlayer, playableVideo, video, attemptIndex]);

  // Once a clip finishes, the player sits at the end and the native play
  // button doesn't reliably restart it (notably on Android), so show our own
  // Replay button that rewinds and plays from the start.
  // Tracks which player finished, so a new recording/upload (which creates a
  // new player) automatically starts without the Replay overlay.
  const [endedPlayer, setEndedPlayer] = useState<typeof videoPlayer | null>(
    null,
  );
  const videoEnded = endedPlayer === videoPlayer;
  useEffect(() => {
    const endSub = videoPlayer.addListener("playToEnd", () => {
      setEndedPlayer(videoPlayer);
    });
    const playingSub = videoPlayer.addListener(
      "playingChange",
      ({ isPlaying }) => {
        if (isPlaying) setEndedPlayer(null);
      },
    );
    return () => {
      endSub.remove();
      playingSub.remove();
    };
  }, [videoPlayer]);

  const replayVideo = () => {
    setEndedPlayer(null);
    videoPlayer.replay();
  };

  const styles = StyleSheet.create({
    replayOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 200,
      borderRadius: 8,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      alignItems: "center",
    },
    replayText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
      marginTop: 4,
    },
    otherInputGroup: {
      marginBottom: 10,
    },
    otherLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
      marginBottom: 4,
    },
    otherInput: {
      backgroundColor: isDark ? "#3a3a3a" : "#fff",
      borderWidth: 1,
      borderColor: isDark ? "#4a4a4a" : "#dee2e6",
      borderRadius: 6,
      padding: 12,
      fontSize: 14,
      color: isDark ? "#fff" : "#000",
      minHeight: 80,
      textAlignVertical: "top",
    },
    container: {
      flex: 1,
      backgroundColor: isDark ? "#000" : "#fff",
    },
    header: {
      padding: 10,
      paddingTop: 30,
      backgroundColor: isDark ? "#1a1a1a" : "#f8f9fa",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: isDark ? "#fff" : "#000",
    },
    content: {
      flex: 1,
      padding: 10,
    },
    imageContainer: {
      backgroundColor: isDark ? "#2a2a2a" : "#f8f9fa",
      borderRadius: 8,
      padding: 10,
      marginBottom: 10,
      alignItems: "center",
    },
    placeholderImage: {
      width: "100%",
      height: 200,
      backgroundColor: isDark ? "#3a3a3a" : "#e9ecef",
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    videoWrapper: {
      width: "100%",
    },
    capturedImage: {
      width: "100%",
      height: 200,
      borderRadius: 8,
      marginBottom: 8,
    },
    buttonContainer: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 4,
    },
    button: {
      flex: 1,
      backgroundColor: "#007AFF",
      padding: 10,
      borderRadius: 6,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
    },
    cancelButton: {
      backgroundColor: isDark ? "#3a3a3a" : "#e9ecef",
    },
    buttonText: {
      color: "#fff",
      fontSize: 12,
      fontWeight: "600",
    },
    cancelButtonText: {
      color: isDark ? "#fff" : "#000",
    },
    uploadButton: {
      backgroundColor: "#34C759",
      padding: 10,
      borderRadius: 6,
      alignItems: "center",
      marginBottom: 24,
    },
    uploadButtonDisabled: {
      backgroundColor: isDark ? "#3a3a3a" : "#e9ecef",
    },
    uploadButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
    },
    agencySubmitButtonText: {
      fontSize: 12,
      textAlign: "center",
    },
    agencySubmitRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 24,
    },
    agencySubmitButton: {
      flex: 1,
      marginBottom: 0,
    },
    placeholderText: {
      color: isDark ? "#888" : "#666",
      textAlign: "center",
    },
    locationSection: {
      marginBottom: 10,
    },
    locationLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#fff" : "#000",
      marginBottom: 4,
    },
    locationButton: {
      backgroundColor: "#007AFF",
      padding: 12,
      borderRadius: 6,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    locationButtonDisabled: {
      opacity: 0.7,
    },
    locationButtonText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600",
    },
    locationResult: {
      marginTop: 8,
      backgroundColor: isDark ? "#3a3a3a" : "#f8f9fa",
      borderWidth: 1,
      borderColor: isDark ? "#4a4a4a" : "#dee2e6",
      borderRadius: 6,
      padding: 10,
    },
    locationResultText: {
      fontSize: 13,
      color: isDark ? "#fff" : "#000",
      lineHeight: 18,
    },
  });

  const uploadVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlert(
        "Permission Required",
        "Media library permission is required to upload videos",
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Caught here rather than after the whole form is filled in.
        const size = asset.fileSize ?? asset.file?.size;
        if (size && size > MAX_VIDEO_BYTES) {
          showAlert("Video Too Large", videoTooLargeMessage(size));
          return;
        }
        const pickedUri = asset.uri;
        // Same stable copy as recorded videos get - see copyVideoToCache.
        if (Platform.OS === "web") {
          setVideo(pickedUri);
        } else {
          try {
            setVideo(await copyVideoToCache(pickedUri));
          } catch (copyError) {
            console.warn(
              "Could not copy picked video, using original:",
              copyError,
            );
            setVideo(pickedUri);
          }
        }
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      showAlert("Error", "Failed to upload video");
    }
  };

  // getCurrentPositionAsync has no built-in timeout, so on a device/emulator
  // that never produces a GPS fix (common on emulators without a mocked
  // location) it can hang indefinitely instead of failing. Race it against a
  // timer so the fallback to the last-known position kicks in promptly.
  const withTimeout = <T,>(
    promise: Promise<T>,
    ms: number,
    timeoutMessage: string,
  ): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), ms);
      }),
    ]).finally(() => clearTimeout(timeoutId));
  };

  const searchMyLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        // On web, once the browser itself reports the permission as denied,
        // JS can't reopen that prompt - the "Search My Location" button will
        // otherwise keep failing silently with no way to recover short of
        // the user finding the browser's own site-permission UI.
        if (Platform.OS === "web" && status === "denied") {
          showAlert(
            "Location Blocked",
            "Your browser has blocked location for this site. Click the lock/site-info icon next to the address bar, set Location to Allow, then reload the page.",
          );
        } else {
          showAlert(
            "Location Required",
            "Please turn on location and allow access so we can find your current position.",
          );
        }
        return;
      }

      let servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled && Platform.OS === "android") {
        // Show the one-tap system "Turn on location?" dialog first.
        try {
          await Location.enableNetworkProviderAsync();
        } catch {
          // Declined - fall through to the alert below.
        }
        servicesEnabled = await Location.hasServicesEnabledAsync();
      }
      if (!servicesEnabled) {
        showAlert(
          "Location Services Off",
          "Turn on your device location services, then try searching your location again.",
          Platform.OS === "web"
            ? undefined
            : [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Open Settings",
                  onPress: () => Linking.openSettings(),
                },
              ],
        );
        return;
      }

      // 1. A very recent, precise cached fix is as good as a new one for an
      //    incident report - and it's instant, even indoors.
      let position = await Location.getLastKnownPositionAsync({
        maxAge: 2 * 60 * 1000,
        requiredAccuracy: 100,
      });

      // 2. Otherwise ask for a fresh fix. Balanced uses Wi-Fi/cell towers as
      //    well as GPS, so it resolves far sooner than waiting on satellites.
      if (!position) {
        try {
          position = await withTimeout(
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
              mayShowUserSettingsDialog: true,
            }),
            15000,
            "Timed out waiting for a GPS fix",
          );
        } catch (currentLocationError) {
          // 3. Indoors or on a cold GPS start this is expected - fall back to
          //    an older/rougher cached fix rather than failing outright.
          console.log(
            "No fresh location fix yet, using last known location instead",
          );
          position = await Location.getLastKnownPositionAsync({
            maxAge: 30 * 60 * 1000,
            requiredAccuracy: 2000,
          });

          if (!position) {
            throw currentLocationError;
          }
        }
      }

      const { latitude, longitude } = position.coords;
      setCoordinates({ latitude, longitude });

      const fallbackLocationText = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      let locationText = fallbackLocationText;

      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        const parts = [
          address?.name,
          address?.street,
          address?.district,
          address?.city,
          address?.region,
          address?.country,
        ].filter(Boolean);

        locationText =
          parts.length > 0 ? parts.join(", ") : fallbackLocationText;
      } catch (reverseGeocodeError) {
        console.warn(
          "Could not convert coordinates to an address:",
          reverseGeocodeError,
        );
      }

      setLocation(locationText);
    } catch (error) {
      console.warn("Error getting location:", error);
      showAlert(
        "Location Unavailable",
        "Could not get your current location. Move near a window or outdoors, make sure GPS/Wi-Fi is enabled, then try again.",
      );
    } finally {
      setIsLocating(false);
    }
  };

  const canSubmit = Boolean(
    video &&
    injuryLevel &&
    selectedAgency &&
    category &&
    (!isOtherCategory || otherCategory.trim()),
  );
  const isUploading = submittingAgency !== null;
  // The button's `disabled` only applies after a re-render, so a quick double
  // tap could otherwise start two uploads and file the same report twice.
  const submitInFlight = useRef(false);

  // Reads the recorded or picked video and saves it in Firestore (see
  // utils/videoStore), returning the videoUrl to store on the incident.
  const uploadVideoToStorage = async (
    localUri: string,
    incidentId: string,
    ownerId: string,
  ): Promise<string> => {
    let bytes: Uint8Array;
    let mimeType: string;

    if (Platform.OS === "web") {
      const response = await fetch(localUri);
      if (!response.ok) {
        throw new Error(
          `Unable to read the local video file (${response.status}).`,
        );
      }
      const blob = await response.blob();
      if (blob.size > MAX_VIDEO_BYTES) {
        throw new Error(videoTooLargeMessage(blob.size));
      }
      bytes = new Uint8Array(await blob.arrayBuffer());
      mimeType = blob.type || "video/mp4";
    } else {
      const file = resolveLocalFile(localUri);
      if (!file) {
        throw new Error(
          "The video file is no longer on this phone. Record or choose the video again.",
        );
      }
      // Checked before reading it all into memory.
      if (file.size > MAX_VIDEO_BYTES) {
        throw new Error(videoTooLargeMessage(file.size));
      }
      bytes = await file.bytes();
      mimeType = file.type || "video/mp4";
    }

    setUploadProgress(0);
    return saveIncidentVideo(
      incidentId,
      ownerId,
      bytes,
      mimeType,
      setUploadProgress,
    );
  };

  const uploadIncident = async () => {
    if (!canSubmit) {
      const missingFields = [
        !video ? "video" : null,
        !injuryLevel ? "injury level" : null,
        !selectedAgency ? "agency" : null,
        !category ? "incident" : null,
        isOtherCategory && !otherCategory.trim()
          ? "incident description"
          : null,
      ].filter(Boolean);

      showAlert(
        "Complete Required Fields",
        `Please add: ${missingFields.join(", ")}.`,
      );
      return;
    }

    if (!user) {
      showAlert("Error", "User not authenticated");
      return;
    }

    if (!video) {
      showAlert("Complete Required Fields", "Please add: video.");
      return;
    }

    if (!selectedAgency) {
      showAlert("Complete Required Fields", "Please select an agency.");
      return;
    }

    if (submitInFlight.current) return;
    submitInFlight.current = true;

    const agency = selectedAgency;
    setSubmittingAgency(agency);
    setUploadProgress(0);
    try {
      const incidentId = `${user.uid}_${Date.now()}`;
      const videoUrl = await uploadVideoToStorage(video, incidentId, user.uid);

      const incidentData = {
        id: incidentId,
        userId: user.uid,
        userEmail: user.email ?? "",
        videoUrl,
        involvedAgency: agency,
        category,
        // Category stays "Other" so admin filters still group it; the typed
        // text goes in `description`, which the admin screens already show.
        ...(isOtherCategory ? { description: otherCategory.trim() } : {}),
        injuryLevel,
        location: location.trim(),
        coordinates,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        await setDoc(doc(db, "incidents", incidentId), incidentData);
      } catch (saveError) {
        // A retry uploads the video again under a new ID, so don't leave this
        // copy taking up the free storage.
        await deleteIncidentVideo(incidentId).catch(() => {});
        throw saveError;
      }

      // Email the selected agency: through EmailJS when it's set up, else the
      // dev machine's backend. Best-effort - shouldn't block a successful
      // report; admins also see it in their dashboard.
      try {
        if (isEmailJsConfigured) {
          await sendAgencyEmail(agency, incidentData);
        } else if (HAS_BACKEND) {
          await postToBackend("/notify-agency", { agency, incidentData });
        }
      } catch (notifyError) {
        console.warn("Notification server unavailable:", notifyError);
        // Don't block success - email notification is best-effort
      }

      showAlert(
        "Success",
        `Incident report submitted to ${agency} successfully!`,
      );
      router.back();
    } catch (error: unknown) {
      console.error("Error uploading incident:", error);

      const errorCode =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code?: string }).code)
          : "";
      const errorMessage = error instanceof Error ? `\n${error.message}` : "";

      showAlert(
        "Upload failed",
        `We couldn't submit the incident report.${errorMessage}${errorCode ? `\n(${errorCode})` : ""}`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Retry", onPress: () => uploadIncident() },
        ],
      );
    } finally {
      submitInFlight.current = false;
      setSubmittingAgency(null);
      setUploadProgress(0);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>REPORT THE INCIDENT</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          {video && videoLoadError ? (
            <View style={styles.placeholderImage}>
              <Ionicons name="alert-circle" size={40} color="#FF3B30" />
              <Text style={styles.placeholderText}>
                {"Couldn't load the video preview:\n" + videoLoadError}
              </Text>
            </View>
          ) : video ? (
            // Full width: imageContainer centres its children, so without an
            // explicit width this wrapper shrinks to its content and the
            // VideoView's width: "100%" resolves to 0 - an empty dark box.
            <View style={styles.videoWrapper}>
              {/* textureView: the default SurfaceView renders black or stops
                  redrawing inside a ScrollView / rounded container on Android. */}
              <VideoView
                player={videoPlayer}
                style={styles.capturedImage}
                nativeControls
                contentFit="cover"
                surfaceType="textureView"
              />
              {videoEnded ? (
                <TouchableOpacity
                  style={styles.replayOverlay}
                  onPress={replayVideo}
                  accessibilityLabel="Replay video"
                >
                  <Ionicons name="refresh" size={36} color="#fff" />
                  <Text style={styles.replayText}>Replay</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons
                name="videocam"
                size={48}
                color={isDark ? "#888" : "#666"}
              />
              <Text style={styles.placeholderText}>No video recorded</Text>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={uploadVideo}>
            <Ionicons
              name="film"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.buttonText}>Upload Video</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push("/realtime-camera")}
          >
            <Ionicons
              name="videocam"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.buttonText}>Record Video</Text>
          </TouchableOpacity>
          {video && (
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setVideo(null)}
            >
              <Ionicons
                name="trash"
                size={20}
                color={isDark ? "#fff" : "#000"}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.buttonText, styles.cancelButtonText]}>
                Clear
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.locationSection}>
          <Text style={styles.locationLabel}>Location</Text>
          <TouchableOpacity
            style={[
              styles.locationButton,
              isLocating && styles.locationButtonDisabled,
            ]}
            onPress={searchMyLocation}
            disabled={isLocating}
          >
            <Ionicons name="locate" size={18} color="#fff" />
            <Text style={styles.locationButtonText}>
              {isLocating ? "Locating..." : "Search My Location"}
            </Text>
          </TouchableOpacity>
          {location ? (
            <View style={styles.locationResult}>
              <Text style={styles.locationResultText}>{location}</Text>
            </View>
          ) : null}
        </View>

        <DropdownField
          label="Injury Level"
          value={injuryLevel}
          placeholder="Select injury level..."
          options={[...INJURY_LEVELS]}
          onSelect={setInjuryLevel}
          isDark={isDark}
        />

        {/* Every agency is listed so citizens can see who exists; ones with no
            admin watching the inbox yet are greyed out and can't be picked. */}
        <DropdownField
          label="Agency"
          value={selectedAgency}
          placeholder="Select an agency..."
          options={[...AGENCIES]}
          disabledOptions={Object.fromEntries(
            AGENCIES.filter((agency) => !activeAgencies.includes(agency)).map(
              (agency) => [agency, "No admin yet"],
            ),
          )}
          onSelect={(value) => {
            // Incident types belong to an agency, so switching agencies
            // clears whatever was picked from the previous agency's list.
            if (value !== selectedAgency) {
              setCategory("");
              setOtherCategory("");
            }
            setSelectedAgency(value as Agency);
          }}
          isDark={isDark}
        />

        {selectedAgency ? (
          <DropdownField
            label="Incident"
            value={category}
            placeholder="Select the incident..."
            options={[...INCIDENT_CATEGORIES[selectedAgency]]}
            onSelect={setCategory}
            isDark={isDark}
          />
        ) : null}

        {selectedAgency && isOtherCategory ? (
          <View style={styles.otherInputGroup}>
            <Text style={styles.otherLabel}>Describe the incident</Text>
            <TextInput
              style={styles.otherInput}
              value={otherCategory}
              onChangeText={setOtherCategory}
              placeholder="Type what happened..."
              placeholderTextColor={isDark ? "#888" : "#999"}
              multiline
              maxLength={200}
            />
          </View>
        ) : null}

        {activeAgencies.length > 0 ? (
          <>
            <View style={styles.agencySubmitRow}>
              <TouchableOpacity
                style={[
                  styles.uploadButton,
                  styles.agencySubmitButton,
                  (!canSubmit || isUploading) && styles.uploadButtonDisabled,
                ]}
                onPress={uploadIncident}
                disabled={isUploading}
              >
                <Text
                  style={[
                    styles.uploadButtonText,
                    styles.agencySubmitButtonText,
                  ]}
                >
                  {isUploading
                    ? uploadProgress < 100
                      ? `Uploading ${uploadProgress}%...`
                      : "Submitting..."
                    : "Submit Report"}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={styles.placeholderText}>
            No agencies are currently accepting reports. Please try again later.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
