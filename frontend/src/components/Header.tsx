import { useAuth } from "../AuthProvider";
import CreatePostDialog from "./CreatePostDialog";
import LoginDialog from "./LoginDialog";
import { Button } from "./ui/button";
import { SidebarTrigger } from "./ui/sidebar";

export default function Header() {
  const { user, logout } = useAuth();
  const handleSearch = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const query: string = (event.target as HTMLInputElement).value;
    console.log("Search query:", query);
  };

  return (
    <header className="flex flex-row items-center justify-between p-4 bg-gray-800 text-white z-10">
      <div className="flex flex-row items-center gap-4">
        <SidebarTrigger />
        <div>
          <img
            src="/logo.png"
            alt="Logo"
            className="inline-block h-8 w-8 mr-2 align-middle"
          />
          OpenUAV
        </div>
      </div>
      {/* <div className="flex flex-1 justify-center">
        <Input
          placeholder="Search..."
          className="w-200 bg-gray-700 text-white"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch(e);
            }
          }}
        />
      </div> */}
      <div>
        {user ? (
          <div className="flex flex-row items-center gap-2">
            <CreatePostDialog />
            <Button onClick={logout} style={{ cursor: "pointer" }}>
              Logout
            </Button>
          </div>
        ) : (
          <LoginDialog />
        )}
      </div>
    </header>
  );
}
