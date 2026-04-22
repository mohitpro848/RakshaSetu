import { createFileRoute, useNavigate } from "@tanstack/react-router";
import CommunityForum from "@/components/CommunityForum";

export const Route = createFileRoute("/forum")({
  component: ForumPage,
});

function ForumPage() {
  const nav = useNavigate();
  return <CommunityForum onBack={() => nav({ to: "/" })} />;
}
