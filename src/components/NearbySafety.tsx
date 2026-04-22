import { useState, useEffect } from "react";
import { ArrowLeft, MapPin, Phone, Navigation, Shield, Building2, Cross, Pill, Home, Flame, Loader2, LocateFixed } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

interface NearbySafetyProps {
  onBack: () => void;
}

interface SafePlace {
  name: string;
  type: "police" | "hospital" | "pharmacy" | "shelter" | "store" | "fire_station";
  distance: string;
  address: string;
  phone?: string;
  open_24h?: boolean;
}

const typeConfig: Record<string, { icon: typeof MapPin; color: string; label: string }> = {
  police: { icon: Shield, color: "text-blue-400 bg-blue-500/15", label: "Police Station" },
  hospital: { icon: Cross, color: "text-red-400 bg-red-500/15", label: "Hospital" },
  pharmacy: { icon: Pill, color: "text-green-400 bg-green-500/15", label: "Pharmacy" },
  shelter: { icon: Home, color: "text-purple-400 bg-purple-500/15", label: "Women's Shelter" },
  store: { icon: Building2, color: "text-yellow-400 bg-yellow-500/15", label: "24/7 Store" },
  fire_station: { icon: Flame, color: "text-orange-400 bg-orange-500/15", label: "Fire Station" },
};

const NearbySafety = ({ onBack }: NearbySafetyProps) => {
  const { t, language } = useI18n();
  const { toast } = useToast();
  const [places, setPlaces] = useState<SafePlace[]>([]);
  const [safetyNote, setSafetyNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Error", description: "Geolocation not supported", variant: "destructive" });
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        fetchNearby(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        toast({ title: "Location denied", description: "Please enable location access", variant: "destructive" });
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const fetchNearby = async (lat: number, lng: number) => {
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/nearby-safety`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ latitude: lat, longitude: lng, language }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Failed to find nearby places");
      }

      const data = await resp.json();
      setPlaces(data.places || []);
      setSafetyNote(data.area_safety_note || "");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, "_self");
  };

  const handleNavigate = (address: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-accent transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">Nearby Safe Places</h1>
          <p className="text-xs text-muted-foreground">AI-powered safety locations near you</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Finding safe places near you...</p>
          </div>
        )}

        {!loading && places.length === 0 && (
          <div className="text-center py-16">
            <LocateFixed className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Enable location to find nearby safe places</p>
            <button
              onClick={getLocation}
              className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold"
            >
              Detect Location
            </button>
          </div>
        )}

        {safetyNote && (
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-xs text-primary font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {safetyNote}
            </p>
          </div>
        )}

        <div className="space-y-2">
          {places.map((place, i) => {
            const config = typeConfig[place.type] || typeConfig.store;
            const Icon = config.icon;
            return (
              <div key={i} className="p-3 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground truncate">{place.name}</h3>
                      {place.open_24h && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400">24/7</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{config.label} • {place.distance}</p>
                    <p className="text-xs text-muted-foreground/70 truncate">{place.address}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {place.phone && (
                      <button
                        onClick={() => handleCall(place.phone!)}
                        className="w-9 h-9 rounded-lg bg-green-500/15 text-green-400 flex items-center justify-center hover:bg-green-500/25 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleNavigate(place.address)}
                      className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center hover:bg-primary/25 transition-colors"
                    >
                      <Navigation className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!loading && places.length > 0 && (
          <button
            onClick={getLocation}
            className="w-full py-3 rounded-xl bg-card border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <LocateFixed className="w-4 h-4 inline mr-2" />
            Refresh Location
          </button>
        )}
      </div>
    </div>
  );
};

export default NearbySafety;
