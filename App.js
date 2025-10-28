import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SignupScreen from './src/screens/SignupScreen.js';
import WelcomeScreen from './src/screens/WelcomeScreen.js';

const Stack = createNativeStackNavigator();

export default function App() {
  const isWeb = Platform.OS === 'web';

  return (
    <View style={isWeb ? styles.page : styles.mobilePage}>
      {isWeb && <View style={styles.phoneFrame} />}
      <View style={isWeb ? styles.screen : styles.mobileScreen}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Signup">
            <Stack.Screen
              name="Signup"
              component={SignupScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Welcome"
              component={WelcomeScreen}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    height: '100vh',
    paddingVertical: 40, // <-- top & bottom padding added
  },
  mobilePage: {
    flex: 1,
    backgroundColor: '#fff',
  },
  phoneFrame: {
    position: 'absolute',
    width: 375, // iPhone X width
    height: 812,
    borderRadius: 40,
    borderWidth: 12,
    borderColor: '#000',
    backgroundColor: '#000',
    boxShadow: '0px 10px 30px rgba(0,0,0,0.3)',
    paddingBottom: 60,
  },
  screen: {
    width: 375,
    height: 812,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  mobileScreen: {
    flex: 1,
  },
});
