import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { useRef, useState } from "react";
import { Alert, Button, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { Image } from "expo-image";
import Feather from "@expo/vector-icons/Feather";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { getItem, storeItem } from "../utils/storage";
import { useVideoPlayer, VideoView } from "expo-video";

export default function CameraScreen({ route, navigation }) {
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();

    const ref = useRef(null);
    const [uri, setUri] = useState(null);

    const [facing, setFacing] = useState("back");
    const [mode, setMode] = useState("image");
    const [isRecording, setIsRecording] = useState(false);

    const { data } = route.params;
    const player = useVideoPlayer(uri, (player) => {
        player.loop = true;
        player.play();
    });

    if (!cameraPermission || ! microphonePermission) {
        return null;
    }

    if (!cameraPermission.granted) {
        return (
        <View style={styles.container}>
            <Text style={{ textAlign: "center" }}>
                We need your permission to use the camera
            </Text>
            <Button onPress={requestCameraPermission} title="Grant permission" />
        </View>
        );
    }

    if (!microphonePermission.granted) {
        return (
            <View style={styles.container}>
                <Text style={{ textAlign: "center" }}>
                    We need your permission to use the microphone
                </Text>
                <Button onPress={requestMicrophonePermission} title="Grant permission" />
            </View>
        );
    }

    const takePicture = async () => {
        const photo = await ref.current?.takePictureAsync();
        if (photo?.uri) {
            setUri(photo.uri);
        }
    };

    const startRecording = async () => {
        if (ref.current) {
            setIsRecording(true);
            try {
                const video = await ref.current.recordAsync({
                    quality: '720p',
                    maxDuration: 60,
                });
                setUri(video.uri);
            } catch (error) {
                console.error('Error recording video:', error);
            } finally {
                setIsRecording(false);
            }
        }
    };

    const stopRecording = () => {
        if (ref.current) {
            ref.current.stopRecording();
            setIsRecording(false);
        }
    };

    const toggleFacing = () => {
        setFacing((prev) => (prev === "back" ? "front" : "back"));
    };

    const toggleMode = () => {
        setMode((prev) => (prev === "image" ? "video" : "image"))
    }

    const handleSave = async () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        const newNote = { ...data, notes: [...data.notes, { uri: uri, date: `${year}-${month}-${day}`, type: mode}] };

        const res = await getItem('folders');
        
        if (res) {
            const update = res.filter((item) => item.name !== data.name);
            update.push(newNote);
            await storeItem('folders', update);
        } else {
            Alert.alert(`Folder ${data.name} is not found.`);
        }

        setUri(null);
        navigation.goBack();
    }

    const renderEditView = (uri) => {
        return (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.previewContainer}>
                    <View style={styles.previewHeader}>
                        <TouchableOpacity onPress={() => setUri(null)}>
                        <Feather name="rotate-ccw" size={24} color="black" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleSave}>
                        <Feather name="check" size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.imageContainer}>
                        { mode === 'video' ? (
                            <VideoView 
                                style={styles.fullImg}
                                player={player}
                                contentFit="contain"
                                nativeControls
                            />
                        ) : (
                            <Image
                                source={{ uri }}
                                contentFit="contain"
                                style={styles.fullImg}
                            />
                        )}
                        
                    </View>
                </View>
            </TouchableWithoutFeedback>
        );
    };

    const renderCameraView = () => {
        return (
            <View style={styles.cameraContainer}>
                <CameraView
                    style={styles.camera}
                    ref={ref}
                    facing={facing}
                    mode={mode}
                    responsiveOrientationWhenOrientationLocked
                    zoom={0.1}
                />
                <View style={styles.modeContainer}>
                    { mode === 'video' ? (
                        <View style={styles.modeButtons}>
                        <TouchableOpacity onPress={toggleMode}>
                            <Feather name="camera" size={24} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.selectedModeButton}>
                            <Feather name="video" size={24} color="red" />
                        </TouchableOpacity>
                        </View>
                    ): (
                        <View style={styles.modeButtons}>
                        <TouchableOpacity style={styles.selectedModeButton}>
                            <Feather name="camera" size={24} color="black" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={toggleMode}>
                            <Feather name="video" size={24} color="white" />
                        </TouchableOpacity>
                        </View>
                    )}
                </View>
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Feather name="chevron-left" size={40} color="white" />
                    </TouchableOpacity>
                    { mode === 'video' ? (
                        <TouchableOpacity onPress={isRecording ? stopRecording : startRecording}>
                            {isRecording ? <MaterialCommunityIcons name="stop-circle-outline" size={64} color="red" /> : <FontAwesome name="circle" size={64} color="red" />}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={takePicture}>
                            <Feather name="circle" size={64} color="white" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={toggleFacing}>
                        <FontAwesome6 name="rotate-left" size={30} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {uri ? renderEditView(uri) : renderCameraView()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
    cameraContainer: StyleSheet.absoluteFillObject,
    camera: StyleSheet.absoluteFillObject,
    buttonsContainer: {
        position: 'absolute',
        bottom: 44,
        left: 0,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    previewContainer: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
    },
    previewHeader: {
        width: '100%',
        height: 100,
        borderBottomColor: 'lightgray',
        borderBottomWidth: 1,
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        padding: 20,
        flexDirection: 'row'
    },
    imageContainer: {
        flex: 1,
        marginTop: 20,
        width: '100%',
    },
    fullImg: {
        width: '100%',
        height: '90%'
    },
    modeContainer: {
        position: "absolute",
        bottom: 120,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 30,
    },
    modeButtons: {
        backgroundColor: 'lightgray',
        opacity: 0.5,
        borderRadius: 99,
        width: "30%",
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 5,
    },
});