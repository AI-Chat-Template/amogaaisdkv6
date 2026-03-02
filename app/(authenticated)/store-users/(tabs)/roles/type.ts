import type { Tables } from "@/types/database";

export const roleListStatuses = ["active", "inactive", "draft"] as const;

export type RoleListStatus = (typeof roleListStatuses)[number];

export type RoleList = Omit<Tables<"role_list">, "status"> & {
  status: RoleListStatus;
};
