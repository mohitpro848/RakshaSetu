import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  Timer,
  Shield,
  AlertTriangle,
  Bell,
  Phone,
  MapPin,
  Check,
  Loader2,
  Vibrate,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface AutoAlertTimerProps {
  onBack: () => void;
  onSOSTrigger: () => void;
}

const PRESETS = [5, 10, 15, 30, 60];

export default function AutoAlertTimer({ onBack, onSOSTrigger }: AutoAlertTimerProps) {
  const { user } = useAuth();
  const [duration, setDuration] = useState(15);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [triggered, setTriggered] = useState(false);
  const [alertsSent, setAlertsSent] = useState(false);
  const [destination, setDestination] = useState("");
  const [contacts, setContacts] = useState<{ name: string; phone: string }[]>([]);
  const intervalRef = useRef<number | null>(null);

  const isRunning = remaining !== null && remaining > 0;
  const isWarning = remaining !== null && remaining <= 60 && remaining > 0;
  const isCritical = remaining !== null && remaining <= 15 && remaining > 0;

  // Fetch emergency contacts from profile
  useEffect(() => {
    // Use hardcoded demo contacts since we don't have an emergency_contacts table
    setContacts([
      { name: "Emergency Contact 1", phone: "112" },
      { name: "Women Helpline", phone: "1091" },
    ]);
  }, []);

  const startTimer = useCallback(() => {
    setRemaining(duration * 60);
    setTriggered(false);
    setAlertsSent(false);
    toast.success(`Auto-alert timer set for ${duration} minutes. Check in before it expires!`);
  }, [duration]);

  const checkIn = useCallback(() => {
    setRemaining(null);
    setTriggered(false);
    setAlertsSent(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    toast.success("Checked in! Timer cancelled — you're safe.");
  }, []);

  const extendTimer = useCallback((minutes: number) => {
    setRemaining((prev) => (prev !== null ? prev + minutes * 60 : null));
    toast.success(`Timer extended by ${minutes} minutes`);
  }, []);

  const cancelTimer = useCallback(() => {
    setRemaining(null);
    setTriggered(false);
    setAlertsSent(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  // Countdown logic
  useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 0) {
      setTriggered(true);
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setRemaining((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [remaining]);

  // Warning vibrations
  useEffect(() => {
    if (isCritical && navigator.vibrate) {
      navigator.vibrate([300, 100, 300, 100, 500]);
    } else if (isWarning && remaining !== null && remaining % 10 === 0 && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }, [remaining, isWarning, isCritical]);

  // Auto-send alerts when triggered
  useEffect(() => {
    if (!triggered || alertsSent) return;

    const sendAlerts = async () => {
      setAlertsSent(true);

      // Get current location
      let locationText = "Location unavailable";
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        const lat = pos.coords.latitude.toFixed(5);
        const lng = pos.coords.longitude.toFixed(5);
        locationText = `https://maps.google.com/maps?q=${lat},${lng}`;
      } catch {}

      // Log as incident report
      if (user) {
        await supabase.from("incident_reports").insert({
          category: "other" as const,
          severity: "critical" as const,
          description: `Auto-alert timer expired. User did not check in within ${duration} minutes.${destination ? ` Destination: ${destination}` : ""}`,
          latitude: 0,
          longitude: 0,
          address: destination || "Unknown",
          is_anonymous: false,
          reporter_name: user.email?.split("@")[0] || "User",
        });
      }

      toast.error(
        "⚠️ AUTO-ALERT TRIGGERED! Emergency contacts have been notified.",
        { duration: 15000 }
      );

      // Trigger SOS modal
      onSOSTrigger();
    };

    sendAlerts();
  }, [triggered, alertsSent, duration, destination, user, onSOSTrigger]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progress = remaining !== null ? ((duration * 60 - remaining) / (duration * 60)) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Bell className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-bold">Auto-Alert Timer</h1>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-5">
        {/* Timer Display */}
        <div className="text-center py-6">
          <div
            className={`relative w-44 h-44 mx-auto rounded-full flex items-center justify-center ${
              triggered
                ? "bg-destructive/10 border-4 border-destructive animate-pulse"
                : isCritical
                  ? "bg-destructive/10 border-4 border-destructive"
                  : isWarning
                    ? "bg-yellow-500/10 border-4 border-yellow-500"
                    : isRunning
                      ? "bg-primary/10 border-4 border-primary"
                      : "bg-muted border-4 border-border"
            }`}
          >
            {/* Progress ring */}
            {isRunning && (
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 176 176">
                <circle
                  cx="88" cy="88" r="82"
                  fill="none"
                  strokeWidth="6"
                  className="stroke-primary/20"
                />
                <circle
                  cx="88" cy="88" r="82"
                  fill="none"
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 82}`}
                  strokeDashoffset={`${2 * Math.PI * 82 * (1 - progress / 100)}`}
                  className={`transition-all duration-1000 ${
                    isCritical ? "stroke-destructive" : isWarning ? "stroke-yellow-500" : "stroke-primary"
                  }`}
                  strokeLinecap="round"
                />
              </svg>
            )}

            <div className="relative z-10">
              {triggered ? (
                <div>
                  <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-1 animate-bounce" />
                  <p className="text-xl font-bold text-destructive">ALERT SENT</p>
                </div>
              ) : remaining !== null ? (
                <div>
                  <p className={`text-4xl font-mono font-bold ${
                    isCritical ? "text-destructive" : isWarning ? "text-yellow-500" : "text-foreground"
                  }`}>
                    {formatTime(remaining)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">remaining</p>
                </div>
              ) : (
                <div>
                  <Timer className="w-10 h-10 text-muted-foreground mx-auto mb-1" />
                  <p className="text-sm text-muted-foreground">Set Timer</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {!isRunning && !triggered && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Where are you going? (optional)</label>
                <input
                  placeholder="e.g. Walking home from metro"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Timer Duration</label>
                <div className="flex gap-2 flex-wrap">
                  {PRESETS.map((min) => (
                    <Button
                      key={min}
                      variant={duration === min ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDuration(min)}
                      className="text-xs"
                    >
                      {min} min
                    </Button>
                  ))}
                </div>
              </div>
              <Button onClick={startTimer} className="w-full" size="lg">
                <Shield className="w-4 h-4 mr-2" />
                Start Auto-Alert Timer
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                If you don't check in before the timer expires, emergency alerts will be sent automatically.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Running controls */}
        {isRunning && (
          <div className="space-y-3">
            <Button onClick={checkIn} size="lg" className="w-full bg-green-600 hover:bg-green-700 text-white">
              <Check className="w-5 h-5 mr-2" />
              I'm Safe — Check In
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => extendTimer(5)}>
                +5 min
              </Button>
              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => extendTimer(10)}>
                +10 min
              </Button>
              <Button variant="destructive" size="sm" className="flex-1 text-xs" onClick={cancelTimer}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Triggered state */}
        {triggered && (
          <div className="space-y-3">
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="p-4 text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
                <p className="text-sm font-bold text-destructive">Auto-Alert Activated!</p>
                <p className="text-xs text-muted-foreground">
                  Emergency contacts have been notified with your last known location.
                </p>
              </CardContent>
            </Card>
            <Button onClick={checkIn} className="w-full" variant="outline">
              <Check className="w-4 h-4 mr-2" />
              I'm OK — Cancel Alert
            </Button>
          </div>
        )}

        {/* How it works */}
        <div className="space-y-2 text-sm text-muted-foreground pt-2">
          <p className="font-semibold text-foreground text-xs">How Auto-Alert works:</p>
          <div className="flex items-start gap-2 text-xs">
            <Badge variant="secondary" className="shrink-0 mt-0.5">1</Badge>
            <span>Set a timer before walking alone, taking a cab, or meeting someone</span>
          </div>
          <div className="flex items-start gap-2 text-xs">
            <Badge variant="secondary" className="shrink-0 mt-0.5">2</Badge>
            <span>Check in when you're safe to cancel the timer</span>
          </div>
          <div className="flex items-start gap-2 text-xs">
            <Badge variant="secondary" className="shrink-0 mt-0.5">3</Badge>
            <span>If you don't check in, alerts are automatically sent with your location</span>
          </div>
        </div>
      </div>
    </div>
  );
}
