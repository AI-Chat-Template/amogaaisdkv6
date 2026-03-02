import { Main } from "@/components/layout/main";
import { postgrest } from "@/lib/postgrest";
import ClientRoleMenu from "./client";
import { auth } from "@/auth";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server"; 

export const metadata = async () => {
  const t = await getTranslations("RoleMenu"); 
  return {
    title: t("title"),
  };
};


export default async function RoleMenu() {
  const session = await auth();
  
  if (!session) return <div>Not authenticated</div>;
  const { data: pages_list } = await postgrest.from("page_list").select("*").eq("status", "active");
  const t = await getTranslations("RoleMenu");
  return (
    <>
      <Main fixed>
        <div>
          <p className="text-muted-foreground pl-1">{t("description")}</p>
        </div>
        <ClientRoleMenu
          pages_list={
            pages_list?.filter((page) => {
              if (!page?.role_json && !Array.isArray(page.role_json)) {
                return false;
              }

              return (
                page?.role_json &&
                page.role_json.some((role: string) =>
                  session?.user?.roles_json?.includes(role)
                )
              );
            }) || []
          }
        />
      </Main>
    </>
  );
}
