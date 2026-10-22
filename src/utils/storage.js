import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  getItem: async (key) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.error('AsyncStorage getItem error:', e);
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error('AsyncStorage setItem error:', e);
    }
  },
  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('AsyncStorage removeItem error:', e);
    }
  },
  clear: async () => {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error('AsyncStorage clear error:', e);
    }
  }
};
export default storage;
