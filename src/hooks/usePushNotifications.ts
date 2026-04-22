import { useCallback, useEffect, useRef, useState } from "react";

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const supported = typeof Notification !== "undefined";

  const requestPermission = useCallback(async () => {
    if (!supported) return "denied" as NotificationPermission;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, [supported]);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!supported || permission !== "granted") return null;
      try {
        return new Notification(title, {
          icon: "/manifest-icon-192.maskable.png",
          badge: "/manifest-icon-192.maskable.png",
          ...options,
        });
      } catch {
        return null;
      }
    },
    [supported, permission]
  );

  return { supported, permission, requestPermission, sendNotification };
}
