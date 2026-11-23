import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { type Coordinates, openInMaps } from "../utils/location";
import {
  metersPerPixel,
  tilesForView,
  toWorld,
} from "../utils/mapTiles";

// A small static map built from OpenStreetMap tiles: free, no API key, and
// plain images, so it works the same on the web and in the app without a
// native map library.
const MIN_ZOOM = 11;
// Street level, with the neighbourhood around it for context.
const MAX_ZOOM = 16;

// The pin's drawing, 34x44 with its tip at (17, 42).
const PIN_WIDTH = 34;
const PIN_HEIGHT = 44;
const PIN_TIP_Y = 42;

/** Zoom in as far as possible while the whole accuracy circle still fits. */
function pickZoom(
  latitude: number,
  accuracy: number | null | undefined,
  shortSide: number,
) {
  if (!accuracy || accuracy <= 0) return MAX_ZOOM;
  const neededMetersPerPixel = (2 * accuracy) / (0.8 * shortSide);
  const zoom = Math.floor(
    Math.log2(metersPerPixel(latitude, 0) / neededMetersPerPixel),
  );
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

type LocationMapProps = {
  coords: Coordinates;
  /** Meters; draws the "somewhere in here" circle and sets the zoom. */
  accuracy?: number | null;
  /** Name shown on the pin in the maps app opened on tap. */
  label?: string;
  height?: number;
  isDark?: boolean;
  style?: StyleProp<ViewStyle>;
  /** What a tap does; opens the phone's maps app (or Google Maps) if unset. */
  onPress?: () => void;
  /** Text on the chip in the corner, saying what a tap does. */
  actionLabel?: string;
};

/** A map centred on `coords` with a pin. */
export function LocationMap({
  coords,
  accuracy,
  label,
  height = 180,
  isDark = false,
  style,
  onPress,
  actionLabel = "Open in Maps",
}: LocationMapProps) {
  const [width, setWidth] = useState(0);

  const zoom = pickZoom(coords.latitude, accuracy, Math.min(width || height, height));
  const tiles = width > 0 ? tilesForView(toWorld(coords), zoom, width, height) : [];
  const accuracyRadius = accuracy
    ? Math.min(accuracy / metersPerPixel(coords.latitude, zoom), 2000)
    : 0;

  const styles = StyleSheet.create({
    map: {
      height,
      width: "100%",
      borderRadius: 12,
      overflow: "hidden",
      // Shows while tiles load, or if they can't (offline).
      backgroundColor: isDark ? "#2c2c34" : "#e8e4dc",
    },
    tile: {
      position: "absolute",
      width: 256,
      height: 256,
    },
    accuracyCircle: {
      position: "absolute",
      left: width / 2 - accuracyRadius,
      top: height / 2 - accuracyRadius,
      width: accuracyRadius * 2,
      height: accuracyRadius * 2,
      borderRadius: accuracyRadius,
      backgroundColor: "rgba(0, 122, 255, 0.15)",
      borderWidth: 1,
      borderColor: "rgba(0, 122, 255, 0.6)",
    },
    pin: {
      position: "absolute",
      left: width / 2 - PIN_WIDTH / 2,
      top: height / 2 - PIN_TIP_Y,
    },
    actionChip: {
      position: "absolute",
      top: 8,
      right: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: "rgba(255, 255, 255, 0.92)",
    },
    actionChipText: {
      color: "#007AFF",
      fontSize: 11,
      fontWeight: "700",
    },
    attribution: {
      position: "absolute",
      right: 0,
      bottom: 0,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderTopLeftRadius: 6,
      backgroundColor: "rgba(255, 255, 255, 0.8)",
    },
    attributionText: {
      color: "#333",
      fontSize: 10,
    },
  });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.map, style]}
      onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}
      onPress={
        onPress ??
        (() =>
          openInMaps(coords, label).catch((error) =>
            console.warn("Could not open the maps app:", error),
          ))
      }
      accessibilityRole="button"
      accessibilityLabel={`Map of the location. ${actionLabel}.`}
    >
      {tiles.map((tile) => (
        <Image
          key={tile.key}
          source={tile.source}
          style={[styles.tile, { left: tile.left, top: tile.top }]}
        />
      ))}
      {width > 0 && accuracyRadius >= 6 ? (
        <View style={styles.accuracyCircle} pointerEvents="none" />
      ) : null}
      {width > 0 ? (
        <View style={styles.pin} pointerEvents="none">
          <Svg
            width={PIN_WIDTH}
            height={PIN_HEIGHT}
            viewBox={`0 0 ${PIN_WIDTH} ${PIN_HEIGHT}`}
          >
            <Path
              d="M17 2C8.7 2 2 8.6 2 16.8 2 27.9 17 42 17 42s15-14.1 15-25.2C32 8.6 25.3 2 17 2z"
              fill="#FF3B30"
              stroke="#fff"
              strokeWidth={2}
            />
            <Circle cx={17} cy={16.5} r={5.5} fill="#fff" />
          </Svg>
        </View>
      ) : null}
      <View style={styles.actionChip} pointerEvents="none">
        <Ionicons name="navigate" size={11} color="#007AFF" />
        <Text style={styles.actionChipText}>{actionLabel}</Text>
      </View>
      {/* Required by OpenStreetMap's licence. */}
      <TouchableOpacity
        style={styles.attribution}
        onPress={() =>
          Linking.openURL("https://www.openstreetmap.org/copyright").catch(
            () => {},
          )
        }
        accessibilityRole="link"
      >
        <Text style={styles.attributionText}>© OpenStreetMap</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
