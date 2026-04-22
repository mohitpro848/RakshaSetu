import { useState, useRef } from "react";
import { Camera, Video, Mic, MicOff, Upload, X, CheckCircle, Loader2, AlertTriangle, Image } from "lucide-react";
import { useEvidenceCapture } from "@/hooks/useEvidenceCapture";
import { toast } from "sonner";

interface DigitalEvidenceProps {
  compact?: boolean;
}

const DigitalEvidence = ({ compact = false }: DigitalEvidenceProps) => {
  const {
    recording, uploading, uploadProgress, lastEvidence, error,
    startCapture, stopCapture, capturePhoto, captureVideo,
  } = useEvidenceCapture();

  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ url: string; type: "photo" | "video" } | null>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview({ url: URL.createObjectURL(file), type: "photo" });
    const result = await capturePhoto(file);
    if (result) {
      toast.success("Photo evidence uploaded successfully");
      setTimeout(() => setPreview(null), 2000);
    } else {
      toast.error(error || "Failed to upload photo");
    }
    e.target.value = "";
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview({ url: URL.createObjectURL(file), type: "video" });
    const result = await captureVideo(file);
    if (result) {
      toast.success("Video evidence uploaded successfully");
      setTimeout(() => setPreview(null), 2000);
    } else {
      toast.error(error || "Failed to upload video");
    }
    e.target.value = "";
  };

  const clearPreview = () => {
    if (preview) {
      URL.revokeObjectURL(preview.url);
      setPreview(null);
    }
  };

  if (compact) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => photoRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-xs font-semibold text-foreground hover:border-primary/30 transition-all active:scale-[0.97] disabled:opacity-50"
        >
          <Camera className="w-3.5 h-3.5 text-primary" />
          Photo
        </button>
        <button
          onClick={() => videoRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-xs font-semibold text-foreground hover:border-primary/30 transition-all active:scale-[0.97] disabled:opacity-50"
        >
          <Video className="w-3.5 h-3.5 text-crisis-high" />
          Video
        </button>
        <button
          onClick={recording ? stopCapture : startCapture}
          disabled={uploading}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all active:scale-[0.97] disabled:opacity-50 ${
            recording ? "bg-crisis-critical text-white border-crisis-critical" : "bg-card border-border text-foreground hover:border-primary/30"
          }`}
        >
          {recording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-crisis-medium" />}
          {recording ? "Stop" : "Audio"}
        </button>
        <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
        <input ref={videoRef} type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Digital Evidence</p>

      {error && (
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-crisis-critical/10 border border-crisis-critical/20">
          <AlertTriangle className="w-4 h-4 text-crisis-critical shrink-0 mt-0.5" />
          <p className="text-xs text-foreground">{error}</p>
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20">
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
          <p className="text-xs font-medium text-foreground">{uploadProgress || "Uploading..."}</p>
        </div>
      )}

      {preview && (
        <div className="relative rounded-xl overflow-hidden border border-border">
          {preview.type === "photo" ? (
            <img src={preview.url} alt="Preview" className="w-full h-40 object-cover" />
          ) : (
            <video src={preview.url} className="w-full h-40 object-cover" controls />
          )}
          <button
            onClick={clearPreview}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-card/80 backdrop-blur flex items-center justify-center"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
          {lastEvidence && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-crisis-safe/90 text-white text-[10px] font-bold">
              <CheckCircle className="w-3 h-3" /> Uploaded
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => photoRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all active:scale-[0.97] disabled:opacity-50"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Camera className="w-6 h-6 text-primary" />
          </div>
          <span className="text-[11px] font-bold text-foreground">Capture Photo</span>
          <span className="text-[9px] text-muted-foreground">Max 10MB</span>
        </button>

        <button
          onClick={() => videoRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all active:scale-[0.97] disabled:opacity-50"
        >
          <div className="w-12 h-12 rounded-full bg-crisis-high/10 flex items-center justify-center">
            <Video className="w-6 h-6 text-crisis-high" />
          </div>
          <span className="text-[11px] font-bold text-foreground">Record Video</span>
          <span className="text-[9px] text-muted-foreground">Max 50MB</span>
        </button>

        <button
          onClick={recording ? stopCapture : startCapture}
          disabled={uploading}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all active:scale-[0.97] disabled:opacity-50 ${
            recording
              ? "bg-crisis-critical/10 border-crisis-critical/30"
              : "bg-card border-border hover:border-primary/30 hover:shadow-md"
          }`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            recording ? "bg-crisis-critical/20" : "bg-crisis-medium/10"
          }`}>
            {recording ? (
              <MicOff className="w-6 h-6 text-crisis-critical" />
            ) : (
              <Mic className="w-6 h-6 text-crisis-medium" />
            )}
          </div>
          <span className="text-[11px] font-bold text-foreground">
            {recording ? "Stop Recording" : "Record Audio"}
          </span>
          <span className="text-[9px] text-muted-foreground">
            {recording ? "Recording..." : "Max 60 sec"}
          </span>
        </button>
      </div>

      {lastEvidence && !preview && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-crisis-safe/10 border border-crisis-safe/30">
          <CheckCircle className="w-4 h-4 text-crisis-safe shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">Evidence saved</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {lastEvidence.file_type} • {lastEvidence.file_size ? `${(lastEvidence.file_size / 1024).toFixed(0)} KB` : ""}
            </p>
          </div>
        </div>
      )}

      <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
      <input ref={videoRef} type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" />
    </div>
  );
};

export default DigitalEvidence;
