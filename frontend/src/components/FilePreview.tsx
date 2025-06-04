import { useMutation } from "@tanstack/react-query";
import { ModelLoader } from "./ModelLoader";
import type { IAttachment } from "./Post";
import { Button } from "./ui/button";
import { BASE_URL, apiClient } from "../lib/client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
} from "./ui/dialog";
import { TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Tooltip } from "@radix-ui/react-tooltip";

export function FilePreview({ attachment }: { attachment: IAttachment }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const filename = attachment.file_url.split("/").pop() || "file";

  const download = useMutation({
    mutationFn: async () => {
      const response = await apiClient.get(`/file/${filename}`);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
  });

  const handleDownload = () => {
    download.mutate();
  };

  const renderMut = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(
        `/render/${attachment.id}`,
        {},
        {
          timeout: 120000,
          responseType: "blob",
        }
      );
      return res.data;
    },
    onSuccess: (blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      setImageUrl(url);
      setOpen(true);
    },
  });

  const handleRender = async () => {
    renderMut.mutate();
  };

  return (
    <div className="flex flex-col items-center">
      <ModelLoader url={`${BASE_URL}/file/${filename}`} />
      <div className="flex flex-row gap-2 text-sm">
        <Button
          className="mt-2 bg-blue-600 hover:bg-blue-800"
          onClick={() => handleDownload()}
        >
          Download
        </Button>
        <Button
          className="mt-2 bg-blue-600 hover:bg-blue-800"
          onClick={() => handleRender()}
          disabled={
            attachment.file_type.toLowerCase() !== "stl" || renderMut.isPending
          } // Only enable for STL files
        >
          {attachment.file_type.toLowerCase() === "stl"
            ? renderMut.isPending
              ? "Loading..."
              : "Render"
            : "Only for .stl"}
        </Button>
        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setImageUrl(null);
            }
          }}
        >
          <DialogContent showCloseButton={false} className="bg-gray-800">
            <DialogHeader>
              <DialogDescription>
                This image is generated using AI from your 3D model input.
              </DialogDescription>
            </DialogHeader>
            {renderMut.isError && (
              <p className="text-red-600">Failed to generate image.</p>
            )}

            {imageUrl && (
              <img src={imageUrl} alt="Rendered" className="mt-2 max-w-full" />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
