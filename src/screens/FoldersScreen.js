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
            if (storedFolders) {
                setFolders(storedFolders);
            }
        })();
    }, [folders]);

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
                              </View>
                              <View style={{ marginTop: 20 }}>
                                  <Text>Folder name:</Text>
                                  <TextInput onChangeText={setNewFolderName} style={styles.inputContainer} value={newFolderName} />
                              </View>
                              {/* folder color selection here */}
                              <View style={styles.buttonContainer}>
                                    <TouchableOpacity style={styles.modalButton} onPress={addFolder}>
                                        <Text>Create</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                                        <Text>Cancel</Text>
                                    </TouchableOpacity>
                              </View>
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
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
    },
    modalButton: {
        flex: 1,
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