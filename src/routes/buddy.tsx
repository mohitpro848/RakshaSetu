import { createFileRoute } from "@tanstack/react-router";
import BuddySystem from "@/components/BuddySystem";

export const Route = createFileRoute("/buddy")({
  component: BuddySystem,
  head: () => ({
    meta: [
      { title: "Buddy System — RakshaSetu" },
      { name: "description", content: "Request a virtual walking companion with real-time location sharing and check-in timers." },
    ],
  }),
});
