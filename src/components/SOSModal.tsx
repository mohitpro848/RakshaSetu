import {
  X, Flame, Siren, Heart, HelpCircle, Phone, VolumeX, WifiOff,
  Mic, EyeOff, Users, MessageSquare, MapPin, Loader2, AlertTriangle, MapPinOff
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useOfflineSOS } from "@/hooks/useOfflineSOS";
import { useEvidenceCapture } from "@/hooks/useEvidenceCapture";
import { getEmergencyContacts, notifyEmergencyContacts, SOSNotification } from "@/hooks/useEmergencyContacts";
import { buildEmergencySmsLink } from "@/lib/smsHelper";
import {
  fetchLocation, startLocationWatch, getCachedLocation, checkLocationPermission,
  buildMapsLink,
  type GeoLocation, type LocationPermission
} from "@/lib/locationHelper";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

interface SOSModalProps {
  onClose: () => void;
  stealthMode?: boolean;
}

type SOSStatus = "idle" | "checking_permission" | "fetching_location" | "sending" | "sent" | "sent_no_location";

const SOSModal = ({ onClose, stealthMode = false }: SOSModalProps) => {
  const { t } = useI18n();
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<SOSStatus>("idle");
  const [isStealth, setIsStealth] = useState(stealthMode);
  const [notifiedContacts, setNotifiedContacts] = useState<SOSNotification[]>([]);
  const [currentLocation, setCurrentLocation] = useState<GeoLocation | null>(getCachedLocation());
  const [permissionState, setPermissionState] = useState<LocationPermission>("prompt");
  const { queueAlert } = useOfflineSOS();
  const { recording, startCapture, stopCapture } = useEvidenceCapture();
  const isOnline = navigator.onLine;
  const contacts = getEmergencyContacts();
  const contactCount = contacts.length;
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const emergencyTypes = [
    { level: "Critical", labelKey: "sos.fireDisaster", icon: Flame, color: "bg-crisis-critical", descKey: "sos.fireDesc" },
    { level: "High", labelKey: "sos.violenceThreat", icon: Siren, color: "bg-crisis-high", descKey: "sos.violenceDesc" },
    { level: "Medium", labelKey: "sos.medicalEmergency", icon: Heart, color: "bg-crisis-medium text-foreground", descKey: "sos.medicalDesc" },
    { level: "Low", labelKey: "sos.needAssistance", icon: HelpCircle, color: "bg-crisis-low", descKey: "sos.assistanceDesc" },
  ];

  useEffect(() => {
    checkLocationPermission().then(setPermissionState);
    const stopWatch = startLocationWatch();
    fetchLocation().then((loc) => { if (loc) setCurrentLocation(loc); });
    return stopWatch;
  }, []);

  const openSmsDL = (level: string, loc?: { lat: number; lng: number }, liveLink?: string) => {
    if (contacts.length === 0) return;
    const link = buildEmergencySmsLink(contacts, level, loc, liveLink);
    if (link) window.open(link, "_self");
  };

  const dispatchAlert = async (loc: GeoLocation | null) => {
    if (!selected) return;
    const locData = loc ? { lat: loc.lat, lng: loc.lng } : undefined;

    // Create a live tracking session
    let liveLink: string | undefined;
    try {
      const code = crypto.randomUUID().slice(0, 8);
      const { data: sessionData } = await supabase
        .from("live_tracking_sessions")
        .insert({ session_code: code })
        .select()
        .single();
      if (sessionData) {
        liveLink = `${window.location.origin}/track/${code}`;
        // Save initial location to the session
        if (loc) {
          await supabase.from("live_location_updates").insert({
            session_id: sessionData.id,
            latitude: loc.lat,
            longitude: loc.lng,
            accuracy: loc.accuracy || null,
          });
        }
        // Continue sending live updates in background
        if (navigator.geolocation) {
          const watchId = navigator.geolocation.watchPosition(
            async (pos) => {
              await supabase.from("live_location_updates").insert({
                session_id: sessionData.id,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy || null,
              });
            },
            () => {},
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
          );
          // Auto-stop after 30 minutes
          setTimeout(() => {
            navigator.geolocation.clearWatch(watchId);
            supabase.from("live_tracking_sessions")
              .update({ is_active: false, ended_at: new Date().toISOString() })
              .eq("id", sessionData.id);
          }, 30 * 60 * 1000);
        }
      }
    } catch (err) {
      console.error("Failed to create tracking session:", err);
    }

    queueAlert({ level: selected, lat: locData?.lat, lng: locData?.lng, stealth: isStealth });
    const notifs = notifyEmergencyContacts(selected, isStealth, locData);
    setNotifiedContacts(notifs);
    if (!isStealth) openSmsDL(selected, locData, liveLink);
    if (!recording) startCapture();
    setStatus(loc ? "sent" : "sent_no_location");
    setTimeout(() => { stopCapture(); onClose(); }, 4000);
  };

  const handleSend = async () => {
    if (!selected || status === "checking_permission" || status === "fetching_location" || status === "sending") return;
    setStatus("checking_permission");
    const perm = await checkLocationPermission();
    setPermissionState(perm);
    setStatus("fetching_location");
    const loc = await fetchLocation();
    if (loc) setCurrentLocation(loc);
    setStatus("sending");
    await dispatchAlert(loc);
  };

  const isBusy = status === "checking_permission" || status === "fetching_location" || status === "sending";
  const isSent = status === "sent" || status === "sent_no_location";

  const statusLabel = (() => {
    switch (status) {
      case "checking_permission": return t("sos.checkingGps");
      case "fetching_location": return t("sos.fetchingLocation");
      case "sending": return t("sos.sendingAlert");
      default: return !isOnline ? t("sos.queueAlert") : t("sos.sendAlert");
    }
  })();

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl animate-scale-in overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              {t("sos.title")}
              {!isOnline && <WifiOff className="w-4 h-4 text-crisis-critical" />}
            </h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              {!isOnline ? t("sos.offlineQueued") : t("sos.selectType")}
              {currentLocation ? (
                <span className="inline-flex items-center gap-0.5 text-crisis-safe font-medium">
                  <MapPin className="w-3 h-3" /> {t("sos.gpsReady")}
                </span>
              ) : permissionState === "denied" ? (
                <span className="inline-flex items-center gap-0.5 text-crisis-critical font-medium">
                  <MapPinOff className="w-3 h-3" /> {t("sos.gpsBlocked")}
                </span>
              ) : null}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {!isSent ? (
          <div className="px-5 pb-5 space-y-3">
            {permissionState === "denied" && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-crisis-critical/10 border border-crisis-critical/20">
                <AlertTriangle className="w-4 h-4 text-crisis-critical shrink-0 mt-0.5" />
                <p className="text-xs text-foreground">{t("sos.locationDenied")}</p>
              </div>
            )}

            {contactCount === 0 && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-crisis-medium/10 border border-crisis-medium/20">
                <Users className="w-4 h-4 text-crisis-medium shrink-0 mt-0.5" />
                <p className="text-xs text-foreground">{t("sos.noContacts")}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              {emergencyTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selected === type.level;
                return (
                  <button
                    key={type.level}
                    onClick={() => setSelected(type.level)}
                    disabled={isBusy}
                    className={`relative p-3.5 rounded-xl border-2 text-left transition-all active:scale-[0.97] disabled:opacity-60 ${
                      isSelected ? "border-primary bg-secondary shadow-md" : "border-border hover:border-primary/30 hover:bg-muted/50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${type.color} text-white flex items-center justify-center mb-2`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">{t(type.labelKey)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{t(type.descKey)}</p>
                    {isSelected && <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-primary" />}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsStealth((s) => !s)}
                disabled={isBusy}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.97] ${
                  isStealth ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                }`}
              >
                <EyeOff className="w-3.5 h-3.5" />
                {t("sos.stealthMode")}
              </button>
              <button
                onClick={recording ? stopCapture : startCapture}
                disabled={isBusy}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.97] ${
                  recording ? "bg-crisis-critical text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                {recording ? t("sos.recording") : t("sos.recordEvidence")}
              </button>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSend}
                disabled={!selected || isBusy}
                className="flex-1 py-3 rounded-xl bg-sos text-sos-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.97] transition-all"
              >
                {isBusy ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{statusLabel}</>
                ) : (
                  <>
                    <Phone className="w-4 h-4" />
                    {statusLabel}
                    {contactCount > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] bg-sos-foreground/20 px-1.5 py-0.5 rounded-full">
                        <Users className="w-2.5 h-2.5" />{contactCount}
                      </span>
                    )}
                  </>
                )}
              </button>
              <button
                onClick={() => { setIsStealth(true); if (selected) handleSend(); }}
                disabled={isBusy}
                className="px-4 py-3 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors active:scale-[0.97] disabled:opacity-40"
                title={t("sos.silentSos")}
              >
                <VolumeX className="w-4 h-4" />
              </button>
            </div>

            <a href="tel:112" className="block w-full py-2.5 text-center text-sm font-semibold text-primary border border-primary/20 rounded-xl hover:bg-secondary transition-colors active:scale-[0.97]">
              {t("sos.call112")}
            </a>
          </div>
        ) : (
          <div className="px-5 pb-8 pt-4 text-center animate-fade-in-up">
            <div className="w-16 h-16 mx-auto rounded-full bg-crisis-safe/10 flex items-center justify-center mb-3">
              <div className="w-10 h-10 rounded-full bg-crisis-safe flex items-center justify-center text-white text-lg">✓</div>
            </div>
            <h3 className="text-lg font-bold text-foreground">
              {!isOnline ? t("sos.alertQueued") : t("sos.alertSent")}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {!isOnline ? t("sos.offlineMessage") : t("sos.sentMessage")}
            </p>

            {status === "sent" && currentLocation && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-crisis-safe flex items-center justify-center gap-1 font-medium">
                  <MapPin className="w-3 h-3" />
                  {t("sos.locationShared")}: {currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)}
                  {currentLocation.accuracy && (
                    <span className="text-muted-foreground font-normal">(±{Math.round(currentLocation.accuracy)}m)</span>
                  )}
                </p>
                <div ref={mapContainerRef} className="w-full h-32 rounded-xl overflow-hidden border border-border">
                  <iframe
                    title={t("map.yourLocation")}
                    src={`https://maps.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}&z=15&output=embed`}
                    className="w-full h-full border-0"
                    loading="eager"
                    allowFullScreen={false}
                  />
                </div>
                <a
                  href={buildMapsLink(currentLocation.lat, currentLocation.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                >
                  <MapPin className="w-3 h-3" /> {t("sos.openGoogleMaps")}
                </a>
              </div>
            )}

            {status === "sent_no_location" && (
              <p className="text-xs text-crisis-critical mt-2 flex items-center justify-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {t("sos.locationUnavailable")}
              </p>
            )}

            {notifiedContacts.length > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-secondary/80 text-left">
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {notifiedContacts.length} {t("sos.contactsNotified")}
                </p>
                <div className="space-y-1">
                  {notifiedContacts.map((n) => (
                    <div key={n.contact.id} className="flex items-center gap-2 text-xs text-foreground">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${n.contact.isPrimary ? "bg-primary" : "bg-crisis-safe"}`} />
                      <span className="font-semibold truncate">{n.contact.name}</span>
                      <span className="text-muted-foreground ml-auto text-[10px]">{n.contact.relation}</span>
                    </div>
                  ))}
                </div>
                <a
                  href={buildEmergencySmsLink(
                    notifiedContacts.map((n) => n.contact),
                    selected || "Critical",
                    currentLocation ? { lat: currentLocation.lat, lng: currentLocation.lng } : undefined
                  ) || "#"}
                  className="mt-2 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 active:scale-[0.97] transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {t("sos.openSmsApp")}
                </a>
              </div>
            )}
            {notifiedContacts.length === 0 && (
              <p className="text-[10px] text-muted-foreground mt-2">{t("sos.noContactsSet")}</p>
            )}
            {recording && (
              <p className="text-xs text-crisis-critical mt-2 flex items-center justify-center gap-1">
                <Mic className="w-3 h-3 animate-pulse" /> {t("sos.recordingEvidence")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SOSModal;
