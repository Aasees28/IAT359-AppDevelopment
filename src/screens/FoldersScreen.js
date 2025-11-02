import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Modal, TextInput, TouchableWithoutFeedback, Keyboard } from "react-native";
import Feather from '@expo/vector-icons/Feather';
import Header from "../components/Header";
import Folder from "../components/Folder";
import { storeItem, getItem, clearAll, removeItem } from "../utils/storage";

export default function FolderScreen() {
    const [folder, setFolder] = useState(null);
    const [folders, setFolders] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    useEffect(() => {
        (async () => {
            const storedFolders = await getItem("folders");
            console.log("Fetched folders:", storedFolders);
            if (storedFolders) {
                setFolders(storedFolders);
            }
        })();
    }, []);

    const addFolder = async () => {
        if (!newFolderName.trim()) return;

        const newFolder = { name: newFolderName.trim(), data: [] };
        const updatedFolders = [...folders, newFolder];

        setFolders(updatedFolders);
        setModalVisible(false);
        setNewFolderName("");

        await storeItem("folders", updatedFolders);

        console.log("Added folder:", updatedFolders);
    };

    const onAddFolder = () => {
        setModalVisible(true);
    }

    return (
        <View style={styles.container}>
            <Header title={"Folder"}/>
            <View>
                <Modal
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => {
                        setModalVisible(!modalVisible);
                    }}
                >
                    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                        <View style={styles.modalContainer}>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                  <Text style={styles.modalTitle}>Add folder</Text>
                                  <TouchableOpacity title="Hide Modal" onPress={() => setModalVisible(false)}>
                                      <Feather name="x" size={24} color="black" />
                                  </TouchableOpacity>
                              </View>
                              <View style={{ marginTop: 20 }}>
                                  <Text>Folder name:</Text>
                                  <TextInput onChangeText={setNewFolderName} style={styles.inputContainer} value={newFolderName} />
                              </View>
                              {/* folder color selection here */}
                              <TouchableOpacity style={styles.createFolderButton} onPress={addFolder}>
                                <Text>Create</Text>
                              </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
 
                <View style={styles.foldersContainer}>
                  <FlatList
                    data={folders}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                      <Folder item={item} />
                    )}
                  />
                </View>
            </View>
            <TouchableOpacity style={styles.addFolder} onPress={onAddFolder}>
                <Feather name="folder-plus" size={24} color="black" />
            </TouchableOpacity>
        </View>
    );
}

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    addFolder: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#c7edf2",
        position: 'absolute',
        right: 30,
        bottom: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    createFolderButton: {
        marginVertical: 20,
        padding: 10,
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    foldersContainer: {
        paddingBottom: 258,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: 300,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10, 
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    inputContainer: {
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 5,
    }
});