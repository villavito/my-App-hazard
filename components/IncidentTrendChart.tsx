import React, { useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

export type TrendPoint = {
  /** Short axis label, e.g. "Aug 14" */
  label: string;
  /** Full label for the tooltip, e.g. "Thursday, Aug 14" */
  fullLabel: string;
  value: number;
};

const LINE_COLOR = "#007AFF";
const CHART_HEIGHT = 140;
const V_PADDING = 14;

function buildPath(points: { x: number; y: number }[]) {
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
}

export default function IncidentTrendChart({
  data,
  isDark,
}: {
  data: TrendPoint[];
  isDark: boolean;
}) {
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const surface = isDark ? "#1a1a2e" : "#ffffff";
  const gridColor = isDark ? "#2a2a40" : "#e8e8ec";
  const mutedText = "#888";
  const textColor = isDark ? "#fff" : "#1a1a2e";

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const maxValue = Math.max(1, ...data.map((d) => d.value));
  const chartWidth = Math.max(width, 1);
  const step = data.length > 1 ? chartWidth / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: data.length > 1 ? i * step : chartWidth / 2,
    y:
      CHART_HEIGHT -
      V_PADDING -
      (d.value / maxValue) * (CHART_HEIGHT - V_PADDING * 2),
  }));

  const linePath = points.length > 0 ? buildPath(points) : "";
  const areaPath =
    points.length > 0
      ? `${linePath} L${points[points.length - 1].x.toFixed(1)},${CHART_HEIGHT} L${points[0].x.toFixed(1)},${CHART_HEIGHT} Z`
      : "";

  const lastPoint = points[points.length - 1];
  const lastValue = data[data.length - 1]?.value;

  const handleTouch = (locationX: number) => {
    if (step === 0) return;
    const index = Math.round(locationX / step);
    setActiveIndex(Math.min(Math.max(index, 0), data.length - 1));
  };

  const active = activeIndex !== null ? data[activeIndex] : null;
  const activePoint = activeIndex !== null ? points[activeIndex] : null;

  if (data.length === 0) {
    return null;
  }

  return (
    <View>
      {active && activePoint ? (
        <View style={styles.tooltipRow}>
          <Text style={[styles.tooltipDate, { color: mutedText }]}>
            {active.fullLabel}
          </Text>
          <Text style={[styles.tooltipValue, { color: textColor }]}>
            {active.value} {active.value === 1 ? "incident" : "incidents"}
          </Text>
        </View>
      ) : (
        <View style={styles.tooltipRow}>
          <Text style={[styles.tooltipDate, { color: mutedText }]}>
            {data[0]?.label} – {data[data.length - 1]?.label}
          </Text>
          <Text style={[styles.tooltipValue, { color: textColor }]}>
            {lastValue} today
          </Text>
        </View>
      )}

      <View
        onLayout={onLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => handleTouch(e.nativeEvent.locationX)}
        onResponderMove={(e) => handleTouch(e.nativeEvent.locationX)}
        onResponderRelease={() => setActiveIndex(null)}
        onResponderTerminate={() => setActiveIndex(null)}
      >
        {width > 0 && (
          <Svg width={width} height={CHART_HEIGHT}>
            {/* Recessive gridlines: zero baseline and the max line */}
            <Line
              x1={0}
              y1={CHART_HEIGHT - V_PADDING}
              x2={width}
              y2={CHART_HEIGHT - V_PADDING}
              stroke={gridColor}
              strokeWidth={1}
            />
            <Line
              x1={0}
              y1={V_PADDING}
              x2={width}
              y2={V_PADDING}
              stroke={gridColor}
              strokeWidth={1}
            />

            <Path d={areaPath} fill={LINE_COLOR} fillOpacity={0.1} />
            <Path
              d={linePath}
              stroke={LINE_COLOR}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            {activePoint && (
              <Line
                x1={activePoint.x}
                y1={V_PADDING}
                x2={activePoint.x}
                y2={CHART_HEIGHT - V_PADDING}
                stroke={gridColor}
                strokeWidth={1}
              />
            )}

            {/* End-dot: the endpoint carries the direct label above */}
            {lastPoint && (
              <Circle
                cx={lastPoint.x}
                cy={lastPoint.y}
                r={5}
                fill={LINE_COLOR}
                stroke={surface}
                strokeWidth={2}
              />
            )}
            {activePoint && activeIndex !== data.length - 1 && (
              <Circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={5}
                fill={LINE_COLOR}
                stroke={surface}
                strokeWidth={2}
              />
            )}
          </Svg>
        )}
      </View>

      <View style={styles.axisRow}>
        <Text style={[styles.axisLabel, { color: mutedText }]}>
          {data[0]?.label}
        </Text>
        <Text style={[styles.axisLabel, { color: mutedText }]}>
          {data[data.length - 1]?.label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tooltipRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 8,
  },
  tooltipDate: {
    fontSize: 12,
  },
  tooltipValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  axisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  axisLabel: {
    fontSize: 11,
  },
});
