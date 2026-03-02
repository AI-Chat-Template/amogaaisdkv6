/* eslint-disable @typescript-eslint/no-explicit-any */
import { FieldType } from "@/types/agentmaker";

export const fieldTypes: FieldType[] = [
  { name: "Label" },
  { name: "Text Area" },
  { name: "Text Box" },
  { name: "Numeric Text Box" },
  { name: "Currency Text Box" },
  { name: "Date" },
  { name: "Start Time and End Time" },
  { name: "Email" },
  { name: "Phone" },
  { name: "Country and state" },
  { name: "Text Box with Image" },
  { name: "Options" },
  { name: "Options with Image" },
  { name: "Image" },
  { name: "Ratings" },
  { name: "Slider" },
  { name: "File Upload" },
  { name: "Switch" },
  { name: "Rich Text Editor" },
];

export const defaultFieldConfig: Record<
  string,
  { label: string; description: string; placeholder?: any }
> = {
  Label: {
    label: "Welcome to Agent Maker",
    description: "Modify the label based on need",
  },
  "Text Area": {
    label: "Text Area",
    description: "Enter text.",
  },
  Image: {
    label: "Select Image",
    description: "Upload your profile picture",
  },

  "File Upload": {
    label: "Select File",
    description: "Select a file to upload.",
  },
  "Image Upload": {
    label: "Select Image",
    description: "Upload your profile picture.",
  },
  "Text Box": {
    label: "Text Box",
    description: "",
    placeholder: "Text Box",
  },

  "Location Select": {
    label: "Select Country",
    description:
      "If your country has states, it will be appear after selecting country",
  },
};
