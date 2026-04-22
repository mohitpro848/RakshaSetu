import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Timer, Shield, AlertTriangle, Bell } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface SafetyTimerProps {
  onBack: () => void;
  onSOSTrigger: () => void;
}

const PRESETS = [5, 10, 15, 30, 60];

const SafetyTimer = ({ onBack, onSOSTrigger }: SafetyTimerProps) => {
  const { t } = useI18n();
  const [duration, setDuration] = useState(15);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [triggered, setTriggered] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const isRunning = remaining !== null && remaining > 0;
  const isWarning = remaining !== null && remaining <= 30 && remaining > 0;

  const startTimer = useCallback(() => {
    setRemaining(duration * 60);
    setTriggered(false);
  }, [duration]);

  const checkIn = useCallback(() => {
    setRemaining(null);
    setTriggered(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const cancelTimer = useCallback(() => {
    setRemaining(null);
    setTriggered(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 0) {
      setTriggered(true);
      onSOSTrigger();
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setRemaining((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [remaining, onSOSTrigger]);

  useEffect(() => {
    if (isWarning && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }, [isWarning, remaining]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progress = remaining !== null ? ((duration * 60 - remaining) / (duration * 60)) * 100 : 0;

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="bg-card border-b border-border">
        <div className="container flex items-center gap-3 h-14 px-4">
          <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <Timer className="w-5 h-5 text-primary" />
          <h1 className="text-sm font-bold text-foreground">{t("timer.title")}</h1>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        <p className="text-sm text-muted-foreground text-center">{t("timer.subtitle")}</p>

        <div className="flex flex-col items-center gap-4">
          <div className={`relative w-48 h-48 rounded-full flex items-center justify-center ${
            triggered ? "bg-crisis-critical/10" : isWarning ? "bg-crisis-medium/10" : isRunning ? "bg-primary/10" : "bg-muted"
          }`}>
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 192 192">
              <circle cx="96" cy="96" r="88" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
              {isRunning && (
                <circle
                  cx="96" cy="96" r="88"
                  fill="none"
                  stroke={isWarning ? "hsl(var(--medium))" : "hsl(var(--primary))"}
                  strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 88}
                  strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              )}
            </svg>
            <div className="text-center z-10">
              {triggered ? (
                <>
                  <AlertTriangle className="w-10 h-10 text-crisis-critical mx-auto mb-1 animate-pulse" />
                  <p className="text-sm font-bold text-crisis-critical">{t("timer.triggered")}</p>
                </>
              ) : isRunning ? (
                <>
                  <p className={`text-4xl font-bold tabular-nums ${isWarning ? "text-crisis-medium" : "text-foreground"}`}>
                    {formatTime(remaining!)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{t("timer.remaining")}</p>
                </>
              ) : (
                <>
                  <Timer className="w-10 h-10 text-muted-foreground mx-auto mb-1" />
                  <p className="text-sm text-muted-foreground">{t("timer.setTimer")}</p>
                </>
              )}
            </div>
          </div>

          {isWarning && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-crisis-medium/10 border border-crisis-medium/20 animate-pulse">
              <Bell className="w-4 h-4 text-crisis-medium" />
              <p className="text-xs font-semibold text-foreground">{t("timer.warning")}</p>
            </div>
          )}
        </div>

        {!isRunning && !triggered && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground text-center uppercase tracking-wider">{t("timer.duration")}</p>
            <div className="flex justify-center gap-2">
              {PRESETS.map((min) => (
                <button
                  key={min}
                  onClick={() => setDuration(min)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                    duration === min
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-foreground hover:border-primary/30"
                  }`}
                >
                  {min}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {!isRunning && !triggered && (
            <button
              onClick={startTimer}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:brightness-110 active:scale-[0.97] transition-all"
            >
              {t("timer.start")}
            </button>
          )}
          {isRunning && (
            <>
              <button
                onClick={checkIn}
                className="w-full py-3.5 rounded-xl bg-crisis-safe text-white font-bold text-sm hover:brightness-110 active:scale-[0.97] transition-all flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                {t("timer.checkin")}
              </button>
              <button
                onClick={cancelTimer}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                {t("timer.cancel")}
              </button>
            </>
          )}
          {triggered && (
            <button
              onClick={checkIn}
              className="w-full py-3.5 rounded-xl bg-crisis-safe text-white font-bold text-sm hover:brightness-110 active:scale-[0.97] transition-all"
            >
              {t("timer.checkin")}
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default SafetyTimer;
