import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMapsLoader";
import { MapPin, Radio, Clock, Shield, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/track/$code")({
  component: TrackViewerPage,
});

interface LocationPoint {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  created_at: string;
}

function TrackViewerPage() {
  const { code } = Route.useParams();
  const { loaded, error: mapError } = useGoogleMapsLoader();

  const [sessionData, setSessionData] = useState<{ id: string; is_active: boolean; started_at: string } | null>(null);
  const [locations, setLocations] = useState<LocationPoint[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const pathRef = useRef<any>(null);
  const trailMarkersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!code) return;
    (async () => {
      const { data: sessRows, error: sessErr } = await supabase
        .rpc("get_tracking_session_by_code", { _code: code });
      const sess = sessRows?.[0];

      if (sessErr || !sess) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setSessionData({ id: sess.id, is_active: sess.is_active, started_at: sess.started_at });

      const { data: locs } = await supabase
        .rpc("get_location_updates_by_code", { _code: code });

      setLocations(
        (locs || []).map((l: any) => ({
          latitude: l.latitude,
          longitude: l.longitude,
          accuracy: l.accuracy,
          created_at: l.created_at,
        }))
      );
      setLoading(false);
    })();
  }, [code]);

  useEffect(() => {
    if (!sessionData) return;
    const channel = supabase
      .channel(`track-${sessionData.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "live_location_updates",
          filter: `session_id=eq.${sessionData.id}`,
        },
        (payload: any) => {
          const p = payload.new as any;
          setLocations((prev) => [
            ...prev,
            { latitude: p.latitude, longitude: p.longitude, accuracy: p.accuracy, created_at: p.created_at },
          ]);
        }
      )
      .subscribe();

    const sessionChannel = supabase
      .channel(`session-${sessionData.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "live_tracking_sessions",
          filter: `id=eq.${sessionData.id}`,
        },
        (payload: any) => {
          const s = payload.new as any;
          setSessionData((prev) => prev ? { ...prev, is_active: s.is_active } : prev);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(sessionChannel);
    };
  }, [sessionData?.id]);

  useEffect(() => {
    if (!loaded || !mapElementRef.current || mapRef.current) return;
    const gmaps = (window as any).google?.maps;
    if (!gmaps?.Map) return;

    const last = locations[locations.length - 1];
    const center = last
      ? { lat: last.latitude, lng: last.longitude }
      : { lat: 20.5937, lng: 78.9629 };

    mapRef.current = new gmaps.Map(mapElementRef.current, {
      center,
      zoom: last ? 16 : 5,
      disableDefaultUI: true,
      zoomControl: true,
      mapId: "track_viewer_map",
      gestureHandling: "greedy",
    });
  }, [loaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || locations.length === 0) return;
    const gmaps = (window as any).google?.maps;
    if (!gmaps) return;

    const last = locations[locations.length - 1];

    if (pathRef.current) pathRef.current.setMap(null);
    if (locations.length > 1) {
      pathRef.current = new gmaps.Polyline({
        path: locations.map((l) => ({ lat: l.latitude, lng: l.longitude })),
        strokeColor: "#6366f1",
        strokeOpacity: 0.7,
        strokeWeight: 3,
        map,
      });
    }

    trailMarkersRef.current.forEach((m: any) => (m.map = null));
    trailMarkersRef.current = [];
    locations.slice(0, -1).filter((_: any, i: number) => i % 3 === 0).forEach((l) => {
      const dot = document.createElement("div");
      dot.style.cssText = "width:6px;height:6px;border-radius:50%;background:#6366f1;opacity:0.45;";
      try {
        const m = new gmaps.marker.AdvancedMarkerElement({
          position: { lat: l.latitude, lng: l.longitude }, map, content: dot,
        });
        trailMarkersRef.current.push(m);
      } catch {}
    });

    if (!markerRef.current) {
      const el = document.createElement("div");
      el.style.cssText = "width:20px;height:20px;border-radius:50%;background:#6366f1;border:3px solid white;box-shadow:0 0 0 4px rgba(99,102,241,0.3);";
      try {
        markerRef.current = new gmaps.marker.AdvancedMarkerElement({
          position: { lat: last.latitude, lng: last.longitude }, map, content: el,
        });
      } catch {}
    } else {
      markerRef.current.position = { lat: last.latitude, lng: last.longitude };
    }

    map.panTo({ lat: last.latitude, lng: last.longitude });
  }, [locations, loaded]);

  const lastLoc = locations[locations.length - 1];
  const timeSince = lastLoc
    ? Math.round((Date.now() - new Date(lastLoc.created_at).getTime()) / 1000)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Radio className="w-8 h-8 text-primary animate-pulse mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading tracking session...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center max-w-xs">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <h1 className="text-lg font-bold text-foreground mb-1">Session Not Found</h1>
          <p className="text-sm text-muted-foreground mb-4">
            This tracking link is invalid or has expired.
          </p>
          <Link to="/" className="text-sm text-primary underline">Go to RakshaSetu</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <Shield className="w-5 h-5 text-primary" />
        <div className="flex-1">
          <h1 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Radio className={`w-3.5 h-3.5 ${sessionData?.is_active ? "text-crisis-critical animate-pulse" : "text-muted-foreground"}`} />
            Live Location Tracking
          </h1>
          <p className="text-[10px] text-muted-foreground">
            {sessionData?.is_active ? "🟢 Active — location updating in real-time" : "⚫ Session ended"}
          </p>
        </div>
      </div>

      <div className="flex-1 relative">
        {(mapError) && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
            <p className="text-sm text-destructive">Failed to load map</p>
          </div>
        )}
        {!loaded && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
            <p className="text-sm text-muted-foreground animate-pulse">Loading map…</p>
          </div>
        )}
        <div ref={mapElementRef} className="w-full h-full" />

        <div className="absolute bottom-4 left-4 right-4 bg-card/95 backdrop-blur-sm rounded-xl border border-border p-3 shadow-lg z-[1000]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                {lastLoc
                  ? `${lastLoc.latitude.toFixed(5)}, ${lastLoc.longitude.toFixed(5)}`
                  : "Waiting for location..."}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeSince !== null
                  ? timeSince < 10 ? "Just now" : `${timeSince}s ago`
                  : "No updates yet"}
                {" • "}
                {locations.length} points
              </p>
            </div>
            {sessionData?.is_active && (
              <div className="w-2.5 h-2.5 rounded-full bg-crisis-safe animate-pulse" />
            )}
          </div>
        </div>
      </div>

      <div className="bg-card border-t border-border px-4 py-2 text-center shrink-0">
        <p className="text-[10px] text-muted-foreground">
          Powered by <Link to="/" className="text-primary font-semibold">RakshaSetu</Link> — Women's Safety Platform
        </p>
      </div>
    </div>
  );
}
