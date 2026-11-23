import * as Location from "expo-location";
import { Linking, Platform } from "react-native";

export type Coordinates = { latitude: number; longitude: number };

export type LocationFix = Coordinates & {
  /** How far off the fix may be, in meters (null when the device can't say). */
  accuracy: number | null;
};

// A phone with GPS outdoors gets within ~5-15 m; once a fix is this good,
// waiting longer won't make it meaningfully better.
const GOOD_ACCURACY_M = 20;
// Phones answer first from Wi-Fi or cell towers (often hundreds of meters
// off) and only a few seconds later from GPS, so after the first fix keep
// listening this long for a better one.
const REFINE_MS = 8000;
// No position at all by then - stop waiting.
const FIRST_FIX_TIMEOUT_MS = 25000;

/** Beyond this, the reporter is told the spot is only approximate. */
export const APPROXIMATE_ACCURACY_M = 100;

// OpenStreetMap's usage policy asks apps to identify themselves. Browsers
// don't allow setting User-Agent - they send the site's address as the
// Referer instead, which the policy accepts.
const APP_USER_AGENT = "IncidentReportingApp/1.0 (+https://incident-4a5a6.web.app)";
export const OSM_REQUEST_HEADERS: Record<string, string> | undefined =
  Platform.OS === "web" ? undefined : { "User-Agent": APP_USER_AGENT };

function toFix(coords: {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
}): LocationFix {
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    accuracy:
      typeof coords.accuracy === "number" && coords.accuracy > 0
        ? coords.accuracy
        : null,
  };
}

const accuracyOf = (fix: LocationFix) => fix.accuracy ?? Infinity;

/**
 * Watches the position for a few seconds and resolves with the most accurate
 * fix seen, or null if the device produced none in time.
 *
 * It never accepts an old cached position. On the web, expo-location's
 * getCurrentPositionAsync allows a cached fix of any age and doesn't ask for
 * GPS, so reports were getting the home screen's rough weather position -
 * kilometers away from the reporter.
 */
function watchForBestFix(
  onImprove?: (fix: LocationFix) => void,
): Promise<LocationFix | null> {
  return new Promise((resolve, reject) => {
    let best: LocationFix | null = null;
    let finished = false;
    let stopWatching: (() => void) | undefined;
    let refineTimer: ReturnType<typeof setTimeout> | undefined;
    let giveUpTimer: ReturnType<typeof setTimeout> | undefined;

    const finish = (error?: unknown) => {
      if (finished) return;
      finished = true;
      clearTimeout(refineTimer);
      clearTimeout(giveUpTimer);
      stopWatching?.();
      if (best) resolve(best);
      else if (error) reject(error);
      else resolve(null);
    };

    const consider = (fix: LocationFix) => {
      if (finished) return;
      const isFirst = best === null;
      if (best && accuracyOf(fix) >= accuracyOf(best)) return;
      best = fix;
      onImprove?.(fix);
      if (accuracyOf(fix) <= GOOD_ACCURACY_M) {
        finish();
      } else if (isFirst) {
        refineTimer = setTimeout(() => finish(), REFINE_MS);
      }
    };

    giveUpTimer = setTimeout(() => finish(), FIRST_FIX_TIMEOUT_MS);

    if (Platform.OS === "web") {
      const geolocation =
        typeof navigator !== "undefined" ? navigator.geolocation : undefined;
      if (!geolocation) {
        finish(new Error("This browser can't share its location."));
        return;
      }
      const watchId = geolocation.watchPosition(
        (position) => consider(toFix(position.coords)),
        (error) => {
          // A refusal won't fix itself; "timeout" and "position unavailable"
          // often do, so keep listening until the deadline for those.
          if (error.code === error.PERMISSION_DENIED) finish(error);
        },
        { enableHighAccuracy: true, maximumAge: 0 },
      );
      stopWatching = () => geolocation.clearWatch(watchId);
    } else {
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 1000,
          distanceInterval: 0,
          mayShowUserSettingsDialog: true,
        },
        (position) => consider(toFix(position.coords)),
      ).then(
        (subscription) => {
          if (finished) subscription.remove();
          else stopWatching = () => subscription.remove();
        },
        (error) => finish(error),
      );
    }
  });
}

