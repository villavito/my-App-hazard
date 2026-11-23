import { Ionicons } from "@expo/vector-icons";
import { type ComponentRef, Fragment, useEffect, useRef, useState } from "react";
import {
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import type { Coordinates } from "../utils/location";
import {
  fromWorld,
  TILE_SIZE,
  tilesForView,
  toWorld,
  type WorldPoint,
  worldSize,
} from "../utils/mapTiles";

// The app's own interactive map: OpenStreetMap tiles drawn as plain images,
// so it is free, needs no API key or native map library, and works the same
// on the web and in the app. Drag to move; zoom with the buttons, the mouse
// wheel, a double tap or two fingers.

export type MapMarker = {
  id: string;
  coords: Coordinates;
  color: string;
  /** Lower is more urgent: a bubble of several pins takes the colour of its most urgent one. */
  rank: number;
  /** Read out by screen readers. */
  label: string;
  /** Drawn with a ring around it, e.g. a report that just came in. */
  highlighted?: boolean;
};

/** Where the map looks when it first appears. */
export type MapStartView =
  | { center: Coordinates; zoom: number }
  | { fit: Coordinates[] };

type Camera = { center: WorldPoint; zoom: number };

const MIN_ZOOM = 3;
const MAX_ZOOM = 18;
// Fitting several pins on screen never zooms in closer than street level.
const FIT_MAX_ZOOM = 16;
const FIT_PADDING = 40;
// The Philippines, for when there is nothing to show yet.
const DEFAULT_START: MapStartView = {
  center: { latitude: 12.3, longitude: 122.6 },
  zoom: 5,
};

// Pins closer together than this are drawn as one numbered bubble.
const CLUSTER_PX = 34;
// A press that moves further than this is a drag, not a tap.
const DRAG_PX = 6;
const DOUBLE_TAP_MS = 400;
// How hard to pinch (finger distance ratio) for one zoom step.
const PINCH_STEP = 1.4;
// Mouse-wheel travel for one zoom step.
const WHEEL_STEP = 60;

const PIN_PATH =
  "M17 2C8.7 2 2 8.6 2 16.8 2 27.9 17 42 17 42s15-14.1 15-25.2C32 8.6 25.3 2 17 2z";
const PIN = { width: 30, height: 39 };
const SELECTED_PIN = { width: 40, height: 52 };
// The tip sits at y=42 of the drawing's 44.
const PIN_TIP = 42 / 44;
const BUBBLE = 36;
const HALO = 48;

function clampZoom(zoom: number, max = MAX_ZOOM) {
  return Math.min(max, Math.max(MIN_ZOOM, zoom));
}

/** Keeps the view on the map: wraps sideways, stops at the top and bottom. */
function clampCamera(camera: Camera, height: number): Camera {
  const halfHeight = height / 2 / worldSize(camera.zoom);
  const y =
    halfHeight >= 0.5
      ? 0.5
      : Math.min(1 - halfHeight, Math.max(halfHeight, camera.center.y));
  const x = ((camera.center.x % 1) + 1) % 1;
  return { zoom: camera.zoom, center: { x, y } };
}

function cameraFor(view: MapStartView, width: number, height: number): Camera {
  if ("center" in view) {
    return clampCamera(
      { center: toWorld(view.center), zoom: clampZoom(Math.round(view.zoom)) },
      height,
    );
  }
  if (view.fit.length === 0) return cameraFor(DEFAULT_START, width, height);

  const points = view.fit.map(toWorld);
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const [minX, maxX] = [Math.min(...xs), Math.max(...xs)];
  const [minY, maxY] = [Math.min(...ys), Math.max(...ys)];
  // The most pixels per world unit that still fits every pin, leaving room
  // above for the pins themselves.
  const scale = Math.min(
    (width - 2 * FIT_PADDING) / Math.max(maxX - minX, 1e-12),
    (height - 2 * FIT_PADDING - PIN.height) / Math.max(maxY - minY, 1e-12),
  );
  const zoom = clampZoom(
    Math.floor(Math.log2(Math.max(scale, 1) / TILE_SIZE)),
    FIT_MAX_ZOOM,
  );
  return clampCamera(
    {
      zoom,
      center: {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2 - PIN.height / 2 / worldSize(zoom),
      },
    },
    height,
  );
}

/** Zooms while keeping the map point under (x, y) where it is on screen. */
function zoomAround(
  camera: Camera,
  zoom: number,
  x: number,
  y: number,
  width: number,
  height: number,
): Camera {
  const next = clampZoom(zoom);
  if (next === camera.zoom) return camera;
  const dx = x - width / 2;
  const dy = y - height / 2;
  const before = worldSize(camera.zoom);
  const after = worldSize(next);
  return clampCamera(
    {
      zoom: next,
      center: {
        x: camera.center.x + dx / before - dx / after,
        y: camera.center.y + dy / before - dy / after,
      },
    },
    height,
  );
}

function panBy(camera: Camera, dx: number, dy: number, height: number): Camera {
  const size = worldSize(camera.zoom);
  return clampCamera(
    {
      zoom: camera.zoom,
      center: { x: camera.center.x - dx / size, y: camera.center.y - dy / size },
    },
    height,
  );
}

type MarkerGroup = { key: string; x: number; y: number; markers: MapMarker[] };

/** On-screen positions of the pins, with near neighbours merged into one group. */
function groupMarkers(
  markers: MapMarker[],
  camera: Camera,
  width: number,
  height: number,
): MarkerGroup[] {
  const size = worldSize(camera.zoom);
  const groups: MarkerGroup[] = [];
  for (const marker of markers) {
    const point = toWorld(marker.coords);
    let dx = point.x - camera.center.x;
    if (dx > 0.5) dx -= 1;
    else if (dx < -0.5) dx += 1;
    const x = width / 2 + dx * size;
    const y = height / 2 + (point.y - camera.center.y) * size;
    const offScreen =
      x < -BUBBLE ||
      x > width + BUBBLE ||
      y < -BUBBLE ||
      y > height + SELECTED_PIN.height;
    if (offScreen) continue;
    const near = groups.find(
      (g) => Math.abs(g.x - x) < CLUSTER_PX && Math.abs(g.y - y) < CLUSTER_PX,
    );
    if (near) near.markers.push(marker);
    else groups.push({ key: marker.id, x, y, markers: [marker] });
  }
  return groups;
}

/** How far apart a group's pins would be at the closest zoom, in pixels. */
function spreadAtMaxZoom(markers: MapMarker[]) {
  const points = markers.map((m) => toWorld(m.coords));
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const size = worldSize(MAX_ZOOM);
  return Math.max(
    (Math.max(...xs) - Math.min(...xs)) * size,
    (Math.max(...ys) - Math.min(...ys)) * size,
  );
}

type PagePoint = { pageX: number; pageY: number };

function touchesOf(event: GestureResponderEvent): readonly PagePoint[] {
  const { touches } = event.nativeEvent;
  return touches && touches.length > 0 ? touches : [event.nativeEvent];
}

const distance = (a: PagePoint, b: PagePoint) =>
  Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);

