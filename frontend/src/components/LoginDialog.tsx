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

export default function LoginDialog() {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const { login } = useAuth();

  const handleLogin = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    login({ username, password });
  };

  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value);
  };
  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Login</Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-800 text-white" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Login</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleLogin} className="grid gap-4">
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="user">User</Label>
              <Input
                id="user"
                name="username"
                onChange={handleUsernameChange}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="password">Password</Label>
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
            <Button type="submit" onClick={handleLogin}>
              Login
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
