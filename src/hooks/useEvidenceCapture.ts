import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchLocation } from "@/lib/locationHelper";

export interface EvidenceFile {
  id?: string;
  file_type: "photo" | "video" | "audio";
  file_url: string;
  file_size?: number;
  mime_type?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
}

export const useEvidenceCapture = () => {
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [lastEvidence, setLastEvidence] = useState<EvidenceFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const uploadFile = useCallback(async (
    file: Blob | File,
    fileType: "photo" | "video" | "audio",
    mimeType: string,
    fileName?: string
  ): Promise<EvidenceFile | null> => {
    setUploading(true);
    setUploadProgress("Getting location...");
    setError(null);

    try {
      const loc = await fetchLocation();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be signed in to upload evidence.");
      }

      const ext = fileName?.split(".").pop() || mimeType.split("/")[1] || "bin";
      const path = `${user.id}/${fileType}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      setUploadProgress("Uploading file...");
      const { error: uploadErr } = await supabase.storage
        .from("evidence-uploads")
        .upload(path, file, { contentType: mimeType });

      if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

      // Bucket is private — generate a signed URL valid for 7 days
      const { data: signed, error: signErr } = await supabase.storage
        .from("evidence-uploads")
        .createSignedUrl(path, 60 * 60 * 24 * 7);
      if (signErr) throw new Error(`Failed to create signed URL: ${signErr.message}`);

      setUploadProgress("Saving record...");
      const evidence: Omit<EvidenceFile, "id" | "created_at"> = {
        file_type: fileType,
        file_url: signed.signedUrl,
        file_size: file instanceof File ? file.size : file.size,
        mime_type: mimeType,
        latitude: loc?.lat,
        longitude: loc?.lng,
      };

      const { data, error: dbErr } = await supabase
        .from("evidence_files")
        .insert(evidence)
        .select()
        .single();

      if (dbErr) {
        console.error("DB save error (file uploaded):", dbErr);
      }

      const result: EvidenceFile = { ...evidence, id: data?.id, created_at: data?.created_at };
      setLastEvidence(result);
      setUploadProgress(null);
      return result;
    } catch (err: any) {
      const msg = err?.message || "Upload failed";
      setError(msg);
      console.error("[Evidence] Upload error:", err);
      setUploadProgress(null);
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const capturePhoto = useCallback(async (file: File): Promise<EvidenceFile | null> => {
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum 10MB.");
      return null;
    }
    return uploadFile(file, "photo", file.type, file.name);
  }, [uploadFile]);

  const captureVideo = useCallback(async (file: File): Promise<EvidenceFile | null> => {
    if (file.size > 50 * 1024 * 1024) {
      setError("File too large. Maximum 50MB.");
      return null;
    }
    return uploadFile(file, "video", file.type, file.name);
  }, [uploadFile]);

  const stopCapture = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    setRecording(false);
  }, []);

  const startCapture = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        await uploadFile(blob, "audio", "audio/webm", "recording.webm");
      };

      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);

      // Auto-stop after 60s
      timeoutRef.current = setTimeout(() => stopCapture(), 60000);
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Microphone permission denied. Go to your browser settings → Site Settings → Microphone and allow access for this site.");
      } else if (err.name === "NotFoundError" || err.message?.includes("Requested device not found")) {
        setError("No microphone found. Please connect a microphone or allow microphone access on your device.");
      } else if (err.name === "NotReadableError") {
        setError("Microphone is in use by another application. Please close other apps using the mic and try again.");
      } else {
        setError("Failed to start recording: " + (err.message || "Unknown error"));
      }
      console.warn("[Evidence] Mic error:", err);
    }
  }, [stopCapture, uploadFile]);

  return {
    recording, uploading, uploadProgress, lastEvidence, error,
    startCapture, stopCapture, capturePhoto, captureVideo,
  };
};
