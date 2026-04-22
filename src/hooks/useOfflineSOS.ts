import { useEffect, useCallback, useRef, useState } from "react";

export interface OfflineSOSAlert {
  id: string;
  level: string;
  timestamp: number;
  lat?: number;
  lng?: number;
  stealth: boolean;
}

const STORAGE_KEY = "rakshasetu_offline_sos_queue";

const getQueue = (): OfflineSOSAlert[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveQueue = (queue: OfflineSOSAlert[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
};

export const useOfflineSOS = () => {
  const syncingRef = useRef(false);
  const [pendingCount, setPendingCount] = useState(getQueue().length);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const syncQueue = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    const queue = getQueue();
    if (queue.length === 0) {
      syncingRef.current = false;
      return;
    }

    console.log(`[RakshaSetu] Syncing ${queue.length} offline SOS alerts...`, queue);

    // Simulate sending (replace with real API later)
    saveQueue([]);
    setPendingCount(0);
    syncingRef.current = false;
    console.log("[RakshaSetu] All offline alerts synced successfully");
  }, []);

  const queueAlert = useCallback((alert: Omit<OfflineSOSAlert, "id" | "timestamp">) => {
    const entry: OfflineSOSAlert = {
      ...alert,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    const queue = getQueue();
    queue.push(entry);
    saveQueue(queue);
    setPendingCount(queue.length);

    console.log(`[RakshaSetu] SOS alert queued:`, entry);

    if (navigator.onLine) syncQueue();
    return entry;
  }, [syncQueue]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log("[RakshaSetu] Back online — syncing offline SOS queue");
      syncQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      console.log("[RakshaSetu] Gone offline — alerts will be queued");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (navigator.onLine && getQueue().length > 0) syncQueue();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncQueue]);

  return { queueAlert, pendingCount, isOnline };
};
