import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Biometric quick re-login using WebAuthn platform authenticator.
 *
 * Flow:
 * 1. After a successful password/Google login, call `enableBiometric(email)`.
 *    - Creates a WebAuthn credential bound to this device (fingerprint/Face ID).
 *    - Stores the current Supabase refresh_token + email in localStorage,
 *      keyed by the credential ID.
 * 2. On next visit, call `loginWithBiometric()`.
 *    - Prompts the user for fingerprint/Face ID.
 *    - On success, restores the Supabase session via setSession({ refresh_token }).
 *
 * Notes:
 * - Refresh tokens rotate on every use, so we update storage after each restore.
 * - This is "quick re-login", not passwordless — user must do a normal login first.
 * - Falls back gracefully if WebAuthn is unavailable.
 */

const STORAGE_KEY = "rs_biometric_v1";

type StoredCredential = {
  credentialId: string; // base64url
  email: string;
  refreshToken: string;
  createdAt: number;
};

function bufferToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBuffer(b64url: string): ArrayBuffer {
  const pad = "=".repeat((4 - (b64url.length % 4)) % 4);
  const b64 = (b64url + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

function readStored(): StoredCredential | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredCredential) : null;
  } catch {
    return null;
  }
}

function writeStored(data: StoredCredential | null) {
  if (typeof window === "undefined") return;
  if (!data) localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useBiometricAuth() {
  const [supported, setSupported] = useState(false);
  const [available, setAvailable] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolledEmail, setEnrolledEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const hasApi =
        typeof window !== "undefined" &&
        !!window.PublicKeyCredential &&
        typeof navigator !== "undefined" &&
        !!navigator.credentials;
      if (!hasApi) {
        if (!cancelled) {
          setSupported(false);
          setAvailable(false);
        }
        return;
      }
      setSupported(true);
      try {
        const ok =
          await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (!cancelled) setAvailable(!!ok);
      } catch {
        if (!cancelled) setAvailable(false);
      }
      if (!cancelled) {
        const stored = readStored();
        setEnrolled(!!stored);
        setEnrolledEmail(stored?.email ?? null);
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep stored refresh token in sync with Supabase's rotating tokens.
  // Supabase rotates refresh tokens on every auto-refresh, so the one we
  // stored at enroll time becomes invalid quickly. We update it on every
  // TOKEN_REFRESHED / SIGNED_IN event so the stored copy stays usable.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.refresh_token) return;
      if (event !== "TOKEN_REFRESHED" && event !== "SIGNED_IN" && event !== "INITIAL_SESSION") return;
      const stored = readStored();
      if (!stored) return;
      // Only update if the user matches (avoid overwriting on account switch)
      if (session.user?.email && stored.email && session.user.email !== stored.email) return;
      if (stored.refreshToken === session.refresh_token) return;
      writeStored({ ...stored, refreshToken: session.refresh_token });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const enableBiometric = useCallback(
    async (email: string): Promise<{ ok: boolean; error?: string }> => {
      if (!supported || !available) {
        return { ok: false, error: "Biometric not available on this device" };
      }
      setBusy(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;
        if (!session?.refresh_token) {
          return { ok: false, error: "No active session to bind" };
        }

        const challenge = crypto.getRandomValues(new Uint8Array(32));
        const userId = crypto.getRandomValues(new Uint8Array(16));

        const cred = (await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: { name: "RakshaSetu", id: window.location.hostname },
            user: {
              id: userId,
              name: email,
              displayName: email,
            },
            pubKeyCredParams: [
              { type: "public-key", alg: -7 }, // ES256
              { type: "public-key", alg: -257 }, // RS256
            ],
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "required",
              residentKey: "preferred",
            },
            timeout: 60000,
            attestation: "none",
          },
        })) as PublicKeyCredential | null;

        if (!cred) return { ok: false, error: "Cancelled" };

        writeStored({
          credentialId: bufferToBase64Url(cred.rawId),
          email,
          refreshToken: session.refresh_token,
          createdAt: Date.now(),
        });
        setEnrolled(true);
        setEnrolledEmail(email);
        return { ok: true };
      } catch (e: any) {
        return { ok: false, error: e?.message || "Failed to enable biometric" };
      } finally {
        setBusy(false);
      }
    },
    [supported, available],
  );

  const loginWithBiometric = useCallback(async (): Promise<{
    ok: boolean;
    error?: string;
  }> => {
    if (!supported || !available) {
      return { ok: false, error: "Biometric not available" };
    }
    const stored = readStored();
    if (!stored) return { ok: false, error: "No biometric enrolled" };
    setBusy(true);
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: window.location.hostname,
          allowCredentials: [
            {
              type: "public-key",
              id: base64UrlToBuffer(stored.credentialId),
              transports: ["internal"],
            },
          ],
          userVerification: "required",
          timeout: 60000,
        },
      })) as PublicKeyCredential | null;

      if (!assertion) return { ok: false, error: "Cancelled" };

      // Restore Supabase session using stored refresh token
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: stored.refreshToken,
      });
      if (error || !data.session) {
        // Refresh token expired/revoked — clear so user must re-login normally
        writeStored(null);
        setEnrolled(false);
        setEnrolledEmail(null);
        return {
          ok: false,
          error: "Session expired. Please sign in with password once.",
        };
      }

      // Save the rotated refresh token for next time
      writeStored({
        ...stored,
        refreshToken: data.session.refresh_token,
      });
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || "Biometric verification failed" };
    } finally {
      setBusy(false);
    }
  }, [supported, available]);

  const disableBiometric = useCallback(() => {
    writeStored(null);
    setEnrolled(false);
    setEnrolledEmail(null);
  }, []);

  return {
    supported,
    available,
    enrolled,
    enrolledEmail,
    busy,
    enableBiometric,
    loginWithBiometric,
    disableBiometric,
  };
}
