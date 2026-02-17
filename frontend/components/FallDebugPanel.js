import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function FallDebugPanel({ scores, prob }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 AI Fall Detection — Debug Mode</Text>

      <Text style={styles.text}>Probability: {prob?.toFixed(3)}</Text>

      {scores && (
        <>
          <Text style={styles.text}>Freefall Ratio: {scores.freefallRatio}</Text>
          <Text style={styles.text}>Impact Ratio: {scores.impactRatio}</Text>
          <Text style={styles.text}>Range: {scores.range}</Text>
          <Text style={styles.text}>Jerk: {scores.jerk}</Text>
          <Text style={styles.text}>Raw Score: {scores.rawScore}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 12,
    borderRadius: 8,
  },
  title: { color: "#00eaff", fontWeight: "bold", marginBottom: 8 },
  text: { color: "#fff", fontSize: 12 },
});
