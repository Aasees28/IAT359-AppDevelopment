// FULL IMAGEGRIDSCREEN CODE
// (Same as previous version — only formatting dates)
// The REAL fix happens when saving images, not here.

import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Alert,
    FlatList
} from "react-native";
import { Image } from "expo-image";
import Feather from "@expo/vector-icons/Feather";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getItem, storeItem } from "../utils/storage";
import { useVideoPlayer, VideoView } from "expo-video";

export default function ImageGridScreen() {
    const navigation = useNavigation();
    const route = useRoute();

    const { images, folderName } = route.params;

    const [list, setList] = useState([]);
    const [selected, setSelected] = useState(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setList(images || []);
        console.log("Sample items:", images?.slice(0, 5));
        console.log("One item:", images?.[0]);
        
    }, [images]);

    function VideoThumb({ uri }) {
        const player = useVideoPlayer(uri);
        return (
            <View style={styles.videoContainer}>
                <VideoView
                    player={player}
                    style={styles.thumbFill}
                    contentFit="cover"
                    nativeControls={false}
                    pointerEvents="none"
                />
                <View style={styles.playOverlay}>
                    <Feather name="play" size={30} color="white" />
                </View>
            </View>
        );
    }

    function FullScreenVideo({ uri }) {
        const player = useVideoPlayer(uri);
        return (
            <VideoView
                player={player}
                style={styles.expanded}
                contentFit="contain"
                nativeControls
            />
        );
    }

    const openItem = (item) => {
        setSelected(item);
        setVisible(true);
    };

    const deleteItem = async () => {
        Alert.alert("Delete", "Delete this item?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    const filtered = list.filter(i => i.uri !== selected.uri);
                    setList(filtered);

                    const folders = await getItem("folders");
                    folders.forEach(folder => {
                        if (folder.name === folderName) {
                            folder.notes = filtered;
                        }
                    });
                    await storeItem("folders", folders);

                    navigation.setParams({ images: filtered });

                    setVisible(false);
                    setSelected(null);
                }
            }
        ]);
    };

const formatDate = (input) => {
  if (!input) return "";

  // CASE 1: input is "YYYY-MM-DD"
  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [_, y, m, d] = match;
    const date = new Date(Number(y), Number(m) - 1, Number(d)); // local date
    return date.toLocaleDateString("en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // CASE 2: input is ISO timestamp or epoch
  const parsed = Date.parse(input);
  if (!isNaN(parsed)) {
    const date = new Date(parsed);
    return date.toLocaleString("en-CA", {
      timeZone: "America/Vancouver",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  return "";
};



    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={26} color="black" />
                </TouchableOpacity>
                <Text style={styles.title}>All Images</Text>
            </View>

            <FlatList
                data={list}
                keyExtractor={(item) => item.uri}
                numColumns={3}
                columnWrapperStyle={{ gap: 10 }}
                contentContainerStyle={{ padding: 10, gap: 10 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => openItem(item)}
                            style={{ width: 110, alignItems: "center" }}
                        >
                            <View style={styles.thumbBox}>
                                {item.type === "video" ? (
                                    <VideoThumb uri={item.uri} />
                                ) : (
                                    <Image
                                        source={{ uri: item.uri }}
                                        style={styles.thumbFill}
                                        contentFit="cover"
                                    />
                                )}
                            </View>

                            {/* Show date it was taken */}
                            <Text style={styles.dateText}>
                                {formatDate(item.date)}
                            </Text>
                        </TouchableOpacity>
                    )}


            />

            <Modal visible={visible} transparent>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={deleteItem}>
                            <Feather name="trash-2" size={26} color="red" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setVisible(false)}>
                            <Feather name="x" size={28} color="black" />
                        </TouchableOpacity>
                    </View>

                    {selected && (
                        <View style={{ width: "100%", alignItems: "center" }}>
                            <Text style={styles.fullscreenDateText}>
                                {formatDate(selected.date)}
                            </Text>

                            {selected.type === "video" ? (
                                <FullScreenVideo uri={selected.uri} />
                            ) : (
                                <Image
                                    source={{ uri: selected.uri }}
                                    style={styles.expanded}
                                    contentFit="contain"
                                />
                            )}
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 15,
        padding: 15,
        paddingTop: 50,
    },
    title: { fontSize: 20, fontWeight: "bold" },

    thumbBox: {
        width: 110,
        height: 110,
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: "#eee",
    },

    thumbFill: { width: "100%", height: "100%" },

    dateText: {
        fontSize: 11,
        color: "#555",
        marginTop: 4,
        textAlign: "center",
    },

    fullscreenDateText: {
        fontSize: 14,
        color: "#333",
        marginBottom: 8,
        fontWeight: "500",
    },

    videoContainer: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
    },

    playOverlay: {
        position: "absolute",
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.25)",
    },

    modalContainer: {
        flex: 1,
        backgroundColor: "#fff",
        paddingTop: 50,
        alignItems: "center",
    },

    modalHeader: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        marginBottom: 10,
    },

    expanded: {
        width: "100%",
        height: "85%",
    },
});
