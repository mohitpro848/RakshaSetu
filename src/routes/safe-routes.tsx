import { createFileRoute } from "@tanstack/react-router";
import SafeRoutes from "@/components/SafeRoutes";

export const Route = createFileRoute("/safe-routes")({
  component: SafeRoutes,
  head: () => ({
    meta: [
      { title: "Safe Routes — RakshaSetu" },
      { name: "description", content: "Find safer walking paths based on incident data and safety heatmaps." },
    ],
  }),
});
