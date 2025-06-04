import { useState } from "react";
import { useAuth } from "../AuthProvider";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useQueryClient } from "@tanstack/react-query";

export default function SignupDialog() {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [organization, setOrganization] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  const { signup } = useAuth();
  const queryClient = useQueryClient();

  const handleSignup = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }
    setError(null);
    signup({ username, email, organization, password });
    queryClient.invalidateQueries({ queryKey: ["user"] });
    setUsername("");
    setPassword("");
    setEmail("");
    setOrganization("");
    setOpen(false);
  };

  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value);
  };
  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };
  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };
  const handleOrganizationChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setOrganization(event.target.value);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Register</Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-800 text-white" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Register</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSignup} className="grid gap-4">
          {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="user">Username*</Label>
              <Input
                id="user"
                name="username"
                onChange={handleUsernameChange}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" onChange={handleEmailChange} />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                name="organization"
                onChange={handleOrganizationChange}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="password">Password*</Label>
              <Input
                id="password"
                name="password"
                className="border-2 border-white p-2"
                onChange={handlePasswordChange}
                type="password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Signup</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
