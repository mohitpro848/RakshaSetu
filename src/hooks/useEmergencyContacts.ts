import { EmergencyContact } from "@/components/EmergencyContacts";

const STORAGE_KEY = "rakshasetu_emergency_contacts";

export const getEmergencyContacts = (): EmergencyContact[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

export interface SOSNotification {
  contact: EmergencyContact;
  level: string;
  timestamp: number;
  location?: { lat: number; lng: number };
  stealth: boolean;
}

export const notifyEmergencyContacts = (
  level: string,
  stealth: boolean,
  location?: { lat: number; lng: number }
): SOSNotification[] => {
  const contacts = getEmergencyContacts();
  if (contacts.length === 0) return [];

  // Sort primary contacts first
  const sorted = [...contacts].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));

  const notifications: SOSNotification[] = sorted.map((contact) => ({
    contact,
    level,
    timestamp: Date.now(),
    location,
    stealth,
  }));

  // Log notifications (mock — in production this would send SMS/push)
  const logKey = "rakshasetu_sos_notifications_log";
  try {
    const existing = JSON.parse(localStorage.getItem(logKey) || "[]");
    existing.push(...notifications);
    localStorage.setItem(logKey, JSON.stringify(existing.slice(-50)));
  } catch {
    // ignore
  }

  console.log(
    `[RakshaSetu] SOS notifications sent to ${notifications.length} contacts:`,
    notifications.map((n) => `${n.contact.name} (${n.contact.phone})`)
  );

  return notifications;
};
