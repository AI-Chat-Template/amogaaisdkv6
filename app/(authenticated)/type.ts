import type { Tables } from "@/types/database";

export const finalBomStatuses = ["active", "inactive", "draft"] as const;

export type FinalBomStatus = (typeof finalBomStatuses)[number];

export type FinalBom = Omit<Tables<"final_bom">, "status"> & {
  status: FinalBomStatus;
};
