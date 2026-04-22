/// <reference types="@types/google.maps" />
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  MapPin,
  Navigation,
  Route as RouteIcon,
  Search,
  Loader2,
  X,
  Star,
  Clock,
  Footprints,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMapsLoader";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";

interface IncidentPoint {
  lat: number;
  lng: number;
  severity: string;
  category: string;
}

const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 }; // New Delhi

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 10,
  high: 7,
  medium: 4,
  low: 1,
};

export default function SafeRoutes() {
  const navigate = useNavigate();
  const { loaded, error: mapError } = useGoogleMapsLoader();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  const [incidents, setIncidents] = useState<IncidentPoint[]>([]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    safetyScore: number;
    warnings: string[];
  } | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch incidents from DB
  useEffect(() => {
    const fetchIncidents = async () => {
      const { data } = await supabase
        .from("incident_reports")
        .select("latitude, longitude, severity, category")
        .limit(500);

      if (data) {
        setIncidents(
          data.map((d) => ({
            lat: d.latitude,
            lng: d.longitude,
            severity: d.severity,
            category: d.category,
          }))
        );
      }
    };
    fetchIncidents();
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          setUserLocation(DEFAULT_CENTER);
        }
      );
    } else {
      setUserLocation(DEFAULT_CENTER);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!loaded || !mapRef.current || mapInstanceRef.current) return;

    const center = userLocation || DEFAULT_CENTER;
    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: 14,
      mapId: "safe_routes_map",
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "simplified" }] },
      ],
    });

    mapInstanceRef.current = map;

    // User location marker
    if (userLocation) {
      new google.maps.Marker({
        position: userLocation,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
        title: "Your Location",
      });
    }
  }, [loaded, userLocation]);

  // Apply heatmap overlay from incident data
  useEffect(() => {
    if (!mapInstanceRef.current || !loaded || incidents.length === 0) return;

    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
    }

    if (!showHeatmap) return;

    const heatmapData = incidents.map((inc) => ({
      location: new google.maps.LatLng(inc.lat, inc.lng),
      weight: SEVERITY_WEIGHT[inc.severity] || 3,
    }));

    const heatmap = new google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      map: mapInstanceRef.current,
      radius: 50,
      opacity: 0.6,
      gradient: [
        "rgba(0, 255, 0, 0)",
        "rgba(0, 255, 0, 0.2)",
        "rgba(255, 255, 0, 0.4)",
        "rgba(255, 165, 0, 0.6)",
        "rgba(255, 69, 0, 0.8)",
        "rgba(255, 0, 0, 1)",
      ],
    });

    heatmapRef.current = heatmap;
  }, [incidents, loaded, showHeatmap]);

  // Calculate safety score for a route based on nearby incidents
  const calculateRouteSafety = useCallback(
    (route: google.maps.DirectionsRoute) => {
      const path = route.overview_path;
      let dangerScore = 0;
      const warnings: string[] = [];
      const categoryCount: Record<string, number> = {};

      for (const inc of incidents) {
        const incLatLng = new google.maps.LatLng(inc.lat, inc.lng);
        for (const point of path) {
          const dist = google.maps.geometry.spherical.computeDistanceBetween(point, incLatLng);
          if (dist < 300) {
            dangerScore += SEVERITY_WEIGHT[inc.severity] || 3;
            categoryCount[inc.category] = (categoryCount[inc.category] || 0) + 1;
            break;
          }
        }
      }

      for (const [cat, count] of Object.entries(categoryCount)) {
        if (count >= 2) {
          warnings.push(`${count} ${cat.replace("_", " ")} incidents nearby`);
        }
      }

      const maxDanger = incidents.length * 5;
      const safetyScore = Math.max(0, Math.round(100 - (dangerScore / Math.max(maxDanger, 1)) * 100));

      return { safetyScore, warnings };
    },
    [incidents]
  );

  const handleFindRoute = useCallback(async () => {
    if (!origin.trim() || !destination.trim() || !mapInstanceRef.current) return;
    setLoading(true);
    setRouteInfo(null);

    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
    }

    const directionsService = new google.maps.DirectionsService();
    const renderer = new google.maps.DirectionsRenderer({
      map: mapInstanceRef.current,
      polylineOptions: {
        strokeColor: "#22c55e",
        strokeWeight: 5,
        strokeOpacity: 0.85,
      },
      suppressMarkers: false,
    });
    directionsRendererRef.current = renderer;

    try {
      const result = await directionsService.route({
        origin,
        destination,
        travelMode: google.maps.TravelMode.WALKING,
        provideRouteAlternatives: true,
      });

      if (result.routes.length === 0) {
        setLoading(false);
        return;
      }

      // Pick safest route
      let bestRoute = result.routes[0];
      let bestSafety = calculateRouteSafety(bestRoute);

      for (let i = 1; i < result.routes.length; i++) {
        const safety = calculateRouteSafety(result.routes[i]);
        if (safety.safetyScore > bestSafety.safetyScore) {
          bestRoute = result.routes[i];
          bestSafety = safety;
        }
      }

      // Show only the safest route
      result.routes = [bestRoute];
      renderer.setDirections(result);

      const leg = bestRoute.legs[0];
      setRouteInfo({
        distance: leg.distance?.text || "N/A",
        duration: leg.duration?.text || "N/A",
        safetyScore: bestSafety.safetyScore,
        warnings: bestSafety.warnings,
      });
    } catch {
      setRouteInfo(null);
    } finally {
      setLoading(false);
    }
  }, [origin, destination, calculateRouteSafety]);

  const safetyColor = (score: number) => {
    if (score >= 75) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const safetyLabel = (score: number) => {
    if (score >= 75) return "Safe Route";
    if (score >= 50) return "Moderate Risk";
    return "High Risk Area";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/" })}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Footprints className="w-5 h-5 text-green-400" />
          <h1 className="text-lg font-bold">Safe Routes</h1>
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            variant={showHeatmap ? "default" : "outline"}
            size="sm"
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="text-xs"
          >
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            Heatmap
          </Button>
        </div>
      </div>

      {/* Route Input Panel */}
      <div className="bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3 space-y-2 z-10">
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <div className="w-0.5 h-6 bg-muted-foreground/30" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
          <div className="flex-1 space-y-2">
            <Input
              placeholder="Starting point (or use current location)"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="h-9 text-sm bg-muted/50"
            />
            <Input
              placeholder="Where are you going?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="h-9 text-sm bg-muted/50"
            />
          </div>
        </div>
        <div className="flex gap-2">
          {userLocation && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setOrigin(`${userLocation.lat}, ${userLocation.lng}`)}
            >
              <Navigation className="w-3 h-3 mr-1" />
              Use My Location
            </Button>
          )}
          <Button
            size="sm"
            className="ml-auto bg-green-600 hover:bg-green-700 text-white text-xs"
            onClick={handleFindRoute}
            disabled={loading || !origin.trim() || !destination.trim()}
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
            ) : (
              <RouteIcon className="w-3.5 h-3.5 mr-1" />
            )}
            Find Safest Route
          </Button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {!loaded ? (
          <div className="flex items-center justify-center h-full bg-muted">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : mapError ? (
          <div className="flex items-center justify-center h-full bg-muted text-destructive p-4 text-center">
            Failed to load map. Please try again.
          </div>
        ) : (
          <div ref={mapRef} className="w-full h-full" />
        )}

        {/* Route Info Overlay */}
        {routeInfo && (
          <Card className="absolute bottom-4 left-4 right-4 bg-card/95 backdrop-blur-sm border-border shadow-xl z-10">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className={`w-6 h-6 ${safetyColor(routeInfo.safetyScore)}`} />
                  <div>
                    <p className={`text-lg font-bold ${safetyColor(routeInfo.safetyScore)}`}>
                      {routeInfo.safetyScore}% Safe
                    </p>
                    <p className="text-xs text-muted-foreground">{safetyLabel(routeInfo.safetyScore)}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setRouteInfo(null)} className="h-7 w-7">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Footprints className="w-4 h-4" />
                  <span>{routeInfo.distance}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{routeInfo.duration}</span>
                </div>
              </div>

              {routeInfo.warnings.length > 0 && (
                <div className="space-y-1.5">
                  {routeInfo.warnings.map((w, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded-lg border border-border p-3 text-xs space-y-1.5 z-10">
          <p className="font-semibold text-foreground mb-1">Heatmap Legend</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Safe</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-muted-foreground">High Risk</span>
          </div>
        </div>

        {/* Incident count badge */}
        <Badge
          variant="secondary"
          className="absolute top-3 left-3 z-10 bg-card/90 backdrop-blur-sm border border-border text-xs"
        >
          <MapPin className="w-3 h-3 mr-1" />
          {incidents.length} incidents tracked
        </Badge>
      </div>
    </div>
  );
}
