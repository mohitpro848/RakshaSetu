import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Phone, MapPin, Search, Building2, Shield, Heart, Scale, ExternalLink, Navigation } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useGoogleMapsLoader } from "@/hooks/useGoogleMapsLoader";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LegalAidDirectoryProps {
  onBack: () => void;
}

type Category = "all" | "police" | "ngo" | "helpline" | "legal";

interface DirectoryEntry {
  id: string;
  name: string;
  category: Category;
  phone: string;
  address: string;
  description: string;
  lat?: number;
  lng?: number;
  isNational?: boolean;
  icon: typeof Building2;
  color: string;
}

const NATIONAL_HELPLINES: DirectoryEntry[] = [
  { id: "h1", name: "Women Helpline (All India)", category: "helpline", phone: "181", address: "National", description: "24/7 women in distress helpline by Ministry of WCD", isNational: true, icon: Phone, color: "text-crisis-critical" },
  { id: "h2", name: "Police Emergency", category: "police", phone: "112", address: "National", description: "Unified emergency number for Police, Fire & Ambulance", isNational: true, icon: Shield, color: "text-primary" },
  { id: "h3", name: "Women Helpline (Domestic Abuse)", category: "helpline", phone: "1091", address: "National", description: "Dedicated helpline for domestic violence cases", isNational: true, icon: Heart, color: "text-crisis-high" },
  { id: "h4", name: "National Commission for Women", category: "ngo", phone: "7827-170-170", address: "New Delhi", description: "NCW complaint & counselling helpline", isNational: true, icon: Scale, color: "text-crisis-safe" },
  { id: "h5", name: "Child Helpline (CHILDLINE)", category: "helpline", phone: "1098", address: "National", description: "24/7 helpline for children in distress", isNational: true, icon: Heart, color: "text-crisis-medium" },
  { id: "h6", name: "Cyber Crime Helpline", category: "police", phone: "1930", address: "National", description: "Report cyber crimes, online harassment, fraud", isNational: true, icon: Shield, color: "text-primary" },
  { id: "h7", name: "Legal Aid (NALSA)", category: "legal", phone: "15100", address: "National", description: "Free legal services for women, SC/ST, economically weaker", isNational: true, icon: Scale, color: "text-crisis-safe" },
  { id: "h8", name: "Acid Attack Helpline", category: "helpline", phone: "1800-103-1026", address: "National", description: "Support for acid attack survivors (toll-free)", isNational: true, icon: Heart, color: "text-crisis-critical" },
  { id: "h9", name: "Mahila Police Volunteer", category: "police", phone: "112", address: "National", description: "Women police volunteer network — contact via 112", isNational: true, icon: Shield, color: "text-primary" },
  { id: "h10", name: "One Stop Centre (Sakhi)", category: "ngo", phone: "181", address: "National (700+ centres)", description: "Medical, legal, psychological support for women affected by violence", isNational: true, icon: Building2, color: "text-crisis-safe" },
];

const CATEGORY_META: Record<Category, { label: string; icon: typeof Building2; color: string }> = {
  all: { label: "All", icon: Building2, color: "text-foreground" },
  police: { label: "Police", icon: Shield, color: "text-primary" },
  ngo: { label: "NGOs", icon: Heart, color: "text-crisis-high" },
  helpline: { label: "Helplines", icon: Phone, color: "text-crisis-critical" },
  legal: { label: "Legal Aid", icon: Scale, color: "text-crisis-safe" },
};

