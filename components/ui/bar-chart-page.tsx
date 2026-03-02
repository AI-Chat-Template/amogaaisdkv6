"use client";

import { useState } from "react";
import { BarChartCard } from "./bar-chart-card";

const initialBarCardConfig = {
  title: "Exciting New Product",
  description:
    "Discover our latest innovation that will revolutionize your daily life.",
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

interface BarChartSocialPage {
  title: string;
  description: string;
  value: any;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
}

export default function BarChartPage({
  title,
  description,
  value,
  onTitleChange,
  onDescriptionChange,
}: BarChartSocialPage) {
  const [mediaCardConfig, setMediaCardConfig] = useState(initialBarCardConfig);

  return (
    <main className="min-h-screen bg-background p-8">
      <BarChartCard
        config={mediaCardConfig}
        title={title}
        description={description}
        value={value}
        onTitleChange={onTitleChange}
        onDescriptionChange={onDescriptionChange}
      />
    </main>
  );
}
