import { useState } from "react";
import { ArrowLeft, Plus, MapPin, Trash2, ToggleLeft, ToggleRight, Shield, Radio } from "lucide-react";
import { useGeofencing } from "@/hooks/useGeofencing";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface GeofencingZonesProps {
  onBack: () => void;
}

const GeofencingZones = ({ onBack }: GeofencingZonesProps) => {
  const { zones, loading, monitoring, addZone, removeZone, toggleZone, startMonitoring, stopMonitoring } = useGeofencing();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [radius, setRadius] = useState(500);

  const handleAddCurrentLocation = () => {
    if (!name.trim()) { toast.error("Please enter a zone name"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        addZone({
          name: name.trim(),
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          radius_meters: radius,
          is_active: true,
          notify_contacts: true,
        });
        setName("");
        setRadius(500);
        setShowAdd(false);
      },
      () => toast.error("Could not get your location")
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-[hsl(160,60%,25%)] to-[hsl(180,50%,20%)] px-4 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Geofencing Safe Zones</h1>
            <p className="text-white/60 text-xs">Set safe areas & get alerts when you leave</p>
          </div>
        </div>

        {/* Monitoring toggle */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Radio className={`w-5 h-5 ${monitoring ? "text-crisis-safe animate-pulse" : "text-white/40"}`} />
            <div>
              <p className="text-white text-sm font-semibold">{monitoring ? "Monitoring Active" : "Monitoring Off"}</p>
              <p className="text-white/50 text-xs">{zones.filter((z) => z.is_active).length} active zones</p>
            </div>
          </div>
          <button
            onClick={monitoring ? stopMonitoring : startMonitoring}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              monitoring ? "bg-crisis-safe/20 text-crisis-safe" : "bg-white text-[hsl(160,60%,25%)]"
            }`}
          >
            {monitoring ? "Stop" : "Start"}
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Add zone */}
        {showAdd ? (
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
            <p className="text-sm font-bold text-foreground">Add Safe Zone</p>
            <Input placeholder="Zone name (e.g., Home, Office)" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Radius</span>
                <span className="text-sm font-bold text-primary">{radius}m</span>
              </div>
              <Slider value={[radius]} onValueChange={([v]) => setRadius(v)} min={100} max={2000} step={50} />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddCurrentLocation}
                className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Use Current Location
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-secondary text-foreground hover:bg-secondary/80"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full bg-card rounded-2xl border-2 border-dashed border-border p-5 flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Safe Zone
          </button>
        )}

        {/* Zone list */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : zones.length === 0 ? (
          <div className="text-center py-10">
            <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No safe zones yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Add zones to get alerts when you leave them</p>
          </div>
        ) : (
          <div className="space-y-3">
            {zones.map((zone) => (
              <div key={zone.id} className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${zone.is_active ? "bg-crisis-safe/10" : "bg-secondary"}`}>
                      <MapPin className={`w-5 h-5 ${zone.is_active ? "text-crisis-safe" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{zone.name}</p>
                      <p className="text-[10px] text-muted-foreground">Radius: {zone.radius_meters}m</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={zone.is_active}
                      onCheckedChange={(checked) => toggleZone(zone.id, checked)}
                    />
                    <button
                      onClick={() => removeZone(zone.id)}
                      className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="bg-secondary/50 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-bold text-foreground">How It Works</p>
          <ul className="space-y-1.5">
            {[
              "Set safe zones around places you frequent (home, office, etc.)",
              "Enable monitoring to track your location in the background",
              "Get instant alerts when you leave any active safe zone",
              "Emergency contacts are notified automatically",
            ].map((text) => (
              <li key={text} className="text-[11px] text-muted-foreground flex items-start gap-2">
                <span className="text-crisis-safe mt-0.5">•</span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GeofencingZones;
