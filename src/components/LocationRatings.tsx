import { useState, useEffect } from "react";
import { ArrowLeft, Star, MapPin, Sun, Moon, Sunrise, Sunset, Plus, X, Send } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Rating {
  id: string;
  user_id: string;
  author_name: string | null;
  place_name: string;
  address: string | null;
  safety_rating: number;
  lighting_rating: number | null;
  crowd_rating: number | null;
  review: string | null;
  visit_time: string | null;
  created_at: string;
}

interface LocationRatingsProps {
  onBack: () => void;
}

const visitTimeIcons: Record<string, typeof Sun> = { day: Sun, night: Moon, morning: Sunrise, evening: Sunset };

const StarRating = ({ value, onChange, size = "w-5 h-5" }: { value: number; onChange?: (v: number) => void; size?: string }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <button key={s} type="button" onClick={() => onChange?.(s)} disabled={!onChange}
        className={`${onChange ? "cursor-pointer" : "cursor-default"}`}>
        <Star className={`${size} ${s <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
      </button>
    ))}
  </div>
);

const LocationRatings = ({ onBack }: LocationRatingsProps) => {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();

  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [placeName, setPlaceName] = useState("");
  const [address, setAddress] = useState("");
  const [safetyRating, setSafetyRating] = useState(0);
  const [lightingRating, setLightingRating] = useState(0);
  const [crowdRating, setCrowdRating] = useState(0);
  const [review, setReview] = useState("");
  const [visitTime, setVisitTime] = useState("day");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchRatings(); }, []);

  const fetchRatings = async () => {
    setLoading(true);
    const { data } = await supabase.from("location_ratings").select("*").order("created_at", { ascending: false });
    setRatings((data as Rating[]) || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user || !placeName.trim() || safetyRating === 0) return;
    setSubmitting(true);
    const { error } = await supabase.from("location_ratings").insert({
      user_id: user.id,
      author_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Anonymous",
      place_name: placeName.trim(),
      address: address.trim() || null,
      safety_rating: safetyRating,
      lighting_rating: lightingRating || null,
      crowd_rating: crowdRating || null,
      review: review.trim() || null,
      visit_time: visitTime,
    });
    setSubmitting(false);
    if (!error) {
      toast({ title: "Rating submitted!", description: "Thanks for helping the community stay safe." });
      setShowForm(false);
      setPlaceName(""); setAddress(""); setSafetyRating(0); setLightingRating(0); setCrowdRating(0); setReview("");
      fetchRatings();
    }
  };

  const avgSafety = ratings.length ? (ratings.reduce((s, r) => s + r.safety_rating, 0) / ratings.length).toFixed(1) : "—";

  const timeAgo = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-muted/50">
        <header className="bg-card border-b border-border">
          <div className="container flex items-center gap-3 h-14 px-4">
            <button onClick={() => setShowForm(false)} className="p-2 hover:bg-muted rounded-lg"><X className="w-5 h-5" /></button>
            <h1 className="text-sm font-bold text-foreground">Rate a Location</h1>
          </div>
        </header>
        <main className="container px-4 py-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-foreground mb-1 block">Place Name *</label>
            <input value={placeName} onChange={(e) => setPlaceName(e.target.value)} placeholder="e.g. Connaught Place Metro"
              className="w-full text-sm bg-card border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs font-bold text-foreground mb-1 block">Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Area, City"
              className="w-full text-sm bg-card border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs font-bold text-foreground mb-2 block">Safety Rating *</label>
            <StarRating value={safetyRating} onChange={setSafetyRating} size="w-7 h-7" />
          </div>
          <div>
            <label className="text-xs font-bold text-foreground mb-2 block">Lighting</label>
            <StarRating value={lightingRating} onChange={setLightingRating} />
          </div>
          <div>
            <label className="text-xs font-bold text-foreground mb-2 block">Crowd Level</label>
            <StarRating value={crowdRating} onChange={setCrowdRating} />
          </div>
          <div>
            <label className="text-xs font-bold text-foreground mb-2 block">Time of Visit</label>
            <div className="flex gap-2">
              {(["morning", "day", "evening", "night"] as const).map((t) => {
                const Icon = visitTimeIcons[t];
                return (
                  <button key={t} onClick={() => setVisitTime(t)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border text-xs font-bold transition-colors ${visitTime === t ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground"}`}>
                    <Icon className="w-4 h-4" />
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-foreground mb-1 block">Review</label>
            <textarea value={review} onChange={(e) => setReview(e.target.value)} placeholder="How safe did you feel? Any tips?"
              rows={3} className="w-full text-sm bg-card border border-border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
          </div>
          <button onClick={handleSubmit} disabled={submitting || !placeName.trim() || safetyRating === 0}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm disabled:opacity-50">
            {submitting ? "Submitting..." : "Submit Rating"}
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="bg-card border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
            <Star className="w-5 h-5 text-yellow-400" />
            <h1 className="text-sm font-bold text-foreground">{t("ratings.title")}</h1>
          </div>
          {user && (
            <button onClick={() => setShowForm(true)} className="p-2 bg-primary text-primary-foreground rounded-lg">
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      <main className="container px-4 py-4 space-y-4">
        {/* Summary */}
        <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Community Avg Safety</p>
            <p className="text-2xl font-extrabold text-foreground">{avgSafety}<span className="text-sm text-muted-foreground">/5</span></p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Ratings</p>
            <p className="text-2xl font-extrabold text-foreground">{ratings.length}</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
        ) : ratings.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground mb-1">No ratings yet</p>
            <p className="text-xs text-muted-foreground">Be the first to rate a location!</p>
          </div>
        ) : (
          ratings.map((r) => (
            <div key={r.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" /> {r.place_name}
                  </h3>
                  {r.address && <p className="text-[10px] text-muted-foreground mt-0.5">{r.address}</p>}
                </div>
                <span className="text-[10px] text-muted-foreground">{timeAgo(r.created_at)}</span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-0.5">Safety</p>
                  <StarRating value={r.safety_rating} size="w-3.5 h-3.5" />
                </div>
                {r.lighting_rating && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-0.5">Lighting</p>
                    <StarRating value={r.lighting_rating} size="w-3.5 h-3.5" />
                  </div>
                )}
                {r.crowd_rating && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-0.5">Crowd</p>
                    <StarRating value={r.crowd_rating} size="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
              {r.review && <p className="text-xs text-foreground">{r.review}</p>}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                <span className="text-[10px] text-muted-foreground">{r.author_name}</span>
                {r.visit_time && (
                  <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
                    {(() => { const Icon = visitTimeIcons[r.visit_time] || Sun; return <Icon className="w-3 h-3" />; })()}
                    {r.visit_time}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default LocationRatings;
