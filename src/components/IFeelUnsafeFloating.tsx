import { useEffect, useRef, useState } from "react";
import { AlertOctagon, Loader2 } from "lucide-react";
import { useUnsafeAlert } from "@/hooks/useUnsafeAlert";

const LONG_PRESS_MS = 2000;

/**
 * Smaller persistent shortcut for "I Feel Unsafe", placed next to the floating SOS button.
 * Tap = quick confirm prompt (toast). Hold 2s = fire instantly.
 */
const IFeelUnsafeFloating = () => {
  const { status, cooldownRemaining, triggerUnsafeAlert, activeTrackingCode } = useUnsafeAlert();
  const [pressProgress, setPressProgress] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressFiredRef = useRef(false);

  const isBusy = status === "fetching_location" || status === "creating_session";
  const isCooldown = cooldownRemaining > 0;

  const cleanupPress = () => {
    if (pressTimerRef.current) { clearTimeout(pressTimerRef.current); pressTimerRef.current = null; }
    if (pressIntervalRef.current) { clearInterval(pressIntervalRef.current); pressIntervalRef.current = null; }
    setPressProgress(0);
  };

  useEffect(() => () => {
    cleanupPress();
    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
  }, []);

  const startPress = () => {
    if (isBusy || isCooldown) return;
    pressFiredRef.current = false;
    const start = Date.now();
    pressIntervalRef.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / LONG_PRESS_MS) * 100);
      setPressProgress(pct);
    }, 30);
    pressTimerRef.current = setTimeout(() => {
      pressFiredRef.current = true;
      cleanupPress();
      triggerUnsafeAlert();
    }, LONG_PRESS_MS);
  };

  const cancelPress = () => {
    if (pressFiredRef.current) return;
    cleanupPress();
  };

  const handleClick = () => {
    if (pressFiredRef.current) { pressFiredRef.current = false; return; }
    if (isBusy || isCooldown) return;
    if (confirming) {
      // second tap within window = confirm
      if (confirmTimeoutRef.current) { clearTimeout(confirmTimeoutRef.current); confirmTimeoutRef.current = null; }
      setConfirming(false);
      triggerUnsafeAlert();
      return;
    }
    setConfirming(true);
    confirmTimeoutRef.current = setTimeout(() => setConfirming(false), 3000);
  };

  return (
    <button
      onClick={handleClick}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchCancel={cancelPress}
      onContextMenu={(e) => e.preventDefault()}
      disabled={isBusy}
      aria-label="I feel unsafe"
      className="fixed bottom-6 right-24 z-50 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform overflow-hidden disabled:opacity-80"
      style={{
        background: "linear-gradient(135deg, oklch(0.6 0.22 25), oklch(0.65 0.2 45))",
        boxShadow: "0 12px 30px -8px oklch(0.55 0.22 27 / 0.6)",
      }}
    >
      {/* Pulse halo */}
      {!isBusy && !isCooldown && !activeTrackingCode && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow: "0 0 0 0 oklch(1 0 0 / 0.3)",
            animation: "sos-pulse 1.8s ease-in-out infinite",
          }}
        />
      )}
      {/* Long-press progress ring (radial) */}
      {pressProgress > 0 && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `conic-gradient(rgba(255,255,255,0.45) ${pressProgress * 3.6}deg, transparent 0deg)`,
          }}
        />
      )}
      <div className="relative flex flex-col items-center gap-0.5">
        {isBusy ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <AlertOctagon className="w-5 h-5" />
        )}
        <span className="text-[8px] font-extrabold tracking-wider leading-none">
          {activeTrackingCode ? "LIVE" : confirming ? "TAP!" : isCooldown ? `${Math.ceil(cooldownRemaining / 1000)}s` : "HELP"}
        </span>
      </div>
    </button>
  );
};

export default IFeelUnsafeFloating;
