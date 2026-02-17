// utils/notificationsClient.js
// Delay importing `expo-notifications` and `expo-device` until functions run
// to avoid module-level side-effects when bundling in Expo Go.

export async function registerForPushNotificationsAsync() {
  const Constants = await import('expo-constants');
  // If running inside Expo Go, skip push registration (remote push removed in Expo Go)
  if (Constants?.appOwnership === 'expo') {
    console.warn('Running in Expo Go — skipping push registration. Use a dev build for push notifications.');
    return null;
  }

  const Notifications = await import('expo-notifications');
  const Device = await import('expo-device');

  if (!Device.isDevice) {
    console.log('Push notifications require a real device');
    return null;
  }

  // Configure foreground notification behavior (do it here, once)
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    // ignore in environments where notifications handler isn't supported
  }

  // Permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Permission for notifications was denied.');
    return null;
  }

  // Generate Expo push token
  let token = null;
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    token = tokenData?.data || null;
    console.log('Expo Push Token:', token);
  } catch (e) {
    // If projectId is missing or environment doesn't support push tokens,
    // return null and log a friendly warning instead of throwing.
    const msg = e?.message || String(e);
    if (msg && msg.toLowerCase().includes('projectid')) {
      console.warn('Expo Push Token unavailable: missing projectId in app manifest. Skipping push registration.');
      return null;
    }
    console.warn('Failed to get Expo push token:', msg);
    return null;
  }

  return token;
}
