import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { showAlert } from "../utils/crossPlatformAlert";

// Web version of the record screen. expo-camera's web build can show a
// preview and take photos but has no video recording (its record() just logs
// "not supported on web"), so this screen talks to the browser directly:
// getUserMedia for the camera/mic stream and MediaRecorder to record it. The
// result is handed back to the report screen as a blob: URL, which the web
// upload path in capture-incident already fetches and sends to the server.

const MAX_RECORDING_SECONDS = 30;

// Prefer MP4 (Chrome 126+, Safari) so the stored file matches its .mp4 name;
// fall back to WebM where MP4 recording isn't available (Firefox).
const MIME_CANDIDATES = [
  "video/mp4;codecs=avc1,mp4a",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type));
}

type CameraState =
  | { status: "starting" }
  | { status: "ready" }
  | { status: "error"; message: string };

export default function RealtimeCameraWebScreen() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [camera, setCamera] = useState<CameraState>({ status: "starting" });
  const [isRecording, setIsRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(MAX_RECORDING_SECONDS);
  const [attempt, setAttempt] = useState(0);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  // (Re)open the camera whenever the facing direction changes or the user
  // retries after a permission error.
  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      setCamera({ status: "starting" });
      stopStream();

      if (!navigator.mediaDevices?.getUserMedia) {
        setCamera({
          status: "error",
          message:
            "This browser can't access the camera. Open the app on http://localhost or over HTTPS in a recent Chrome, Edge, Firefox or Safari.",
        });
        return;
      }
      if (!pickMimeType()) {
        setCamera({
          status: "error",
          message:
            "This browser doesn't support video recording. Use \"Upload Video\" instead, or try a recent Chrome or Edge.",
        });
        return;
      }

      try {
        // facingMode is a preference, not a requirement, so laptops with only
        // a front webcam still get a stream.
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCamera({ status: "ready" });
      } catch (error: any) {
        if (cancelled) return;
        const name = error?.name;
        setCamera({
          status: "error",
          message:
            name === "NotAllowedError" || name === "SecurityError"
              ? "Camera or microphone access was blocked. Click the camera/lock icon in the address bar, allow Camera and Microphone, then tap Try Again."
              : name === "NotFoundError" || name === "OverconstrainedError"
                ? "No camera or microphone was found on this computer."
                : name === "NotReadableError"
                  ? "The camera is being used by another app. Close it and tap Try Again."
                  : `Couldn't start the camera: ${error?.message ?? "unknown error"}`,
        });
      }
    };

    start();
    return () => {
      cancelled = true;
    };
  }, [facing, attempt, stopStream]);

  // Release the camera when leaving the screen.
  useEffect(() => {
    return () => {
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.onstop = null;
        recorderRef.current.stop();
      }
      stopStream();
    };
  }, [stopStream]);

  // Countdown, and stop automatically at the time limit.
  useEffect(() => {
    if (!isRecording) return;
    setSecondsLeft(MAX_RECORDING_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          if (recorderRef.current?.state === "recording") {
            recorderRef.current.stop();
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream || isRecording) return;

    const mimeType = pickMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch (error) {
      console.error("Error creating MediaRecorder:", error);
      showAlert("Error", "This browser couldn't start recording.");
      return;
    }

    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onerror = (event: any) => {
      console.error("Recording error:", event?.error ?? event);
      setIsRecording(false);
      showAlert("Error", "Failed to record video");
    };
    recorder.onstop = () => {
      setIsRecording(false);
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || mimeType || "video/webm",
      });
      chunksRef.current = [];
      if (blob.size === 0) {
        showAlert(
          "Error",
          "The recording didn't produce a video. Please try again.",
        );
        return;
      }
      const videoUri = URL.createObjectURL(blob);
      console.log("Recorded video:", videoUri, blob.type, blob.size);
      stopStream();
      // Same hand-back as the native screen: return to the report form that
      // opened the camera so the details already filled in are kept.
      router.dismissTo({
        pathname: "/capture-incident",
        params: { videoUri },
      });
    };

    recorderRef.current = recorder;
    // Collect data every second so a long recording isn't held in one chunk.
    recorder.start(1000);
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  };

  const toggleFacing = () => {
    setFacing((current) => (current === "environment" ? "user" : "environment"));
  };

  return (
    <View style={styles.container}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          backgroundColor: "#000",
          // Mirror the front camera like a normal selfie preview.
          transform: facing === "user" ? "scaleX(-1)" : undefined,
        }}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} disabled={isRecording}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={isRecording ? "rgba(255,255,255,0.3)" : "#fff"}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record Incident Video</Text>
        <View style={{ width: 24 }} />
      </View>

      {isRecording && (
        <View style={styles.recordingBadge} pointerEvents="none">
          <View style={styles.recordingBadgeInner}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>
              Recording... 0:{String(secondsLeft).padStart(2, "0")}
            </Text>
          </View>
        </View>
      )}

      {camera.status !== "ready" && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>
            {camera.status === "starting"
              ? "Starting camera... allow camera and microphone access if your browser asks."
              : camera.message}
          </Text>
          {camera.status === "error" && (
            <TouchableOpacity
              style={styles.messageButton}
              onPress={() => setAttempt((n) => n + 1)}
            >
              <Text style={styles.messageButtonText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

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
            camera.status !== "ready" && styles.buttonDisabled,
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={camera.status !== "ready"}
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
          onPress={toggleFacing}
          disabled={isRecording}
        >
          <Ionicons name="camera-reverse" size={24} color="#fff" />
          <Text style={styles.buttonText}>Flip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: 20,
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
    top: 72,
    left: 0,
    right: 0,
    alignItems: "center",
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
  messageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    zIndex: 5,
  },
  messageText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    maxWidth: 480,
  },
  messageButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  messageButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 20,
    paddingBottom: 32,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    zIndex: 10,
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
});
