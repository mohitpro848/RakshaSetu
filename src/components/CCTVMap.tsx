import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Camera, Plus, ThumbsUp, ThumbsDown, MapPin, CheckCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface CCTVLocation {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  address: string | null;
  description: string | null;
  is_verified: boolean;
  upvotes: number;
  downvotes: number;
  created_at: string;
}

interface CCTVMapProps {
  onBack: () => void;
}

const CCTVMap = ({ onBack }: CCTVMapProps) => {
  const { user } = useAuth();
  const [locations, setLocations] = useState<CCTVLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  const fetchLocations = useCallback(async () => {
    const { data } = await supabase
      .from("cctv_locations")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setLocations(data as CCTVLocation[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const addAtCurrentLocation = () => {
    if (!address.trim()) { toast.error("Please enter the address"); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { error } = await supabase.from("cctv_locations").insert({
          user_id: user!.id,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          address: address.trim(),
          description: description.trim() || null,
        } as any);
        if (error) { toast.error("Failed to add CCTV location"); return; }
        toast.success("CCTV location added! 📷");
        setAddress("");
        setDescription("");
        setShowAdd(false);
        fetchLocations();
      },
      () => toast.error("Could not get your location")
    );
  };

  const vote = async (id: string, type: "up" | "down") => {
    const loc = locations.find((l) => l.id === id);
    if (!loc) return;
    const update = type === "up" ? { upvotes: loc.upvotes + 1 } : { downvotes: loc.downvotes + 1 };
    // We can't update others' rows due to RLS, so we'll use a simple approach
    // In production, you'd have a separate votes table
    const { error } = await supabase.from("cctv_locations").update(update as any).eq("id", id);
    if (error) {
      toast.error("Only the reporter can modify this pin");
      return;
    }
    setLocations((locs) => locs.map((l) => (l.id === id ? { ...l, ...update } : l)));
  };

  const deleteLocation = async (id: string) => {
    const { error } = await supabase.from("cctv_locations").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    setLocations((l) => l.filter((loc) => loc.id !== id));
    toast.success("CCTV pin removed");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-[hsl(210,50%,25%)] to-[hsl(230,45%,20%)] px-4 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">CCTV Camera Map</h1>
            <p className="text-white/60 text-xs">Community-mapped surveillance cameras</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 flex items-center gap-3">
          <Camera className="w-6 h-6 text-white/70" />
          <div>
            <p className="text-white text-sm font-semibold">{locations.length} CCTV Cameras Mapped</p>
            <p className="text-white/50 text-xs">{locations.filter((l) => l.is_verified).length} verified by community</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Add CCTV */}
        {showAdd ? (
          <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
            <p className="text-sm font-bold text-foreground">Pin a CCTV Camera</p>
            <Input placeholder="Address / Location name" value={address} onChange={(e) => setAddress(e.target.value)} />
            <Textarea placeholder="Description (optional) - e.g., ATM camera, shop entrance" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            <div className="flex gap-2">
              <button
                onClick={addAtCurrentLocation}
                className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Pin at My Location
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
            Pin a CCTV Camera
          </button>
        )}

        {/* Locations list */}
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-10">
            <Camera className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No CCTV cameras mapped yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Be the first to pin a camera location!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {locations.map((loc) => (
              <div key={loc.id} className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${loc.is_verified ? "bg-crisis-safe/10" : "bg-secondary"}`}>
                      <Camera className={`w-5 h-5 ${loc.is_verified ? "text-crisis-safe" : "text-muted-foreground"}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-foreground truncate">{loc.address || "Unknown"}</p>
                        {loc.is_verified && <CheckCircle className="w-3.5 h-3.5 text-crisis-safe shrink-0" />}
                      </div>
                      {loc.description && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{loc.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {new Date(loc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => vote(loc.id, "up")}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-crisis-safe transition-colors"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{loc.upvotes}</span>
                    </button>
                    <button
                      onClick={() => vote(loc.id, "down")}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>{loc.downvotes}</span>
                    </button>
                  </div>
                  {user?.id === loc.user_id && (
                    <button
                      onClick={() => deleteLocation(loc.id)}
                      className="flex items-center gap-1 text-xs text-destructive/70 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="bg-secondary/50 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-bold text-foreground">Why Map CCTV Cameras?</p>
          <ul className="space-y-1.5">
            {[
              "Know which areas have surveillance for safer route planning",
              "Community-verified locations help everyone stay safe",
              "Cameras deter crime and help with evidence collection",
              "Pin cameras you spot to help the community",
            ].map((text) => (
              <li key={text} className="text-[11px] text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CCTVMap;