/**
 * The reporter's current position, as precise as the device can manage.
 * `onImprove` is called each time a more accurate fix comes in, so the screen
 * can show progress. Rejects when no position can be found at all.
 */
export async function getPreciseLocation(
  onImprove?: (fix: LocationFix) => void,
): Promise<LocationFix> {
  const fix = await watchForBestFix(onImprove);
  if (fix) return fix;

  // Indoors or on a cold GPS start a phone may not get a fix in time; a
  // recent cached one beats failing. Not on the web: there it would be the
  // rough position the weather card asked for.
  if (Platform.OS !== "web") {
    const last = await Location.getLastKnownPositionAsync({
      maxAge: 10 * 60 * 1000,
      requiredAccuracy: 1000,
    }).catch(() => null);
    if (last) return toFix(last.coords);
  }
  throw new Error("Timed out waiting for a location fix");
}

/**
 * Where a report was made, or null if it saved no usable position. Some
 * older reports keep latitude/longitude at the top level instead.
 */
export function reportCoordinates(report: {
  coordinates?: Coordinates | null;
  latitude?: number;
  longitude?: number;
}): Coordinates | null {
  const point =
    report.coordinates ??
    (report.latitude != null && report.longitude != null
      ? { latitude: report.latitude, longitude: report.longitude }
      : null);
  return point &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude)
    ? { latitude: point.latitude, longitude: point.longitude }
    : null;
}

export function formatCoordinates({ latitude, longitude }: Coordinates) {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

/** "12 m", "850 m", "1.2 km". */
export function formatDistance(meters: number) {
  return meters < 1000
    ? `${Math.max(1, Math.round(meters))} m`
    : `${(meters / 1000).toFixed(1)} km`;
}

const COORDINATES_TEXT = /^\s*-?\d{1,3}(\.\d+)?\s*,\s*-?\d{1,3}(\.\d+)?\s*$/;

/**
 * True when a saved location is just "lat, lng" - what reports made on the
 * web got before addresses could be looked up there.
 */
export function isCoordinatesText(text?: string | null) {
  return !text || COORDINATES_TEXT.test(text);
}

function joinUnique(parts: (string | null | undefined)[]) {
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const raw of parts) {
    const part = raw?.trim();
    if (!part || seen.has(part.toLowerCase())) continue;
    seen.add(part.toLowerCase());
    kept.push(part);
  }
  return kept.join(", ");
}

type NominatimResult = {
  error?: string;
  name?: string;
  display_name?: string;
  address?: Record<string, string | undefined>;
};

/** "Place, Street, Barangay, Town, Province" from an OpenStreetMap lookup. */
function formatNominatimAddress(result: NominatimResult) {
  const a = result.address ?? {};
  const street = a.road
    ? [a.house_number, a.road].filter(Boolean).join(" ")
    : (a.pedestrian ?? a.footway ?? a.path);
  return (
    joinUnique([
      result.name,
      street,
      a.neighbourhood ?? a.quarter,
      a.suburb ?? a.village ?? a.hamlet,
      a.city ?? a.town ?? a.municipality ?? a.county,
      a.state ?? a.province ?? a.region,
    ]) ||
    result.display_name ||
    null
  );
}

// e.g. "QHPP+7G8": Android's geocoder often puts a plus code in `name`,
// which means nothing to a responder.
const PLUS_CODE = /^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]*$/i;

function formatDeviceAddress(place: Location.LocationGeocodedAddress) {
  const name = place.name && !PLUS_CODE.test(place.name.trim()) ? place.name : null;
  const street = [place.streetNumber, place.street].filter(Boolean).join(" ");
  return (
    joinUnique([
      name,
      street,
      place.district,
      place.city ?? place.subregion,
      place.region,
    ]) || null
  );
}

// Nominatim allows at most one request per second.
const NOMINATIM_INTERVAL_MS = 1100;
let nextNominatimSlot = 0;

