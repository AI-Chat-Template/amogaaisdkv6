import type { Tables } from "@/types/database";

export const contactStatuses = ["active", "inactive", "draft"] as const;

export type ContactStatus = (typeof contactStatuses)[number];

export type Contact = Omit<Tables<"user_catalog">, "status"> & {
  status: ContactStatus;
};
