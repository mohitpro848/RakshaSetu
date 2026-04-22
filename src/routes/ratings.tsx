import { createFileRoute, useNavigate } from "@tanstack/react-router";
import LocationRatings from "@/components/LocationRatings";

export const Route = createFileRoute("/ratings")({
  component: RatingsPage,
});

function RatingsPage() {
  const nav = useNavigate();
  return <LocationRatings onBack={() => nav({ to: "/" })} />;
}
