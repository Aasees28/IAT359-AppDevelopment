import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Keyboard, Modal, TextInput, Button, TouchableWithoutFeedback, Alert, Platform } from "react-native";
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import CheckBox from "react-native-check-box";
import { Image } from "expo-image";
import Header from "../components/Header";
import { storeItem, getItem, clearAll, removeItem } from "../utils/storage";
import { launchImageLibraryAsync, requestMediaLibraryPermissionsAsync } from 'expo-image-picker';
import { useVideoPlayer, VideoView } from "expo-video";

// import { Zoomable } from "@likashefqet/react-native-image-zoom";

export default function FolderScreen({ navigation, route }) {
    const [modalVisible, setModalVisible] = useState(false);
    const [todoModalVisible, setTodoModalVisible] = useState(false);
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [newTodoName, setNewTodoName] = useState("");
    const [deadline, setDeadline] = useState(null);
    const [showDeadline, setShowDeadline] = useState(false);
    const [data, setData] = useState(route.params.item);
    const [selectedImage, setSelectedImage] = useState(null);
    const { name } = route.params.item;

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
        await storeItem("folders", updatedFolders);
        setModalVisible(false);
        navigation.goBack();
    }

    const showDatepicker = () => {
        DateTimePickerAndroid.open({
            value: new Date(),
            onChange: onDateChange,
            mode: 'date',
        }); 
        
    }

    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate;
        setShowDeadline(false);
        setDeadline(currentDate);
    };

    const pickImage = async () => {
        const permissionResult = await requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Permission required', 'We need your permission to use the media library.');
            return;
        }

        let result = await launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const updated = { ...data, notes: [...data.notes, { uri: result.assets[0].uri, type: result.assets[0].type, date: `${year}-${month}-${day}` }] };

            setData(updated);
            const res = await getItem("folders");
            res.forEach((folder, i) => {
                if (folder.name === data.name) {
                    res[i] = updated;
                }
            });

            await storeItem("folders", res);
        }
    };

    const onImageClick = (image) => {
        setSelectedImage(image);
        setImageModalVisible(true);
    }

    const createTodo = async () => {
        const res = await getItem("folders");
        
        const trimmedName = newTodoName.trim();
        if (!trimmedName) {
            Alert.alert("Todo name cannot be empty.");
            return;
        };

        const newTodo = { name: trimmedName, date: formatDate(), checked: false };
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

    const formatDate = () => {
        const offset = deadline.getTimezoneOffset() * 60000;
        const local = new Date(deadline.getTime() - offset);
        return local.toISOString().split('T')[0];
    }

    const onDeadlineChange = (e, selectedDate) => {
        if (e.type !== 'dismissed') {
            setDeadline(selectedDate || new Date());
        }
    }

    const onCheck = async (todoItem) => {
        const updated = data.todos.map(todo => {
            if (todo.name === todoItem.name && todo.date === todoItem.date) {
                return { ...todo, checked: !todo.checked };
            } else {
                return todo;
            }
        })

        setData({ ...data, todos: updated });
        
        const res = await getItem("folders");
        res.forEach((folder, i) => {
            if (folder.name === data.name) {
                res[i].todos = updated;
            }
        });

        await storeItem("folders", res);
    }
    
    const resetTodoInput = () => {
        setDeadline(null);
        setNewTodoName("");
        setShowDeadline(false);
        setTodoModalVisible(false);
    }

    function VideoPreview({ uri, style, contentFit }) {
        const player = useVideoPlayer(uri);
        
        return (
            <VideoView
                player={player}
                style={style ? style : styles.expanded}
                contentFit={ contentFit ? contentFit : "contain"}
                nativeControls
            />
        );
    }

    return (
        <View style={styles.container}>
            <Header isBackOnly />
            <View style={styles.header}>
                <Text style={styles.folderName}>📁 {data.name}</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                    <Feather name="more-vertical" size={24} color="black" />
                </TouchableOpacity>
            </View>
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.title}>📖 Lecture note / photo</Text>
                    <View style={styles.buttonContainers}>
                        <TouchableOpacity onPress={() => navigation.navigate('Camera' , { data })}>
                            <Feather name="camera" size={24} color="black" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={pickImage}>
                            <Feather name="image" size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                </View>
                
                {/* photo previews / gallery here */}
                <View style={styles.photosContainer}>
                    {data.notes && data.notes.map((item, i) => (
                        <TouchableOpacity key={i} onPress={() => onImageClick(item)}>
                            { item.type === 'video' ? (
                                <VideoPreview uri={item.uri} style={styles.image} contentFit="cover" />
                            ) : (
                                <Image
                                    source={{ uri: item.uri }}
                                    contentFit="cover"
                                    style={styles.image}
                                />
                            )}
                        </TouchableOpacity>
                    ))}                    
                </View>
            </View>
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.title}>✒️ Todo</Text>
                    <TouchableOpacity onPress={() => setTodoModalVisible(true)}>
                        <Feather name="plus-circle" size={24} color="black" />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.todosContainer}>
                    <View>
                        <View style={[styles.statusTag, { backgroundColor: '#FFEFE0' }]}>
                            <Text style={styles.statusText}>In progress</Text>
                        </View>
                        {data.todos && data.todos.map((todo, i) => 
                            {return !(todo.checked) && (
                            <View key={i} style={styles.todoContainer}>
                                <CheckBox
                                    isChecked={todo.checked}
                                    onClick={() => onCheck(todo)}
                                    checkedImage={<MaterialIcons name="check-box" size={28} color="black" />}
                                    unCheckedImage={<MaterialIcons name="check-box-outline-blank" size={28} color="black" />}
                                />
                                <View style={styles.todoContent}>
                                    <Text style={styles.todoName}>{todo.name}</Text>
                                    <Text style={styles.todoDate}>{todo.date}</Text>
                                </View>
                            </View>)}
                        )}
                    </View>
                    
                    <View style={{ marginTop: 20 }}>
                        <View style={[styles.statusTag, { backgroundColor: '#C9F0CF' }]}>
                            <Text style={styles.statusText}>Done</Text>
                        </View>
                        {data.todos && data.todos.map((todo, i) => 
                            {return todo.checked && (
                            <View key={i} style={styles.todoContainer}>
                                <CheckBox
                                    isChecked={todo.checked}
                                    onClick={() => onCheck(todo)}
                                    checkedImage={<MaterialIcons name="check-box" size={28} color="black" />}
                                    unCheckedImage={<MaterialIcons name="check-box-outline-blank" size={28} color="black" />}
                                />
                                <View style={styles.todoContent}>
                                    <Text style={styles.todoName}>{todo.name}</Text>
                                    <Text style={styles.todoDate}>{todo.date}</Text>
                                </View>
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
                            <View style={styles.todoModalHeader}>
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
                            <View style={{ marginTop: 10 }}>
                                <Text>Deadline:</Text>
                                { Platform.OS === 'ios' ? (
                                    <DateTimePicker
                                        value={deadline ?? new Date()}
                                        mode='date'
                                        display="compact"
                                        onChange={onDeadlineChange}
                                        style={styles.datePickerCalendar}
                                    />
                                ) : (
                                    <TouchableOpacity onPress={showDatepicker} >
                                        <Text style={styles.input}>{deadline ? formatDate() : 'Select date'}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            
                            <View style={styles.modalButtonContainer}>
                                <TouchableOpacity style={styles.modalCreateButton} onPress={createTodo}>
                                    <Text style={styles.modalButtonText}>Create</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalBackButton} onPress={resetTodoInput}>
                                    <Text style={styles.modalButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* expand image */}
            { selectedImage &&
                <Modal
                    transparent={true}
                    visible={imageModalVisible}
                    onRequestClose={() => {
                        setImageModalVisible(!imageModalVisible);
                    }}
                >
                    <View style={styles.imageModalContainer}>
                        <View style={styles.imageModalContent}>
                            <View style={styles.modalHeader}>
                                <View style={styles.modalTitleContainer}>
                                    <Text style={styles.modalTitle}>{data.name}</Text>
                                    <Text style={styles.modalSubtitle}>{selectedImage.date}</Text>
                                </View>
                                <TouchableOpacity onPress={() => setImageModalVisible(false)}>
                                    <Feather name="x" size={24} color="black" />
                                </TouchableOpacity>
                            </View>
                            { selectedImage && (selectedImage.type === 'video' ? (
                                <VideoPreview uri={selectedImage.uri} />
                            ) : (
                                // <Zoomable isDoubleTapEnabled>
                                    <Image
                                        source={{ uri: selectedImage.uri}}
                                        contentFit="contain"
                                        style={styles.expanded}
                                    />
                                // </Zoomable>
                                
                            ))}
                        </View>
                    </View>
                </Modal>
            }
        </View> 
    )
}

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        marginVertical: 20,
        marginHorizontal: 20,
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
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonContainers: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },  
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    imageModalContainer: {
        flex: 1,
        paddingTop: 40,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    modalContent: {
        width: 300,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10, 
    },
    imageModalContent: {
        width: '100%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    todoModalHeader: {
        paddingBottom: 20,
    },
    modalTitleContainer: {
        flexDirection: 'column',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
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
        marginBottom: 12,
    },
    statusText: {
        fontWeight: 'bold',
        color: '#333',
        fontSize: 14,
    },
    todoContainer: {
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    todoContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flex: 1,
    },
    todoName: {
        fontSize: 16
    },
    todoDate: {
        color: '#666', 
        fontSize: 12,
    },
    datePicker: {
        marginTop: 5,
    },
    datePickerCalendar: {
        marginTop: 10,
        marginLeft: -5,
    },
    photosContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 8,
    },
    expanded: {
        width: '100%',
        aspectRatio: 1,
    }
});