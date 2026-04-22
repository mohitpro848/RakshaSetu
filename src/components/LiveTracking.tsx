import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Share2, Copy, Check, Navigation, Radio, MapPinOff, Loader2, MessageCircle, Phone } from "lucide-react";
import { getEmergencyContacts } from "@/hooks/useEmergencyContacts";
import { useI18n } from "@/lib/i18n";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMapsLoader";
import { useLiveTracking } from "@/hooks/useLiveTracking";

interface IncidentTarget {
  latitude: number;
  longitude: number;
  category: string;
  description: string;
}

interface LiveTrackingProps {
  onBack: () => void;
  incidentTarget?: IncidentTarget | null;
}

const LiveTracking = ({ onBack, incidentTarget }: LiveTrackingProps) => {
  const { t } = useI18n();
  const { loaded, error: mapError } = useGoogleMapsLoader();
  const {
    positions, currentPos, tracking, error: gpsError, trackingLink,
    startSession, stopSession, setTracking,
  } = useLiveTracking();
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const pathRef = useRef<any>(null);
  const trailMarkersRef = useRef<any[]>([]);
  const incidentMarkerRef = useRef<any>(null);

  // Start session on mount
  useEffect(() => {
    startSession().then(() => setStarting(false));
    return () => { stopSession(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize Google Map — center on user's real position or a neutral default
  useEffect(() => {
    if (!loaded || !mapElementRef.current || mapRef.current) return;
    try {
      const gmaps = (window as any).google.maps;
      if (!gmaps?.Map) { setInitError("Google Maps failed to load"); return; }
      const center = currentPos
        ? { lat: currentPos[0], lng: currentPos[1] }
        : { lat: 20.5937, lng: 78.9629 }; // India center as fallback
      const map = new gmaps.Map(mapElementRef.current, {
        center,
        zoom: currentPos ? 16 : 5,
        disableDefaultUI: true,
        zoomControl: true,
        mapId: "live_tracking_map",
        gestureHandling: "greedy",
      });
      mapRef.current = map;
    } catch (err: any) {
      console.error("LiveTracking map init error:", err);
      setInitError(err?.message || "Failed to initialize map");
    }
    return () => { mapRef.current = null; };
  }, [loaded]);

  // Update map markers and polyline when positions change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    const gmaps = (window as any).google.maps;
    if (!gmaps) return;

    // Update polyline
    if (pathRef.current) pathRef.current.setMap(null);
    if (positions.length > 1) {
      pathRef.current = new gmaps.Polyline({
        path: positions.map(([lat, lng]) => ({ lat, lng })),
        strokeColor: "#6366f1",
        strokeOpacity: 0.7,
        strokeWeight: 3,
        map,
      });
    }

    // Clear old trail markers
    trailMarkersRef.current.forEach((m: any) => (m.map = null));
    trailMarkersRef.current = [];

    // Add trail dots
    positions.slice(0, -1).filter((_, i) => i % 3 === 0).forEach(([lat, lng]) => {
      const dot = document.createElement("div");
      dot.style.cssText = "width:6px;height:6px;border-radius:50%;background:#6366f1;opacity:0.45;";
      try {
        const marker = new gmaps.marker.AdvancedMarkerElement({
          position: { lat, lng }, map, content: dot,
        });
        trailMarkersRef.current.push(marker);
      } catch { /* ignore if marker API not available */ }
    });

    // Update user marker
    if (currentPos) {
      if (!userMarkerRef.current) {
        const el = document.createElement("div");
        el.style.cssText = "width:18px;height:18px;border-radius:50%;background:#6366f1;border:3px solid white;box-shadow:0 0 0 4px rgba(99,102,241,0.25);";
        try {
          userMarkerRef.current = new gmaps.marker.AdvancedMarkerElement({
            position: { lat: currentPos[0], lng: currentPos[1] }, map, content: el,
          });
        } catch { /* fallback */ }
      } else {
        userMarkerRef.current.position = { lat: currentPos[0], lng: currentPos[1] };
      }
      map.panTo({ lat: currentPos[0], lng: currentPos[1] });
      if (positions.length <= 2) map.setZoom(16);
    }

    // Incident target marker
    if (incidentTarget && !incidentMarkerRef.current) {
      const el = document.createElement("div");
      el.style.cssText = "width:22px;height:22px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 0 0 4px rgba(239,68,68,0.3);";
      try {
        incidentMarkerRef.current = new gmaps.marker.AdvancedMarkerElement({
          position: { lat: incidentTarget.latitude, lng: incidentTarget.longitude },
          map,
          content: el,
        });
      } catch { /* ignore */ }
    }

    // Fit bounds to show both user and incident
    if (currentPos && incidentTarget) {
      const bounds = new gmaps.LatLngBounds();
      bounds.extend({ lat: currentPos[0], lng: currentPos[1] });
      bounds.extend({ lat: incidentTarget.latitude, lng: incidentTarget.longitude });
      map.fitBounds(bounds, 60);
    }
  }, [positions, currentPos, loaded, incidentTarget]);

  const handleCopyLink = async () => {
    if (!trackingLink) return;
    try { await navigator.clipboard.writeText(trackingLink); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); }
  };

  const handleShare = async () => {
    if (!trackingLink) return;
    if (navigator.share) { await navigator.share({ title: t("app.name"), url: trackingLink }); } else { handleCopyLink(); }
  };

  const shareMessage = trackingLink
    ? `🆘 Track my live location on RakshaSetu: ${trackingLink}`
    : "";

  const handleWhatsAppShare = () => {
    if (!trackingLink) return;
    const contacts = getEmergencyContacts();
    if (contacts.length > 0) {
      // Share to first contact's phone
      const phone = contacts[0].phone.replace(/[^0-9]/g, "");
      window.open(`https://wa.me/${phone.startsWith("91") ? phone : "91" + phone}?text=${encodeURIComponent(shareMessage)}`, "_blank");
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, "_blank");
    }
  };

  const handleSMSShare = () => {
    if (!trackingLink) return;
    const contacts = getEmergencyContacts();
    const phones = contacts.map((c) => c.phone).join(",");
    window.open(`sms:${phones}?body=${encodeURIComponent(shareMessage)}`, "_self");
  };

  const handleToggleTracking = async () => {
    if (tracking) {
      await stopSession();
    } else {
      setStarting(true);
      await startSession();
      setStarting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-background flex flex-col">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-muted transition-colors active:scale-95">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-crisis-critical animate-pulse" />
            {t("livetrack.title")}
          </h2>
          <p className="text-[10px] text-muted-foreground">
            {positions.length} {t("livetrack.pointsRecorded")} • {tracking ? t("livetrack.active") : t("livetrack.paused")}
          </p>
        </div>
        <button
          onClick={handleToggleTracking}
          disabled={starting}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
            tracking ? "bg-crisis-critical/10 text-crisis-critical" : "bg-muted text-muted-foreground"
          }`}
        >
          {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : tracking ? t("livetrack.stop") : t("livetrack.resume")}
        </button>
      </div>

      {trackingLink && (
        <div className="bg-card border-b border-border px-4 py-2.5 shrink-0 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-lg px-3 py-2 text-[11px] font-mono text-muted-foreground truncate">{trackingLink}</div>
            <button onClick={handleCopyLink} className="p-2 rounded-lg hover:bg-muted transition-colors active:scale-95">
              {copied ? <Check className="w-4 h-4 text-crisis-safe" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
            </button>
            <button onClick={handleShare} className="p-2 rounded-lg bg-primary text-primary-foreground hover:brightness-110 active:scale-95 transition-all">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all active:scale-95"
              style={{ background: "#25D366", color: "white" }}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </button>
            <button
              onClick={handleSMSShare}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-muted text-foreground text-xs font-semibold transition-all active:scale-95"
            >
              <Phone className="w-3.5 h-3.5" />
              SMS
            </button>
          </div>
        </div>
      )}

      {gpsError && (
        <div className="bg-crisis-critical/10 border-b border-crisis-critical/20 px-4 py-2.5 flex items-center gap-2 shrink-0">
          <MapPinOff className="w-4 h-4 text-crisis-critical shrink-0" />
          <p className="text-xs text-foreground">{gpsError}</p>
        </div>
      )}

      <div className="flex-1 relative">
        {(mapError || initError) && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
            <p className="text-sm text-destructive">{initError || "Failed to load Google Maps"}</p>
          </div>
        )}
        {!loaded && !mapError && !initError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
            <p className="text-sm text-muted-foreground animate-pulse">Loading map…</p>
          </div>
        )}
        <div ref={mapElementRef} className="w-full h-full" />
        <div className="absolute bottom-4 left-4 right-4 bg-card/95 backdrop-blur-sm rounded-xl border border-border p-3 shadow-lg z-[1000]">
          <div className="flex items-center justify-between">
          <div>
              <p className="text-xs font-bold text-foreground">
                {incidentTarget ? `📍 ${incidentTarget.category.replace("_", " ").toUpperCase()}` : t("livetrack.sharingLocation")}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {incidentTarget
                  ? `Incident: ${incidentTarget.latitude.toFixed(4)}, ${incidentTarget.longitude.toFixed(4)}`
                  : currentPos
                    ? `${currentPos[0].toFixed(5)}, ${currentPos[1].toFixed(5)}`
                    : t("livetrack.sharingDesc")}
              </p>
            </div>
            <Navigation className="w-5 h-5 text-primary shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;
