import { createFileRoute } from "@tanstack/react-router";
import SafetyReports from "@/components/SafetyReports";

export const Route = createFileRoute("/reports")({
  component: SafetyReports,
  head: () => ({
    meta: [
      { title: "Safety Reports — RakshaSetu" },
      { name: "description", content: "Generate and download PDF safety reports for incident documentation." },
    ],
  }),
});
