import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys used in AsyncStorage
const STORAGE_KEY = 'APP_USER_V1';

// Context provides { user, setUser, clearUser }
const UserContext = createContext({ user: null, setUser: () => {}, clearUser: () => {}, loading: true });

export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  // load user from AsyncStorage on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && mounted) {
          const parsed = JSON.parse(raw);
          // Only respect persisted user if it contains a token
          if (parsed && parsed.token) {
            setUserState(parsed);
          }
        }
      } catch (e) {
        console.warn('Failed to load user from storage', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // wrapper that persists the user only when a JWT token is present
  const setUser = useCallback(async (u) => {
    try {
      if (u == null || !u.token) {
        await AsyncStorage.removeItem(STORAGE_KEY);
        setUserState(null);
        return;
      }
      const raw = JSON.stringify(u);
      await AsyncStorage.setItem(STORAGE_KEY, raw);
      setUserState(u);
    } catch (e) {
      console.warn('Failed to persist user', e);
      // still set in memory
      setUserState(u);
    }
  }, []);

  const clearUser = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear user storage', e);
    }
    setUserState(null);
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, clearUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) return { user: null, setUser: async () => {}, clearUser: async () => {} };
  return ctx;
};

export default UserContext;
