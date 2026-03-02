"use server";
import { auth } from "@/auth";
import { Client } from "minio";

const minioClient = new Client({
  endPoint: process.env.MINIO_S3_URL ?? "",
  port: process.env.MINIO_S3_PORT
    ? Number(process.env.MINIO_S3_PORT)
    : undefined,
  useSSL: true,
  accessKey: process.env.MINIO_S3_ACCESS_KEY ?? "",
  secretKey: process.env.MINIO_S3_SECRET_KEY ?? "",
});

export async function listFolders(context?: string, subContext?: string) {
  const session = await auth();
  const business_number = session?.user?.business_number;
  const user_name = session?.user?.user_name;

  const bucket = process.env.MINIO_S3_BUCKET;
  if (!bucket) throw new Error("Bucket name is not configured.");

  const prefix = `${business_number}/${user_name}${
    context ? `/${context}` : ""
  }${subContext ? `/${subContext}/` : "/"}`;

  try {
    const items: Set<string> = new Set();
    const stream = minioClient.listObjectsV2(bucket, prefix, false);

    return new Promise<string[]>((resolve, reject) => {
      stream.on("data", (obj) => {
        if (obj.prefix) {
          const folderName = obj.prefix.replace(prefix, "").replace(/\/$/, "");
          if (folderName) {
            items.add(folderName);
          }
        }

        if (obj.name) {
          const relative = obj.name.replace(prefix, "");
          if (!relative) return;

          const parts = relative.split("/");
          if (parts.length > 1) {
            items.add(parts[0]);
          } else {
            items.add(relative);
          }
        }
      });

      stream.on("end", () => {
        const result = Array.from(items);
        resolve(result);
      });

      stream.on("error", (err) => {
        console.error("MinIO error:", err);
        reject(err);
      });
    });
  } catch (e) {
    console.error("Error listing folders/files:", e);
    throw e;
  }
}
