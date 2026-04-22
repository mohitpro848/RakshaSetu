import { Mic, MicOff } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface VoiceSOSIndicatorProps {
  listening: boolean;
  supported: boolean;
  enabled: boolean;
  onToggle: () => void;
}

const VoiceSOSIndicator = ({ listening, supported, enabled, onToggle }: VoiceSOSIndicatorProps) => {
  const { t } = useI18n();
  if (!supported) return null;

  return (
    <button
      onClick={onToggle}
      className={`fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${
        enabled && listening
          ? "bg-crisis-critical text-white animate-pulse"
          : enabled
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground border border-border"
      }`}
      title={enabled ? t("voice.activeTitle") : t("voice.title")}
    >
      {enabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
    </button>
  );
};

export default VoiceSOSIndicator;
