import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { apiClient } from "../lib/client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export default function CreatePostDialog() {
  const [postContent, setPostContent] = useState<string>("");
  const [postTitle, setPostTitle] = useState<string>("");
  const [postDialogOpen, setPostDialogOpen] = useState<boolean>(false);
  const [attachmentType, setAttachmentType] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

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
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });

  const fileUpload = useMutation({
    mutationFn: ({ file, thread_id }: { file: File; thread_id: number }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("thread_id", thread_id.toString());
      return apiClient.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: (response) => {
      console.log("File uploaded successfully:", response.data);
      // Handle successful file upload if needed
    },
    onError: (error) => {
      console.error("File upload failed:", error);
      // Handle file upload error if needed
    },
  });

  const handlePostCreate = async (event: {
    preventDefault: () => void;
    currentTarget: HTMLFormElement | undefined;
  }) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const post = await mutation.mutateAsync({ postTitle, postContent });
    if (file) {
      await fileUpload.mutateAsync({
        file: formData.get("attachmentFile") as File,
        thread_id: post.data.id,
      });
    }

    setPostContent("");
    setPostTitle("");
    setPostDialogOpen(false);
    setFile(null);
    setAttachmentType("");
    navigate({
      to: `/posts/${post.data.id}`,
    });
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
            <Select
              onValueChange={(value) => {
                setAttachmentType(value);
              }}
            >
              <Label htmlFor="attachment">Attachment</Label>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="filetype" />
              </SelectTrigger>
              <SelectContent id="attachment">
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="model">.GLB/.GLTF file</SelectItem>
              </SelectContent>
            </Select>
            {attachmentType === "url" && (
              <div className="grid gap-3">
                <Label htmlFor="attachmentUrl">Attachment URL</Label>
                <Input
                  type="text"
                  id="attachmentUrl"
                  name="attachmentUrl"
                  placeholder="https://example.com/news-article"
                />
              </div>
            )}
            {attachmentType === "model" && (
              <div className="grid gap-3 p-4 rounded-lg bg-gray-700 border border-gray-600">
                <Label
                  htmlFor="attachmentFile"
                  className="text-white font-semibold"
                >
                  Upload 3D Model (.glb, .gltf)
                </Label>
                <Input
                  type="file"
                  id="attachmentFile"
                  name="attachmentFile"
                  accept=".glb,.gltf,.stl"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setFile(file);
                  }}
                />
                <label
                  htmlFor="attachmentFile"
                  className="inline-block cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium text-center"
                >
                  Choose 3D Model File
                </label>
                <span className="text-xs text-gray-300">
                  Only .glb or .gltf files are supported. Max size: 25MB.
                </span>
                {file && (
                  <span className="text-sm text-green-400">
                    Selected file: {file.name} ({(file.size / 1024).toFixed(2)}{" "}
                    KB)
                  </span>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit">Create post</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
