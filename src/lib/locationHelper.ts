const CACHE_KEY = "rakshasetu_last_known_location";

export interface GeoLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

export type LocationPermission = "granted" | "denied" | "prompt" | "unsupported";

/** Save location to localStorage as fallback */
const cacheLocation = (loc: GeoLocation) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(loc));
  } catch {
    // ignore
  }
};

/** Get last known cached location (max 30 min old) */
export const getCachedLocation = (): GeoLocation | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const loc: GeoLocation = JSON.parse(raw);
    if (Date.now() - loc.timestamp < 30 * 60 * 1000) return loc;
    return null;
  } catch {
    return null;
  }
};

/** Build a Google Maps link from coordinates */
export const buildMapsLink = (lat: number, lng: number): string =>
  `https://www.google.com/maps?q=${lat},${lng}`;

/** Check location permission status without triggering a prompt */
export const checkLocationPermission = async (): Promise<LocationPermission> => {
  if (!navigator.geolocation) return "unsupported";
  try {
    if (navigator.permissions) {
      const status = await navigator.permissions.query({ name: "geolocation" });
      return status.state as LocationPermission;
    }
    return "prompt"; // Can't check — assume prompt
  } catch {
    return "prompt";
  }
};

/**
 * Fetch current GPS location with high accuracy.
 * Retry once with lower accuracy. Falls back to cached location.
 * Designed to resolve within ~5s even in poor conditions.
 */
export const fetchLocation = (): Promise<GeoLocation | null> => {
  if (!navigator.geolocation) {
    return Promise.resolve(getCachedLocation());
  }

  return new Promise((resolve) => {
    let resolved = false;

    const succeed = (pos: GeolocationPosition) => {
      if (resolved) return;
      resolved = true;
      const loc: GeoLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: Date.now(),
      };
      cacheLocation(loc);
      resolve(loc);
    };

    const fallback = () => {
      if (resolved) return;
      resolved = true;
      resolve(getCachedLocation());
    };

    // Attempt 1: high accuracy, 4s timeout
    navigator.geolocation.getCurrentPosition(
      succeed,
      () => {
        // Attempt 2: low accuracy, accept cached up to 60s, 3s timeout
        navigator.geolocation.getCurrentPosition(succeed, fallback, {
          enableHighAccuracy: false,
          timeout: 3000,
          maximumAge: 60000,
        });
      },
      { enableHighAccuracy: true, timeout: 4000, maximumAge: 0 }
    );
  });
};

/**
 * Start watching location in the background and cache each update.
 * Returns a cleanup function to stop watching.
 */
export const startLocationWatch = (): (() => void) => {
  if (!navigator.geolocation) return () => {};

  const id = navigator.geolocation.watchPosition(
    (pos) => {
      cacheLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: Date.now(),
      });
    },
    () => {},
    { enableHighAccuracy: true, maximumAge: 10000 }
  );

  return () => navigator.geolocation.clearWatch(id);
};
