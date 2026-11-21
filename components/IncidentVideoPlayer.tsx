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
import { isStoredVideoUrl, useStoredVideoUri } from "../utils/videoStore";

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
        style={styles.video}
        contentFit={contentFit ?? "contain"}
        nativeControls
        // Admins reviewing evidence need to see portrait phone videos big.
        fullscreenOptions={{ enable: true }}
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

function VideoErrorView({
  style,
  message,
  onRetry,
}: {
  style: StyleProp<ViewStyle>;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={[style, styles.errorContainer]}>
      <Ionicons name="videocam-off-outline" size={32} color="#fff" />
      <Text style={styles.errorText}>{message}</Text>
      {onRetry ? (
        <TouchableOpacity
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry video playback"
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// A video saved in Firestore (see utils/videoStore): downloaded first, then
// played from the local copy.
function StoredVideoPlayer({ uri, style, contentFit }: IncidentVideoPlayerProps) {
  const { uri: playableUri, error, retry } = useStoredVideoUri(uri);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const message = error ?? playbackError;
  if (message) {
    return (
      <VideoErrorView
        style={style}
        message={message}
        onRetry={() => {
          setPlaybackError(null);
          retry();
        }}
      />
    );
  }
  if (!playableUri) {
    return (
      <View style={[style, styles.errorContainer]}>
        <ActivityIndicator color="#fff" />
        <Text style={styles.errorText}>Loading video…</Text>
      </View>
    );
  }
  return (
    <VideoSourcePlayer
      key={playableUri}
      uri={playableUri}
      style={style}
      contentFit={contentFit}
      onError={setPlaybackError}
    />
  );
}

export function IncidentVideoPlayer(props: IncidentVideoPlayerProps) {
  return isStoredVideoUrl(props.uri) ? (
    <StoredVideoPlayer {...props} />
  ) : (
    <UrlVideoPlayer {...props} />
  );
}

// A video at a plain URL (reports from before Firestore storage), tried at
// each address the backend might be reachable on.
function UrlVideoPlayer({ uri, style, contentFit }: IncidentVideoPlayerProps) {
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
    <VideoErrorView
      style={style}
      message={
        allSourcesFailed
          ? failedSource.message
          : "No playable video URL is available."
      }
      onRetry={allSourcesFailed ? () => setFailedSource(null) : undefined}
    />
  );
}

const styles = StyleSheet.create({
  playerContainer: {
    overflow: "hidden",
    backgroundColor: "#000",
  },
  // On the web the style goes straight onto a <video> element, which, unlike
  // a View, ignores top/right/bottom/left and keeps the video's own size: a
  // 720x1280 phone video overflowed the box, so only its top showed and the
  // play controls at its bottom were cut off. Explicit 100% sizes fit it.
  video: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
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
