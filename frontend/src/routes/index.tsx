import { createFileRoute } from "@tanstack/react-router";
import { PostRouteComponent } from "./posts.index";
export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <PostRouteComponent />;
}
