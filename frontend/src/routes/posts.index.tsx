import { createFileRoute } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/client";
import type { IPost } from "../components/Post";
import Post from "../components/Post";
import React, { useEffect, useRef } from "react";
export const Route = createFileRoute("/posts/")({
  component: PostRouteComponent,
});

export function PostRouteComponent() {
  // Access the client
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery<IPost[]>({
    queryKey: ["threads"],
    queryFn: async (page): Promise<IPost[]> => {
      const response = await apiClient.get<IPost[]>("/threads", {
        params: { page: page.pageParam },
      });
      return response.data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 10 ? allPages.length : undefined;
    },
  });

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex flex-col p-4 lg:max-w-4xl w-full mx-auto">
      {data?.pages.length === 0 && (
        <div className="text-lg text-center">
          No threads available. Start a new discussion!
        </div>
      )}
      <ul className="space-y-6">
        {data?.pages.map((threads, index) => (
          <React.Fragment key={index}>
            {threads.map((thread) => (
              <Post key={thread.id} thread={thread} />
            ))}
          </React.Fragment>
        ))}
      </ul>
      <div ref={loadMoreRef} style={{ height: "1px" }} />
      {isFetchingNextPage && <p>Loading more...</p>}
    </div>
  );
}
