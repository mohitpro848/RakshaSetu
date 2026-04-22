import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Layers, Navigation, Shield, AlertTriangle, MapPin, Search, Hospital, Building2, Flame, Loader2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useGoogleMaps, NearbyPlace, PlaceDetails } from "@/hooks/useGoogleMaps";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMapsLoader";
import LocationSearch from "@/components/LocationSearch";

interface MapPoint {
  id: number;
  lat: number;
  lng: number;
  type: "incident" | "safe";
  level?: "Critical" | "High" | "Medium";
  label: string;
  detail: string;
}

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 }; // India center fallback

const points: MapPoint[] = [
  { id: 1, lat: 28.628, lng: 77.219, type: "incident", level: "Critical", label: "Fire Reported", detail: "Sector 22, Dwarka — 3 min ago" },
  { id: 2, lat: 28.5965, lng: 77.1855, type: "incident", level: "High", label: "Suspicious Activity", detail: "MG Road — 28 min ago" },
  { id: 3, lat: 28.635, lng: 77.225, type: "incident", level: "Medium", label: "Road Accident", detail: "NH-48, Gurugram — 45 min ago" },
  { id: 4, lat: 28.61, lng: 77.23, type: "safe", label: "Safdarjung Hospital", detail: "24/7 Emergency Ward" },
  { id: 5, lat: 28.6225, lng: 77.198, type: "safe", label: "Police Station — Chanakyapuri", detail: "Staffed & Active" },
  { id: 6, lat: 28.605, lng: 77.215, type: "safe", label: "Fire Station — South Delhi", detail: "Response Unit Available" },
  { id: 7, lat: 28.632, lng: 77.205, type: "safe", label: "AIIMS Trauma Centre", detail: "Emergency Services" },
];

const markerColor = (p: MapPoint) => {
  if (p.type === "safe") return "#22c55e";
  if (p.level === "Critical") return "#ef4444";
  if (p.level === "High") return "#f97316";
  return "#eab308";
};

const placeColors: Record<string, string> = {
  hospital: "#22c55e",
  police: "#3b82f6",
  fire_station: "#ef4444",
};

type Filter = "all" | "incidents" | "safe";

interface EmergencyMapProps {
  onBack: () => void;
}

const PLACE_TYPES = [
  { key: "hospital", label: "Hospitals", icon: Hospital, color: "bg-green-500" },
  { key: "police", label: "Police", icon: Building2, color: "bg-blue-500" },
  { key: "fire_station", label: "Fire Station", icon: Flame, color: "bg-red-500" },
];

function createMarkerEl(color: string, size = 28): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer;`;
  return el;
}

function createPlaceMarkerEl(color: string): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = `width:24px;height:24px;border-radius:6px;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;cursor:pointer;`;
  el.innerHTML = `<svg width="14" height="14" fill="white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
  return el;
}