const LegalAidDirectory = ({ onBack }: LegalAidDirectoryProps) => {
  const { t } = useI18n();
  const { loaded: mapsLoaded } = useGoogleMapsLoader();
  const { searchNearby, loading: mapsLoading } = useGoogleMaps();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"helplines" | "nearby">("helplines");
  const [category, setCategory] = useState<Category>("all");
  const [nearbyPlaces, setNearbyPlaces] = useState<DirectoryEntry[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapRef, setMapRef] = useState<HTMLDivElement | null>(null);
  const [googleMap, setGoogleMap] = useState<any>(null);
  const [loadingNearby, setLoadingNearby] = useState(false);

  // Get user location
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation({ lat: 28.6139, lng: 77.209 }) // Default Delhi
    );
  }, []);

  // Search nearby places
  const fetchNearby = useCallback(async () => {
    if (!userLocation) return;
    setLoadingNearby(true);
    try {
      const [policeResults, hospitalResults] = await Promise.all([
        searchNearby(userLocation.lat, userLocation.lng, "police", undefined, 5000),
        searchNearby(userLocation.lat, userLocation.lng, "hospital", "women NGO legal aid", 5000),
      ]);

      const mapped: DirectoryEntry[] = [
        ...(policeResults || []).map((p, i) => ({
          id: `police-${i}`,
          name: p.name,
          category: "police" as Category,
          phone: "",
          address: p.address,
          description: "Police Station",
          lat: p.lat,
          lng: p.lng,
          icon: Shield,
          color: "text-primary",
        })),
        ...(hospitalResults || []).map((p, i) => ({
          id: `ngo-${i}`,
          name: p.name,
          category: "ngo" as Category,
          phone: "",
          address: p.address,
          description: "Support Organization",
          lat: p.lat,
          lng: p.lng,
          icon: Heart,
          color: "text-crisis-high",
        })),
      ];
      setNearbyPlaces(mapped);
    } catch {
      // silent
    } finally {
      setLoadingNearby(false);
    }
  }, [userLocation, searchNearby]);

  useEffect(() => {
    if (activeTab === "nearby" && userLocation && nearbyPlaces.length === 0) {
      fetchNearby();
    }
  }, [activeTab, userLocation, nearbyPlaces.length, fetchNearby]);

  // Initialize Google Map
  useEffect(() => {
    if (!mapsLoaded || !mapRef || !userLocation || googleMap) return;
    const map = new window.google.maps.Map(mapRef, {
      center: userLocation,
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
      mapId: "legal-aid-map",
    });
    setGoogleMap(map);

    new window.google.maps.marker.AdvancedMarkerElement({
      map,
      position: userLocation,
      title: "You",
    });
  }, [mapsLoaded, mapRef, userLocation, googleMap]);

  // Add markers for nearby places
  useEffect(() => {
    if (!googleMap || nearbyPlaces.length === 0) return;
    nearbyPlaces.forEach((place) => {
      if (!place.lat || !place.lng) return;
      const pin = document.createElement("div");
      pin.className = "w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold";
      pin.style.background = place.category === "police" ? "#3b82f6" : "#ef4444";
      pin.textContent = place.category === "police" ? "P" : "N";

      new window.google.maps.marker.AdvancedMarkerElement({
        map: googleMap,
        position: { lat: place.lat, lng: place.lng },
        title: place.name,
        content: pin,
      });
    });
  }, [googleMap, nearbyPlaces]);

  const filteredHelplines = NATIONAL_HELPLINES.filter((entry) => {
    const matchesCategory = category === "all" || entry.category === category;
    const matchesSearch = !searchQuery || entry.name.toLowerCase().includes(searchQuery.toLowerCase()) || entry.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredNearby = nearbyPlaces.filter((entry) => {
    const matchesCategory = category === "all" || entry.category === category;
    const matchesSearch = !searchQuery || entry.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCall = (phone: string) => {
    if (phone) window.location.href = `tel:${phone.replace(/[^0-9+]/g, "")}`;
  };

  const handleDirections = (lat?: number, lng?: number, name?: string) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(name || "")}`, "_blank");
    }
  };

  const DirectoryCard = ({ entry }: { entry: DirectoryEntry }) => {
    const Icon = entry.icon;
    return (
      <div className="bg-card rounded-2xl p-4 border border-border shadow-sm hover:shadow-md transition-all">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${entry.category === "police" ? "bg-primary/10" : entry.category === "helpline" ? "bg-crisis-critical/10" : entry.category === "legal" ? "bg-crisis-safe/10" : "bg-crisis-high/10"}`}>
            <Icon className={`w-5 h-5 ${entry.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground truncate">{entry.name}</h3>
              {entry.isNational && <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0">National</Badge>}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{entry.description}</p>
            {entry.address && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" /> {entry.address}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          {entry.phone && (
            <button
              onClick={() => handleCall(entry.phone)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-crisis-critical/10 text-crisis-critical text-xs font-bold hover:bg-crisis-critical/20 active:scale-[0.97] transition-all"
            >
              <Phone className="w-3.5 h-3.5" /> Call {entry.phone}
            </button>
          )}
          {entry.lat && entry.lng && (
            <button
              onClick={() => handleDirections(entry.lat, entry.lng, entry.name)}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 active:scale-[0.97] transition-all"
            >
              <Navigation className="w-3.5 h-3.5" /> Directions
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 active:scale-95 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-foreground">Legal Aid Directory</h1>
            <p className="text-[10px] text-muted-foreground">Police, NGOs, Helplines & Legal Services</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search helplines, police stations, NGOs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {(Object.keys(CATEGORY_META) as Category[]).map((cat) => {
            const meta = CATEGORY_META[cat];
            const Icon = meta.icon;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${category === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
              >
                <Icon className="w-3 h-3" /> {meta.label}
              </button>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "helplines" | "nearby")}>
          <TabsList className="w-full">
            <TabsTrigger value="helplines" className="flex-1 text-xs">🇮🇳 National Helplines</TabsTrigger>
            <TabsTrigger value="nearby" className="flex-1 text-xs">📍 Nearby Services</TabsTrigger>
          </TabsList>

          <TabsContent value="helplines" className="mt-3 space-y-3">
            {filteredHelplines.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No results found</p>
            ) : (
              filteredHelplines.map((entry) => <DirectoryCard key={entry.id} entry={entry} />)
            )}
          </TabsContent>

          <TabsContent value="nearby" className="mt-3 space-y-3">
            {/* Map */}
            {mapsLoaded && (
              <div ref={setMapRef} className="w-full h-48 rounded-2xl border border-border overflow-hidden" />
            )}

            {loadingNearby || mapsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : filteredNearby.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No nearby services found. Try expanding your search.</p>
            ) : (
              filteredNearby.map((entry) => <DirectoryCard key={entry.id} entry={entry} />)
            )}
          </TabsContent>
        </Tabs>

        {/* Emergency Banner */}
        <div className="bg-crisis-critical/10 border border-crisis-critical/20 rounded-2xl p-4 text-center">
          <p className="text-xs font-bold text-crisis-critical mb-1">In Immediate Danger?</p>
          <button
            onClick={() => handleCall("112")}
            className="w-full py-3 rounded-xl bg-crisis-critical text-white font-bold text-sm active:scale-[0.97] transition-all"
          >
            <Phone className="w-4 h-4 inline mr-2" /> Call 112 — Emergency
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalAidDirectory;
