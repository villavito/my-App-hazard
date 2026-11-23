import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type Coordinates, type FoundPlace, searchPlaces } from "../utils/location";
import { TileMap } from "./TileMap";

type PinPickerProps = {
  /** Where the device thinks it is. */
  start: Coordinates;
  startZoom: number;
  isDark: boolean;
  onCancel: () => void;
  onPick: (coords: Coordinates) => void;
};

/**
 * A full-screen map for putting the report's pin on the right spot by hand,
 * for when the device's position is wrong - computers have no GPS and guess
 * from their internet connection, which can be kilometers off. Render it
 * only while it is open, so each opening starts fresh.
 */
export function PinPicker({ start, startZoom, isDark, onCancel, onPick }: PinPickerProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const wide = width >= 700;

  // A new key moves the map (search result, back to the found spot).
  const [view, setView] = useState({ key: 0, center: start, zoom: startZoom });
  // The point under the pin; updated as the map moves.
  const center = useRef<Coordinates>(start);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // Other matches for the last search (names repeat across towns).
  const [results, setResults] = useState<FoundPlace[]>([]);

  const moveTo = (coords: Coordinates, zoom: number) => {
    center.current = coords;
    setView((current) => ({ key: current.key + 1, center: coords, zoom }));
  };

  const showPlace = (place: FoundPlace) => {
    moveTo(place.coords, 17);
    setResults([]);
    setMessage(`Showing ${place.name}. Now drag the map so the pin is on the exact spot.`);
  };

  const search = async () => {
    const text = query.trim();
    if (!text || searching) return;
    setSearching(true);
    setMessage(null);
    setResults([]);
    try {
      const found = await searchPlaces(text, center.current);
      if (found.length === 0) {
        setMessage("No place found with that name. Try another name, or drag the map yourself.");
      } else if (found.length === 1) {
        showPlace(found[0]);
      } else {
        moveTo(found[0].coords, 17);
        setResults(found);
        setMessage(`Showing ${found[0].name}. Not the right one? Pick it below.`);
      }
    } catch {
      setMessage("Couldn't search right now. Drag the map yourself, or try again.");
    } finally {
      setSearching(false);
    }
  };

  const styles = StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: wide ? "rgba(0, 0, 0, 0.5)" : isDark ? "#000" : "#fff",
      alignItems: "center",
      justifyContent: "center",
    },
    panel: wide
      ? {
          width: Math.min(760, width - 48),
          height: Math.min(780, height - 48),
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: isDark ? "#1a1a1a" : "#fff",
        }
      : {
          flex: 1,
          alignSelf: "stretch",
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          backgroundColor: isDark ? "#1a1a1a" : "#fff",
        },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 14,
    },
    title: {
      flex: 1,
      fontSize: 18,
      fontWeight: "700",
      color: isDark ? "#fff" : "#000",
    },
    hint: {
      fontSize: 13,
      lineHeight: 18,
      color: isDark ? "#aaa" : "#555",
      paddingHorizontal: 16,
      marginTop: 4,
    },
    searchRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 16,
      marginTop: 10,
    },
    searchInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: isDark ? "#4a4a4a" : "#dee2e6",
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: isDark ? "#fff" : "#000",
      backgroundColor: isDark ? "#2a2a2a" : "#fff",
    },
    searchButton: {
      width: 46,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#007AFF",
    },
    message: {
      fontSize: 12,
      lineHeight: 16,
      color: isDark ? "#ccc" : "#444",
      paddingHorizontal: 16,
      marginTop: 6,
    },
    resultRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#2a2a2a" : "#eee",
    },
    resultText: {
      flex: 1,
      fontSize: 13,
      color: isDark ? "#fff" : "#1a1a2e",
    },
    map: {
      flex: 1,
      marginTop: 10,
    },
    actions: {
      flexDirection: "row",
      gap: 8,
      padding: 12,
    },
    secondaryButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: isDark ? "#2a2a4e" : "#e8f0fe",
    },
    secondaryText: {
      color: "#007AFF",
      fontSize: 14,
      fontWeight: "700",
    },
    primaryButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: "#34C759",
    },
    primaryText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "700",
    },
  });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Put the pin on the right spot</Text>
            <TouchableOpacity
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Ionicons name="close" size={26} color={isDark ? "#fff" : "#000"} />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>
            Drag the map until the pin points to where the incident is. You can
            also search for a place nearby, like a school or barangay.
          </Text>

          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={search}
              placeholder="Search a place..."
              placeholderTextColor={isDark ? "#888" : "#999"}
              returnKeyType="search"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={search}
              disabled={searching}
              accessibilityRole="button"
              accessibilityLabel="Search"
            >
              {searching ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="search" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {results.map((place) => (
            <TouchableOpacity
              key={`${place.name}-${place.coords.latitude}`}
              style={styles.resultRow}
              onPress={() => showPlace(place)}
            >
              <Ionicons name="location-outline" size={16} color="#007AFF" />
              <Text style={styles.resultText} numberOfLines={2}>
                {place.name}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.map}>
            <TileMap
              key={view.key}
              markers={[]}
              startView={{ center: view.center, zoom: view.zoom }}
              centerPin
              showAllControl={false}
              onCenterChange={(coords) => {
                center.current = coords;
              }}
              isDark={isDark}
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => moveTo(start, startZoom)}
            >
              <Ionicons name="refresh" size={16} color="#007AFF" />
              <Text style={styles.secondaryText}>Back to start</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => onPick(center.current)}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.primaryText}>Use this spot</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
