import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/client";
import type { IPost } from "../components/Post";
import Post from "../components/Post";
export const Route = createFileRoute("/posts/")({
  component: RouteComponent,
});

function RouteComponent() {
  // Access the client
  const threadsQuery = useQuery<IPost[]>({
    queryKey: ["threads"],
    queryFn: async (): Promise<IPost[]> => {
      const response = await apiClient.get<IPost[]>("/threads");
      return response.data;
    },
  });

  const threads = threadsQuery.data ?? [];

  return (
    <div className="flex flex-col p-4 lg:max-w-4xl w-full mx-auto">
      {threads.length === 0 ? (
        <div className="text-lg text-center">
          No threads available. Start a new discussion!
        </div>
      ) : (
        <ul className="space-y-6">
          {threads.map((thread) => (
            <Post key={thread.id} thread={thread} />
          ))}
        </ul>
      )}
    </div>
  );
}
