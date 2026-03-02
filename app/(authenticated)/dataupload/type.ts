import type { Tables } from "@/types/database";

export type DataUpload = Omit<Tables<"data_upload">, "status"> & {
  status: DataUploadStatus;
};

export type DataUploadStatus = "active" | "inactive" | "canceled";
export const DataUploadStatuses: [DataUploadStatus, ...DataUploadStatus[]] = [
  "active",
  "inactive",
  "canceled",
];

export interface DataUploadActions {
  data_upload_uuid: string;
  status: DataUploadStatus;
  created_date: Date;
  updated_date?: Date;
  file_name?: string;
  file_url?: string;
}

export type NewDataUpload = Omit<
  DataUploadActions,
  "created_date" | "updated_date"
>;

export type DataUploads = DataUpload[];
