import { useLocale, useTranslations } from "next-intl";
// import LocaleSwitcherSelect from './LocaleSwitcherSelect';
import LocaleSwitcherSelect from "./LocaleSwitcherSelector";

export default function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();

  return (
    <LocaleSwitcherSelect
      defaultValue={locale}
      items={[
        {
          value: "en",
          label: t("en"),
        },
        {
          value: "fr",
          label: t("fr"),
        },
        {
          value: "ar",
          label: t("ar"),
        },
         {
          value: "ms",
          label: t("ms"),
        },
         {
          value: "vi",
          label: t("vi"),
        },
        {
          value: "hi",
          label: t("hi"),
        },
        {
          value: "te",
          label: t("te"),
        }
      ]}
      label={t("label")}
    />
  );
}
