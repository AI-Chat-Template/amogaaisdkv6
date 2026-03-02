"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Share, Bookmark, MoreHorizontal, Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname } from "next/navigation";

interface MediaCardProps {
  title: string;
  description: string;
  value: any;
  onMediaChange: (media: { url: string; name: string }) => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
}

export function MediaCard({
  title,
  description,
  value,
  onMediaChange,
  onTitleChange,
  onDescriptionChange,
}: MediaCardProps) {
  const [customHtml, setCustomHtml] = useState(
    '<p class="text-sm">This is <strong>custom HTML</strong> content.</p>'
  );
  const [mediaSource, setMediaSource] = useState<string | null>(
    value?.url || null
  );
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [mediaFileName, setMediaFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const path = usePathname();

  const currentPath = path.includes("submit");

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Upload file to server
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/agent-maker/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const data = await response.json();
      const fileUrl = data.url;

      setMediaSource(fileUrl);
      onMediaChange({ url: fileUrl, name: file.name });
    } catch (error) {
      console.error("File upload error:", error);
      alert("Failed to upload file. Please try again.");
    }
  };

  const handleLinkChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    if (url.match(/\.(jpeg|jpg|png|gif|webp|mp4|webm|ogg)$/i)) {
      setMediaSource(url);
      setMediaFileName(""); // Clear file name for URL input
      onMediaChange({ url: url, name: "" }); // Update parent JSON
    } else {
      alert("Please enter a valid image or video URL");
    }
  };

  return (
    <div className="space-y-4">
      {!currentPath && (
        <>
          <div className="space-y-2">
            <Label htmlFor="title-input">Title</Label>
            <Input
              id="title-input"
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description-input">Description</Label>
            <Input
              id="description-input"
              type="text"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
            />
          </div>
        </>
      )}
      <Card className="w-full max-w-sm mx-auto overflow-hidden">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          <div className="relative w-full aspect-video bg-muted">
            {mediaSource ? (
              mediaType === "image" ? (
                <Image
                  src={mediaSource}
                  alt="Uploaded media"
                  fill
                  style={{ objectFit: "cover" }}
                  onError={() => setMediaSource(null)} // Handle invalid image
                />
              ) : (
                <video
                  src={mediaSource}
                  controls
                  className="w-full h-full"
                  onError={() => setMediaSource(null)} // Handle invalid video
                >
                  Your browser does not support the video tag.
                </video>
              )
            ) : (
              <div className="flex items-center justify-center h-full text-muted">
                Upload an image or video to preview
              </div>
            )}
          </div>
          <div
            className="px-6 py-2 prose prose-sm max-w-none break-words"
            style={{
              width: "100%",
              overflowWrap: "break-word",
              wordWrap: "break-word",
              hyphens: "auto",
            }}
            dangerouslySetInnerHTML={{ __html: customHtml }}
          />
        </CardContent>
        <CardFooter className="flex justify-between pb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => console.log("Liked")}
          >
            <Heart className="h-4 w-4" />
            <span className="sr-only">Like</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => console.log("Shared")}
          >
            <Share className="h-4 w-4" />
            <span className="sr-only">Share</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => console.log("Bookmarked")}
          >
            <Bookmark className="h-4 w-4" />
            <span className="sr-only">Bookmark</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top">
              <DropdownMenuItem onClick={() => console.log("Link 1 clicked")}>
                Link 1
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log("Link 2 clicked")}>
                Link 2
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>
      {!currentPath && (
        <div className="w-full max-w-sm mx-auto space-y-4">
          <div className="space-y-2">
            <Label htmlFor="media-upload">Upload Image or Video</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="media-upload"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
              <Input
                type="text"
                placeholder="Or enter media URL"
                onChange={handleLinkChange}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-html">Custom HTML</Label>
            <Textarea
              id="custom-html"
              value={customHtml}
              onChange={(e) => setCustomHtml(e.target.value)}
              placeholder="Enter custom HTML here"
              rows={4}
            />
          </div>
        </div>
      )}
    </div>
  );
}
