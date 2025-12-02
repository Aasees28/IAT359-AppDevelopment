import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  LayoutAnimation,
  UIManager,
  Platform,
} from "react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HistoryModal({ visible, onClose, logs }) {
  const [openFolders, setOpenFolders] = useState({});
  const [openFocus, setOpenFocus] = useState({});
  const [openRest, setOpenRest] = useState({});

  // Group logs by folder
  const folderGroups = logs?.reduce((acc, log) => {
    if (!acc[log.folder]) acc[log.folder] = [];
    acc[log.folder].push(log);
    return acc;
  }, {}) || {};

  // toggles for dropdowns
  const toggleFolder = (folder) => {
    LayoutAnimation.easeInEaseOut();
    setOpenFolders((prev) => ({ ...prev, [folder]: !prev[folder] }));
  };

  const toggleFocus = (folder) => {
    LayoutAnimation.easeInEaseOut();
    setOpenFocus((prev) => ({ ...prev, [folder]: !prev[folder] }));
  };

  const toggleRest = (folder) => {
    LayoutAnimation.easeInEaseOut();
    setOpenRest((prev) => ({ ...prev, [folder]: !prev[folder] }));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.title}>Timer History</Text>

          {logs && logs.length > 0 ? (
            <FlatList
              data={Object.keys(folderGroups)}
              keyExtractor={(folder) => folder}
              renderItem={({ item: folder }) => {
                const folderLogs = folderGroups[folder];
                const focusLogs = folderLogs.filter((l) => l.sessionType === "focus");
                const restLogs = folderLogs.filter((l) => l.sessionType === "rest");

                return (
                  <View style={styles.folderBox}>
                    {/* Folder Header */}
                    <TouchableOpacity
                      style={styles.folderHeader}
                      onPress={() => toggleFolder(folder)}
                    >
                      <Text style={styles.folderTitle}>
                        {openFolders[folder] ? "▼" : "▶"} {folder}
                      </Text>
                    </TouchableOpacity>

                    {/* Folder Expanded */}
                    {openFolders[folder] && (
                      <View style={{ paddingLeft: 10 }}>

                        {/* Focus Dropdown */}
                        <TouchableOpacity
                          style={styles.subHeader}
                          onPress={() => toggleFocus(folder)}
                        >
                          <Text style={styles.subTitle}>
                            {openFocus[folder] ? "▼" : "▶"} Focus Sessions ({focusLogs.length})
                          </Text>
                        </TouchableOpacity>

                        {openFocus[folder] &&
                          focusLogs.map((log, i) => (
                            <View key={i} style={styles.item}>
                              <Text style={styles.date}>{log.date} at {log.time}</Text>
                              <Text style={styles.details}>Minutes: {log.minutes}</Text>
                            </View>
                          ))}

                        {/* Rest Dropdown */}
                        <TouchableOpacity
                          style={styles.subHeader}
                          onPress={() => toggleRest(folder)}
                        >
                          <Text style={styles.subTitle}>
                            {openRest[folder] ? "▼" : "▶"} Rest Sessions ({restLogs.length})
                          </Text>
                        </TouchableOpacity>

                        {openRest[folder] &&
                          restLogs.map((log, i) => (
                            <View key={i} style={styles.item}>
                              <Text style={styles.date}>{log.date} at {log.time}</Text>
                              <Text style={styles.details}>Minutes: {log.minutes}</Text>
                            </View>
                          ))}

                      </View>
                    )}
                  </View>
                );
              }}
            />
          ) : (
            <Text style={{ marginTop: 20, fontSize: 16 }}>No history yet</Text>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeTxt}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalBox: {
    width: "85%",
    height: "75%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },

  folderBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: "#f5f5f5",
  },
  folderHeader: {
    padding: 12,
    backgroundColor: "#e5e5e5",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  folderTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  subHeader: {
    paddingVertical: 8,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: "600",
  },

  item: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginVertical: 5,
  },
  date: {
    fontWeight: "700",
    marginBottom: 2,
  },
  details: {
    fontSize: 14,
  },

  closeBtn: {
    marginTop: 15,
    backgroundColor: "#111",
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeTxt: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
});
