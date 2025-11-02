import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeItem = async (key, value) => {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error("Error storing date:", e);
    }
}

export const getItem = async (key) => {
    try {
        const value = await AsyncStorage.getItem(key);
        return value != null ? JSON.parse(value) : null;
    } catch (e) {
        console.error("Error retrieving item:", e);
    }
}

export const removeItem = async (key) => {
    try {
        await AsyncStorage.removeItem(key);
    } catch (e) {
        console.error("Error removing item:", e);
    }
}

export const clearAll = async () => {
    try {
        await AsyncStorage.clear();
    } catch (e) {
        console.error("Error clearing storage:", e);
    }  
}