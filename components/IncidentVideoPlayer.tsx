import { Ionicons } from "@expo/vector-icons";
import {
  useVideoPlayer,
  VideoView,
  type VideoPlayerStatus,
} from "expo-video";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { getIncidentVideoUrlCandidates } from "../utils/incidentVideo";

type IncidentVideoPlayerProps = {
  uri: string;
  style: StyleProp<ViewStyle>;
  contentFit?: "contain" | "cover";
};

const VIDEO_LOAD_TIMEOUT_MS = 20000;

function VideoSourcePlayer({
  uri,
  style,
  contentFit,
  onError,
}: IncidentVideoPlayerProps & { onError: (message: string) => void }) {
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.loop = false;
  });
  const [status, setStatus] = useState<VideoPlayerStatus>(player.status);
  const hasReportedError = useRef(false);

  useEffect(() => {
    const reportError = (message: string) => {
      if (hasReportedError.current) return;
      hasReportedError.current = true;
      onError(message);
    };
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const subscription = player.addListener(
      "statusChange",
      ({ status: nextStatus, error }) => {
        setStatus(nextStatus);
        if (nextStatus === "readyToPlay" || nextStatus === "error") {
          clearTimeout(timeoutId);
        }
        if (nextStatus === "error") {
          reportError(error?.message ?? "The video could not be played.");
        }
      },
    );

    if (player.status === "error") {
      reportError("The video could not be played.");
    } else if (player.status !== "readyToPlay") {
      timeoutId = setTimeout(() => {
        reportError(`Timed out loading video from ${uri}`);
      }, VIDEO_LOAD_TIMEOUT_MS);
    }

    return () => {
      clearTimeout(timeoutId);
      subscription.remove();
    };
  }, [onError, player, uri]);

  return (
    <View style={[style, styles.playerContainer]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit={contentFit ?? "contain"}
        nativeControls
        surfaceType={Platform.OS === "android" ? "textureView" : undefined}
      />
      {status === "loading" ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator color="#fff" />
        </View>
      ) : null}
    </View>
  );
}

export function IncidentVideoPlayer({
  uri,
  style,
  contentFit,
}: IncidentVideoPlayerProps) {
  const candidates = getIncidentVideoUrlCandidates(uri);
  const [failedSource, setFailedSource] = useState<{
    uri: string;
    index: number;
    message: string;
  } | null>(null);
  const attemptIndex = failedSource?.uri === uri ? failedSource.index : 0;
  const source = candidates[attemptIndex];
  const allSourcesFailed =
    failedSource?.uri === uri && failedSource.index >= candidates.length;

  const handleError = useCallback(
    (message: string) => {
      console.warn("Incident video playback failed:", message);
      setFailedSource({
        uri,
        index: attemptIndex + 1,
        message,
      });
    },
    [attemptIndex, uri],
  );

  if (source) {
    return (
      <VideoSourcePlayer
        key={`${uri}:${attemptIndex}`}
        uri={source}
        style={style}
        contentFit={contentFit}
        onError={handleError}
      />
    );
  }

  return (
    <View style={[style, styles.errorContainer]}>
      <Ionicons name="videocam-off-outline" size={32} color="#fff" />
      <Text style={styles.errorText}>
        {allSourcesFailed
          ? failedSource.message
          : "No playable video URL is available."}
      </Text>
      {allSourcesFailed ? (
        <TouchableOpacity
          onPress={() => setFailedSource(null)}
          accessibilityRole="button"
          accessibilityLabel="Retry video playback"
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  playerContainer: {
    overflow: "hidden",
    backgroundColor: "#000",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
    backgroundColor: "#111",
  },
  errorText: {
    color: "#fff",
    textAlign: "center",
  },
  retryText: {
    color: "#60a5fa",
    fontWeight: "600",
  },
});
