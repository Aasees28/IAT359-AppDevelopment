import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Feather from '@expo/vector-icons/Feather';
import { useNavigation } from "@react-navigation/native";

export default function Folder({ item }) {
    const navigation = useNavigation();
    const openFolder = () => {
        navigation.navigate('FolderScreen', { item });
    }
    return (
        <View>
            <TouchableOpacity onPress={openFolder} style={styles.container}>
                <Text>{item.name}</Text>
                <View style={styles.loadMore}>
                    <Text>{item.data.length}</Text>
                    <Feather name="chevron-right" size={24} color="black" />
                </View>
            </TouchableOpacity>
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
    loadMore:{
        flexDirection: 'row',
        alignItems: 'center',
    }
});