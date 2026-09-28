import { Ionicons } from "@expo/vector-icons";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { showAlert } from "../utils/crossPlatformAlert";
import { copyVideoToCache } from "../utils/localVideoFile";

const MAX_RECORDING_SECONDS = 30;

export default function RealtimeCameraScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] =
    useMicrophonePermissions();
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [torchOn, setTorchOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(MAX_RECORDING_SECONDS);
  const cameraRef = React.useRef<CameraView>(null);

  useEffect(() => {
    if (!isRecording) return;

    setSecondsLeft(MAX_RECORDING_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#000",
    },
    header: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      padding: 20,
      paddingTop: 60,
      backgroundColor: "rgba(0,0,0,0.5)",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      zIndex: 10,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#fff",
    },
    recordingBadge: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      alignItems: "center",
      paddingTop: 110,
      zIndex: 10,
    },
    recordingBadgeInner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(0,0,0,0.6)",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    recordingDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: "#FF3B30",
    },
    recordingText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "600",
    },
    camera: {
      flex: 1,
    },
    buttonContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "rgba(0,0,0,0.7)",
      padding: 20,
      paddingBottom: 40,
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
    },
    button: {
      backgroundColor: "rgba(255,255,255,0.2)",
      padding: 15,
      borderRadius: 50,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonDisabled: {
      opacity: 0.4,
    },
    captureButton: {
      backgroundColor: "#FF3B30",
      width: 70,
      height: 70,
      borderRadius: 35,
    },
    captureButtonRecording: {
      backgroundColor: "#fff",
    },
    captureButtonInner: {
      width: 28,
      height: 28,
      borderRadius: 6,
      backgroundColor: "#FF3B30",
    },
    flipButton: {
      backgroundColor: "rgba(255,255,255,0.3)",
    },
    buttonText: {
      color: "#fff",
      fontSize: 12,
      marginTop: 4,
    },
    permissionContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    permissionText: {
      color: "#fff",
      fontSize: 18,
      textAlign: "center",
      marginBottom: 20,
    },
    permissionButton: {
      backgroundColor: "#007AFF",
      padding: 15,
      borderRadius: 8,
    },
    permissionButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
  });

  if (!permission || !microphonePermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Requesting camera permission...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted || !microphonePermission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            We need your permission to use the camera and microphone to record
            video
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={async () => {
              await requestPermission();
              await requestMicrophonePermission();
            }}
          >
            <Text style={styles.permissionButtonText}>Grant permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.permissionButton,
              { marginTop: 10, backgroundColor: "#666" },
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.permissionButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const toggleCameraFacing = () => {
    setTorchOn(false);
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      setIsRecording(true);
      const video = await cameraRef.current.recordAsync({
        maxDuration: MAX_RECORDING_SECONDS,
      });

      if (!video?.uri) {
        showAlert("Error", "The recording didn't produce a video. Please try again.");
        return;
      }

      console.log("Recorded video:", video.uri);
      // Hand the report screen a stable copy rather than the camera's own
      // temp file, whose Expo Go path can't be read back when submitting.
      let videoUri = video.uri;
      try {
        videoUri = await copyVideoToCache(video.uri);
        console.log("Saved video copy:", videoUri);
      } catch (copyError) {
        console.warn("Could not copy recorded video, using original:", copyError);
      }

      router.replace({
        pathname: "/capture-incident",
        params: { videoUri },
      });
    } catch (error) {
      console.error("Error recording video:", error);
      showAlert("Error", "Failed to record video");
    } finally {
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (!cameraRef.current || !isRecording) return;
    cameraRef.current.stopRecording();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} disabled={isRecording}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={isRecording ? "rgba(255,255,255,0.3)" : "#fff"}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record Incident Video</Text>
        {facing === "back" ? (
          <TouchableOpacity onPress={() => setTorchOn((current) => !current)}>
            <Ionicons
              name={torchOn ? "flash" : "flash-off"}
              size={24}
              color={torchOn ? "#FFD60A" : "#fff"}
            />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {isRecording && (
        <View style={styles.recordingBadge}>
          <View style={styles.recordingBadgeInner}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>
              Recording... 0:{String(secondsLeft).padStart(2, "0")}
            </Text>
          </View>
        </View>
      )}

      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode="video"
        enableTorch={facing === "back" && torchOn}
        videoQuality="720p"
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isRecording && styles.buttonDisabled]}
          onPress={() => router.back()}
          disabled={isRecording}
        >
          <Ionicons name="close" size={24} color="#fff" />
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.captureButton,
            isRecording && styles.captureButtonRecording,
          ]}
          onPress={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? (
            <View style={styles.captureButtonInner} />
          ) : (
            <Ionicons name="videocam" size={30} color="#fff" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.flipButton,
            isRecording && styles.buttonDisabled,
          ]}
          onPress={toggleCameraFacing}
          disabled={isRecording}
        >
          <Ionicons name="camera-reverse" size={24} color="#fff" />
          <Text style={styles.buttonText}>Flip</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
