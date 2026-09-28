import { File, Paths } from "expo-file-system";

// Expo Go keeps each project's files in a folder literally named like
// "%40anonymous%2Fincident-reporting-app-<id>" - the percent signs are part of
// the folder name. Camera/picker URIs contain that name unescaped, so treated
// as a URL "%40" decodes to "@" and "%2F" to "/", and the file is looked up in
// a folder that doesn't exist. Escaping the "%" (-> "%25") keeps the name
// literal. Returns null when a file:// URI can't be found in either form.
export function resolveLocalFile(uri: string): File | null {
  const candidates = [uri];
  if (uri.startsWith("file://") && uri.includes("%")) {
    candidates.push(uri.replace(/%/g, "%25"));
  }
  for (const candidate of candidates) {
    try {
      const file = new File(candidate);
      if (file.exists) return file;
    } catch {
      // Some URIs (e.g. content://) can't be checked this way.
    }
  }
  // A content:// URI can't be confirmed up front - let the caller try it.
  return uri.startsWith("file://") ? null : new File(uri);
}

// Copies a freshly recorded or picked video into the app's cache under a
// plain name, and returns that copy's URI. The URI comes from the File API
// itself, so it is correctly encoded and reads back without the Expo Go
// folder-name problem above - and the copy survives the camera/picker
// clearing its own temp file before the report is submitted.
export async function copyVideoToCache(uri: string): Promise<string> {
  const source = resolveLocalFile(uri);
  if (!source) {
    throw new Error(`Recorded video not found at ${uri}`);
  }
  const destination = new File(Paths.cache, `incident-video-${Date.now()}.mp4`);
  await source.copy(destination);
  return destination.uri;
}
