import type { Tables } from "@/types/database";

export const dataGroupStatuses = ["active", "inactive", "draft"] as const;

export type DataGroupStatus = (typeof dataGroupStatuses)[number];

export type DataGroup = Omit<Tables<"data_upload_setup">, "status"> & {
  status: DataGroupStatus;
  template_file_fields_json: JSON;
  data_upload_group: string;
  template_name: string;
  data_upload_setup_id: number;
  data_table_name: string;
};
