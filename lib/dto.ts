import { Tables } from "@/types/database";
import "server-only";

export function getUserSessionDTO(data: Tables<"user_catalog">) {
  return {
    user_catalog_id: data?.user_catalog_id,
    status: data?.status,
    first_name: data?.first_name,
    last_name: data?.last_name,
    gender: data?.gender,
    user_email: data?.user_email,
    user_mobile: data?.user_mobile,
    user_name: data?.user_name,
    avatar_url: data?.avatar_url,
    profile_pic_url: data?.profile_pic_url,
    profile_url: data?.profile_url,
    roles: data?.roles,
    roles_json: (data?.roles_json as string[]) ?? [],
    for_business_name: data?.for_business_name,
    for_business_number: data?.for_business_number,
    business_name: data?.business_name,
    business_number: data?.business_number,
    app_name: data?.app_name,
    emailverify: data?.emailverify,
    mobileverify: data?.mobileverify,
    whatsappverify: data?.whatsappverify,
  };
}