async function nominatimFetch<T>(pathAndQuery: string): Promise<T> {
  const now = Date.now();
  const wait = Math.max(0, nextNominatimSlot - now);
  nextNominatimSlot = now + wait + NOMINATIM_INTERVAL_MS;
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/${pathAndQuery}`,
      { headers: OSM_REQUEST_HEADERS, signal: controller.signal },
    );
    if (!response.ok) {
      throw new Error(`OpenStreetMap request failed (${response.status})`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function nominatimAddress({ latitude, longitude }: Coordinates) {
  const result = await nominatimFetch<NominatimResult>(
    `reverse?format=jsonv2&lat=${latitude}&lon=${longitude}` +
      "&zoom=18&addressdetails=1&accept-language=en",
  );
  return result.error ? null : formatNominatimAddress(result);
}

export type FoundPlace = { coords: Coordinates; name: string };

/**
 * Places in the Philippines matching a name (a school, barangay, street...),
 * best first, preferring ones near `near`. Names repeat across towns, so
 * there can be several. Only call it when the user asks to search:
 * OpenStreetMap doesn't allow search-as-you-type.
 */
export async function searchPlaces(
  query: string,
  near?: Coordinates,
): Promise<FoundPlace[]> {
  const params = [
    "format=jsonv2",
    `q=${encodeURIComponent(query)}`,
    "countrycodes=ph",
    "limit=8",
    "addressdetails=1",
    "accept-language=en",
  ];
  if (near) {
    // Prefer (but don't limit to) places within about 25 km.
    const d = 0.25;
    params.push(
      `viewbox=${near.longitude - d},${near.latitude + d},${near.longitude + d},${near.latitude - d}`,
    );
  }
  const results = await nominatimFetch<
    (NominatimResult & { lat?: string; lon?: string })[]
  >(`search?${params.join("&")}`);

  const places: FoundPlace[] = [];
  for (const result of results) {
    const latitude = Number(result.lat);
    const longitude = Number(result.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
    // "Name, Barangay, Town, Province" - and one building mapped several
    // times over shows up once.
    const name = formatNominatimAddress(result) ?? query;
    if (places.some((p) => p.name === name)) continue;
    places.push({ coords: { latitude, longitude }, name });
    if (places.length === 5) break;
  }
  return places;
}

async function findAddress(coords: Coordinates): Promise<string | null> {
  // OpenStreetMap first: it works on the web too (the device geocoder there
  // doesn't exist) and names the barangay, which Android's often leaves out.
  try {
    const address = await nominatimAddress(coords);
    if (address) return address;
  } catch (error) {
    console.warn("OpenStreetMap address lookup failed:", error);
  }

  if (Platform.OS !== "web") {
    try {
      const [place] = await Location.reverseGeocodeAsync(coords);
      if (place) return formatDeviceAddress(place);
    } catch (error) {
      console.warn("Device address lookup failed:", error);
    }
  }
  return null;
}

const addressCache = new Map<string, Promise<string | null>>();

/**
 * A readable address for a point ("Street, Barangay, Town, Province"), or
 * null if none could be found. Results are remembered for this session.
 */
export function lookupAddress(coords: Coordinates): Promise<string | null> {
  const key = `${coords.latitude.toFixed(5)},${coords.longitude.toFixed(5)}`;
  let pending = addressCache.get(key);
  if (!pending) {
    pending = findAddress(coords);
    addressCache.set(key, pending);
    // Don't remember a failure - the next try may be back online.
    pending.then((address) => {
      if (!address) addressCache.delete(key);
    });
  }
  return pending;
}

/** Opens the point in the phone's maps app, or Google Maps on the web. */
export async function openInMaps(
  { latitude, longitude }: Coordinates,
  label = "Incident Location",
) {
  const encodedLabel = encodeURIComponent(label);
  const nativeUrl = Platform.select({
    ios: `maps:0,0?q=${encodedLabel}@${latitude},${longitude}`,
    android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedLabel})`,
  });
  const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  if (nativeUrl && (await Linking.canOpenURL(nativeUrl).catch(() => false))) {
    await Linking.openURL(nativeUrl);
    return;
  }
  await Linking.openURL(webUrl);
}

/**
 * Turn-by-turn directions to the point in Google Maps: the app on a phone
 * that has it, the website otherwise.
 */
export async function openDirections({ latitude, longitude }: Coordinates) {
  await Linking.openURL(
    `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
  );
}
