import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import Header from "../components/Header";
import Folder from "../components/Folder";
import { storeItem, getItem, removeItem } from "../utils/storage";

export default function FoldersScreen() {
  const [folders, setFolders] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [activeFolder, setActiveFolder] = useState(null);

  useEffect(() => {
    (async () => {
      const storedFolders = await getItem("folders");
      if (storedFolders) {
        setFolders(storedFolders);
      }
    })();
  }, [folders]);

  // Add folder
  const addFolder = async () => {
    const trimmedName = newFolderName.trim();
    if (!trimmedName) return;

    const newFolder = { name: trimmedName, todos: [], notes: [] };
    const updatedFolders = [...folders, newFolder];

    setFolders(updatedFolders);
    setModalVisible(false);
    setNewFolderName("");

    await storeItem("folders", updatedFolders);
  };

  // Delete single folder
  const deleteFolder = async (name) => {
    const updatedFolders = folders.filter((f) => f.name !== name);
    setFolders(updatedFolders);
    await storeItem("folders", updatedFolders);

    if (activeFolder === name) {
      await removeItem("activeFolder");
      setActiveFolder(null);
    }
  };

  // Delete all folders
  const deleteAllFolders = async () => {
    Alert.alert(
      "Delete All Folders",
      "Are you sure you want to delete all folders?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await removeItem("folders");
              await removeItem("activeFolder");
              setFolders([]);
              setActiveFolder(null);
              Alert.alert("Deleted", "All folders have been deleted.");
            } catch (error) {
              console.error("Error deleting folders:", error);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Folders" />

      {/* Folder list */}
      <View style={styles.foldersContainer}>
        <FlatList
          data={folders}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <Folder item={item} onDelete={() => deleteFolder(item.name)} />
          )}
        />
      </View>

      {/* Floating Add Folder Button */}
      <TouchableOpacity style={styles.addFolder} onPress={() => setModalVisible(true)}>
        <Feather name="folder-plus" size={24} color="black" />
      </TouchableOpacity>

      {/* Delete All Button */}
      {folders.length > 0 && (
        <TouchableOpacity
          style={styles.fixedDeleteAllButton}
          onPress={deleteAllFolders}
        >
          <Feather name="trash-2" size={22} color="black" />
        </TouchableOpacity>
      )}

      {/* Add Folder Modal */}
      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Folder</Text>
              </View>
              <View style={{ marginTop: 20 }}>
                <Text>Folder name:</Text>
                <TextInput
                  onChangeText={setNewFolderName}
                  style={styles.inputContainer}
                  value={newFolderName}
                />
              </View>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: "#000" }]}
                  onPress={addFolder}
                >
                  <Text style={{ color: '#fff' }}>Create</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  addFolder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#c7edf2",
    position: "absolute",
    right: 30,
    bottom: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  fixedDeleteAllButton: {
    position: "absolute",
    left: 30,
    bottom: 30,
    backgroundColor: "#fddede",
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  foldersContainer: {
    paddingBottom: 200,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  inputContainer: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
});
