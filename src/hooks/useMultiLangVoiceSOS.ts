import { useEffect, useRef, useState, useCallback } from "react";

// Multi-language SOS keywords
const VOICE_KEYWORDS: Record<string, string[]> = {
  en: ["help me", "help", "save me", "emergency", "sos"],
  hi: ["bachao", "bachaao", "madad", "madad karo", "bachao mujhe"],
  ta: ["kaappaattungal", "udavi", "kaappaattu"],
  bn: ["bachao", "sahayya koro", "amake bachao"],
  te: ["rakshinchamdi", "sahayam", "nanu kapadandi"],
};

interface UseMultiLangVoiceSOSOptions {
  onTrigger: () => void;
  enabled: boolean;
  language?: string;
}

export const useMultiLangVoiceSOS = ({
  onTrigger,
  enabled,
  language = "en",
}: UseMultiLangVoiceSOSOptions) => {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [detectedPhrase, setDetectedPhrase] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const enabledRef = useRef(enabled);
  const onTriggerRef = useRef(onTrigger);

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { onTriggerRef.current = onTrigger; }, [onTrigger]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SpeechRecognition);
  }, []);

  // Build keyword list for current language + English fallback
  const keywords = [
    ...(VOICE_KEYWORDS[language] || []),
    ...(language !== "en" ? VOICE_KEYWORDS.en : []),
  ];

  // Language code for speech recognition
  const langCodeMap: Record<string, string> = {
    en: "en-IN",
    hi: "hi-IN",
    ta: "ta-IN",
    bn: "bn-IN",
    te: "te-IN",
  };

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

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = langCodeMap[language] || "en-IN";

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        console.log("[MultiLangVoiceSOS] Heard:", transcript);

        const matchedKeyword = keywords.find((kw) => transcript.includes(kw.toLowerCase()));
        if (matchedKeyword) {
          console.log(`[MultiLangVoiceSOS] Keyword "${matchedKeyword}" detected!`);
          setDetectedPhrase(matchedKeyword);

          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 400]);
          }

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
        console.warn("[MultiLangVoiceSOS] Error:", e.error);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
    } catch (err) {
      console.warn("[MultiLangVoiceSOS] Could not start:", err);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
        setListening(false);
      }
    };
  }, [enabled, supported, language]);

  return { listening, supported, detectedPhrase, keywords };
};
