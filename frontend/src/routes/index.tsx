import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/utils";
export const Route = createFileRoute("/")({
  component: Index,
});

interface Thread {
  id: number;
  user_id: number;
  title: string;
  content: string;
  created_at: Date;
  updated_at: Date;
  category: string;
  tags: string[];
  summary: string;
}

function Index() {
  // Access the client
  const threadsQuery = useQuery<Thread[]>({
    queryKey: ["threads"],
    queryFn: async (): Promise<Thread[]> => {
      const response = await apiClient.get<Thread[]>("/threads");
      return response.data;
    },
  });

  const threads = threadsQuery.data ?? [];

  return (
    <div className="p-10 min-w-1/2 max-w-1/2">
      {threads.length === 0 ? (
        <div className="text-white text-lg">
          No threads available. Start a new discussion!
        </div>
      ) : (
        <ul className="space-y-6">
          {threads.map((thread) => (
            <li
              key={thread.id}
              className="flex flex-row p-4 bg-black text-white shadow rounded-2xl border-white border-2 hover:bg-gray-800 transition-colors duration-200 hover:cursor-pointer"
            >
              <div className="flex flex-col items-center">
                <button
                  className="text-gray-400 hover:text-green-400 transition-colors"
                  aria-label="Upvote"
                  // onClick={() => handleUpvote(thread.id)}
                  disabled
                >
                  ▲
                </button>
                <span className="text-white font-semibold my-1 text-xs">0</span>
                <button
                  className="text-gray-400 hover:text-red-400 transition-colors"
                  aria-label="Downvote"
                  // onClick={() => handleDownvote(thread.id)}
                  disabled
                >
                  ▼
                </button>
              </div>
              <div className="flex-1 ml-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-bold text-xl">{thread.title}</div>
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
                      .replace(/(\d+)(,)/, (match, day, comma) => {
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
                <div>{thread.content}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
