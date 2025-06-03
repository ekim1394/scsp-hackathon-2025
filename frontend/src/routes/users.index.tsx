import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { IUser } from "../components/Comment";
import { apiClient } from "../lib/client";
import { useAuth } from "../AuthProvider";

export const Route = createFileRoute("/users/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = useAuth();
  const users = useQuery<IUser[]>({
    queryKey: ["user"],
    queryFn: async (): Promise<IUser[]> => {
      const response = await apiClient.get(`/users`);
      return response.data;
    },
  });
  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 rounded-lg shadow-md">
        <p className="text-center text-gray-500">Please log in to view users</p>
      </div>
    );
  }
  return (
    <div className="m-8">
      {users.isLoading && <div>Loading...</div>}
      {users.error && <div>Error loading users.</div>}
      {users.data && (
        <table className="min-w-full border border-gray-300 border-collapse text-left">
          <thead>
            <tr className="bg-gray-600">
              <th className="border border-gray-300 px-4 py-2 text-left align-top">
                Name
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left align-top">
                Email
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left align-top">
                Organization
              </th>
            </tr>
          </thead>
          <tbody>
            {users.data.map((user) => (
              <tr key={user.id} className="align-top">
                <td className="border border-gray-300 px-4 py-2 align-top">
                  {user.username}
                </td>
                <td className="border border-gray-300 px-4 py-2 align-top">
                  {user.email}
                </td>
                <td className="border border-gray-300 px-4 py-2 align-top">
                  {user.organization}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
