import { useState } from "react";
import { ArrowLeft, Heart, Bluetooth, BluetoothOff, AlertTriangle, Settings2, Wifi } from "lucide-react";
import { useHeartRateMonitor } from "@/hooks/useHeartRateMonitor";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface WearableMonitorProps {
  onBack: () => void;
  onSOSTrigger?: () => void;
}

const WearableMonitor = ({ onBack, onSOSTrigger }: WearableMonitorProps) => {
  const [threshold, setThreshold] = useState(150);
  const [autoSOS, setAutoSOS] = useState(true);

  const { connected, connecting, heartRate, deviceName, supported, error, connect, disconnect } =
    useHeartRateMonitor({
      spikeThreshold: threshold,
      enabled: autoSOS,
      onSpike: (bpm) => {
        toast.error(`🚨 Heart rate spike detected: ${bpm} BPM! SOS triggered!`, { duration: 10000 });
        onSOSTrigger?.();
      },
    });

  const getHeartRateColor = () => {
    if (!heartRate) return "text-muted-foreground";
    if (heartRate < 60) return "text-blue-400";
    if (heartRate < 100) return "text-crisis-safe";
    if (heartRate < 130) return "text-crisis-medium";
    if (heartRate < threshold) return "text-crisis-high";
    return "text-destructive";
  };

  const getHeartRateStatus = () => {
    if (!heartRate) return "No data";
    if (heartRate < 60) return "Low";
    if (heartRate < 100) return "Normal";
    if (heartRate < 130) return "Elevated";
    if (heartRate < threshold) return "High";
    return "⚠️ DANGER";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-[hsl(340,70%,35%)] to-[hsl(350,60%,25%)] px-4 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">Wearable Monitor</h1>
            <p className="text-white/60 text-xs">Heart rate monitoring & auto-SOS</p>
          </div>
        </div>

        {/* Connection Status */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {connected ? (
                <Bluetooth className="w-6 h-6 text-crisis-safe" />
              ) : (
                <BluetoothOff className="w-6 h-6 text-white/40" />
              )}
              <div>
                <p className="text-white text-sm font-semibold">
                  {connected ? deviceName : "No Device Connected"}
                </p>
                <p className="text-white/50 text-xs">
                  {connecting ? "Connecting..." : connected ? "Connected via BLE" : "Tap to connect"}
                </p>
              </div>
            </div>
            <button
              onClick={connected ? disconnect : connect}
              disabled={connecting}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                connected
                  ? "bg-white/20 text-white hover:bg-white/30"
                  : "bg-white text-[hsl(340,70%,35%)] hover:bg-white/90"
              } disabled:opacity-50`}
            >
              {connecting ? "..." : connected ? "Disconnect" : "Connect"}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-5">
        {!supported && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-destructive">Not Supported</p>
              <p className="text-xs text-muted-foreground mt-1">
                Web Bluetooth is only available in Chrome/Edge on Android and desktop. iOS Safari is not supported.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Heart Rate Display */}
        <div className="bg-card rounded-3xl border border-border p-6 flex flex-col items-center">
          <div className="relative">
            <Heart
              className={`w-20 h-20 ${getHeartRateColor()} ${connected && heartRate ? "animate-pulse" : ""}`}
              fill={connected && heartRate ? "currentColor" : "none"}
            />
            {connected && heartRate && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-black text-white">{heartRate}</span>
              </div>
            )}
          </div>
          <p className={`text-4xl font-black mt-4 ${getHeartRateColor()}`}>
            {heartRate ?? "--"}
            <span className="text-lg font-medium ml-1">BPM</span>
          </p>
          <p className={`text-sm font-semibold mt-1 ${getHeartRateColor()}`}>{getHeartRateStatus()}</p>
          <div className="flex items-center gap-1.5 mt-3">
            <Wifi className={`w-3.5 h-3.5 ${connected ? "text-crisis-safe" : "text-muted-foreground"}`} />
            <span className="text-[10px] text-muted-foreground">
              {connected ? "Live monitoring active" : "Connect a device to start"}
            </span>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-5">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-muted-foreground" />
            <p className="text-sm font-bold text-foreground">Monitor Settings</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">SOS Threshold</span>
              <span className="text-sm font-bold text-crisis-high">{threshold} BPM</span>
            </div>
            <Slider
              value={[threshold]}
              onValueChange={([v]) => setThreshold(v)}
              min={100}
              max={200}
              step={5}
              className="w-full"
            />
            <p className="text-[10px] text-muted-foreground">SOS triggers when heart rate exceeds this value</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Auto-trigger SOS</p>
              <p className="text-[10px] text-muted-foreground">Automatically send SOS on heart rate spike</p>
            </div>
            <Switch checked={autoSOS} onCheckedChange={setAutoSOS} />
          </div>
        </div>

        {/* How it works */}
        <div className="bg-secondary/50 rounded-2xl p-4 space-y-2">
          <p className="text-xs font-bold text-foreground">How It Works</p>
          <ul className="space-y-1.5">
            {[
              "Connect your BLE heart rate monitor or smartwatch",
              "Real-time heart rate is monitored continuously",
              `If BPM exceeds ${threshold}, SOS is auto-triggered`,
              "Emergency contacts are immediately notified",
            ].map((text) => (
              <li key={text} className="text-[11px] text-muted-foreground flex items-start gap-2">
                <span className="text-crisis-safe mt-0.5">•</span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WearableMonitor;
