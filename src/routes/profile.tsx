import { createFileRoute, useNavigate } from "@tanstack/react-router";
import ProfileSettings from "@/components/ProfileSettings";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — RakshaSetu" },
      { name: "description", content: "View and edit your RakshaSetu profile." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  return <ProfileSettings onBack={() => navigate({ to: "/" })} />;
}
