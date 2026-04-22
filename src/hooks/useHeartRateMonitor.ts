import { useState, useCallback, useRef, useEffect } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface HeartRateMonitorOptions {
  spikeThreshold?: number;
  onSpike?: (bpm: number) => void;
  enabled?: boolean;
}

interface HeartRateMonitorState {
  connected: boolean;
  connecting: boolean;
  heartRate: number | null;
  deviceName: string | null;
  supported: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function useHeartRateMonitor({
  spikeThreshold = 150,
  onSpike,
  enabled = true,
}: HeartRateMonitorOptions = {}): HeartRateMonitorState {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { sendNotification } = usePushNotifications();

  const deviceRef = useRef<any>(null);
  const characteristicRef = useRef<any>(null);
  const spikeTriggeredRef = useRef(false);
  const spikeCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supported = typeof navigator !== "undefined" && "bluetooth" in (navigator as any);

  const handleHeartRateChange = useCallback(
    (event: Event) => {
      const characteristic = event.target as any;
      const value = characteristic.value;
      if (!value) return;

      const flags = value.getUint8(0);
      const is16Bit = flags & 0x01;
      const bpm = is16Bit ? value.getUint16(1, true) : value.getUint8(1);

      setHeartRate(bpm);

      if (enabled && bpm >= spikeThreshold && !spikeTriggeredRef.current) {
        spikeTriggeredRef.current = true;
        onSpike?.(bpm);
        sendNotification(`🚨 Heart Rate Spike: ${bpm} BPM`, {
          body: `Your heart rate exceeded the ${spikeThreshold} BPM threshold. SOS has been triggered.`,
          tag: "heartrate-spike",
          requireInteraction: true,
        });
        spikeCooldownRef.current = setTimeout(() => {
          spikeTriggeredRef.current = false;
        }, 30000);
      }
    },
    [enabled, spikeThreshold, onSpike, sendNotification]
  );

  const connect = useCallback(async () => {
    if (!supported) {
      setError("Web Bluetooth is not supported in this browser");
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      const nav = navigator as any;
      const device = await nav.bluetooth.requestDevice({
        filters: [{ services: ["heart_rate"] }],
        optionalServices: ["battery_service"],
      });

      deviceRef.current = device;
      setDeviceName(device.name || "Unknown Device");

      device.addEventListener("gattserverdisconnected", () => {
        setConnected(false);
        setHeartRate(null);
        setDeviceName(null);
      });

      const server = await device.gatt!.connect();
      const service = await server.getPrimaryService("heart_rate");
      const characteristic = await service.getCharacteristic("heart_rate_measurement");

      characteristicRef.current = characteristic;
      characteristic.addEventListener("characteristicvaluechanged", handleHeartRateChange);
      await characteristic.startNotifications();

      setConnected(true);
    } catch (err: any) {
      if (err.name !== "NotFoundError") {
        setError(err.message || "Failed to connect");
      }
    } finally {
      setConnecting(false);
    }
  }, [supported, handleHeartRateChange]);

  const disconnect = useCallback(() => {
    if (characteristicRef.current) {
      characteristicRef.current.removeEventListener("characteristicvaluechanged", handleHeartRateChange);
      characteristicRef.current = null;
    }
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    deviceRef.current = null;
    setConnected(false);
    setHeartRate(null);
    setDeviceName(null);
  }, [handleHeartRateChange]);

  useEffect(() => {
    return () => {
      disconnect();
      if (spikeCooldownRef.current) clearTimeout(spikeCooldownRef.current);
    };
  }, [disconnect]);

  return { connected, connecting, heartRate, deviceName, supported, error, connect, disconnect };
}
