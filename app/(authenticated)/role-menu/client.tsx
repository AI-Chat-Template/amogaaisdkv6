"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ArrowDownZA,
  ArrowUpAZ,
  SlidersHorizontal,
  SquareMenu,
} from "lucide-react";
import React from "react";
import Link from "next/link";
import { Tables } from "@/types/database";
import { useTranslations } from "next-intl";

export default function ClientRoleMenu({
  pages_list,
}: {
  pages_list: Tables<"page_list">[];
}) {
  const [sort, setSort] = useState("ascending");
  const [searchTerm, setSearchTerm] = useState("");
  const t = useTranslations("RoleMenu");
  const filteredApps = pages_list
    .sort((a, b) => {
      const aName = a?.page_name ?? "";
      const bName = b?.page_name ?? "";
      return sort === "ascending"
        ? aName.localeCompare(bName)
        : bName.localeCompare(aName);
    })
    .filter((page) =>
      page?.page_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <>
      <div className="my-4 flex items-end justify-between md:my-0 sm:items-center pl-1">
        <div className="flex flex-col gap-4 sm:my-4 sm:flex-row">
          <Input
            placeholder={t("placeholder")}
            className="h-9 w-40 lg:w-[250px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-16">
            <SelectValue>
              <SlidersHorizontal size={18} />
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="ascending">
              <div className="flex items-center gap-4">
                <ArrowUpAZ size={16} />
                <span>{t("ascending")}</span>
              </div>
            </SelectItem>
            <SelectItem value="descending">
              <div className="flex items-center gap-4">
                <ArrowDownZA size={16} />
                <span>{t("descending")}</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Separator className="shadow" />
      
      <ul className="faded-bottom no-scrollbar grid gap-4 overflow-auto pb-16 pt-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredApps.map((page) => (
          <Link href={page.page_link || ""}  key={page.pagelist_id}>
            <li
              key={page.page_name}
              className="rounded-lg border p-4 "
            >
              <div className="mb-6 flex items-center justify-between">
                <div
                  className={`flex size-8 items-center justify-center rounded-lg  p-2`}
                >
                  <SquareMenu />
                </div>
              </div>
              <div>
                <h2 className="mb-1 text-sm">{page.page_name}</h2>
                <p className="line-clamp-2 text-gray-500">
                  {page.customtext_one}
                </p>
              </div>
            </li>
          </Link>
        ))}
      </ul>
    </>
  );
}
