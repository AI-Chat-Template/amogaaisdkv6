import { addDays, endOfDay, startOfDay } from "date-fns";
import type { Filter, JoinOperator } from "@/types";

export type SupabaseFilter = {
  column: string;
  operator: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
};

export function filterSupabase<T>({
  filters,
  joinOperator,
}: {
  filters: Filter<T>[];
  joinOperator: JoinOperator;
}): { filters: SupabaseFilter[]; joinOperator: JoinOperator } {
  const supabaseFilters: SupabaseFilter[] = filters
    .map((filter) => {
      const column = filter.id as string;

      switch (filter.operator) {
        case "eq":
          if (Array.isArray(filter.value)) {
            return {
              column,
              operator: "in",
              value: `(${filter.value.join(",")})`,
            };
          }
          if (filter.type === "date") {
            const date = new Date(filter.value);
            return [
              {
                column,
                operator: "gte",
                value: startOfDay(date).toISOString(),
              },
              { column, operator: "lte", value: endOfDay(date).toISOString() },
            ];
          }
          return { column, operator: "eq", value: filter.value };

        case "ne":
          return { column, operator: "neq", value: filter.value };

        case "iLike":
          return { column, operator: "ilike", value: `%${filter.value}%` };

        case "notILike":
          return { column, operator: "not.ilike", value: `%${filter.value}%` };

        case "lt":
          return { column, operator: "lt", value: filter.value };

        case "lte":
          return { column, operator: "lte", value: filter.value };

        case "gt":
          return { column, operator: "gt", value: filter.value };

        case "gte":
          return { column, operator: "gte", value: filter.value };

        case "isBetween":
          if (Array.isArray(filter.value) && filter.value.length === 2) {
            return [
              { column, operator: "gte", value: filter.value[0] },
              { column, operator: "lte", value: filter.value[1] },
            ];
          }
          throw new Error("isBetween requires an array with two values");

        case "isRelativeToToday":
          const days = Number(filter.value);
          if (isNaN(days))
            throw new Error("isRelativeToToday requires a number value");
          const today = new Date();
          return [
            {
              column,
              operator: "gte",
              value: startOfDay(addDays(today, days)).toISOString(),
            },
            {
              column,
              operator: "lte",
              value: endOfDay(addDays(today, days)).toISOString(),
            },
          ];

        case "isEmpty":
          return { column, operator: "is", value: null };

        case "isNotEmpty":
          return { column, operator: "not.is", value: null };

        default:
          throw new Error(`Unsupported operator: ${filter.operator}`);
      }
    })
    .flat();

  return { filters: supabaseFilters, joinOperator };
}
