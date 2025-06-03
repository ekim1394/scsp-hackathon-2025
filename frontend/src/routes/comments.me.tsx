import { createFileRoute } from "@tanstack/react-router";
import Comment, { type IComment } from "../components/Comment";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/client";
import Post, { type IPost } from "../components/Post";

export const Route = createFileRoute("/comments/me")({
  component: RouteComponent,
});

function RouteComponent() {
  const comments = useQuery<IComment[]>({
    queryKey: ["comments"],
    queryFn: async (): Promise<IComment[]> => {
      const response = await apiClient.get("/comments");
      return response.data;
    },
  });

  const posts = useQuery<IPost[]>({
    queryKey: ["threads"],
    queryFn: async (): Promise<IPost[]> => {
      const response = await apiClient.get<IPost[]>("/threads");
      return response.data;
    },
  });

  return (
    <div className="flex flex-col p-4 lg:max-w-4xl w-full mx-auto">
      {comments.isLoading && <div>Loading comments...</div>}
      {comments.error && <div>Error loading comments.</div>}
      {comments.data && comments.data.length === 0 && (
        <div className="text-center text-gray-500">
          You have not made any comments yet.
        </div>
      )}
      {comments.data && comments.data.length > 0 && (
        <ul className="space-y-4">
          {comments.data.map((comment: IComment) => (
            <>
              {posts.data && (
                <Post
                  thread={posts.data.find((p) => p.id === comment.thread_id)!}
                />
              )}
              <Comment key={comment.id} comment={comment} />
            </>
          ))}
        </ul>
      )}
    </div>
  );
}
