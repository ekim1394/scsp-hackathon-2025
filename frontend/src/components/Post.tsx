import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Trash } from "lucide-react";
import { apiClient } from "../lib/client";
import { useAuth } from "../AuthProvider";
import { FilePreview } from "./FilePreview";
import { toast } from "sonner";

export interface IVote {
  value: number;
  user_id: number;
}

export interface IAttachment {
  id: number;
  file_url: string;
  file_type: string;
}
export interface IPost {
  id: number;
  user_id: number;
  title: string;
  content: string;
  created_at: Date;
  updated_at: Date;
  category: string;
  tags: string[];
  summary: string;
  vote: IVote[];
  attachment: IAttachment;
}

export default function Post({ thread }: { thread: IPost }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const voteCount = thread.vote?.reduce((acc, v) => acc + v.value, 0);

  const mutation = useMutation({
    mutationFn: ({
      postId,
      voteType,
    }: {
      postId: number;
      voteType: string;
    }) => {
      return apiClient.put("/vote", {
        thread_id: postId,
        vote_type: voteType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.invalidateQueries({ queryKey: ["threads" + thread.id] });
    },
  });

  const handleVote = (id: number, voteType: string) => {
    mutation.mutate({
      postId: id,
      voteType: voteType,
    });
  };

  const deleteThread = useMutation({
    mutationFn: (thread_id: number) => {
      return apiClient.delete(`/threads/${thread_id}`);
    },
    onSuccess: () => {
      toast.info("Post deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.invalidateQueries({ queryKey: ["threads" + thread.id] });
      navigate({
        to: "/posts",
      });
    },
    onError: (error: any) => {
      toast.error(
        `Failed to delete post: ${error.response?.data?.message || error.message}`
      );
    },
  });

  function handleDelete(thread_id: number) {
    deleteThread.mutate(thread_id);
  }

  return (
    <div className="flex flex-row">
      <li
        key={thread.id}
        className="flex-grow flex flex-row p-4 bg-black text-white shadow rounded-2xl border-white border-2 max-w-full overflow-auto"
      >
        <div className="flex flex-col items-center">
          <button
            className={
              `transition-colors ` +
              (thread.vote.find((v) => v.user_id === user)?.value === 1
                ? "text-green-400"
                : "text-gray-400 hover:text-green-400")
            }
            aria-label="Upvote"
            onClick={(e) => {
              e.stopPropagation();
              handleVote(thread.id, "upvote");
            }}
          >
            <ArrowUp />
          </button>
          <span
            className={
              "font-semibold my-1 text-xs " +
              (voteCount > 0
                ? "text-green-400"
                : voteCount < 0
                  ? "text-red-400"
                  : "text-white")
            }
          >
            {voteCount}
          </span>
          <button
            className={
              `transition-colors ` +
              (thread.vote.find((v) => v.user_id === user)?.value === -1
                ? "text-red-400"
                : "text-gray-400 hover:text-red-400")
            }
            aria-label="Downvote"
            onClick={(e) => {
              e.stopPropagation();
              handleVote(thread.id, "downvote");
            }}
          >
            <ArrowDown />
          </button>
        </div>
        <div className="flex-1 ml-4">
          <div className="flex justify-between items-center mb-2">
            <div
              className="font-bold text-xl hover:text-blue-400 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                navigate({
                  to: `/posts/${thread.id}`,
                });
              }}
            >
              {thread.title}
            </div>
            <div>
              {new Date(thread.created_at)
                .toLocaleString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                .replace(/(\d+)(,)/, (_match, day, _comma) => {
                  const j = day % 10,
                    k = day % 100;
                  const suffix =
                    j === 1 && k !== 11
                      ? "st"
                      : j === 2 && k !== 12
                        ? "nd"
                        : j === 3 && k !== 13
                          ? "rd"
                          : "th";
                  return `${day}${suffix},`;
                })}
            </div>
          </div>
          <div className="flex flex-col lg:flex-row">
            <div
              className={`break-all whitespace-pre-line text-white mb-2 ${
                thread.attachment ? "lg:w-2/3 w-full" : "w-full"
              }`}
            >
              {thread.content}
            </div>
            <div>
              {thread.attachment && (
                <FilePreview attachment={thread.attachment} />
              )}
            </div>
          </div>
        </div>
      </li>
      <div>
        <Trash
          className="hover:text-red-600 cursor-pointer"
          onClick={() => handleDelete(thread.id)}
        />
      </div>
    </div>
  );
}
