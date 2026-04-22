import { useEffect, useRef, useState, useCallback } from "react";

interface UseShakeDetectionOptions {
  threshold?: number;       // acceleration threshold (m/s²)
  shakeCount?: number;      // number of shakes required
  timeWindow?: number;      // time window in ms to detect shakes
  cooldown?: number;        // cooldown between triggers in ms
  onShake: () => void;
  enabled: boolean;
}

export const useShakeDetection = ({
  threshold = 15,
  shakeCount = 3,
  timeWindow = 1000,
  cooldown = 5000,
  onShake,
  enabled,
}: UseShakeDetectionOptions) => {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);

  const shakesRef = useRef<number[]>([]);
  const lastTriggerRef = useRef(0);
  const onShakeRef = useRef(onShake);
  const enabledRef = useRef(enabled);

  useEffect(() => { onShakeRef.current = onShake; }, [onShake]);
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);

  useEffect(() => {
    const hasMotion = "DeviceMotionEvent" in window;
    setSupported(hasMotion);
  }, []);

  useEffect(() => {
    if (!enabled || !supported) {
      setActive(false);
      return;
    }

    const handleMotion = (event: DeviceMotionEvent) => {
      if (!enabledRef.current) return;

      const acc = event.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

      // Calculate total acceleration magnitude (subtract gravity ~9.8)
      const total = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
      const netAcceleration = Math.abs(total - 9.8);

      if (netAcceleration > threshold) {
        const now = Date.now();
        shakesRef.current.push(now);

        // Remove old shakes outside time window
        shakesRef.current = shakesRef.current.filter((t) => now - t < timeWindow);

        // Check if enough shakes in window and cooldown passed
        if (
          shakesRef.current.length >= shakeCount &&
          now - lastTriggerRef.current > cooldown
        ) {
          lastTriggerRef.current = now;
          shakesRef.current = [];

          // Vibrate feedback
          if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100, 50, 200]);
          }

          console.log("[ShakeDetection] Shake detected! Triggering SOS...");
          onShakeRef.current();
        }
      }
    };

    // Request permission on iOS 13+
    const requestPermission = async () => {
      if (
        typeof (DeviceMotionEvent as any).requestPermission === "function"
      ) {
        try {
          const permission = await (DeviceMotionEvent as any).requestPermission();
          if (permission !== "granted") {
            console.warn("[ShakeDetection] Motion permission denied");
            return false;
          }
        } catch {
          console.warn("[ShakeDetection] Could not request motion permission");
          return false;
        }
      }
      return true;
    };

    requestPermission().then((granted) => {
      if (granted) {
        window.addEventListener("devicemotion", handleMotion);
        setActive(true);
      }
    });

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
      setActive(false);
    };
  }, [enabled, supported, threshold, shakeCount, timeWindow, cooldown]);

  // Manual permission request (for iOS button click requirement)
  const requestPermission = useCallback(async () => {
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        return permission === "granted";
      } catch {
        return false;
      }
    }
    return true;
  }, []);

  return { supported, active, requestPermission };
};
