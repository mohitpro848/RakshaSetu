import { useState, useRef, useCallback, useEffect } from "react";
import { ArrowLeft, MapPin, Camera, Video, X, AlertTriangle, Send, Loader2, CheckCircle, Mic, MicOff } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { fetchLocation } from "@/lib/locationHelper";
import { toast } from "sonner";
import { useSpeechToText } from "@/hooks/useSpeechToText";

interface CommunityReportProps {
  onBack: () => void;
  autoStartVoice?: boolean;
}

const CATEGORIES = [
  { value: "harassment", emoji: "🚨", labelKey: "report.harassment" },
  { value: "theft", emoji: "💰", labelKey: "report.theft" },
  { value: "unsafe_area", emoji: "⚠️", labelKey: "report.unsafeArea" },
  { value: "stalking", emoji: "👁️", labelKey: "report.stalking" },
  { value: "assault", emoji: "🛑", labelKey: "report.assault" },
  { value: "other", emoji: "📝", labelKey: "report.other" },
] as const;

const SEVERITIES = [
  { value: "low", labelKey: "report.low", color: "bg-crisis-safe" },
  { value: "medium", labelKey: "report.medium", color: "bg-crisis-medium" },
  { value: "high", labelKey: "report.high", color: "bg-crisis-high" },
  { value: "critical", labelKey: "report.critical", color: "bg-crisis-critical" },
] as const;

