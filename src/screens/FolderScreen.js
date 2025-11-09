import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Keyboard, Modal, TextInput, TouchableWithoutFeedback } from "react-native";
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import DateTimePicker from '@react-native-community/datetimepicker';
import CheckBox from "react-native-check-box";
import Header from "../components/Header";
import { storeItem, getItem, clearAll, removeItem } from "../utils/storage";

export default function FolderScreen({ route }) {
    const [modalVisible, setModalVisible] = useState(false);
    const [todoModalVisible, setTodoModalVisible] = useState(false);
    const [newTodoName, setNewTodoName] = useState("");
    const [deadline, setDeadline] = useState(new Date());
    const [data, setData] = useState(route.params.item);

    const { name } = route.params.item;

    const navigation = useNavigation();

    useFocusEffect(
        useCallback(() => {
            (async () => {
                const res = await getItem("folders");
                if (res) {
                    const found = res.find((item) => item.name === name);
                    setData(found);
                }
            })();
        }, [])
    )

    const handleDeleteFolder = async () => {
        const storedFolders = await getItem("folders");
        const updatedFolders = storedFolders.filter(folder => folder.name !== name);
        console.log("Deleted folder ", updatedFolders);
        await storeItem("folders", updatedFolders);
        setModalVisible(false);
        navigation.goBack();
    }

    const createTodo = async () => {
        const res = await getItem("folders");
        
        const trimmedName = newTodoName.trim();
        if (!trimmedName) return;

        const newTodo = { name: trimmedName, date: deadline.toISOString().split('T')[0], checked: false };
        res.forEach((folder, i) => {
            if (folder.name === name) {
                res[i].todos.push(newTodo);
            }
        })
        
        await storeItem("folders", res);

        const found = res.find(f => f.name === name);
        setData(found);

        setTodoModalVisible(false);
        setNewTodoName("");
        setDeadline(new Date());
    }

    const onDeadlineChange = (e, selectedDate) => {
        if (e.type !== 'dismissed') {
            setDeadline(selectedDate || new Date());
        }
    }

    return (
        <View style={styles.container}>
            <Header isBackOnly />
            <View style={styles.header}>
                <Text style={styles.folderName}>📁{data.name}</Text>
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
                    <TouchableOpacity onPress={() => setTodoModalVisible(true)}>
                        <Feather name="plus-circle" size={24} color="black" />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.todosContainer}>
                    <View>
                        <View style={[styles.statusTag, { backgroundColor: '#FFEFE0' }]}>
                            <Text style={styles.statusText}>In progress</Text>
                        </View>
                        {data.todos.map((todo, i) => 
                            {return !(todo.checked) && (<View key={i} style={styles.todoContainer}>
                                <CheckBox
                                    isChecked={todo.checked}
                                    onClick={() => {}}
                                    checkedImage={<MaterialIcons name="check-box" size={28} color="black" />}
                                    unCheckedImage={<MaterialIcons name="check-box-outline-blank" size={28} color="black" />}
                                />
                                <Text style={styles.todoName}>{todo.name} | {todo.date}</Text>
                            </View>)}
                        )}
                    </View>
                    
                    <View style={{ marginTop: 20 }}>
                        <View style={[styles.statusTag, { backgroundColor: '#C9F0CF' }]}>
                            <Text style={styles.statusText}>Done</Text>
                        </View>
                        {data.todos.map((todo, i) => 
                            {return todo.checked && (<View key={i} style={styles.todoContainer}>
                                <CheckBox
                                    isChecked={todo.checked}
                                    onClick={() => {}}
                                    checkedImage={<MaterialIcons name="check-box" size={28} color="black" />}
                                    unCheckedImage={<MaterialIcons name="check-box-outline-blank" size={28} color="black" />}
                                />
                                <Text style={styles.todoName}>{todo.name} | {todo.date}</Text>
                            </View>)}
                        )}
                    </View>
                    
                </View>
            </View>

            {/* Setting modal */}
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
            
            {/* Create todo modal */}
            <Modal
                transparent={true}
                visible={todoModalVisible}
                onRequestClose={() => {
                    setTodoModalVisible(!todoModalVisible);
                }}
            >
                <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Add Todo</Text>
                            </View>
                            <View>
                                <Text>Todo name:</Text>
                                <TextInput 
                                    value={newTodoName}
                                    onChangeText={setNewTodoName}
                                    style={styles.input}
                                />
                            </View>
                            <View style={{ marginTop: 10,}}>
                                <Text>Deadline:</Text>
                                <DateTimePicker
                                    value={deadline ?? new Date()}
                                    mode='date'
                                    onChange={onDeadlineChange}
                                    style={styles.datePicker}
                                />
                            </View>
                            
                            <View style={styles.modalButtonContainer}>
                                <TouchableOpacity style={styles.modalCreateButton} onPress={createTodo}>
                                    <Text style={styles.modalButtonText}>Create</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalBackButton} onPress={() => setTodoModalVisible(false)}>
                                    <Text style={styles.modalButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View> 
    )
}

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        margin: 10,
        marginHorizontal: 20,
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
        marginHorizontal: 20,
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
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    modalButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    modalButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 5,
        marginTop: 20,
    },
    input: {
        backgroundColor: "#f0f0f0",
        padding: 10,
        borderRadius: 5,
        marginTop: 5,
    },
    modalCreateButton: {
        width: '50%',
        padding: 10,
        alignItems: 'center',
        backgroundColor: '#000',
        borderRadius: 5,
    },
    modalBackButton: {
        width: '50%',
        padding: 10,
        alignItems: 'center',
        backgroundColor: '#a1a1a1',
        borderRadius: 5,
    },
    modalDeleteButton: {
        width: '100%',
        marginVertical: 10,
        padding: 10,
        alignItems: 'center',
        backgroundColor: '#cf190c',
        borderRadius: 5,
    },
    modalCancelButton: {
        width: '100%',
        padding: 10,
        alignItems: 'center',
        backgroundColor: '#a1a1a1',
        borderRadius: 5,
    },
    todosContainer: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    statusTag: {
        paddingVertical: 2,
        paddingHorizontal: 8,
        alignSelf: 'flex-start',
        borderRadius: 99,
        marginLeft: 10,
        marginBottom: 10,
    },
    statusText: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    todoContainer: {
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    todoName: {
        
    },
    datePicker: {
        marginTop: 5,
    }
});