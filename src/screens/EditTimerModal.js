import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";

const ITEM_HEIGHT = 36;
const VISIBLE_ITEMS = 3;
const MODAL_WIDTH = 320;

const hoursData = Array.from({ length: 25 }, (_, i) => i); // 0 - 24
const minsSecsData = Array.from({ length: 60 }, (_, i) => i); // 0 - 59

export default function EditTimerModal({
  visible,
  onClose,
  onSave,
  focusTime,
  restTime,
}) {
  const [focusH, setFocusH] = useState(0);
  const [focusM, setFocusM] = useState(25);
  const [focusS, setFocusS] = useState(0);

  const [restH, setRestH] = useState(0);
  const [restM, setRestM] = useState(5);
  const [restS, setRestS] = useState(0);

  const focusHoursRef = useRef();
  const focusMinutesRef = useRef();
  const focusSecondsRef = useRef();

  const restHoursRef = useRef();
  const restMinutesRef = useRef();
  const restSecondsRef = useRef();

  useEffect(() => {
    if (visible) {
      const fH = Number(focusTime?.h) || 0;
      const fM = Number(focusTime?.m) || 25;
      const fS = Number(focusTime?.s) || 0;

      const rH = Number(restTime?.h) || 0;
      const rM = Number(restTime?.m) || 5;
      const rS = Number(restTime?.s) || 0;

      setFocusH(fH);
      setFocusM(fM);
      setFocusS(fS);

      setRestH(rH);
      setRestM(rM);
      setRestS(rS);

      setTimeout(() => {
        focusHoursRef.current?.scrollTo({ y: fH * ITEM_HEIGHT, animated: false });
        focusMinutesRef.current?.scrollTo({ y: fM * ITEM_HEIGHT, animated: false });
        focusSecondsRef.current?.scrollTo({ y: fS * ITEM_HEIGHT, animated: false });

        restHoursRef.current?.scrollTo({ y: rH * ITEM_HEIGHT, animated: false });
        restMinutesRef.current?.scrollTo({ y: rM * ITEM_HEIGHT, animated: false });
        restSecondsRef.current?.scrollTo({ y: rS * ITEM_HEIGHT, animated: false });
      }, 100);
    }
  }, [visible]);

  const handleScroll = (event, setter, dataLength) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    if (index >= 0 && index < dataLength) setter(index);
  };

  const renderColumn = (data, ref, value, setter) => (
    <ScrollView
      ref={ref}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      onScroll={(e) => handleScroll(e, setter, data.length)}
      scrollEventThrottle={16}
      style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}
      contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
    >
      {data.map((item) => (
        <View
          key={item}
          style={{
            height: ITEM_HEIGHT,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={[
              styles.scrollText,
              value === item && styles.activeScrollText,
            ]}
          >
            {String(item).padStart(2, "0")}
          </Text>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Edit Timer</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} />
            </TouchableOpacity>
          </View>

          {/* ========== FOCUS ========== */}
          <Text style={styles.sectionTitle}>Focus</Text>

          <View style={styles.selectorFrame}>
            <View style={styles.selectionLineTop} />
            <View style={styles.selectionLineBottom} />

            <View style={styles.timeRow}>
              {renderColumn(hoursData, focusHoursRef, focusH, setFocusH)}
              <Text style={styles.colon}>:</Text>
              {renderColumn(minsSecsData, focusMinutesRef, focusM, setFocusM)}
              <Text style={styles.colon}>:</Text>
              {renderColumn(minsSecsData, focusSecondsRef, focusS, setFocusS)}
            </View>
          </View>

          <Text style={styles.sectionTitle}>Rest</Text>

          <View style={styles.selectorFrame}>
            <View style={styles.selectionLineTop} />
            <View style={styles.selectionLineBottom} />

            <View style={styles.timeRow}>
              {renderColumn(hoursData, restHoursRef, restH, setRestH)}
              <Text style={styles.colon}>:</Text>
              {renderColumn(minsSecsData, restMinutesRef, restM, setRestM)}
              <Text style={styles.colon}>:</Text>
              {renderColumn(minsSecsData, restSecondsRef, restS, setRestS)}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => {
              onSave(
                { h: focusH, m: focusM, s: focusS },
                { h: restH, m: restM, s: restS }
              );
              onClose();
            }}
          >
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: MODAL_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  sectionTitle: {
    textAlign: "center",
    marginTop: 10,
    marginBottom: 6,
    fontWeight: "600",
  },

  timeRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },

  selectorFrame: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#000",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginBottom: 10,
    overflow: "hidden",
  },

  scrollText: {
    fontSize: 16,
    color: "#aaa",
  },

  activeScrollText: {
    fontSize: 22,
    color: "#000",
    fontWeight: "700",
  },

  colon: {
    fontSize: 18,
    marginHorizontal: 2,
  },

  saveButton: {
    marginTop: 8,
    backgroundColor: "#000",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  saveText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