const CommunityReport = ({ onBack, autoStartVoice = false }: CommunityReportProps) => {
  const { t } = useI18n();
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const voiceAutoStarted = useRef(false);

  const [category, setCategory] = useState<string>("");
  const [severity, setSeverity] = useState<string>("medium");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [reporterName, setReporterName] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { isListening, transcript, interimText, error: sttError, supported: sttSupported, startListening, stopListening, resetTranscript } = useSpeechToText();

  // Store the description text that existed before voice started
  const preVoiceDescRef = useRef("");

  // Real-time callback: updates description field live as user speaks
  const handleTranscriptUpdate = useCallback((liveText: string) => {
    const base = preVoiceDescRef.current;
    const combined = base ? base + " " + liveText : liveText;
    setDescription(combined.slice(0, 500));
  }, []);

  // Auto-start voice input when opened via Voice Report card
  useEffect(() => {
    if (autoStartVoice && sttSupported && !voiceAutoStarted.current) {
      voiceAutoStarted.current = true;
      preVoiceDescRef.current = description;
      setTimeout(() => startListening("en-IN", handleTranscriptUpdate), 500);
    }
  }, [autoStartVoice, sttSupported, startListening, handleTranscriptUpdate]);

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
      resetTranscript();
    } else {
      preVoiceDescRef.current = description;
      resetTranscript();
      startListening("en-IN", handleTranscriptUpdate);
    }
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPG, PNG)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Photo too large. Maximum 10MB.");
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please select a video file (MP4)");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Video too large. Maximum 50MB.");
      return;
    }
    setVideo(file);
    setVideoPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const removePhoto = () => {
    setPhoto(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  };

  const removeVideo = () => {
    setVideo(null);
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(null);
  };

  const getLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      const loc = await fetchLocation();
      if (loc) {
        setLocation({ lat: loc.lat, lng: loc.lng });
        toast.success(t("report.locationCaptured"));
      } else {
        toast.error(t("report.locationFailed"));
      }
    } catch {
      toast.error(t("report.locationFailed"));
    } finally {
      setLocationLoading(false);
    }
  }, [t]);

  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    const ext = file.name.split(".").pop() || "bin";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadErr } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type });
    if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!category) { toast.error(t("report.selectCategory")); return; }
    if (!description.trim()) { toast.error(t("report.descriptionRequired")); return; }
    if (!location) { toast.error(t("report.locationRequired")); return; }

    setSubmitting(true);
    try {
      let photoUrl: string | null = null;
      let videoUrl: string | null = null;

      if (photo) {
        photoUrl = await uploadFile(photo, "incident-photos");
      }

      if (video) {
        videoUrl = await uploadFile(video, "evidence-uploads");
      }

      const { error } = await supabase.from("incident_reports").insert({
        category: category as any,
        severity: severity as any,
        description: description.trim(),
        latitude: location.lat,
        longitude: location.lng,
        address: location.address || null,
        is_anonymous: isAnonymous,
        reporter_name: isAnonymous ? null : reporterName.trim() || null,
        photo_url: photoUrl,
        video_url: videoUrl,
      });

      if (error) throw error;
      setSubmitted(true);
      toast.success(t("report.submitted"));
    } catch (err: any) {
      console.error("Report submission error:", err);
      toast.error(err?.message || t("report.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-muted/50 flex flex-col items-center justify-center px-6">
        <div className="bg-card rounded-2xl border border-border p-8 text-center max-w-sm w-full">
          <div className="w-16 h-16 rounded-full bg-crisis-safe/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-crisis-safe" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">{t("report.thankYou")}</h2>
          <p className="text-sm text-muted-foreground mb-6">{t("report.thankYouDesc")}</p>
          <button
            onClick={onBack}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
          >
            {t("back")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="bg-card border-b border-border">
        <div className="container flex items-center gap-3 h-14 px-4">
          <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <AlertTriangle className="w-5 h-5 text-crisis-high" />
          <h1 className="text-sm font-bold text-foreground">{t("report.title")}</h1>
        </div>
      </header>

      <main className="container px-4 py-5 space-y-5 pb-32">
        {/* Category */}
        <section>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("report.categoryLabel")}</p>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  category === cat.value
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                    : "border-border bg-card hover:border-primary/20"
                }`}
              >
                <span className="text-xl">{cat.emoji}</span>
                <p className="text-[10px] font-semibold text-foreground mt-1">{t(cat.labelKey)}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Severity */}
        <section>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("report.severityLabel")}</p>
          <div className="flex gap-2">
            {SEVERITIES.map((s) => (
              <button
                key={s.value}
                onClick={() => setSeverity(s.value)}
                className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                  severity === s.value
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                    : "border-border bg-card"
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full ${s.color} mr-1`} />
                {t(s.labelKey)}
              </button>
            ))}
          </div>
        </section>

        {/* Description with Voice Input */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("report.descriptionLabel")}</p>
            {sttSupported && (
              <button
                onClick={handleVoiceToggle}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-[0.95] ${
                  isListening
                    ? "bg-crisis-critical text-white animate-pulse"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                }`}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                {isListening ? "Stop Voice" : "Voice Input"}
              </button>
            )}
          </div>

          {sttError && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-crisis-critical/10 border border-crisis-critical/20 mb-2">
              <AlertTriangle className="w-4 h-4 text-crisis-critical shrink-0 mt-0.5" />
              <p className="text-xs text-foreground">{sttError}</p>
            </div>
          )}

          {isListening && (
            <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 mb-2 animate-pulse">
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">🎤 Listening... speak now</p>
              {interimText && <p className="text-xs text-muted-foreground italic">{interimText}</p>}
            </div>
          )}

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder={t("report.descriptionPlaceholder")}
            className="w-full p-3 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <p className="text-[10px] text-muted-foreground text-right mt-1">{description.length}/500</p>
        </section>

        {/* Location */}
        <section>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("report.locationLabel")}</p>
          {location ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-crisis-safe/10 border border-crisis-safe/30">
              <MapPin className="w-4 h-4 text-crisis-safe shrink-0" />
              <p className="text-xs text-foreground font-medium">
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </p>
              <button onClick={() => setLocation(null)} className="ml-auto text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={getLocation}
              disabled={locationLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border bg-card text-sm font-semibold text-muted-foreground hover:border-primary/30 transition-colors"
            >
              {locationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              {locationLoading ? t("report.gettingLocation") : t("report.addLocation")}
            </button>
          )}
        </section>

        {/* Photo */}
        <section>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("report.photoLabel")}</p>
          {photoPreview ? (
            <div className="relative">
              <img src={photoPreview} alt="Evidence" className="w-full h-40 object-cover rounded-xl border border-border" />
              <button
                onClick={removePhoto}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-card/80 backdrop-blur flex items-center justify-center"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => photoRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border bg-card text-sm font-semibold text-muted-foreground hover:border-primary/30 transition-colors"
            >
              <Camera className="w-4 h-4" />
              {t("report.addPhoto")}
              <span className="text-[10px]">(Max 10MB)</span>
            </button>
          )}
          <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp,image/*" onChange={handlePhoto} className="hidden" />
        </section>

        {/* Video */}
        <section>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Video Evidence</p>
          {videoPreview ? (
            <div className="relative">
              <video src={videoPreview} className="w-full h-40 object-cover rounded-xl border border-border" controls />
              <button
                onClick={removeVideo}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-card/80 backdrop-blur flex items-center justify-center"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => videoRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border bg-card text-sm font-semibold text-muted-foreground hover:border-primary/30 transition-colors"
            >
              <Video className="w-4 h-4" />
              Attach Video
              <span className="text-[10px]">(Max 50MB, MP4)</span>
            </button>
          )}
          <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/*" onChange={handleVideo} className="hidden" />
        </section>

        {/* Anonymous toggle */}
        <section className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
          <div>
            <p className="text-sm font-bold text-foreground">{t("report.anonymous")}</p>
            <p className="text-[10px] text-muted-foreground">{t("report.anonymousDesc")}</p>
          </div>
          <button
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`w-11 h-6 rounded-full transition-colors ${isAnonymous ? "bg-primary" : "bg-muted"}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${isAnonymous ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </section>

        {!isAnonymous && (
          <input
            value={reporterName}
            onChange={(e) => setReporterName(e.target.value)}
            maxLength={50}
            placeholder={t("report.yourName")}
            className="w-full p-3 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        )}
      </main>

      {/* Submit button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/80 backdrop-blur border-t border-border">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !category || !description.trim() || !location}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {submitting ? t("report.submitting") : t("report.submit")}
        </button>
      </div>
    </div>
  );
};

export default CommunityReport;
