import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

export type StatusSlice = {
  key: string;
  label: string;
  value: number;
  /** Status-role color, fixed regardless of light/dark - see palette.md */
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const SIZE = 140;
const STROKE_WIDTH = 22;
const ACTIVE_STROKE_EXTRA = 4; // how much the selected slice's ring grows
// Leave room for the selected slice's wider stroke so its outer edge never
// extends past the SVG canvas and gets clipped.
const RADIUS = (SIZE - STROKE_WIDTH - ACTIVE_STROKE_EXTRA) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 3; // surface-color gap between adjacent slices

export default function IncidentStatusChart({
  data,
  isDark,
}: {
  data: StatusSlice[];
  isDark: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const track = isDark ? "#2a2a40" : "#eef0f3";
  const textColor = isDark ? "#fff" : "#1a1a2e";
  const mutedText = "#898781";

  const slices = data.filter((s) => s.value > 0);
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  const activeSlice = selected
    ? slices.find((s) => s.key === selected) ?? null
    : null;

  if (total === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons
          name="checkmark-done-outline"
          size={22}
          color={mutedText}
        />
        <Text style={[styles.emptyText, { color: mutedText }]}>
          No incidents recorded yet
        </Text>
      </View>
    );
  }

  let cumulative = 0;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => setSelected(null)}
        style={styles.ringWrap}
        accessibilityRole="button"
        accessibilityLabel="Clear selection"
      >
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={track}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {slices.map((slice) => {
            const fraction = slice.value / total;
            const length = Math.max(fraction * CIRCUMFERENCE - GAP, 0);
            const offset = -cumulative;
            cumulative += fraction * CIRCUMFERENCE;
            const isDimmed = activeSlice && activeSlice.key !== slice.key;

            return (
              <Circle
                key={slice.key}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                stroke={slice.color}
                strokeWidth={
                  activeSlice?.key === slice.key
                    ? STROKE_WIDTH + ACTIVE_STROKE_EXTRA
                    : STROKE_WIDTH
                }
                strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
                strokeOpacity={isDimmed ? 0.35 : 1}
                fill="none"
                rotation={-90}
                origin={`${SIZE / 2}, ${SIZE / 2}`}
              />
            );
          })}
        </Svg>
        <View style={styles.centerLabel}>
          <Text style={[styles.centerValue, { color: textColor }]}>
            {activeSlice ? activeSlice.value : total}
          </Text>
          <Text style={[styles.centerCaption, { color: mutedText }]}>
            {activeSlice ? activeSlice.label : "Total"}
          </Text>
        </View>
      </Pressable>

      <View style={styles.legend}>
        {slices.map((slice) => {
          const pct = Math.round((slice.value / total) * 100);
          const isActive = activeSlice?.key === slice.key;
          return (
            <Pressable
              key={slice.key}
              onPress={() => setSelected(isActive ? null : slice.key)}
              style={[
                styles.legendRow,
                isActive && {
                  backgroundColor: isDark ? "#24243a" : "#f5f6f8",
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${slice.label}: ${slice.value} incidents, ${pct} percent`}
            >
              <Ionicons name={slice.icon} size={14} color={slice.color} />
              <Text
                style={[styles.legendLabel, { color: textColor }]}
                numberOfLines={1}
              >
                {slice.label}
              </Text>
              <Text style={[styles.legendValue, { color: mutedText }]}>
                {slice.value} - {pct}%
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  ringWrap: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabel: {
    position: "absolute",
    alignItems: "center",
    pointerEvents: "none",
  },
  centerValue: {
    fontSize: 26,
    fontWeight: "800",
  },
  centerCaption: {
    fontSize: 11,
    marginTop: 2,
  },
  legend: {
    flex: 1,
    gap: 4,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 1,
  },
  legendValue: {
    fontSize: 12,
    marginLeft: "auto",
  },
  emptyState: {
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  emptyText: {
    fontSize: 13,
  },
});
