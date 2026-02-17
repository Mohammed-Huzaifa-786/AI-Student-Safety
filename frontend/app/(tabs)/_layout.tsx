import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useUser } from '../../context/UserContext';
import { onAuthLogout } from '../../utils/authEvents';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, clearUser } = useUser();
  const router = useRouter();

  // 🔥 AUTH REDIRECT FIX (must be here)
  useEffect(() => {
    if (!user) {
      try { router.replace("/login"); } catch {}
    }
  }, [user]);

  // logout listener
  useEffect(() => {
    const unsub = onAuthLogout(async () => {
      try { await clearUser(); } catch {}
      try { router.replace('/login'); } catch {}
    });
    return () => { try { unsub(); } catch {} };
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        tabBarButton: HapticTab,

        headerRight: () => (
          <TouchableOpacity
            style={styles.logout}
            onPress={async () => {
              try { await clearUser(); } catch {}
              try { await AsyncStorage.removeItem('APP_USER_V1'); } catch {}
              try { router.replace('/login'); } catch {}
            }}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  logout: { marginRight: 12, padding: 6 },
  logoutText: { color: '#E53935', fontWeight: '600' },
});
