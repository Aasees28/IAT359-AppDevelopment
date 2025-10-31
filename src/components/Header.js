import Feather from '@expo/vector-icons/Feather';
import { View, StyleSheet, Text, Touchable, TouchableOpacity } from "react-native";

export default function Header({ isBackOnly = false, title }) {
    return (
        <View style={styles.container}>
            { isBackOnly ? (
                <TouchableOpacity>
                    <Feather name="chevron-left" size={24} color="black" />
                </TouchableOpacity>
            ) : (
                <Text style={styles.title}>{title}</Text>
            )}
        </View>
    )
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        borderBottomColor: '#ddd',
        borderBottomWidth: 1,
        height: 50,
        justifyContent: 'center',
        paddingHorizontal: 20,
        marginTop: 50
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
    },
})