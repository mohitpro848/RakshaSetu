import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Phone, PhoneOff, PhoneIncoming } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface FakeCallScreenProps {
  onBack: () => void;
}

const CALLER_KEYS = [
  { nameKey: "fakecall.mom", avatar: "👩" },
  { nameKey: "fakecall.dad", avatar: "👨" },
  { nameKey: "fakecall.boss", avatar: "👔" },
  { nameKey: "fakecall.bestFriend", avatar: "🧑" },
  { nameKey: "fakecall.partner", avatar: "❤️" },
];

const DELAYS = [
  { label: "5 sec", value: 5 },
  { label: "10 sec", value: 10 },
  { label: "30 sec", value: 30 },
  { label: "1 min", value: 60 },
  { label: "3 min", value: 180 },
];

const FakeCallScreen = ({ onBack }: FakeCallScreenProps) => {
  const { t } = useI18n();
  const [phase, setPhase] = useState<"setup" | "ringing" | "active" | "ended">("setup");
  const [selectedCallerIdx, setSelectedCallerIdx] = useState(0);
  const [delay, setDelay] = useState(5);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<number | null>(null);

  const callerName = t(CALLER_KEYS[selectedCallerIdx].nameKey);
  const callerAvatar = CALLER_KEYS[selectedCallerIdx].avatar;

  const scheduleCall = () => {
    setCountdown(delay);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setPhase("ringing");
      setCountdown(null);
      if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
      return;
    }
    const id = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  useEffect(() => {
    if (phase !== "active") return;
    timerRef.current = window.setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const acceptCall = () => {
    setPhase("active");
    setCallDuration(0);
  };

  const endCall = () => {
    setPhase("ended");
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeout(() => {
      setPhase("setup");
      setCallDuration(0);
    }, 1500);
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (phase === "ringing") {
    return (
      <div className="fixed inset-0 z-[80] bg-gradient-to-b from-[hsl(230,72%,18%)] to-[hsl(230,72%,8%)] flex flex-col items-center justify-between py-16 px-6 animate-fade-in-up">
        <div className="text-center space-y-4">
          <p className="text-sm text-white/60 uppercase tracking-widest">{t("fakecall.caller")}</p>
          <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mx-auto text-5xl">
            {callerAvatar}
          </div>
          <h2 className="text-2xl font-bold text-white">{callerName}</h2>
          <p className="text-sm text-white/40">{t("fakecall.mobile")}</p>
        </div>
        <div className="flex items-center gap-12">
          <button
            onClick={endCall}
            className="w-16 h-16 rounded-full bg-crisis-critical flex items-center justify-center active:scale-90 transition-transform"
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </button>
          <button
            onClick={acceptCall}
            className="w-16 h-16 rounded-full bg-crisis-safe flex items-center justify-center animate-pulse active:scale-90 transition-transform"
          >
            <Phone className="w-7 h-7 text-white" />
          </button>
        </div>
      </div>
    );
  }

  if (phase === "active") {
    return (
      <div className="fixed inset-0 z-[80] bg-gradient-to-b from-[hsl(230,72%,18%)] to-[hsl(230,72%,8%)] flex flex-col items-center justify-between py-16 px-6">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto text-4xl">
            {callerAvatar}
          </div>
          <h2 className="text-xl font-bold text-white">{callerName}</h2>
          <p className="text-sm text-crisis-safe font-mono tabular-nums">{formatDuration(callDuration)}</p>
        </div>
        <button
          onClick={endCall}
          className="w-16 h-16 rounded-full bg-crisis-critical flex items-center justify-center active:scale-90 transition-transform"
        >
          <PhoneOff className="w-7 h-7 text-white" />
        </button>
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
          <PhoneIncoming className="w-5 h-5 text-primary" />
          <h1 className="text-sm font-bold text-foreground">{t("fakecall.title")}</h1>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        <p className="text-sm text-muted-foreground text-center">{t("fakecall.subtitle")}</p>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("fakecall.callerLabel")}</p>
          <div className="grid grid-cols-5 gap-2">
            {CALLER_KEYS.map((c, idx) => (
              <button
                key={c.nameKey}
                onClick={() => setSelectedCallerIdx(idx)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all active:scale-95 ${
                  selectedCallerIdx === idx ? "bg-primary/10 border-2 border-primary" : "bg-card border border-border"
                }`}
              >
                <span className="text-2xl">{c.avatar}</span>
                <span className="text-[10px] font-semibold text-foreground">{t(c.nameKey)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("fakecall.after")}</p>
          <div className="flex gap-2 flex-wrap">
            {DELAYS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDelay(d.value)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  delay === d.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-foreground hover:border-primary/30"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {countdown !== null ? (
          <div className="text-center space-y-3">
            <p className="text-3xl font-bold text-primary tabular-nums">{countdown}s</p>
            <p className="text-sm text-muted-foreground">{t("fakecall.callComingIn")}</p>
            <button
              onClick={() => setCountdown(null)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("fakecall.cancel")}
            </button>
          </div>
        ) : (
          <button
            onClick={scheduleCall}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
          >
            <PhoneIncoming className="w-4 h-4" />
            {t("fakecall.schedule")}
          </button>
        )}
      </main>
    </div>
  );
};

export default FakeCallScreen;
