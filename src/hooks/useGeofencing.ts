import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

interface SafeZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  notify_contacts: boolean;
}

export function useGeofencing() {
  const { user } = useAuth();
  const { sendNotification } = usePushNotifications();
  const [zones, setZones] = useState<SafeZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [monitoring, setMonitoring] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const outsideZonesRef = useRef<Set<string>>(new Set());

  const fetchZones = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("safe_zones")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setZones(data as SafeZone[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  const addZone = async (zone: Omit<SafeZone, "id">) => {
    if (!user) return;
    const { error } = await supabase.from("safe_zones").insert({ ...zone, user_id: user.id } as any);
    if (error) { toast.error("Failed to add safe zone"); return; }
    toast.success("Safe zone added!");
    fetchZones();
  };

  const removeZone = async (id: string) => {
    const { error } = await supabase.from("safe_zones").delete().eq("id", id);
    if (error) { toast.error("Failed to remove zone"); return; }
    setZones((z) => z.filter((zone) => zone.id !== id));
    toast.success("Zone removed");
  };

  const toggleZone = async (id: string, active: boolean) => {
    await supabase.from("safe_zones").update({ is_active: active } as any).eq("id", id);
    setZones((z) => z.map((zone) => (zone.id === id ? { ...zone, is_active: active } : zone)));
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const startMonitoring = useCallback(() => {
    if (!("geolocation" in navigator)) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const activeZones = zones.filter((z) => z.is_active);

        for (const zone of activeZones) {
          const distance = getDistance(latitude, longitude, zone.latitude, zone.longitude);
          const isOutside = distance > zone.radius_meters;

          if (isOutside && !outsideZonesRef.current.has(zone.id)) {
            outsideZonesRef.current.add(zone.id);
            toast.warning(`⚠️ You left safe zone: ${zone.name}`, { duration: 10000 });
            sendNotification(`⚠️ Left Safe Zone: ${zone.name}`, {
              body: "You have left a designated safe zone. Your emergency contacts may be notified.",
              tag: `geofence-${zone.id}`,
              requireInteraction: true,
            });
          } else if (!isOutside && outsideZonesRef.current.has(zone.id)) {
            outsideZonesRef.current.delete(zone.id);
            toast.success(`✅ Back in safe zone: ${zone.name}`);
            sendNotification(`✅ Back in Safe Zone: ${zone.name}`, {
              body: "You have returned to a safe zone.",
              tag: `geofence-${zone.id}`,
            });
          }
        }
      },
      undefined,
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    setMonitoring(true);
  }, [zones]);

  const stopMonitoring = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    outsideZonesRef.current.clear();
    setMonitoring(false);
  }, []);

  useEffect(() => () => stopMonitoring(), [stopMonitoring]);

  return { zones, loading, monitoring, addZone, removeZone, toggleZone, startMonitoring, stopMonitoring, fetchZones };
}
