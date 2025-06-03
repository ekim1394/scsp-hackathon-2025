import { Plus } from "lucide-react";
import { Input } from "../components/ui/input";
import { Button } from "./ui/button";
import { SidebarTrigger } from "./ui/sidebar";

export default function Header() {
  const handleClick = () => {
    // Handle the click event for creating a post
    console.log("Create Post button clicked");
  };

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
      <div>
        <Input
          placeholder="Search..."
          className="w-164 bg-gray-700 text-white"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch(e);
            }
          }}
        />
      </div>
      <div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleClick}
        >
          <Plus /> Create Post
        </Button>
      </div>
    </header>
  );
}
