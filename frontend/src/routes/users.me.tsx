import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/users/me")({
  component: RouteComponent,
});

function RouteComponent() {
  //   const user = useQuery<object>({
  //     queryKey: ["user"],
  //     queryFn: async (): Promise<object> => {
  //       const response = await apiClient.get("/me");
  //       return response.data;
  //     },
  //   });
  return <div>Hello "/users/me"!</div>;
}
