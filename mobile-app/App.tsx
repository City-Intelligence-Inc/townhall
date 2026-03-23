import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkProvider } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import { tokenCache } from './src/hooks/useTokenCache';
import AppNavigator from './src/navigation/AppNavigator';

const CLERK_KEY =
  Constants.expoConfig?.extra?.clerkPublishableKey ??
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ??
  '';

export default function App() {
  return (
    <ClerkProvider publishableKey={CLERK_KEY} tokenCache={tokenCache}>
      <SafeAreaProvider>
        <AppNavigator />
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
