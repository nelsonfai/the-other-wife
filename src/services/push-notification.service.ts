/** @format */

import { expoAccessToken } from "../constants/env.js";

type PushMessageInput = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export class PushNotificationService {
  private isExpoToken = (token: string) =>
    /^ExponentPushToken\[.+\]$|^ExpoPushToken\[.+\]$/.test(token);

  sendToTokens = async (tokens: string[], message: PushMessageInput) => {
    const uniqueValidTokens = [...new Set(tokens)].filter((token) =>
      this.isExpoToken(token),
    );

    if (uniqueValidTokens.length === 0) return;

    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(expoAccessToken
          ? { Authorization: `Bearer ${expoAccessToken}` }
          : {}),
      },
      body: JSON.stringify(
        uniqueValidTokens.map((to) => ({
          to,
          title: message.title,
          body: message.body,
          sound: message.sound ?? "default",
          data: message.data ?? {},
        })),
      ),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Expo push request failed: ${errorText}`);
    }
  };
}
