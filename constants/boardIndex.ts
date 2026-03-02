/* eslint-disable @typescript-eslint/no-explicit-any */
import { FieldType } from "@/types/agentmaker";

export const fieldTypes: FieldType[] = [
  { name: "Chat with Data JSON", isNew: false },
];

export const defaultFieldConfig: Record<
  string,
  { label: string; description: string; placeholder?: any }
> = {
  "Check Box": {
    label: "Check Box",
    description:
      "You can manage your mobile notifications in the mobile settings page.",
  },

  "Radio Group": {
    label: "Radio Group",
    description:
      "You can manage your mobile notifications in the mobile settings page.",
  },
  Badge: {
    label: "Badge",
    description: "Select from the options below.",
  },
  Progress: {
    label: "Progress",
    description: "Select from the options below.",
  },
  "Search Lookup": {
    label: "Choose your framework",
    description: "Select from the options below.",
  },
  "Tab Seperator": {
    label: "Select your framework",
    description: "Select from the options below.",
  },
  Combobox: {
    label: "Combobox",
    description: "This is the language that will be used in the dashboard.",
  },
  Date: {
    label: "Date",
    description: "Your date of birth is used to calculate your age.",
  },
  "Date Time": {
    label: "Date Time",
    description: "Add the date of submission with detailly.",
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
  Email: {
    label: "Email",
    description: "",
    placeholder: "Email Address",
  },
  OTP: {
    label: "One-Time Password",
    description: "Please enter the one-time password sent to your phone.",
  },
  "Location Select": {
    label: "Select Country",
    description:
      "If your country has states, it will be appear after selecting country",
  },
  "Multi Select": {
    label: "Multi Select",
    description: "Select multiple options.",
  },
  Dropdown: {
    label: "Dropdown",
    description: "You can manage email addresses in your email settings.",
    placeholder: "Select a verified email to display",
  },
  Slider: {
    label: "Slider",
    description: "Adjust the price by sliding.",
  },
  "Signature Input": {
    label: "Sign here",
    description: "Please provide your signature above",
  },
  "Smart Datetime Input": {
    label: "What's the best time for you?",
    description: "Please select the full time",
  },
  Switch: {
    label: "Switch",
    description: "Receive emails about new products, features, and more.",
  },
  "Tags Input": { label: "Enter your tech stack.", description: "Add tags." },
  "Text Area": {
    label: "Text Area",
    description: "",
  },
  Password: {
    label: "Password",
    description: "Enter your password.",
  },
  Number: {
    label: "Number",
    description: "Enter your Number.",
  },
  Mobile: {
    label: "Phone number",
    description: "Enter your phone number.",
  },
};
