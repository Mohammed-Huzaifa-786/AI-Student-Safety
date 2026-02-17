import React from "react";
import { View, Text } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

function sanitizeValues(arr) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  for (let v of arr) {
    const n = Number(v);
    if (!Number.isFinite(n)) {
      // replace invalid values with previous valid value or 0
      const prev = out.length ? out[out.length - 1] : 0;
      out.push(prev);
      continue;
    }
    // clamp to [0,1]
    out.push(Math.max(0, Math.min(1, n)));
  }
  return out;
}

export default function FallGraph({ probHistory }) {
  const raw = Array.isArray(probHistory) ? probHistory.slice(-40) : [];
  const dataPoints = sanitizeValues(raw);

  if (dataPoints.length === 0) {
    return (
      <View style={{ padding: 12 }}>
        <Text style={{ color: '#9CA3AF' }}>No fall probability history yet</Text>
      </View>
    );
  }

  return (
    <View>
      <LineChart
        data={{ labels: [], datasets: [{ data: dataPoints }] }}
        width={Dimensions.get("window").width - 20}
        height={160}
        withDots={false}
        chartConfig={{
          backgroundColor: "#000",
          backgroundGradientFrom: "#1c1c1c",
          backgroundGradientTo: "#1c1c1c",
          color: (o) => `rgba(0, 255, 200, ${o})`,
          strokeWidth: 2,
        }}
        bezier
        style={{ marginVertical: 8, borderRadius: 10 }}
      />
    </View>
  );
}
