import type { Tables } from "@/types/database";

export const pageListStatuses = ["active", "inactive", "draft"] as const;

export type PageListStatus = (typeof pageListStatuses)[number];

export type PageList = Omit<Tables<"page_list">, "status"> & {
  status: PageListStatus;
};
