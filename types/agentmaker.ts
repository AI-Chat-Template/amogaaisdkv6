import { z } from "zod";

export type Unicorn = {
  id: number;
  company: string;
  valuation: number;
  date_joined: Date | null;
  country: string;
  city: string;
  industry: string;
  select_investors: string;
};

export type Result = Record<string, string | number>;

export const explanationSchema = z.object({
  section: z.string(),
  explanation: z.string(),
});
export const explanationsSchema = z.array(explanationSchema);

export type QueryExplanation = z.infer<typeof explanationSchema>;

// Define the schema for chart configuration
export const configSchema = z
  .object({
    description: z
      .string()
      .describe(
        "Describe the chart. What is it showing? What is interesting about the way the data is displayed?"
      ),
    takeaway: z.string().describe("What is the main takeaway from the chart?"),
    type: z
      .enum([
        "bar",
        "line",
        "area",
        "pie",
        // "Data Card Text",
        // "Data Card Line Chart",
        // "Data Card Bar Chart",
        // "Data Card Bar Chart Horizontal",
        // "Data Card Donut Chart",
      ])
      .describe("Type of chart"),
    title: z.string(),
    xKey: z.string().describe("Key for x-axis or category"),
    yKeys: z
      .array(z.string())
      .describe(
        "Key(s) for y-axis values this is typically the quantitative column"
      ),
    multipleLines: z
      .boolean()
      .describe(
        "For line charts only: whether the chart is comparing groups of data."
      )
      .optional(),
    measurementColumn: z
      .string()
      .describe(
        "For line charts only: key for quantitative y-axis column to measure against (eg. values, counts etc.)"
      )
      .optional(),
    lineCategories: z
      .array(z.string())
      .describe(
        "For line charts only: Categories used to compare different lines or data series. Each category represents a distinct line in the chart."
      )
      .optional(),
    colors: z
      .record(
        z.string().describe("Any of the yKeys"),
        z.string().describe("Color value in CSS format (e.g., hex, rgb, hsl)")
      )
      .describe("Mapping of data keys to color values for chart elements")
      .optional(),
    legend: z.boolean().describe("Whether to show legend"),
  })
  .describe("Chart configuration object");

export type Config = z.infer<typeof configSchema>;

import { Icons } from "@/components/icons";
import * as Locales from "date-fns/locale";

export interface NavItem {
  title: string;
  href?: string;
  disabled?: boolean;
  external?: boolean;
  icon?: keyof typeof Icons;
  label?: string;
  description?: string;
}

export interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[];
}

export interface NavItemWithOptionalChildren extends NavItem {
  items?: NavItemWithChildren[];
}

export interface FooterItem {
  title: string;
  items: {
    title: string;
    href: string;
    external?: boolean;
  }[];
}

export type MainNavItem = NavItemWithOptionalChildren;

export type SidebarNavItem = NavItemWithChildren;

export type FormFieldType = {
  type: string;
  variant: string;
  name: string;
  variant_code?: string;
  validation_message?: string;
  label: string;
  placeholder?: string;
  description?: string;
  options?: string[];
  combobox?: string[];
  media_card_data?: {
    media_url?: string;
    card_type?: string;
    custom_html?: string;
    card_json?: string[];
    action_urls?: {
      like?: string;
      favorite?: string;
      task?: string;
      chat?: string;
      share?: string;
    };
    component_name?: string;
  };
  chat_with_data?: {
    buttons: [
      {
        button_text: string;
        prompt: string;
        api_response: string[];
        dataApi_response: string[];
        // response_data: string[];
        enable_api: boolean;
        enable_dataApi: boolean;
        enable_prompt: boolean;
        promptDataFilter: string;
        apiDataFilter: string;
        component_name?: string;
        metricApi?: string;
        metricApiEnabled?: boolean;
      }
    ];
  };
  multiselect?: string[];
  radiogroup?: string[];
  placeholder_file_url?: string;
  placeholder_video_url?: string;
  placeholder_file_upload_url?: string;
  placeholder_pdf_file_url?: string;
  disabled: boolean;
  value: string | boolean | Date | number | string[];
  setValue: (value: string | boolean) => void;
  checked: boolean;
  onChange: (
    value: string | string[] | boolean | Date | number | number[]
  ) => void;
  onSelect: (
    value: string | string[] | boolean | Date | number | number[]
  ) => void;
  rowIndex: number;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  locale?: keyof typeof Locales;
  hour12?: boolean;
  className?: string;
};

export type AgentFieldType = {
  type: string;
  variant: string;
  name: string;
  variant_code?: string;
  validation_message?: string;
  label: string;
  placeholder?: string;
  description?: string;
  options?: string[];
  combobox?: string[];
  use_settings_upload?: boolean;
  media_card_data?: {
    media_url?: string;
    card_type?: string;
    custom_html?: string;
    card_json?: string[];
    use_upload?: boolean;
    action_urls?: {
      like?: string;
      favorite?: string;
      task?: string;
      chat?: string;
      share?: string;
    };
    component_name?: string;
  };
  chat_with_data?: {
    buttons: [
      {
        button_text: string;
        prompt: string;
        api_response: string[];
        dataApi_response: string[];
        // response_data: string[];
        enable_api: boolean;
        enable_dataApi: boolean;
        enable_prompt: boolean;
        promptDataFilter: string;
        apiDataFilter: string;
        component_name?: string;
        metricApi?: string;
        metricApiEnabled?: boolean;
        storyApiEnabled?: boolean;
        storyName?: string;
        storyCode?: string;
      }
    ];
  };
  multiselect?: string[];
  radiogroup?: string[];
  placeholder_file_url?: string;
  placeholder_video_url?: string;
  placeholder_file_upload_url?: string;
  placeholder_pdf_file_url?: string;
  disabled: boolean;
  value: string | boolean | Date | number | string[];
  setValue: (value: string | boolean) => void;
  checked: boolean;
  onChange: (
    value: string | string[] | boolean | Date | number | number[]
  ) => void;
  onSelect: (
    value: string | string[] | boolean | Date | number | number[]
  ) => void;
  rowIndex: number;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  locale?: keyof typeof Locales;
  hour12?: boolean;
  className?: string;
};

export type FieldType = { name: string; index?: number };

export type DocFieldType = { name: string; isNew: boolean; index?: number };
