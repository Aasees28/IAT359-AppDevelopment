import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, Image, FlatList } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getItem, storeItem } from "../utils/storage";

export default function ImageGridScreen({ route, navigation }) {
    const [data, setData] = useState(route.params.folder);

    // Reload folder on screen focus
useFocusEffect(
    useCallback(() => {
        (async () => {
            const folders = await getItem("folders");
            const found = folders.find(f => f.name === route.params.folderName);

            if (found) {
                setImages(found.notes);   // refresh grid
            }
        })();
    }, [])
);

    const deleteItem = async (index) => {
        const updated = {
            ...data,
            notes: data.notes.filter((_, i) => i !== index)
        };

        setData(updated);

        const folders = await getItem("folders");
        const idx = folders.findIndex(f => f.name === data.name);
        folders[idx] = updated;
        await storeItem("folders", folders);
    };

    const openItem = (item) => {
        navigation.navigate("viewer", { item });
    };

    return (
        <View style={{ flex: 1, padding: 10 }}>

            <FlatList
                data={data.notes}
                keyExtractor={(_, i) => i.toString()}
                numColumns={3}
                renderItem={({ item, index }) => (
                    <TouchableOpacity
                        onPress={() => openItem(item)}
                        onLongPress={() => deleteItem(index)}
                        style={{
                            width: "32%",
                            margin: "1%",
                            backgroundColor: "#eee",
                            borderRadius: 8
                        }}
                    >
                        <Image
                            source={{ uri: item.uri }}
                            style={{ width: "100%", height: 100, borderRadius: 8 }}
                        />
                        <Text style={{ fontSize: 12, textAlign: "center", marginVertical: 4 }}>
                            {item.date}
                        </Text>
                    </TouchableOpacity>
                )}
            />

        </View>
    );
}
