import { useEffect, useRef, useState, useCallback } from "react";

interface UseVoiceSOSOptions {
  keyword?: string;
  onTrigger: () => void;
  enabled: boolean;
}

export const useVoiceSOS = ({ keyword = "help me", onTrigger, enabled }: UseVoiceSOSOptions) => {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const enabledRef = useRef(enabled);
  const onTriggerRef = useRef(onTrigger);

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { onTriggerRef.current = onTrigger; }, [onTrigger]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SpeechRecognition);
  }, []);

  useEffect(() => {
    if (!enabled || !supported) {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
        setListening(false);
      }
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        console.log("[VoiceSOS] Heard:", transcript);
        if (transcript.includes(keyword.toLowerCase())) {
          console.log(`[VoiceSOS] Keyword "${keyword}" detected! Triggering SOS...`);
          onTriggerRef.current();
          break;
        }
      }
    };

    recognition.onend = () => {
      if (enabledRef.current) {
        try { recognition.start(); } catch {}
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error !== "aborted" && e.error !== "no-speech") {
        console.warn("[VoiceSOS] Error:", e.error);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
      console.log("[VoiceSOS] Listening started");
    } catch (err) {
      console.warn("[VoiceSOS] Could not start:", err);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
        setListening(false);
      }
    };
  }, [enabled, supported, keyword]);

  return { listening, supported };
};
