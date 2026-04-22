import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TrackingSession {
  id: string;
  session_code: string;
  is_active: boolean;
}

export const useLiveTracking = () => {
  const [session, setSession] = useState<TrackingSession | null>(null);
  const [positions, setPositions] = useState<[number, number][]>([]);
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const startSession = useCallback(async () => {
    const code = crypto.randomUUID().slice(0, 8);
    const { data, error: err } = await supabase.rpc("create_tracking_session", { _code: code });
    const row = Array.isArray(data) ? data[0] : data;
    if (err || !row) {
      console.error("Failed to create tracking session:", err);
      setError("Failed to start session");
      return null;
    }
    setSession(row as TrackingSession);
    setTracking(true);
    setPositions([]);
    setCurrentPos(null);
    return row as TrackingSession;
  }, []);

  const stopSession = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
    if (session) {
      await supabase.rpc("end_tracking_session_by_code", { _code: session.session_code });
    }
  }, [session]);

  const saveLocation = useCallback(async (lat: number, lng: number, accuracy?: number) => {
    if (!session) return;
    await supabase.rpc("post_location_update", {
      _code: session.session_code,
      _lat: lat,
      _lng: lng,
      _accuracy: accuracy ?? undefined,
    });
  }, [session]);

  // Watch real GPS position
  useEffect(() => {
    if (!tracking || !session) return;
    if (!navigator.geolocation) {
      setError("GPS not available on this device");
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coord: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCurrentPos(coord);
        setPositions((prev) => {
          if (prev.length === 0) return [coord];
          const last = prev[prev.length - 1];
          const dist = Math.abs(last[0] - coord[0]) + Math.abs(last[1] - coord[1]);
          if (dist > 0.00005) return [...prev, coord];
          return prev;
        });
        saveLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
      (err) => {
        console.error("GPS error:", err);
        if (err.code === 1) setError("Location permission denied. Please enable GPS.");
        else if (err.code === 2) setError("GPS unavailable. Please check your device settings.");
        else setError("Location request timed out. Retrying...");
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [tracking, session, saveLocation]);

  const trackingLink = session
    ? `${window.location.origin}/track/${session.session_code}`
    : null;

  return {
    session, positions, currentPos, tracking, error, trackingLink,
    startSession, stopSession, setTracking,
  };
};
