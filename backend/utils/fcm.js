// backend/utils/fcm.js
import { Expo } from "expo-server-sdk";

const expo = new Expo();

export async function sendExpoPush(tokens, title, body, data = {}) {
  if (!tokens || tokens.length === 0) return;

  const valid = tokens.filter((t) => Expo.isExpoPushToken(t));
  if (valid.length === 0) return;

  const messages = valid.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data,
  }));

  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const receipts = await expo.sendPushNotificationsAsync(chunk);
      console.log("Expo push receipts:", receipts);
    } catch (e) {
      console.log("Expo push error:", e);
    }
  }
}
