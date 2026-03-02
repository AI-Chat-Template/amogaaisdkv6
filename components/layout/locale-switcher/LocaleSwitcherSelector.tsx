"use client";

import { useTransition } from "react";
import { Locale } from "@/i18n/config";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Globe } from "lucide-react";
import { setUserLocale } from "@/i18n/locale";

type Props = {
  defaultValue: string;
  items: Array<{ value: string; label: string }>;
  label: string;
};

export default function LocaleSwitcherSelect({ defaultValue, items }: Props) {
  const [isPending, startTransition] = useTransition();

  function onChange(value: string) {
    const locale = value as Locale;
    startTransition(() => {
      setUserLocale(locale);
    });
  }

  return (
    <div className="relative">
      <Select
        defaultValue={defaultValue}
        onValueChange={onChange}
        disabled={isPending}
      >
        <SelectTrigger className="h-8 border-secondary flex gap-2.5 text-xs outline-none transition-colors [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:hidden">
          <Globe className="flex" style={{ display: "flex" }} />
          <h1>{defaultValue.toUpperCase()}</h1>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
