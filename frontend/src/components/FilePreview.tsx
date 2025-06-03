import { ModelLoader } from "./ModelLoader";
import type { IAttachment } from "./Post";
import { Button } from "./ui/button";

export function FilePreview({ attachment }: { attachment: IAttachment }) {
  return (
    <div className="flex flex-col items-center">
      <ModelLoader url={"/" + attachment.file_url} />
      <Button className="mt-2 bg-blue-600 hover:bg-blue-800">
        Generate Render
      </Button>
    </div>
  );
}
