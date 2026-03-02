"use client";

import { useState } from "react";
import { MediaCard } from "./media-social-card";

const initialMediaCardConfig = {
  title: "Exciting New Product",
  description:
    "Discover our latest innovation that will revolutionize your daily life.",
  mediaSource: "/placeholder.svg?height=180&width=320",
  mediaType: "image" as const,
  customCss: "",
  customHtml:
    '<p class="text-sm">This is <strong>custom HTML</strong> content.</p>',
  actions: [
    {
      icon: "Heart",
      label: "Like",
      onClick: "console.log('Liked')",
    },
    {
      icon: "Share",
      label: "Share",
      onClick: "console.log('Shared')",
    },
    {
      icon: "Bookmark",
      label: "Bookmark",
      onClick: "console.log('Bookmarked')",
    },
    {
      icon: "MoreHorizontal",
      label: "More options",
      onClick: "console.log('More options')",
    },
  ],
};

interface MediaSocialPage {
  title: string;
  description: string;
  value: any;
  onMediaChange: (media: { url: string; name: string }) => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
}

export default function Home({
  title,
  description,
  value,
  onMediaChange,
  onTitleChange,
  onDescriptionChange,
}: MediaSocialPage) {
  const [mediaCardConfig, setMediaCardConfig] = useState(
    initialMediaCardConfig
  );

  return (
    <main className="min-h-screen bg-background">
      <MediaCard
        config={mediaCardConfig}
        title={title}
        description={description}
        value={value}
        onMediaChange={onMediaChange}
        onTitleChange={onTitleChange}
        onDescriptionChange={onDescriptionChange}
      />
    </main>
  );
}
