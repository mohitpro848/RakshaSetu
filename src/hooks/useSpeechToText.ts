import { useState, useRef, useCallback } from "react";

export const useSpeechToText = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    return !!SR;
  });
  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef<((text: string) => void) | null>(null);

  const startListening = useCallback((lang: string = "en-IN", onTranscriptUpdate?: (text: string) => void) => {
    setError(null);
    setTranscript("");
    setInterimText("");
    if (onTranscriptUpdate) {
      onTranscriptRef.current = onTranscriptUpdate;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      setSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      let accumulatedFinal = "";

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let interim = "";
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + " ";
          } else {
            interim += result[0].transcript;
          }
        }

        accumulatedFinal = finalTranscript.trim();
        const fullText = (accumulatedFinal + " " + interim).trim();

        setTranscript(accumulatedFinal);
        setInterimText(interim);

        // Call the real-time callback so the parent can update description live
        if (onTranscriptRef.current) {
          onTranscriptRef.current(fullText);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn("[STT] Error:", e.error);
        if (e.error === "not-allowed") {
          setError("Microphone permission denied. Please allow microphone access in your browser settings.");
        } else if (e.error === "no-speech") {
          return; // auto-recovers
        } else if (e.error === "network") {
          setError("Network error. Speech recognition requires an internet connection.");
        } else {
          setError(`Speech recognition error: ${e.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        // Auto-restart if still supposed to be listening (handles browser auto-stop)
        if (recognitionRef.current === recognition) {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (err: any) {
      setError("Failed to start speech recognition: " + (err.message || "Unknown error"));
    }
  }, []);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null; // clear ref first so onend doesn't restart
    if (recognition) {
      recognition.onend = null;
      recognition.stop();
    }
    onTranscriptRef.current = null;
    setIsListening(false);
    setInterimText("");
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimText("");
    setError(null);
  }, []);

  return { isListening, transcript, interimText, error, supported, startListening, stopListening, resetTranscript };
};
