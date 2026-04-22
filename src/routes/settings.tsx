import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SettingsPage from "@/components/SettingsPage";
import { useState } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — RakshaSetu" },
      { name: "description", content: "Configure your RakshaSetu app settings." },
    ],
  }),
  component: SettingsRoute,
});

function SettingsRoute() {
  const navigate = useNavigate();
  const [stealthMode, setStealthMode] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  return (
    <SettingsPage
      onBack={() => navigate({ to: "/" })}
      stealthMode={stealthMode}
      onStealthToggle={() => setStealthMode((v) => !v)}
      voiceEnabled={voiceEnabled}
      onVoiceToggle={() => setVoiceEnabled((v) => !v)}
      onProfile={() => navigate({ to: "/profile" })}
    />
  );
}