function createSelectedMarkerEl(): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText = "width:32px;height:32px;border-radius:50%;background:#8b5cf6;border:3px solid white;box-shadow:0 0 0 4px rgba(139,92,246,0.3),0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer;";
  el.innerHTML = `<svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
  return el;
}

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const EmergencyMap = ({ onBack }: EmergencyMapProps) => {
  const { t } = useI18n();
  const { loaded, error: mapError } = useGoogleMapsLoader();
  const [filter, setFilter] = useState<Filter>("all");
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [showPlaces, setShowPlaces] = useState(false);
  const [activePlaceType, setActivePlaceType] = useState<string | null>(null);
  const [geocodedAddress, setGeocodedAddress] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const { nearbyPlaces, loading: placesLoading, searchNearby, reverseGeocode } = useGoogleMaps();

  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circlesRef = useRef<any[]>([]);
  const placeMarkersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const selectedMarkerRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);

  const filtered = useMemo(
    () => points.filter((p) => {
      if (filter === "all") return true;
      if (filter === "incidents") return p.type === "incident";
      return p.type === "safe";
    }),
    [filter]
  );

  const refPos = userPos || DEFAULT_CENTER;

  const [initError, setInitError] = useState<string | null>(null);

  // Auto-detect user location on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const nextPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(nextPos);
        if (mapRef.current) {
          mapRef.current.panTo(nextPos);
          mapRef.current.setZoom(14);
        }
        const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        if (result) setGeocodedAddress(result.address);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, [reverseGeocode]);

  // Init map
  useEffect(() => {
    if (!loaded || !mapElementRef.current || mapRef.current) return;
    try {
      const gmaps = (window as any).google.maps;
      if (!gmaps?.Map) { setInitError("Google Maps failed to load"); return; }
      const map = new gmaps.Map(mapElementRef.current, {
        center: userPos || DEFAULT_CENTER,
        zoom: userPos ? 14 : 5,
        disableDefaultUI: true,
        zoomControl: true,
        mapId: "emergency_map",
        gestureHandling: "greedy",
      });
      mapRef.current = map;
      infoWindowRef.current = new gmaps.InfoWindow();

    // Click on map → reverse geocode
    map.addListener("click", async (e: any) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      
      // Show marker immediately
      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.position = { lat, lng };
      } else {
        const el = createSelectedMarkerEl();
        selectedMarkerRef.current = new gmaps.marker.AdvancedMarkerElement({
          position: { lat, lng },
          map,
          content: el,
          title: "Selected Location",
        });
      }

      // Reverse geocode the clicked point
      try {
        const { data } = await (await import("@/integrations/supabase/client")).supabase.functions.invoke("google-maps-proxy", {
          body: { action: "geocode", lat, lng },
        });
        if (data?.address) {
          setGeocodedAddress(data.address);
          const iw = infoWindowRef.current;
          iw.setContent(`
            <div style="font-family:'Noto Sans',system-ui,sans-serif;min-width:180px;max-width:260px;">
              <p style="font-weight:700;font-size:13px;margin:0;">📍 Selected Location</p>
              <p style="font-size:11px;color:#666;margin:4px 0 0;">${data.address}</p>
              <p style="font-size:10px;color:#999;margin:4px 0 0;">${lat.toFixed(5)}, ${lng.toFixed(5)}</p>
            </div>
          `);
          iw.open(map, selectedMarkerRef.current);
        }
      } catch (err) {
        console.error("Map click geocode error:", err);
      }
    });

    } catch (err: any) {
      console.error("EmergencyMap init error:", err);
      setInitError(err?.message || "Failed to initialize map");
    }
    return () => { mapRef.current = null; };
  }, [loaded, userPos]);

  // Render incident/safe markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    const gmaps = (window as any).google.maps;

    markersRef.current.forEach((m: any) => (m.map = null));
    markersRef.current = [];
    circlesRef.current.forEach((c: any) => c.setMap(null));
    circlesRef.current = [];

    const iw = infoWindowRef.current;

    filtered.forEach((p) => {
      if (p.type === "safe") {
        const circle = new gmaps.Circle({
          center: { lat: p.lat, lng: p.lng },
          radius: 500,
          strokeColor: "#22c55e",
          strokeWeight: 1.5,
          fillColor: "#22c55e",
          fillOpacity: 0.08,
          map,
        });
        circlesRef.current.push(circle);
      }

      const el = createMarkerEl(markerColor(p));
      const marker = new gmaps.marker.AdvancedMarkerElement({
        position: { lat: p.lat, lng: p.lng },
        map,
        content: el,
        title: p.label,
      });

      el.addEventListener("click", () => {
        iw.setContent(`
          <div style="font-family:'Noto Sans',system-ui,sans-serif;min-width:160px;">
            <p style="font-weight:700;font-size:14px;margin:0;">${p.label}</p>
            <p style="font-size:12px;color:#666;margin:4px 0 0;">${p.detail}</p>
            ${p.level ? `<span style="display:inline-block;margin-top:6px;font-size:10px;font-weight:700;padding:2px 8px;border-radius:9999px;background:${markerColor(p)}22;color:${markerColor(p)}">${p.level}</span>` : ""}
          </div>
        `);
        iw.open(map, marker);
      });

      markersRef.current.push(marker);
    });

    // User marker
    if (userPos) {
      if (!userMarkerRef.current) {
        const el = document.createElement("div");
        el.style.cssText = "width:16px;height:16px;border-radius:50%;background:#6366f1;border:3px solid white;box-shadow:0 0 0 3px rgba(99,102,241,0.3);";
        userMarkerRef.current = new gmaps.marker.AdvancedMarkerElement({
          position: userPos,
          map,
          content: el,
          title: "Your Location",
        });
      } else {
        userMarkerRef.current.position = userPos;
      }
    }
  }, [filtered, userPos, loaded]);

  // Render nearby places
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    const gmaps = (window as any).google.maps;

    placeMarkersRef.current.forEach((m: any) => (m.map = null));
    placeMarkersRef.current = [];

    const iw = infoWindowRef.current;

    nearbyPlaces.forEach((place) => {
      const color = placeColors[activePlaceType || "hospital"] || "#6b7280";
      const dist = getDistanceKm(refPos.lat, refPos.lng, place.lat, place.lng);
      const distLabel = dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`;

      const el = createPlaceMarkerEl(color);
      const marker = new gmaps.marker.AdvancedMarkerElement({
        position: { lat: place.lat, lng: place.lng },
        map,
        content: el,
        title: place.name,
      });

      el.addEventListener("click", () => {
        iw.setContent(`
          <div style="font-family:'Noto Sans',system-ui,sans-serif;min-width:180px;">
            <p style="font-weight:700;font-size:13px;margin:0;">${place.name}</p>
            <p style="font-size:11px;color:#666;margin:4px 0 0;">${place.address || ''}</p>
            <div style="display:flex;gap:8px;margin-top:6px;align-items:center;">
              ${place.rating ? `<span style="font-size:11px;">⭐ ${place.rating}</span>` : ''}
              <span style="font-size:10px;font-weight:600;color:#6b7280;">📏 ${distLabel}</span>
            </div>
            ${place.open_now !== undefined ? `<span style="display:inline-block;margin-top:4px;font-size:10px;font-weight:600;padding:2px 8px;border-radius:9999px;${place.open_now ? 'background:#dcfce7;color:#16a34a' : 'background:#fee2e2;color:#dc2626'}">${place.open_now ? 'Open Now' : 'Closed'}</span>` : ''}
          </div>
        `);
        iw.open(map, marker);
      });

      placeMarkersRef.current.push(marker);
    });
  }, [nearbyPlaces, activePlaceType, loaded, refPos]);

  const handleLocate = async () => {
    setLocating(true);
    if (!navigator.geolocation) {
      setGeocodedAddress("GPS not available on this device");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const nextPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(nextPos);
        mapRef.current?.panTo(nextPos);
        mapRef.current?.setZoom(14);
        setLocating(false);
        const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        if (result) setGeocodedAddress(result.address);
      },
      () => {
        setGeocodedAddress("Location permission denied — enable GPS in browser settings");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSearchNearby = async (type: string) => {
    const pos = userPos || DEFAULT_CENTER;
    setActivePlaceType(type);
    setShowPlaces(true);
    await searchNearby(pos.lat, pos.lng, type, undefined, 5000);
    mapRef.current?.panTo(pos);
    mapRef.current?.setZoom(13);
  };

  const clearPlaces = () => {
    setShowPlaces(false);
    setActivePlaceType(null);
    placeMarkersRef.current.forEach((m: any) => (m.map = null));
    placeMarkersRef.current = [];
  };

  const flyToPlace = (lat: number, lng: number) => {
    mapRef.current?.panTo({ lat, lng });
    mapRef.current?.setZoom(16);
  };

  const handleLocationSelect = (place: PlaceDetails) => {
    if (!place.lat || !place.lng) return;
    const gmaps = (window as any).google?.maps;
    const map = mapRef.current;
    if (!map || !gmaps) return;

    // Place a selected marker
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.position = { lat: place.lat, lng: place.lng };
    } else {
      const el = createSelectedMarkerEl();
      selectedMarkerRef.current = new gmaps.marker.AdvancedMarkerElement({
        position: { lat: place.lat, lng: place.lng },
        map,
        content: el,
        title: place.name || "Selected Location",
      });
    }

    setGeocodedAddress(place.address);
    map.panTo({ lat: place.lat, lng: place.lng });
    map.setZoom(15);

    const iw = infoWindowRef.current;
    iw.setContent(`
      <div style="font-family:'Noto Sans',system-ui,sans-serif;min-width:180px;max-width:260px;">
        <p style="font-weight:700;font-size:13px;margin:0;">${place.name || '📍 Selected'}</p>
        <p style="font-size:11px;color:#666;margin:4px 0 0;">${place.address}</p>
      </div>
    `);
    iw.open(map, selectedMarkerRef.current);
    setShowSearch(false);
  };

  const filters: { key: Filter; labelKey: string; icon: typeof MapPin }[] = [
    { key: "all", labelKey: "map.all", icon: Layers },
    { key: "incidents", labelKey: "map.incidents", icon: AlertTriangle },
    { key: "safe", labelKey: "map.safeZones", icon: Shield },
  ];

  return (
    <div className="fixed inset-0 z-40 bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-muted transition-colors active:scale-95">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-foreground">{t("map.title")}</h2>
          <p className="text-[10px] text-muted-foreground truncate">
            {geocodedAddress || `${filtered.length} ${t("map.locationsVisible")}`}
          </p>
        </div>
        <button
          onClick={() => setShowSearch((s) => !s)}
          className="p-2 rounded-lg bg-muted text-foreground hover:bg-accent active:scale-95 transition-all"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          onClick={handleLocate}
          disabled={locating}
          className="p-2 rounded-lg bg-primary text-primary-foreground hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
        >
          <Navigation className={`w-4 h-4 ${locating ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Location Search */}
      {showSearch && (
        <div className="bg-card border-b border-border px-4 py-2.5 shrink-0">
          <LocationSearch
            onSelect={handleLocationSelect}
            placeholder="Search city, area, or address..."
            userLat={userPos?.lat}
            userLng={userPos?.lng}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-card px-4 py-2 flex gap-2 border-b border-border shrink-0">
        {filters.map(({ key, labelKey, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
              filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* Nearby places toolbar */}
      <div className="bg-card px-4 py-2.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-xs font-semibold text-foreground">Find Nearby</p>
          <div className="flex gap-1.5 ml-auto">
            {PLACE_TYPES.map(({ key, label, icon: Icon, color }) => (
              <button
                key={key}
                onClick={() => handleSearchNearby(key)}
                disabled={placesLoading}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95 ${
                  activePlaceType === key
                    ? `${color} text-white`
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {placesLoading && activePlaceType === key ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Icon className="w-3 h-3" />
                )}
                {label}
              </button>
            ))}
          </div>
        </div>
        {showPlaces && (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">
              {placesLoading ? "Searching..." : `${nearbyPlaces.length} places found nearby`}
            </p>
            <button onClick={clearPlaces} className="p-1 rounded hover:bg-muted">
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      {/* Map */}
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
        <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-xl border border-border p-3 shadow-lg z-[1000]">
          <p className="text-[10px] font-bold text-foreground mb-1.5 uppercase tracking-wide">{t("map.legend")}</p>
          <div className="space-y-1">
            {[
              { color: "#ef4444", labelKey: "map.critical" },
              { color: "#f97316", labelKey: "map.high" },
              { color: "#eab308", labelKey: "map.medium" },
              { color: "#22c55e", labelKey: "map.safeZone" },
              { color: "#8b5cf6", label: "Selected" },
              { color: "#22c55e", label: "Hospital" },
              { color: "#3b82f6", label: "Police" },
              { color: "#ef4444", label: "Fire Station" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                <span className="text-[10px] text-muted-foreground">{'labelKey' in item && item.labelKey ? t(item.labelKey) : ('label' in item ? item.label : '')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nearby places list with distance */}
      {showPlaces && nearbyPlaces.length > 0 && (
        <div className="bg-card border-t border-border max-h-[180px] overflow-y-auto shrink-0">
          <div className="px-4 py-2 space-y-1.5">
            {nearbyPlaces.slice(0, 8).map((place) => {
              const dist = getDistanceKm(refPos.lat, refPos.lng, place.lat, place.lng);
              const distLabel = dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`;
              return (
                <button
                  key={place.id}
                  onClick={() => flyToPlace(place.lat, place.lng)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted transition-colors text-left"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: (placeColors[activePlaceType || "hospital"] || "#6b7280") + "22" }}
                  >
                    <MapPin className="w-4 h-4" style={{ color: placeColors[activePlaceType || "hospital"] }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">{place.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{place.address}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {place.rating && (
                      <span className="text-[10px] font-bold text-muted-foreground block">⭐ {place.rating}</span>
                    )}
                    <span className="text-[10px] font-semibold text-primary">{distLabel}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyMap;
