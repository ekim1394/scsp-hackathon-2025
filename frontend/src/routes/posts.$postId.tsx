import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "../AuthProvider";
import Comment, { type IComment } from "../components/Comment";
import type { IPost } from "../components/Post";
import Post from "../components/Post";
import { apiClient } from "../lib/utils";

export const Route = createFileRoute("/posts/$postId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { postId } = Route.useParams();
  const { user } = useAuth();
  const [commentInput, setCommentInput] = useState("");

  const queryClient = useQueryClient();

  const comments = useQuery<IComment[]>({
    queryKey: ["comments" + postId],
    queryFn: async (): Promise<IComment[]> => {
      const response = await apiClient.get<IComment[]>("/comments/" + postId);
      return response.data;
    },
  });

  const post = useQuery<IPost>({
    queryKey: ["threads" + postId],
    queryFn: async (): Promise<IPost> => {
      const response = await apiClient.get<IPost>("/threads/" + postId);
      return response.data;
    },
  });

  const mutation = useMutation({
    mutationFn: ({ postId, comment }: { postId: string; comment: string }) => {
      return apiClient.post("/comment", {
        thread_id: postId,
        content: comment,
        user_id: user,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments" + postId],
      });
    },
  });

  if (!post.data) {
    return <div>Loading...</div>;
  }
  return (
    <div className="flex flex-col p-4 lg:max-w-4xl w-full">
      <Post thread={post.data} />
      <hr className="my-4 border-t-2 border-solid border-white" />
      <div className="flex flex-row mb-4">
        <h2>Comments</h2>
      </div>
      <div className="flex flex-col items-center">
        <textarea
          placeholder="Add a comment..."
          className="border rounded px-2 py-1 mr-2 bg-black text-white w-full"
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && commentInput.trim()) {
              e.preventDefault();
              mutation.mutate({ postId, comment: commentInput });
              setCommentInput("");
            }
          }}
        />
        <div className="ml-auto text-gray-500">press enter to comment</div>
      </div>
      <div className="mt-4">
        <ul className="space-y-2">
          {!comments.data || comments.data.length === 0 ? (
            <li className="text-gray-400">
              No comments yet. Be the first to comment!
            </li>
          ) : (
            comments.data.map((comment) => <Comment comment={comment} />)
          )}
        </ul>
      </div>
    </div>
  );
}