type Drag = {
  /** Page position where the press began. */
  startX: number;
  startY: number;
  camera: Camera;
  moved: boolean;
  pinchDistance: number | null;
  pinched: boolean;
};

type TileMapProps = {
  markers: MapMarker[];
  startView: MapStartView;
  /** Pins drawn larger, as chosen. */
  selectedIds?: string[];
  /**
   * A pin was tapped (one id), or a bubble of reports at the very same spot
   * (several ids), or the empty map (null).
   */
  onSelect?: (ids: string[] | null) => void;
  /**
   * Pixels along the bottom covered by something drawn over the map (like a
   * details card). A pin tapped there slides up into view.
   */
  bottomInset?: number;
  /** Picking a spot: a pin stays in the middle while the map moves under it. */
  centerPin?: boolean;
  /** Called with the point under the middle of the map whenever the view moves. */
  onCenterChange?: (center: Coordinates) => void;
  /** The "show all reports" button (pointless with no pins). */
  showAllControl?: boolean;
  isDark?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function TileMap({
  markers,
  startView,
  selectedIds = [],
  onSelect,
  bottomInset = 0,
  centerPin = false,
  onCenterChange,
  showAllControl = true,
  isDark = false,
  style,
}: TileMapProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [camera, setCamera] = useState<Camera | null>(null);
  const containerRef = useRef<ComponentRef<typeof View>>(null);
  // Copies of state for the web wheel listener, which outlives renders.
  const sizeRef = useRef(size);
  // Where the map sits on the page, to turn touch positions into map ones.
  const origin = useRef({ x: 0, y: 0 });
  const pressStart = useRef<{ x: number; y: number } | null>(null);
  const drag = useRef<Drag | null>(null);
  const lastTap = useRef<{ time: number; x: number; y: number } | null>(null);
  // The latest callback, so a new one from the parent on every render doesn't
  // count as the view moving.
  const centerListener = useRef(onCenterChange);
  useEffect(() => {
    centerListener.current = onCenterChange;
  });
  useEffect(() => {
    if (camera) centerListener.current?.(fromWorld(camera.center));
  }, [camera]);

  const measureOrigin = () => {
    const node = containerRef.current;
    if (!node) return;
    if (Platform.OS === "web") {
      const rect = (node as unknown as HTMLElement).getBoundingClientRect?.();
      if (rect) {
        origin.current = { x: rect.left + window.scrollX, y: rect.top + window.scrollY };
      }
    } else {
      node.measure((_x, _y, _w, _h, pageX, pageY) => {
        origin.current = { x: pageX, y: pageY };
      });
    }
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    sizeRef.current = { width, height };
    setSize({ width, height });
    setCamera((current) =>
      current ? clampCamera(current, height) : cameraFor(startView, width, height),
    );
    measureOrigin();
  };

  // Mouse-wheel zoom on the web, towards the pointer.
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const node = containerRef.current as unknown as HTMLElement | null;
    if (!node?.addEventListener) return;
    let travel = 0;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      // Some mice report lines rather than pixels.
      travel += event.deltaMode === 1 ? event.deltaY * 33 : event.deltaY;
      if (Math.abs(travel) < WHEEL_STEP) return;
      const step = travel < 0 ? 1 : -1;
      travel = 0;
      const rect = node.getBoundingClientRect();
      const { width, height } = sizeRef.current;
      setCamera((current) =>
        current &&
        zoomAround(
          current,
          current.zoom + step,
          event.clientX - rect.left,
          event.clientY - rect.top,
          width,
          height,
        ),
      );
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, []);

  const toLocal = (point: PagePoint) => ({
    x: point.pageX - origin.current.x,
    y: point.pageY - origin.current.y,
  });

  const zoomBy = (step: number) =>
    setCamera((current) =>
      current &&
      zoomAround(current, current.zoom + step, size.width / 2, size.height / 2, size.width, size.height),
    );

  const showAll = () =>
    setCamera(cameraFor({ fit: markers.map((m) => m.coords) }, size.width, size.height));

  const select = (group: MarkerGroup) => {
    onSelect?.(group.markers.map((m) => m.id));
    // Keep the chosen pin in sight above whatever covers the bottom.
    const visibleBottom = size.height - bottomInset - 12;
    if (camera && group.y > visibleBottom) {
      const target = Math.min(visibleBottom - 40, size.height / 2);
      setCamera(panBy(camera, 0, target - group.y, size.height));
    }
  };

  const openGroup = (group: MarkerGroup) => {
    // Reports at (almost) the very same spot never separate, however far
    // in you zoom - list them instead.
    if (!camera || camera.zoom >= MAX_ZOOM || spreadAtMaxZoom(group.markers) < CLUSTER_PX) {
      select(group);
      return;
    }
    setCamera(zoomAround(camera, camera.zoom + 2, group.x, group.y, size.width, size.height));
  };

  // Dragging and pinching use the touch responder system directly, so pins
  // and buttons still get their taps, but a drag that starts on one moves
  // the map instead.
  const responder = {
    onStartShouldSetResponderCapture: (event: GestureResponderEvent) => {
      const [touch] = touchesOf(event);
      pressStart.current = { x: touch.pageX, y: touch.pageY };
      return false;
    },
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponderCapture: (event: GestureResponderEvent) => {
      const touches = touchesOf(event);
      const start = pressStart.current;
      return (
        touches.length > 1 ||
        (!!start &&
          Math.hypot(touches[0].pageX - start.x, touches[0].pageY - start.y) > DRAG_PX)
      );
    },
    onResponderTerminationRequest: () => false,
    onResponderGrant: (event: GestureResponderEvent) => {
      if (!camera) return;
      measureOrigin();
      const touches = touchesOf(event);
      const start = pressStart.current ?? { x: touches[0].pageX, y: touches[0].pageY };
      drag.current = {
        startX: start.x,
        startY: start.y,
        camera,
        moved: false,
        pinchDistance: touches.length > 1 ? distance(touches[0], touches[1]) : null,
        pinched: false,
      };
    },
    onResponderMove: (event: GestureResponderEvent) => {
      const current = drag.current;
      if (!current) return;
      const touches = touchesOf(event);

      if (touches.length > 1) {
        const apart = distance(touches[0], touches[1]);
        current.moved = true;
        current.pinched = true;
        if (current.pinchDistance === null) {
          current.pinchDistance = apart;
          return;
        }
        const ratio = apart / current.pinchDistance;
        if (ratio > PINCH_STEP || ratio < 1 / PINCH_STEP) {
          const middle = toLocal({
            pageX: (touches[0].pageX + touches[1].pageX) / 2,
            pageY: (touches[0].pageY + touches[1].pageY) / 2,
          });
          const step = ratio > 1 ? 1 : -1;
          current.pinchDistance = apart;
          setCamera((cam) =>
            cam && zoomAround(cam, cam.zoom + step, middle.x, middle.y, size.width, size.height),
          );
        }
        return;
      }

      // The finger left over after a pinch would drag from a stale start.
      if (current.pinched) return;
      const dx = touches[0].pageX - current.startX;
      const dy = touches[0].pageY - current.startY;
      if (!current.moved && Math.hypot(dx, dy) < DRAG_PX) return;
      current.moved = true;
      setCamera(panBy(current.camera, dx, dy, size.height));
    },
    onResponderRelease: (event: GestureResponderEvent) => {
      const current = drag.current;
      drag.current = null;
      pressStart.current = null;
      if (!current || current.moved) return;

      // A tap on the map itself (pins handle their own).
      const point = toLocal(touchesOf(event)[0]);
      const now = Date.now();
      const previous = lastTap.current;
      if (
        previous &&
        now - previous.time < DOUBLE_TAP_MS &&
        Math.hypot(point.x - previous.x, point.y - previous.y) < 30
      ) {
        lastTap.current = null;
        setCamera((cam) =>
          cam && zoomAround(cam, cam.zoom + 1, point.x, point.y, size.width, size.height),
        );
        return;
      }
      lastTap.current = { time: now, x: point.x, y: point.y };
      onSelect?.(null);
    },
    onResponderTerminate: () => {
      drag.current = null;
      pressStart.current = null;
    },
  };

  const selected = new Set(selectedIds);
  const ready = camera !== null && size.width > 0;
  const tiles = ready ? tilesForView(camera.center, camera.zoom, size.width, size.height) : [];
  const groups = ready
    ? groupMarkers(markers, camera, size.width, size.height)
        .map((group) => ({
          ...group,
          isSelected: group.markers.some((m) => selected.has(m.id)),
          isHighlighted: group.markers.some((m) => m.highlighted),
        }))
        // Southern pins overlap northern ones, and the chosen one goes on top.
        .sort((a, b) => Number(a.isSelected) - Number(b.isSelected) || a.y - b.y)
    : [];

  const styles = StyleSheet.create({
    map: {
      flex: 1,
      overflow: "hidden",
      // Shows while tiles load, or if they can't (offline).
      backgroundColor: isDark ? "#2c2c34" : "#e8e4dc",
    },
    tile: {
      position: "absolute",
      width: TILE_SIZE,
      height: TILE_SIZE,
    },
    bubble: {
      position: "absolute",
      width: BUBBLE,
      height: BUBBLE,
      borderRadius: BUBBLE / 2,
      borderWidth: 3,
      borderColor: "#fff",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.35)",
    },
    bubbleSelected: {
      borderColor: "#1a1a2e",
    },
    bubbleText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "800",
    },
    halo: {
      position: "absolute",
      width: HALO,
      height: HALO,
      borderRadius: HALO / 2,
      borderWidth: 2,
    },
    controls: {
      position: "absolute",
      top: 12,
      right: 12,
      borderRadius: 10,
      backgroundColor: isDark ? "#1a1a2e" : "#fff",
      boxShadow: "0px 1px 5px rgba(0, 0, 0, 0.3)",
      overflow: "hidden",
    },
    control: {
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
    },
    controlDivider: {
      height: 1,
      backgroundColor: isDark ? "#2a2a4e" : "#e5e5ea",
    },
    attribution: {
      position: "absolute",
      right: 0,
      bottom: 0,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderTopLeftRadius: 6,
      backgroundColor: "rgba(255, 255, 255, 0.85)",
    },
    attributionText: {
      color: "#333",
      fontSize: 11,
    },
  });

  const control = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    onPress: () => void,
  ) => (
    <TouchableOpacity
      style={styles.control}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={20} color={isDark ? "#fff" : "#1a1a2e"} />
    </TouchableOpacity>
  );

  return (
    <View
      ref={containerRef}
      style={[styles.map, Platform.OS === "web" ? webGrab : null, style]}
      onLayout={handleLayout}
      {...responder}
    >
      {tiles.map((tile) => (
        <Image
          key={tile.key}
          source={tile.source}
          style={[styles.tile, { left: tile.left, top: tile.top }]}
        />
      ))}

      {groups.map((group) => {
        const mostUrgent = group.markers.reduce((a, b) => (b.rank < a.rank ? b : a));
        // A ring on the ground around a report that just came in.
        const halo = group.isHighlighted ? (
          <View
            pointerEvents="none"
            style={[
              styles.halo,
              {
                left: group.x - HALO / 2,
                top: group.y - HALO / 2,
                borderColor: mostUrgent.color,
                backgroundColor: `${mostUrgent.color}33`,
              },
            ]}
          />
        ) : null;

        if (group.markers.length === 1) {
          const [marker] = group.markers;
          const pin = group.isSelected ? SELECTED_PIN : PIN;
          return (
            <Fragment key={group.key}>
              {halo}
              <Pressable
                onPress={() => select(group)}
                accessibilityRole="button"
                accessibilityLabel={marker.label}
                style={{
                  position: "absolute",
                  left: group.x - pin.width / 2,
                  top: group.y - pin.height * PIN_TIP,
                }}
              >
                <Svg width={pin.width} height={pin.height} viewBox="0 0 34 44">
                  <Path d={PIN_PATH} fill={marker.color} stroke="#fff" strokeWidth={2} />
                  <Circle cx={17} cy={16.5} r={5.5} fill="#fff" />
                </Svg>
              </Pressable>
            </Fragment>
          );
        }
        return (
          <Fragment key={group.key}>
            {halo}
            <Pressable
              onPress={() => openGroup(group)}
              accessibilityRole="button"
              accessibilityLabel={`${group.markers.length} reports here`}
              style={[
                styles.bubble,
                {
                  left: group.x - BUBBLE / 2,
                  top: group.y - BUBBLE / 2,
                  backgroundColor: mostUrgent.color,
                },
                group.isSelected && styles.bubbleSelected,
              ]}
            >
              <Text style={styles.bubbleText}>{group.markers.length}</Text>
            </Pressable>
          </Fragment>
        );
      })}

      {centerPin && ready ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: size.width / 2 - SELECTED_PIN.width / 2,
            top: size.height / 2 - SELECTED_PIN.height * PIN_TIP,
          }}
        >
          <Svg width={SELECTED_PIN.width} height={SELECTED_PIN.height} viewBox="0 0 34 44">
            <Path d={PIN_PATH} fill="#FF3B30" stroke="#fff" strokeWidth={2} />
            <Circle cx={17} cy={16.5} r={5.5} fill="#fff" />
          </Svg>
        </View>
      ) : null}

      <View style={styles.controls}>
        {control("add", "Zoom in", () => zoomBy(1))}
        <View style={styles.controlDivider} />
        {control("remove", "Zoom out", () => zoomBy(-1))}
        {showAllControl ? (
          <>
            <View style={styles.controlDivider} />
            {control("scan-outline", "Show all reports", showAll)}
          </>
        ) : null}
      </View>

      {/* Required by OpenStreetMap's licence. */}
      <TouchableOpacity
        style={styles.attribution}
        onPress={() =>
          Linking.openURL("https://www.openstreetmap.org/copyright").catch(() => {})
        }
        accessibilityRole="link"
      >
        <Text style={styles.attributionText}>© OpenStreetMap contributors</Text>
      </TouchableOpacity>
    </View>
  );
}

// Web only: a grab cursor, no text selection while dragging, and touch
// drags move the map instead of scrolling the page.
const webGrab = {
  cursor: "grab",
  userSelect: "none",
  touchAction: "none",
} as unknown as ViewStyle;
