import type { EmergencyContact } from "@/components/EmergencyContacts";
import { buildMapsLink } from "@/lib/locationHelper";

/**
 * Builds an `sms:` deep-link URI that opens the native SMS app
 * with a pre-filled emergency message addressed to all saved contacts.
 *
 * iOS uses `sms:num1,num2&body=...`
 * Android uses `sms:num1,num2?body=...`
 */
export const buildEmergencySmsLink = (
  contacts: EmergencyContact[],
  level: string,
  location?: { lat: number; lng: number },
  trackingLink?: string
): string | null => {
  if (contacts.length === 0) return null;

  const phones = contacts.map((c) => c.phone).join(",");

  let body = `🆘 EMERGENCY SOS — RakshaSetu\n\nAlert Level: ${level}\nI need immediate help!`;

  if (location) {
    body += `\n\n📍 My Location:\n${buildMapsLink(location.lat, location.lng)}`;
  }

  if (trackingLink) {
    body += `\n\n🔴 Track My Live Location:\n${trackingLink}`;
  }

  body += `\n\nThis is an automated emergency alert from RakshaSetu.`;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const separator = isIOS ? "&" : "?";

  return `sms:${phones}${separator}body=${encodeURIComponent(body)}`;
};
