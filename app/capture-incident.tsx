import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL_CANDIDATES } from "../config/api";
import { db } from "../config/firebase";
import { type Agency } from "../constants/agencies";
import { useAuth } from "../contexts/AuthContext";
import { getActiveAgencies } from "../services/firestoreService";
import { showAlert } from "../utils/crossPlatformAlert";


const INJURY_LEVEL_OPTIONS = [
  "No Injury",
  "Minor (First Aid)",
  "Moderate (Medical Attention)",
  "Serious (Hospitalization)",
  "Critical (Life-threatening)",
  "Fatality",
];

type DropdownFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  onSelect: (value: string) => void;
  isDark: boolean;
};

function DropdownField({
  label,
  value,
  placeholder,
  options,
  onSelect,
  isDark,
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
      // The container caps itself at 70% of the screen, but a ScrollView sizes
      // to its content unless told to shrink - without this the option list
      // overflows the modal and gets clipped instead of scrolling.
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
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {options.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.optionItem}
                  onPress={() => {
                    onSelect(option);
                    setVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      value === option && styles.selectedOptionText,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
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
  const [injuryLevel, setInjuryLevel] = useState("");
  const [location, setLocation] = useState("");
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [submittingAgency, setSubmittingAgency] = useState<Agency | null>(
    null,
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLocating, setIsLocating] = useState(false);
  const [activeAgencies, setActiveAgencies] = useState<Agency[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<Agency | "">("");

  useEffect(() => {
    // Firebase Auth restores the session asynchronously on app start, so
    // wait for a signed-in user before querying - the agencies read rule
    // requires request.auth != null and would otherwise silently fail here
    // before the session finishes loading.
    if (!user) return;
    getActiveAgencies().then(setActiveAgencies);
  }, [user]);

  useEffect(() => {
    if (params.videoUri) {
      setVideo(params.videoUri as string);
    }
  }, [params.videoUri]);

  const videoPlayer = useVideoPlayer(video, (player) => {
    player.loop = false;
  });

  const styles = StyleSheet.create({
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
        setVideo(result.assets[0].uri);
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
  ): Promise<T> =>
    Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(timeoutMessage)), ms),
      ),
    ]);

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

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        showAlert(
          "Location Services Off",
          "Turn on your device location services, then try searching your location again.",
          Platform.OS === "web"
            ? undefined
            : [
                { text: "Cancel", style: "cancel" },
                { text: "Open Settings", onPress: () => Linking.openSettings() },
              ],
        );
        return;
      }

      let position: Location.LocationObject | null = null;

      try {
        position = await withTimeout(
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            mayShowUserSettingsDialog: true,
          }),
          10000,
          "Timed out waiting for a GPS fix",
        );
      } catch (currentLocationError) {
        console.warn(
          "Current location unavailable, trying last known location:",
          currentLocationError,
        );
        position = await Location.getLastKnownPositionAsync({
          maxAge: 10 * 60 * 1000,
          requiredAccuracy: 1000,
        });

        if (!position) {
          throw currentLocationError;
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

  const canSubmit = Boolean(video && injuryLevel && selectedAgency);
  const isUploading = submittingAgency !== null;

  // The captured video only exists as a local file/blob URI on this device.
  // Upload it to our own backend (backend/server.js) so the resulting URL is
  // playable from other devices (e.g. the admin dashboard). There's no single
  // host alias that reliably reaches the dev machine from every run target
  // (physical device vs. standard Android Studio emulator vs. Genymotion vs.
  // iOS simulator/web), so every known candidate is tried in turn instead of
  // betting on one guess. A short per-attempt timeout keeps an unreachable
  // host from stalling the whole upload.
  const uploadVideoToStorage = async (
    localUri: string,
    incidentId: string,
  ): Promise<string> => {
    const formData = new FormData();
    formData.append("incidentId", incidentId);

    if (Platform.OS === "web") {
      const response = await fetch(localUri);
      if (!response.ok) {
        throw new Error(
          `Unable to read the local video file (${response.status}).`,
        );
      }
      const blob = await response.blob();
      formData.append("video", blob, `${incidentId}.mp4`);
    } else {
      // React Native's FormData accepts this {uri,name,type} descriptor and
      // streams the file from disk instead of loading it into JS memory.
      formData.append("video", {
        uri: localUri,
        name: `${incidentId}.mp4`,
        type: "video/mp4",
      } as unknown as Blob);
    }

    let lastError: Error | null = null;

    // A failure is often just bad timing (dev server mid-restart, a brief
    // Wi-Fi hiccup) rather than the backend genuinely being unreachable, so
    // the whole candidate list gets a few passes with a growing pause
    // between them before giving up.
    const MAX_ROUNDS = 3;

    for (let round = 1; round <= MAX_ROUNDS; round += 1) {
      for (const baseUrl of API_BASE_URL_CANDIDATES) {
        const uploadUrl = `${baseUrl}/upload-video`;
        console.log(`Video upload attempt (round ${round}) -> ${uploadUrl}`);
        setUploadProgress(0);

        try {
          const relativePath = await new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", uploadUrl);
            // Longer than the LAN candidates need, since a public tunnel
            // relays the whole video through an extra hop.
            xhr.timeout = 20000;
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                setUploadProgress(
                  Math.round((event.loaded / event.total) * 100),
                );
              }
            };
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const response = JSON.parse(xhr.responseText) as {
                    path: string;
                  };
                  resolve(response.path);
                } catch {
                  reject(new Error("Invalid response from upload server"));
                }
              } else {
                console.error(
                  `Video upload FAILED: ${xhr.status} ${xhr.responseText}`,
                );
                reject(new Error(`Upload failed with status ${xhr.status}`));
              }
            };
            xhr.onerror = () =>
              reject(new Error(`Network error uploading to ${uploadUrl}`));
            xhr.ontimeout = () =>
              reject(new Error(`Timed out uploading to ${uploadUrl}`));
            xhr.send(formData);
          });

          console.log(`Video upload succeeded via ${baseUrl}`);
          return `${baseUrl.replace(/\/api$/, "")}${relativePath}`;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          console.warn(`Upload attempt failed, trying next host:`, lastError.message);
        }
      }

      if (round < MAX_ROUNDS) {
        const delayMs = round * 1500;
        console.warn(
          `All hosts failed on round ${round}, retrying in ${delayMs}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw new Error(
      `Couldn't reach the backend on any known address after ${MAX_ROUNDS} attempts ` +
        `(tried: ${API_BASE_URL_CANDIDATES.join(", ")}). ` +
        `Make sure "npm run server" is running on the dev machine and the device is on the same network.` +
        (lastError ? `\nLast error: ${lastError.message}` : ""),
    );
  };

  const uploadIncident = async () => {
    if (!canSubmit) {
      const missingFields = [
        !video ? "video" : null,
        !injuryLevel ? "injury level" : null,
        !selectedAgency ? "agency" : null,
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

    const agency = selectedAgency;
    setSubmittingAgency(agency);
    setUploadProgress(0);
    try {
      const incidentId = `${user.uid}_${Date.now()}`;
      const videoUrl = await uploadVideoToStorage(video, incidentId);

      const incidentData = {
        id: incidentId,
        userId: user.uid,
        userEmail: user.email ?? "",
        videoUrl,
        injuryLevel,
        involvedAgency: agency,
        location: location.trim(),
        coordinates,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "incidents", incidentId), incidentData);

      // Send email notification to the selected agency, reusing whichever
      // backend host the video upload just proved reachable rather than
      // re-guessing. Best-effort - shouldn't block a successful report.
      try {
        const backendOrigin = new URL(videoUrl).origin;
        await fetch(`${backendOrigin}/api/notify-agency`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agency,
            incidentData,
          }),
        });
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
          {video ? (
            <VideoView
              player={videoPlayer}
              style={styles.capturedImage}
              nativeControls
              contentFit="cover"
            />
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
          options={INJURY_LEVEL_OPTIONS}
          onSelect={setInjuryLevel}
          isDark={isDark}
        />

        {activeAgencies.length > 0 ? (
          <>
            <DropdownField
              label="Agency"
              value={selectedAgency}
              placeholder="Select an agency..."
              options={activeAgencies}
              onSelect={(value) => setSelectedAgency(value as Agency)}
              isDark={isDark}
            />

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
            No agencies are currently accepting reports. Please try again
            later.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
