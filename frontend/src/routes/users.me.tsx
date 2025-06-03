import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { apiClient } from "../lib/client";
import type { IUser } from "../components/Comment";
import { useAuth } from "../AuthProvider";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useState } from "react";

export const Route = createFileRoute("/users/me")({
  component: RouteComponent,
});

function RouteComponent() {
  const [organization, setOrganization] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const { user } = useAuth();
  const userInfo = useQuery<IUser>({
    queryKey: ["user"],
    enabled: !!user,
    queryFn: async (): Promise<IUser> => {
      const response = await apiClient.get(`/users/${user}`);
      return response.data;
    },
  });

  const handleOrgChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOrganization(event.target.value);
  };
  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization) {
      return;
    }
    try {
      await apiClient.put(`/users/${user}`, { organization });
      userInfo.refetch();
    } catch (error) {
      console.error("Failed to update organization:", error);
    }
    setOpen(false);
  };
  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 rounded-lg shadow-md">
        <p className="text-center text-gray-500">
          Please log in to view your profile.
        </p>
      </div>
    );
  }
  return (
    <div className="max-w-md mx-auto mt-8 p-6 rounded-lg shadow-md">
      <table className="w-full border-collapse">
        <tbody>
          <tr className="mb-2">
            <th className="text-left p-2 w-2/5 font-medium">Username</th>
            <td className="p-2">{userInfo.data?.username}</td>
          </tr>
          <tr className="mb-2">
            <th className="text-left p-2 font-medium">Email</th>
            <td className="p-2">{userInfo.data?.email}</td>
          </tr>
          <tr className="mb-2">
            <th className="text-left p-2 font-medium">Role</th>
            <td className="p-2">{userInfo.data?.role}</td>
          </tr>

          <tr>
            <th className="text-left p-2 font-medium">Organization</th>
            <td className="p-2">{userInfo.data?.organization}</td>
          </tr>
        </tbody>
      </table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="bg-blue-800">Change Org</Button>
        </DialogTrigger>
        <DialogContent className="bg-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Change Org</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="grid gap-4">
            <div className="grid gap-4">
              <div className="grid gap-3">
                <Label htmlFor="user">Organization Name</Label>
                <Input
                  id="organization"
                  name="organization"
                  onChange={handleOrgChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Update</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
