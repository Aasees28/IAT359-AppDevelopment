import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Keyboard, Modal, TextInput, TouchableWithoutFeedback } from "react-native";
import Feather from '@expo/vector-icons/Feather';
import { useNavigation } from "@react-navigation/native";
import Header from "../components/Header";
import { storeItem, getItem, clearAll, removeItem } from "../utils/storage";

export default function FolderScreen({ route }) {
    const [modalVisible, setModalVisible] = useState(false);
    const navigation = useNavigation();
    const { item } = route.params;

    const handleDeleteFolder = async () => {
        const storedFolders = await getItem("folders");
        const updatedFolders = storedFolders.filter(folder => folder.name !== item.name);
        console.log("Deleted folder ", updatedFolders);
        await storeItem("folders", updatedFolders);
        setModalVisible(false);
        navigation.goBack();
    }

    return (
        <View>
            <Header isBackOnly />
            <View style={styles.header}>
                <Text style={styles.folderName}>📁{item.name}</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                    <Feather name="more-vertical" size={24} color="black" />
                </TouchableOpacity>
            </View>
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.title}>📖Lecture note / photo</Text>
                    <TouchableOpacity onPress={() => {}}>
                        <Feather name="plus-circle" size={24} color="black" />
                    </TouchableOpacity>
                </View>
                
                {/* photo previews / gallery here */}
            </View>
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.title}>✒️Todo</Text>
                    <TouchableOpacity onPress={() => {}}>
                        <Feather name="plus-circle" size={24} color="black" />
                    </TouchableOpacity>
                </View>
                
                {/* todo list here */}
            </View>

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
                                <Text style={styles.modalTitle}>Setting</Text>
                            </View>
                            <TouchableOpacity style={styles.modalDeleteButton} onPress={handleDeleteFolder}>
                                <Text style={styles.modalButtonText}>Delete this folder</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setModalVisible(false)}>
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View> 
    )
}

export const styles = StyleSheet.create({
    container: {
        marginHorizontal: 10,
        marginVertical: 8,
        backgroundColor: '#fffef5',
        borderRadius: 5,
        padding: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    header: {
        margin: 10,
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    folderName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    section: {
        marginTop: 10,
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
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
    modalDeleteButton: {
        width: '100%',
        marginVertical: 10,
        padding: 10,
        alignItems: 'center',
        backgroundColor: '#cf190c',
        borderRadius: 5,
    },
    modalButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    modalCancelButton: {
        width: '100%',
        padding: 10,
        alignItems: 'center',
        backgroundColor: '#a1a1a1',
        borderRadius: 5,
    },
});