import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      {/* Outer border frame */}
      <View style={styles.frame}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.menuIcon}>
            <View style={styles.bar} />
            <View style={styles.bar} />
            <View style={styles.bar} />
          </View>
          <TouchableOpacity style={styles.taskButton}>
            <Text style={styles.taskText}>Today's Tasks</Text>
          </TouchableOpacity>
        </View>

        {/* Legend Section */}
        <View style={styles.legend}>
          <View style={styles.legendRow}>
            <View style={[styles.colorBox, { backgroundColor: "#f4a6a6" }]} />
            <Text style={styles.legendText}>course 1</Text>
            <View style={[styles.colorBox, { backgroundColor: "#b4e197" }]} />
            <Text style={styles.legendText}>course 2</Text>
            <View style={[styles.colorBox, { backgroundColor: "#a3c7f7" }]} />
            <Text style={styles.legendText}>course 3</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.colorBox, { backgroundColor: "#555" }]} />
            <Text style={styles.legendText}>event 1</Text>
            <View style={[styles.colorBox, { backgroundColor: "#999" }]} />
            <Text style={styles.legendText}>event 2</Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calendar}>
          <Text style={styles.monthTitle}>January / 01</Text>

          <View style={styles.calendarGrid}>
            {/* Placeholder for calendar cells */}
            <Text style={styles.placeholderText}>[ Calendar Grid Here ]</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 70, // 🔹 add this line to push everything down
  },
  frame: {
    flex: 1,
    margin: 8,
    borderWidth: 1,
    borderColor: "#666",
    borderRadius: 4,
    padding: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  menuIcon: {
    width: 28,
    justifyContent: "space-between",
    height: 18,
  },
  bar: {
    width: "100%",
    height: 2,
    backgroundColor: "#444",
  },
  taskButton: {
    borderWidth: 1,
    borderColor: "#666",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  taskText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  legend: {
    marginBottom: 24,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  colorBox: {
    width: 16,
    height: 10,
    borderRadius: 2,
    marginRight: 4,
  },
  legendText: {
    fontSize: 13,
    color: "#555",
    marginRight: 10,
  },
  calendar: {
    flex: 1,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    marginBottom: 12,
  },
  calendarGrid: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: "#aaa",
  },
});
