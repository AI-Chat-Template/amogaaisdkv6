import type { Tables } from "@/types/database";

export const dataGroupStatuses = ["active", "inactive", "draft"] as const;

export type DataGroupStatus = (typeof dataGroupStatuses)[number];

export type DataGroup = Omit<Tables<"data_group">, "status"> & {
  status: DataGroupStatus;
};
