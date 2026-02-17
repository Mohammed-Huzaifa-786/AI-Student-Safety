import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
// Note: commented out to avoid initializing native worklets in Expo Go during dev.
// import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { UserProvider, useUser } from '../context/UserContext';
import { useEffect } from 'react';

export const unstable_settings = {
  anchor: '(tabs)',
};

// -------------------------------
// 🔐 AUTH GATE FOR LOGIN CHECK
// -------------------------------
function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useUser() as any;

  useEffect(() => {
    if (loading) return; // still resolving auth
    if (!user) {
      requestAnimationFrame(() => router.replace('/login'));
    }
  }, [loading, user]);

  if (loading) return null;

  return <>{children}</>;
}

// -------------------------------
// ROOT LAYOUT
// -------------------------------
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <UserProvider>
        
        {/* All screens wrapped inside auth gate */}
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
        </AuthGate>

      </UserProvider>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
