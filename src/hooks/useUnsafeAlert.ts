import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fetchLocation, type GeoLocation, buildMapsLink } from "@/lib/locationHelper";
import { getEmergencyContacts, notifyEmergencyContacts } from "@/hooks/useEmergencyContacts";
import { buildEmergencySmsLink } from "@/lib/smsHelper";
import { toast } from "sonner";

const COOLDOWN_MS = 15_000; // 15s between triggers
const TRACKING_DURATION_MS = 30 * 60 * 1000; // 30 min auto-stop
const TRACKING_INTERVAL_MS = 5_000; // every 5s

export type UnsafeAlertStatus =
  | "idle"
  | "cooldown"
  | "fetching_location"
  | "creating_session"
  | "sent"
  | "error";

interface UnsafeAlertResult {
  ok: boolean;
  alertId?: string;
  trackingCode?: string;
  trackingLink?: string;
  location?: GeoLocation;
  contactsNotified: number;
  smsLink?: string;
  whatsappLink?: string;
  reason?: string;
}

const STORAGE_LAST_TRIGGER = "rakshasetu_unsafe_last_trigger";

export const useUnsafeAlert = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<UnsafeAlertStatus>("idle");
  const [lastResult, setLastResult] = useState<UnsafeAlertResult | null>(null);
  const [activeTrackingCode, setActiveTrackingCode] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const watchIdRef = useRef<number | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const alertIdRef = useRef<string | null>(null);
  const lastWriteRef = useRef<number>(0);

  // Cooldown countdown
  useEffect(() => {
    const tick = () => {
      try {
        const last = Number(localStorage.getItem(STORAGE_LAST_TRIGGER) || 0);
        const remaining = Math.max(0, COOLDOWN_MS - (Date.now() - last));
        setCooldownRemaining(remaining);
      } catch {
        setCooldownRemaining(0);
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, []);

  const cleanupTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    const sessionId = sessionIdRef.current;
    const alertId = alertIdRef.current;
    if (sessionId) {
      try {
        await supabase
          .from("live_tracking_sessions")
          .update({ is_active: false, ended_at: new Date().toISOString() })
          .eq("id", sessionId);
      } catch (err) {
        console.error("Failed to end tracking session:", err);
      }
    }
    if (alertId) {
      try {
        await supabase
          .from("sos_alerts")
          .update({ status: "ended", ended_at: new Date().toISOString() })
          .eq("id", alertId);
      } catch (err) {
        console.error("Failed to mark alert ended:", err);
      }
    }
    sessionIdRef.current = null;
    alertIdRef.current = null;
    setActiveTrackingCode(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    };
  }, []);

  const triggerUnsafeAlert = useCallback(async (): Promise<UnsafeAlertResult> => {
    // Auth check
    if (!user) {
      toast.error("Please sign in to send an emergency alert");
      const r: UnsafeAlertResult = { ok: false, contactsNotified: 0, reason: "not_authenticated" };
      setLastResult(r);
      return r;
    }

    // Cooldown check
    const last = Number(localStorage.getItem(STORAGE_LAST_TRIGGER) || 0);
    const since = Date.now() - last;
    if (since < COOLDOWN_MS) {
      const wait = Math.ceil((COOLDOWN_MS - since) / 1000);
      toast.warning(`Please wait ${wait}s before sending another alert`);
      setStatus("cooldown");
      const r: UnsafeAlertResult = { ok: false, contactsNotified: 0, reason: "cooldown" };
      setLastResult(r);
      return r;
    }

    // Step 1: get location
    setStatus("fetching_location");
    const location = await fetchLocation();
    if (!location) {
      toast.error("Location permission required. Please enable GPS to send alert.");
      setStatus("error");
      const r: UnsafeAlertResult = { ok: false, contactsNotified: 0, reason: "no_location" };
      setLastResult(r);
      return r;
    }

    // Step 2: create live tracking session
    setStatus("creating_session");
    let trackingCode: string | undefined;
    let trackingLink: string | undefined;
    let sessionId: string | undefined;
    try {
      const code = crypto.randomUUID().slice(0, 8);
      const { data: sessionRows, error: sessErr } = await supabase
        .rpc("create_tracking_session", { _code: code });
      const sessionRow = Array.isArray(sessionRows) ? sessionRows[0] : sessionRows;
      if (sessErr || !sessionRow) {
        console.error("Failed to create tracking session:", sessErr);
      } else {
        sessionId = sessionRow.id;
        trackingCode = sessionRow.session_code;
        trackingLink = `${window.location.origin}/track/${trackingCode}`;
        // Initial location
        await supabase.rpc("post_location_update", {
          _code: trackingCode,
          _lat: location.lat,
          _lng: location.lng,
          _accuracy: location.accuracy ?? undefined,
        });
      }
    } catch (err) {
      console.error("Tracking session error:", err);
    }

    // Step 3: write alert row to DB
    let alertId: string | undefined;
    try {
      const contacts = getEmergencyContacts();
      const { data: alertRow, error: alertErr } = await supabase
        .from("sos_alerts")
        .insert({
          user_id: user.id,
          alert_type: "feel_unsafe",
          message: "User feels unsafe",
          latitude: location.lat,
          longitude: location.lng,
          accuracy: location.accuracy ?? null,
          tracking_session_code: trackingCode ?? null,
          contacts_notified_count: contacts.length,
          status: "active",
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
        })
        .select()
        .single();
      if (alertErr) {
        console.error("Failed to log SOS alert:", alertErr);
      } else if (alertRow) {
        alertId = alertRow.id;
      }
    } catch (err) {
      console.error("Alert insert error:", err);
    }

    // Step 4: notify contacts (in-app log + build SMS/WhatsApp links)
    const contacts = getEmergencyContacts();
    const notifs = notifyEmergencyContacts("Critical", false, { lat: location.lat, lng: location.lng });
    const smsLink = buildEmergencySmsLink(contacts, "Feel Unsafe", { lat: location.lat, lng: location.lng }, trackingLink) || undefined;

    // WhatsApp deep link (single message to first primary contact, or chooser)
    let whatsappLink: string | undefined;
    if (contacts.length > 0) {
      const userName = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || user.email?.split("@")[0] || "A RakshaSetu user";
      const ts = new Date().toLocaleString();
      const msg =
        `🆘 EMERGENCY — RakshaSetu\n\n${userName} feels unsafe and needs help.\n\n📍 Location: ${buildMapsLink(location.lat, location.lng)}\n${trackingLink ? `🔴 Live track: ${trackingLink}\n` : ""}🕒 ${ts}\n\nThis is an automated alert.`;
      // Strip non-digits from primary phone for wa.me
      const primary = contacts.find((c) => c.isPrimary) || contacts[0];
      const cleaned = (primary.phone || "").replace(/[^\d]/g, "");
      whatsappLink = `https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`;
    }

    // Step 5: start live tracking (5s interval, auto-stop after 30 min)
    if (sessionId && trackingCode && navigator.geolocation) {
      sessionIdRef.current = sessionId;
      alertIdRef.current = alertId ?? null;
      setActiveTrackingCode(trackingCode);
      lastWriteRef.current = Date.now();

      watchIdRef.current = navigator.geolocation.watchPosition(
        async (pos) => {
          const now = Date.now();
          if (now - lastWriteRef.current < TRACKING_INTERVAL_MS) return;
          lastWriteRef.current = now;
          try {
            await supabase.rpc("post_location_update", {
              _code: trackingCode,
              _lat: pos.coords.latitude,
              _lng: pos.coords.longitude,
              _accuracy: pos.coords.accuracy ?? undefined,
            });
          } catch (err) {
            console.error("Live update failed:", err);
          }
        },
        (err) => console.error("GPS watch error:", err),
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
      );

      stopTimerRef.current = setTimeout(() => {
        cleanupTracking();
        toast.info("Live tracking auto-stopped after 30 minutes");
      }, TRACKING_DURATION_MS);
    }

    // Step 6: stamp cooldown & finish
    try {
      localStorage.setItem(STORAGE_LAST_TRIGGER, String(Date.now()));
    } catch { /* ignore */ }

    setStatus("sent");
    const result: UnsafeAlertResult = {
      ok: true,
      alertId,
      trackingCode,
      trackingLink,
      location,
      contactsNotified: notifs.length,
      smsLink,
      whatsappLink,
    };
    setLastResult(result);

    if (notifs.length === 0) {
      toast.warning("Alert logged. Add emergency contacts to notify them automatically.", { duration: 5000 });
    } else {
      toast.success(`Alert sent. ${notifs.length} contact${notifs.length === 1 ? "" : "s"} ready to notify.`, { duration: 4000 });
    }

    return result;
  }, [user, cleanupTracking]);

  const stopTracking = useCallback(async () => {
    await cleanupTracking();
    setStatus("idle");
    toast.success("Live tracking stopped. You're marked safe.");
  }, [cleanupTracking]);

  return {
    status,
    lastResult,
    activeTrackingCode,
    cooldownRemaining,
    triggerUnsafeAlert,
    stopTracking,
  };
};
