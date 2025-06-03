import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { apiClient } from "../lib/utils";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useNavigate } from "@tanstack/react-router";

export default function CreatePostDialog() {
  const [postContent, setPostContent] = useState<string>("");
  const [postTitle, setPostTitle] = useState<string>("");
  const [postDialogOpen, setPostDialogOpen] = useState<boolean>(false);

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: ({
      postTitle,
      postContent,
    }: {
      postTitle: string;
      postContent: string;
    }) => {
      return apiClient.post("/thread", {
        title: postTitle,
        content: postContent,
      });
    },
    onSuccess: (response) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      setPostContent("");
      setPostTitle("");
      setPostDialogOpen(false);
      navigate({
        to: `/posts/${response.data.id}`,
      });
    },
  });

  const handlePostCreate = (event: {
    preventDefault: () => void;
    currentTarget: HTMLFormElement | undefined;
  }) => {
    event.preventDefault();
    console.log("event.target:", event.currentTarget);
    const formData = new FormData(event.currentTarget);
    console.log("Form Data:", formData);
    mutation.mutate({ postTitle, postContent });
  };

  const handleContentChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setPostContent(event.target.value);
  };
  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPostTitle(event.target.value);
  };

  return (
    <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> Create Post
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-800 text-white" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
          <DialogDescription>
            Create a new post to share with the community.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handlePostCreate} className="grid gap-4">
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="title">Title</Label>
              <Input
                type="text"
                id="title"
                name="title"
                onChange={handleTitleChange}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                name="content"
                className="border-2 border-white p-2"
                rows={9}
                onChange={handleContentChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Create post</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
