import { File, Paths } from "expo-file-system";
import {
  Bytes,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { db } from "../config/firebase";

// Incident videos are stored in Firestore itself: Cloud Storage needs the paid
// Blaze plan, and the app runs on the free Spark plan. Each video is a small
// manifest doc, incidentVideos/{incidentId}, plus its bytes split across
// incidentVideos/{incidentId}/chunks/{0..n} - Firestore caps a document at
// 1 MiB. firestore.rules enforces the same sizes and who may read them.
//
// The incident doc's videoUrl points here as "firestore://incidentVideos/<id>".

export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
const CHUNK_BYTES = 1_000_000;
const VIDEO_URL_PREFIX = "firestore://incidentVideos/";

export const isStoredVideoUrl = (url: string) =>
  url.startsWith(VIDEO_URL_PREFIX);

const incidentIdOf = (url: string) => url.slice(VIDEO_URL_PREFIX.length);

export function videoTooLargeMessage(bytes: number): string {
  const mb = (bytes / (1024 * 1024)).toFixed(1);
  return `This video is ${mb} MB, but the limit is ${MAX_VIDEO_BYTES / (1024 * 1024)} MB. Record a shorter video in the app, or choose a smaller one.`;
}

type Manifest = {
  ownerId: string;
  chunkCount: number;
  size: number;
  mimeType: string;
};

// Uploads the video and returns the videoUrl to save on the incident. Must run
// before the incident doc is created: the rules tie the upload to its owner
// through the incident ID ("<uid>_<timestamp>").
export async function saveIncidentVideo(
  incidentId: string,
  ownerId: string,
  bytes: Uint8Array,
  mimeType: string,
  onProgress?: (percent: number) => void,
): Promise<string> {
  if (bytes.length === 0) throw new Error("The video file is empty.");
  if (bytes.length > MAX_VIDEO_BYTES) {
    throw new Error(videoTooLargeMessage(bytes.length));
  }

  const chunkCount = Math.ceil(bytes.length / CHUNK_BYTES);
  let written = 0;
  try {
    for (let index = 0; index < chunkCount; index += 1) {
      const part = bytes.subarray(index * CHUNK_BYTES, (index + 1) * CHUNK_BYTES);
      await setDoc(doc(db, "incidentVideos", incidentId, "chunks", String(index)), {
        index,
        data: Bytes.fromUint8Array(part),
      });
      written = index + 1;
      onProgress?.(Math.round((written / chunkCount) * 100));
    }
    // Written last, so a manifest only ever exists for a complete video.
    await setDoc(doc(db, "incidentVideos", incidentId), {
      ownerId,
      chunkCount,
      size: bytes.length,
      mimeType,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    // Don't leave half a video using up the free storage.
    await Promise.allSettled(
      Array.from({ length: written }, (_, index) =>
        deleteDoc(doc(db, "incidentVideos", incidentId, "chunks", String(index))),
      ),
    );
    throw error;
  }
  return `${VIDEO_URL_PREFIX}${incidentId}`;
}

// Deletes an incident's stored video, if it has one. Must run before the
// incident doc is deleted: an agency admin's permission is checked against
// that incident. Chunk IDs are known (0..n), so they're deleted without
// downloading them first.
export async function deleteIncidentVideo(incidentId: string): Promise<void> {
  const manifestRef = doc(db, "incidentVideos", incidentId);
  const manifest = await getDoc(manifestRef);
  if (!manifest.exists()) return;
  const { chunkCount } = manifest.data() as Manifest;
  await Promise.all(
    Array.from({ length: chunkCount }, (_, index) =>
      deleteDoc(doc(db, "incidentVideos", incidentId, "chunks", String(index))),
    ),
  );
  await deleteDoc(manifestRef);
}

function fileExtension(mimeType: string): string {
  if (mimeType.startsWith("video/webm")) return "webm";
  if (mimeType.startsWith("video/quicktime")) return "mov";
  return "mp4";
}

// Web: blob: URLs already made this session, so reopening a video is free.
const webVideoUrls = new Map<string, string>();

// Downloads a stored video and returns a URI the video player can open: a
// blob: URL on web, a cached file:// on Android/iOS.
async function loadStoredVideo(videoUrl: string): Promise<string> {
  const incidentId = incidentIdOf(videoUrl);
  const cachedWebUrl = webVideoUrls.get(incidentId);
  if (cachedWebUrl) return cachedWebUrl;

  // Always fetched (one small read): it re-checks access, and its size tells
  // whether a cached copy on this phone is complete.
  const manifestSnap = await getDoc(doc(db, "incidentVideos", incidentId));
  if (!manifestSnap.exists()) {
    throw new Error("This video is no longer available.");
  }
  const manifest = manifestSnap.data() as Manifest;

  const cachedFile =
    Platform.OS === "web"
      ? null
      : new File(
          Paths.cache,
          `stored-video-${incidentId}.${fileExtension(manifest.mimeType)}`,
        );
  if (cachedFile?.exists && cachedFile.size === manifest.size) {
    return cachedFile.uri;
  }

  const chunkSnaps = await getDocs(
    collection(db, "incidentVideos", incidentId, "chunks"),
  );
  const chunks = chunkSnaps.docs
    .map((snap) => snap.data() as { index: number; data: Bytes })
    .sort((a, b) => a.index - b.index);
  if (chunks.length !== manifest.chunkCount) {
    throw new Error("This video is incomplete and can't be played.");
  }
  const bytes = new Uint8Array(manifest.size);
  let offset = 0;
  for (const chunk of chunks) {
    const part = chunk.data.toUint8Array();
    bytes.set(part, offset);
    offset += part.length;
  }

  if (!cachedFile) {
    const url = URL.createObjectURL(new Blob([bytes], { type: manifest.mimeType }));
    webVideoUrls.set(incidentId, url);
    return url;
  }
  cachedFile.create({ overwrite: true });
  await cachedFile.write(bytes);
  return cachedFile.uri;
}

// Resolves an incident's videoUrl to something playable. Plain http(s) URLs
// (videos from before Firestore storage) pass straight through.
export function useStoredVideoUri(videoUrl: string | null | undefined): {
  uri: string | null;
  error: string | null;
  retry: () => void;
} {
  const stored = Boolean(videoUrl && isStoredVideoUrl(videoUrl));
  const [attempt, setAttempt] = useState(0);
  // Identifies one load; a result for any other key is stale ("loading").
  const key = `${videoUrl ?? ""}#${attempt}`;
  const [result, setResult] = useState<{
    key: string;
    uri: string | null;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (!videoUrl || !stored) return;
    let cancelled = false;
    loadStoredVideo(videoUrl)
      .then((uri) => {
        if (!cancelled) setResult({ key, uri, error: null });
      })
      .catch((error: unknown) => {
        console.warn("Loading stored video failed:", error);
        if (!cancelled) {
          setResult({
            key,
            uri: null,
            error:
              error instanceof Error
                ? error.message
                : "The video could not be loaded.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [key, videoUrl, stored]);

  const retry = () => setAttempt((n) => n + 1);
  if (!videoUrl) return { uri: null, error: null, retry };
  if (!stored) return { uri: videoUrl, error: null, retry };
  if (result?.key !== key) return { uri: null, error: null, retry };
  return { uri: result.uri, error: result.error, retry };
}
