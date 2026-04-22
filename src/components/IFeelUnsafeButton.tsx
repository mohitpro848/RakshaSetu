import { useEffect, useRef, useState } from "react";
import { AlertOctagon, MapPin, MessageSquare, X, Loader2, ShieldCheck, ExternalLink } from "lucide-react";
import { useUnsafeAlert } from "@/hooks/useUnsafeAlert";
import { buildMapsLink } from "@/lib/locationHelper";

const LONG_PRESS_MS = 2000;

interface IFeelUnsafeButtonProps {
  className?: string;
}

const IFeelUnsafeButton = ({ className = "" }: IFeelUnsafeButtonProps) => {
  const { status, lastResult, activeTrackingCode, cooldownRemaining, triggerUnsafeAlert, stopTracking } = useUnsafeAlert();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [pressProgress, setPressProgress] = useState(0); // 0..100
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pressFiredRef = useRef(false);

  const isBusy = status === "fetching_location" || status === "creating_session";
  const cooldownSec = Math.ceil(cooldownRemaining / 1000);
  const isCooldown = cooldownRemaining > 0;

  const cleanupPress = () => {
    if (pressTimerRef.current) { clearTimeout(pressTimerRef.current); pressTimerRef.current = null; }
    if (pressIntervalRef.current) { clearInterval(pressIntervalRef.current); pressIntervalRef.current = null; }
    setPressProgress(0);
  };

  useEffect(() => () => cleanupPress(), []);

  const fireAlert = async () => {
    const r = await triggerUnsafeAlert();
    if (r.ok) setShowResult(true);
  };

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
      fireAlert();
    }, LONG_PRESS_MS);
  };

  const cancelPress = () => {
    if (pressFiredRef.current) return;
    cleanupPress();
  };

  const handleClick = () => {
    // If long-press already fired, ignore the click
    if (pressFiredRef.current) {
      pressFiredRef.current = false;
      return;
    }
    if (isBusy || isCooldown) return;
    setShowConfirm(true);
  };

  return (
    <>
      <section className={`animate-fade-in-up ${className}`}>
        <button
          type="button"
          onClick={handleClick}
          onMouseDown={startPress}
          onMouseUp={cancelPress}
          onMouseLeave={cancelPress}
          onTouchStart={startPress}
          onTouchEnd={cancelPress}
          onTouchCancel={cancelPress}
          onContextMenu={(e) => e.preventDefault()}
          disabled={isBusy}
          aria-label="I feel unsafe — emergency alert"
          className="relative w-full overflow-hidden rounded-2xl p-4 text-left active:scale-[0.99] transition-transform disabled:opacity-80"
          style={{
            background: "linear-gradient(135deg, oklch(0.6 0.22 25), oklch(0.65 0.2 45))",
            backgroundSize: "200% 200%",
            animation: "gradientMove 5s ease infinite",
            boxShadow: "0 14px 40px -10px oklch(0.55 0.22 27 / 0.55)",
            willChange: "transform, background-position",
          }}
        >
          {/* Pulse halo (urgency) */}
          {!isBusy && !isCooldown && (
            <span
              aria-hidden
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                boxShadow: "0 0 0 0 oklch(1 0 0 / 0.25)",
                animation: "sos-pulse 1.8s ease-in-out infinite",
              }}
            />
          )}

          {/* Long-press progress fill */}
          {pressProgress > 0 && (
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 bg-white/20 pointer-events-none"
              style={{ width: `${pressProgress}%`, transition: "width 30ms linear" }}
            />
          )}

          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              {isBusy ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <AlertOctagon className="w-7 h-7 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-extrabold text-white leading-tight">
                {isBusy
                  ? (status === "fetching_location" ? "Getting your location…" : "Preparing alert…")
                  : isCooldown
                    ? `Please wait ${cooldownSec}s`
                    : "I Feel Unsafe"}
              </p>
              <p className="text-[11px] text-white/85 leading-tight mt-0.5">
                {activeTrackingCode
                  ? "Live tracking active — tap to manage"
                  : "Tap to confirm · Hold 2s to send instantly"}
              </p>
            </div>
            {activeTrackingCode && (
              <span className="text-[10px] font-bold text-white bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                LIVE
              </span>
            )}
          </div>
        </button>

        {/* Active tracking control bar */}
        {activeTrackingCode && (
          <div className="mt-2 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-crisis-critical animate-pulse" />
              <span className="text-xs font-semibold text-foreground truncate">
                Sharing live location · code {activeTrackingCode}
              </span>
            </div>
            <button
              onClick={stopTracking}
              className="text-xs font-bold text-crisis-safe px-2 py-1 rounded-lg bg-crisis-safe/10 hover:bg-crisis-safe/15 active:scale-95 transition-all"
            >
              I'm Safe
            </button>
          </div>
        )}
      </section>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setShowConfirm(false)} />
          <div className="relative w-full max-w-sm mx-auto bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl animate-scale-in overflow-hidden">
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-extrabold text-foreground">Send emergency alert?</h3>
                <button onClick={() => setShowConfirm(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Your live location will be shared with your emergency contacts and a live tracking link will be created.
              </p>
              <div className="mt-4 space-y-2">
                <button
                  onClick={async () => { setShowConfirm(false); await fireAlert(); }}
                  className="w-full py-3 rounded-xl text-white font-bold text-sm active:scale-[0.97] transition-transform"
                  style={{ background: "linear-gradient(135deg, oklch(0.6 0.22 25), oklch(0.65 0.2 45))", boxShadow: "0 10px 30px -10px oklch(0.55 0.22 27 / 0.5)" }}
                >
                  Yes, send alert now
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="w-full py-2.5 rounded-xl bg-muted text-foreground text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-3">
                Tip: Hold the red button for 2 seconds to skip this confirmation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Result sheet */}
      {showResult && lastResult?.ok && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setShowResult(false)} />
          <div className="relative w-full max-w-md mx-auto bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl animate-scale-in overflow-hidden">
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-crisis-safe/15 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-crisis-safe" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-foreground leading-tight">Alert sent</h3>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {lastResult.contactsNotified > 0
                        ? `${lastResult.contactsNotified} contact${lastResult.contactsNotified === 1 ? "" : "s"} ready to notify`
                        : "No contacts saved yet"}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowResult(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {lastResult.location && (
                <a
                  href={buildMapsLink(lastResult.location.lat, lastResult.location.lng)}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-xl bg-secondary mb-2 active:scale-[0.98] transition-transform"
                >
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs font-semibold text-foreground truncate flex-1">
                    {lastResult.location.lat.toFixed(5)}, {lastResult.location.lng.toFixed(5)}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
              )}

              {lastResult.trackingLink && (
                <div className="p-3 rounded-xl bg-crisis-critical/10 border border-crisis-critical/20 mb-3">
                  <p className="text-[10px] font-bold text-crisis-critical uppercase tracking-wider">Live tracking link</p>
                  <p className="text-xs text-foreground break-all mt-0.5">{lastResult.trackingLink}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {lastResult.smsLink ? (
                  <a
                    href={lastResult.smsLink}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-[0.97] transition-transform"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Open SMS
                  </a>
                ) : (
                  <span className="flex items-center justify-center py-2.5 rounded-xl bg-muted text-xs font-semibold text-muted-foreground">
                    No contacts
                  </span>
                )}
                {lastResult.whatsappLink && (
                  <a
                    href={lastResult.whatsappLink}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-crisis-safe text-white text-xs font-bold active:scale-[0.97] transition-transform"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                )}
              </div>

              <button
                onClick={() => setShowResult(false)}
                className="mt-3 w-full py-2.5 rounded-xl bg-muted text-foreground text-sm font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default IFeelUnsafeButton;
