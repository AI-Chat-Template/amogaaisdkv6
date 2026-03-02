import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";
import * as z from "zod";

import { getFiltersStateParser, getSortingStateParser } from "@/lib/parsers";

interface DataRow {
  [key: string]: string | number | boolean | null;
}

export const searchParamsCache = createSearchParamsCache({
  flags: parseAsArrayOf(z.enum(["advancedTable", "floatingBar"])).withDefault(
    []
  ),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(12),
  sort: getSortingStateParser<DataRow>().withDefault([
    { id: "created_date", desc: true },
  ]),
  search: parseAsString.withDefault(""),
  from: parseAsString.withDefault(""),
  to: parseAsString.withDefault(""),
  // advanced filter
  filters: getFiltersStateParser().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
  tableName: parseAsString.withDefault(""),
  dataUploadUuid: parseAsString.withDefault(""),
  templateFields: parseAsArrayOf(z.string()).withDefault([]),
});

export type GetDataUploadsSchema = Awaited<
  ReturnType<typeof searchParamsCache.parse>
>;
