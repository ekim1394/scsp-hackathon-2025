import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ReplyIcon, Trash } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../AuthProvider";
import { apiClient } from "../lib/utils";
import { Button } from "./ui/button";

export interface IVote {
  value: number;
  user_id: number;
}

export interface IComment {
  id: number;
  content: string;
  created_at: Date;
  user_id: string;
  thread_id: string;
  parent_comment_id?: string;
  vote: IVote[];
}

export default function Comment({ comment }: { comment: IComment }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const voteCount = comment.vote.reduce((acc, v) => acc + v.value, 0);

  const voteMut = useMutation({
    mutationFn: ({
      commentId,
      voteType,
    }: {
      commentId: number;
      voteType: string;
    }) => {
      return apiClient.put("/vote", {
        comment_id: commentId,
        vote_type: voteType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["comments" + comment.thread_id],
      });
    },
  });

  function handleVote(commentId: number, voteType: string) {
    voteMut.mutate({
      commentId: commentId,
      voteType,
    });
  }

  const handleDeleteComment = (commentId: number) => {
    apiClient
      .delete(`/comments/${commentId}`)
      .then(() => {
        toast.info("Deleted comment");
        queryClient.invalidateQueries({
          queryKey: ["comments" + comment.thread_id],
        });
      })
      .catch((error) => {
        toast.error("Error deleting comment");
        console.error("Error deleting comment:", error);
      });
  };

  return (
    <li key={comment.id} className="bg-black p-3">
      <div className="font-bold mb-4 flex items-center justify-between">
        <span className="flex items-center space-x-2">
          {comment.user_id} -{" "}
          {(() => {
            const easternDate = new Date(comment.created_at);
            const isDST = (() => {
              const jan = new Date(
                easternDate.getFullYear(),
                0,
                1
              ).getTimezoneOffset();
              const jul = new Date(
                easternDate.getFullYear(),
                6,
                1
              ).getTimezoneOffset();
              return easternDate.getTimezoneOffset() < Math.max(jan, jul);
            })();
            const easternOffset = isDST ? -4 : -5;
            const utcDate = new Date(
              easternDate.getTime() + easternOffset * 60 * 60 * 1000
            );
            const diffMs = Date.now() - utcDate.getTime();
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            if (diffHours <= 0) {
              const diffMinutes = Math.floor(diffMs / (1000 * 60));
              return `${diffMinutes}m ago`;
            }
            return `${diffHours}h ago`;
          })()}
        </span>
        <span className="ml-2 flex items-center">
          <Trash
            className="text-red-500/80 cursor-pointer"
            onClick={() => handleDeleteComment(comment.id)}
          />
        </span>
      </div>
      <div className="mb-4">{comment.content}</div>
      <div>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            aria-label="upvote"
            className={
              `transition-colors ` +
              (comment.vote.find((v) => v.user_id === user)?.value === 1
                ? "text-green-400"
                : "text-gray-400 hover:text-green-400")
            }
            onClick={() => handleVote(comment.id, "upvote")}
          >
            <ArrowUp />
          </Button>
          <span
            className={
              `transition-colors ` +
              (comment.vote.find((v) => v.user_id === user)?.value === -1
                ? "text-red-400"
                : "text-gray-400 hover:text-red-400")
            }
          >
            {voteCount}
          </span>{" "}
          <Button
            variant="ghost"
            size="icon"
            aria-label="downvote"
            className="bg-black hover:bg-black hover:text-red-700"
            onClick={() => handleVote(comment.id, "downvote")}
          >
            <ArrowDown />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-500 hover:bg-black hover:text-blue-300"
            // onClick handler for reply can be added here
          >
            <ReplyIcon />
            Reply
          </Button>
        </div>
      </div>
    </li>
  );
}
