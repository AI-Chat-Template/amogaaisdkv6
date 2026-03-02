"use client";
import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Heart,
  Share,
  Bookmark,
  MoreHorizontal,
  Upload,
  Link,
  Menu,
} from "lucide-react";
import { usePathname } from "next/navigation";

interface Action {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}

interface MediaCardConfig {
  title: string;
  description: string;
  mediaSource: string;
  mediaType: "image" | "video";
  customHtml: string;
  customCss: string;
  actions: Array<{
    icon: string;
    label: string;
    onClick: string;
  }>;
}

interface MediaCardProps {
  config: MediaCardConfig;
  title: string;
  description: string;
  value: any;
  onMediaChange: (media: { url: string; name: string }) => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
}

const iconMap: Record<string, React.ElementType> = {
  Heart,
  Share,
  Bookmark,
  MoreHorizontal,
};

export function MediaCard({
  config,
  title,
  description,
  value,
  onMediaChange,
  onTitleChange,
  onDescriptionChange,
}: MediaCardProps) {
  const [cardConfig, setCardConfig] = useState<MediaCardConfig>(config);
  const [imageUrl, setImageUrl] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [iconUrls, setIconUrls] = useState<Record<string, string>>({});
  const [customWidgetPreview, setCustomWidgetPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const path = usePathname();
  const currentPath = path.includes("submit");
  const [mediaSource, setMediaSource] = useState(config.mediaSource);
  const [mediaType, setMediaType] = useState(config.mediaType);
  const [customWidget, setCustomWidget] = useState(`
    // Example Button Widget
    function CustomButton({ label, onClick }) {
      return React.createElement(
        'button',
        {
          className: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors',
          onClick: onClick,
          type: 'button' // Ensures it won't act as a submit button
        },
        label
      );
    }
    
    function handleClick() {
      alert('Button clicked!!!!');
    }
    
    return React.createElement(
      'div',
      null,
      React.createElement(CustomButton, { label: 'Click me!', onClick: handleClick })
    );
  `);

  useEffect(() => {
    if (currentPath) {
      const savedImageUrl = localStorage.getItem("uploadedImageUrl");
      if (savedImageUrl) {
        setUploadedImageUrl(savedImageUrl);
        setCardConfig((prev) => ({
          ...prev,
          mediaSource: savedImageUrl,
          mediaType: "image",
        }));
      }
    }
  }, [currentPath]);

  useEffect(() => {
    if (currentPath) {
      const savedImageUrl = localStorage.getItem("uploadedImageUrl");
      const savedCustomHtml = localStorage.getItem("customHtml");
      const savedCustomWidget = localStorage.getItem("customWidget");

      if (savedImageUrl) {
        setUploadedImageUrl(savedImageUrl);
        setCardConfig((prev) => ({
          ...prev,
          mediaSource: savedImageUrl,
          mediaType: "image",
        }));
      }

      if (savedCustomHtml) {
        setCardConfig((prev) => ({
          ...prev,
          customHtml: savedCustomHtml,
        }));
      }

      if (savedCustomWidget) {
        setCustomWidget(savedCustomWidget);
      }
    }
  }, [currentPath]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/agent-maker/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      const uploadedUrl = data?.url;

      localStorage.setItem("uploadedImageUrl", uploadedUrl);

      setUploadedImageUrl(uploadedUrl);
      setCardConfig((prev) => ({
        ...prev,
        mediaSource: uploadedUrl,
        mediaType: "image",
      }));

      onMediaChange({ url: uploadedUrl, name: file.name });
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const handleMediaClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(event.target.value);
  };

  const handleImageUrlSubmit = async () => {
    if (imageUrl) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const formData = new FormData();
        formData.append("file", blob, "uploaded-image.jpg");

        const uploadResponse = await fetch("/api/agent-maker/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadResponse.ok) {
          throw new Error("Image upload failed.");
        }

        const data = await uploadResponse.json();
        console.log("data-----", data);
        const vercelBlobUrl = data.url;

        localStorage.setItem("uploadedImageUrl", vercelBlobUrl);

        setUploadedImageUrl(vercelBlobUrl);

        setCardConfig((prev) => ({
          ...prev,
          mediaSource: vercelBlobUrl,
          mediaType: "image",
        }));
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }
  };

  const handleCustomCssChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const cssValue = event.target.value;
      setCardConfig((prev) => ({
        ...prev,
        customCss: cssValue,
      }));
    },
    []
  );

  const handleCustomHtmlChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const htmlValue = event.target.value;
      setCardConfig((prev) => ({
        ...prev,
        customHtml: htmlValue,
      }));
      localStorage.setItem("customHtml", htmlValue);
    },
    []
  );

  const handleCustomWidgetChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const widgetValue = event.target.value;
      setCustomWidget(widgetValue);
      // Save to localStorage
      localStorage.setItem("customWidget", widgetValue);
    },
    []
  );

  const handlePreviewWidget = useCallback(() => {
    setCustomWidgetPreview(customWidget);
  }, [customWidget]);

  const handleIconUrlChange = useCallback((icon: string, value: string) => {
    setIconUrls((prev) => ({ ...prev, [icon]: value }));
  }, []);

  const actions: Action[] = useMemo(
    () =>
      config.actions.map((action) => ({
        icon: iconMap[action.icon],
        label: action.label,
        onClick: () => {
          console.log(`Action clicked: ${action.label}`);
        },
      })),
    [config.actions]
  );

  const executeCustomWidget = () => {
    try {
      // Create a new function that returns a React element
      const CustomWidget = new Function(
        "React",
        `
        const { useState } = React;
        return () => {
          ${customWidget}
        }
      `
      )(React);

      // Render the custom widget
      return <CustomWidget />;
    } catch (error) {
      console.error("Error executing custom widget:", error);
      return (
        <div>Error executing custom widget: {(error as Error).message}</div>
      );
    }
  };

  return (
    <div className="space-y-4 w-full max-w-sm mx-auto">
      <div className="space-y-2">
        <Label htmlFor="card-title">Card Title</Label>
        <Input
          id="card-title"
          type="text"
          readOnly={currentPath}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter card title"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="card-description">Card Description</Label>
        <Textarea
          id="card-description"
          value={description}
          readOnly={currentPath}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Enter card description"
          rows={2}
        />
      </div>
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          <div
            className="relative w-full aspect-video bg-muted cursor-pointer group"
            onClick={handleMediaClick}
          >
            {uploadedImageUrl ? (
              <Image
                src={uploadedImageUrl}
                alt="Uploaded media"
                fill
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span>No media available</span>
              </div>
            )}
            <div
              className={`${
                currentPath && "cursor-not-allowed"
              } absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity`}
            >
              <Upload className="w-12 h-12 text-white" />
            </div>
          </div>
          <Input
            type="file"
            disabled={currentPath}
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
          />
          {!currentPath && (
            <div className="px-6 flex items-center space-x-2">
              <Input
                type="text"
                placeholder="Enter image URL"
                value={imageUrl}
                onChange={handleImageUrlChange}
              />
              <Button onClick={handleImageUrlSubmit} size="icon">
                <Link className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div
            className="px-6 py-2 prose prose-sm max-w-none break-words"
            style={{
              width: "100%",
              overflowWrap: "break-word",
              wordWrap: "break-word",
              hyphens: "auto",
            }}
            dangerouslySetInnerHTML={{ __html: cardConfig.customHtml }}
          />
        </CardContent>
        <CardFooter className="flex justify-between pb-2">
          {actions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={index}
                variant="ghost"
                size="icon"
                onClick={(event) => {
                  event.preventDefault(); // Prevent form submission
                  action.onClick(); // Perform the intended action
                }}
                type="button"
              >
                <IconComponent className="h-4 w-4" />
                <span className="sr-only">{action.label}</span>
              </Button>
            );
          })}
        </CardFooter>
      </Card>
      {!currentPath && (
        <div className="space-y-2">
          <Label htmlFor="custom-html">Custom HTML</Label>
          <Textarea
            id="custom-html"
            value={cardConfig.customHtml}
            onChange={handleCustomHtmlChange}
            placeholder="Enter custom HTML here"
            rows={4}
          />
        </div>
      )}
      {!currentPath && (
        <div className="space-y-2">
          <Label htmlFor="icon-urls">Icon URLs</Label>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(iconMap).map(([key, Icon]) => (
              <div key={key} className="flex items-center space-x-2">
                <Icon className="w-6 h-6" />
                <Input
                  type="text"
                  placeholder={`${key} icon URL`}
                  value={iconUrls[key] || ""}
                  onChange={(e) => handleIconUrlChange(key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      {!currentPath && (
        <div className="space-y-2">
          <Label htmlFor="custom-css">Custom CSS</Label>
          <Textarea
            id="custom-css"
            value={cardConfig.customCss}
            onChange={handleCustomCssChange}
            placeholder="Enter custom CSS here"
            rows={4}
          />
        </div>
      )}
      {!currentPath && (
        <div className="space-y-2">
          <Label htmlFor="custom-widget">Custom Widget</Label>
          <Textarea
            id="custom-widget"
            value={customWidget}
            onChange={handleCustomWidgetChange}
            placeholder="Enter custom widget code here"
            rows={8}
          />
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Custom Widget Preview</CardTitle>
        </CardHeader>
        <CardContent>{executeCustomWidget()}</CardContent>
      </Card>
    </div>
  );
}
