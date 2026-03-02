"use server";

// import { postgrest } from "@/lib/postgrest";
import { Pool } from "pg";

// export async function executeQuery(queryString: string) {
//   try {
//     // Parse the base query parts
//     const matches = queryString.match(
//       /from\("([^"]+)"\)\.select\("([^"]+)"(?:,\s*({[^}]+}))?\)/
//     );

//     if (!matches) {
//       throw new Error("Invalid query format");
//     }

//     const [, tableName, selectFields, options] = matches;
//     let query: any = postgrest.from(tableName);

//     // Add select with options if present
//     if (options) {
//       const parsedOptions = eval(`(${options})`);
//       query = query.select(selectFields, parsedOptions);
//     } else {
//       query = query.select(selectFields);
//     }

//     // Handle group by if present
//     const groupMatches = queryString.match(/\.group\("([^"]+)"\)/);
//     if (groupMatches) {
//       const [, groupBy] = groupMatches;
//       query = query.group(groupBy);
//     }

//     // Handle order by if present
//     const orderMatches = queryString.match(/\.order\("([^"]+)"\)/);
//     if (orderMatches) {
//       const [, orderBy] = orderMatches;
//       query = query.order(orderBy);
//     }

//     // Handle eq operators if present
//     const eqMatches = queryString.match(/\.eq\("([^"]+)","([^"]+)"\)/);
//     if (eqMatches) {
//       const [, column, value] = eqMatches;
//       query = query.eq(column, value);
//     }

//     const { data, error, count } = await query;
//     if (error) throw error;
//     return { data, count };
//   } catch (error) {
//     console.error("Error executing query:", error);
//     throw error;
//   }
// }

// export async function executeChartQuery(queryString: string) {
//   try {
//     // For pie chart query
//     if (queryString.includes('select("status")')) {
//       const tableMatch = queryString.match(/from\("([^"]+)"\)/);
//       if (tableMatch) {
//         const tableName = tableMatch[1];
//         const { data, error } = await postgrest
//           .from(tableName)
//           .select("status")
//           .then((result) => {
//             if (result.error) throw result.error;
//             // Group and count by status
//             const label = `${
//               tableName.charAt(0).toUpperCase() + tableName.slice(1)
//             } Status Distribution`;
//             const statusCounts = result.data.reduce(
//               (acc: { [key: string]: number }, curr: any) => {
//                 const status = curr.status || "unknown";
//                 acc[status] = (acc[status] || 0) + 1;
//                 return acc;
//               },
//               {}
//             );

//             // Transform to required format
//             return {
//               data: Object.entries(statusCounts).map(([status, count]) => ({
//                 name: status,
//                 value: count,
//                 label: label,
//               })),
//               error: null,
//             };
//           });

//         if (error) throw error;

//         return data;
//       }
//     }

//     // For time series query
//     const timeSeriesMatch = queryString.match(/from\("([^"]+)"\)/);

//     if (timeSeriesMatch) {
//       const tableName = timeSeriesMatch[1];

//       const { data, error } = await postgrest
//         .from(tableName)
//         .select("created_datetime")
//         .then((result) => {
//           if (result.error) throw result.error;

//           const label = `${
//             tableName.charAt(0).toUpperCase() + tableName.slice(1)
//           } Creation Timeline`;

//           // Group data by month and count
//           const monthlyCounts = result.data.reduce(
//             (acc: { [key: string]: number }, curr: any) => {
//               if (!curr.created_datetime) return acc;
//               const month = new Date(curr.created_datetime)
//                 .toISOString()
//                 .substring(0, 7); // Gets YYYY-MM format
//               acc[month] = (acc[month] || 0) + 1;
//               return acc;
//             },
//             {}
//           );

//           // Transform to required format and sort by month
//           return {
//             data: Object.entries(monthlyCounts)
//               .map(([month, count]) => ({
//                 month,
//                 value: count,
//                 label,
//               }))
//               .sort((a, b) => a.month.localeCompare(b.month)),
//             error: null,
//           };
//         });

//       if (error) throw error;
//       return data;
//     }

//     throw new Error(`Invalid query format: ${queryString}`);
//   } catch (error) {
//     console.error("Error executing chart query:", error);
//     throw error;
//   }
// }

export async function executeSqlQuery(query: string) {
  const pool = new Pool({
    connectionString:
      "postgres://postgres:cTL7hYqR69qHS7DYmoPrx5M5MNBqFKTo@219.93.129.146:5446/postgres",
  });
  try {
    const result = await pool.query(query);
    await pool.end();
    return [{ data: result.rows, label: query }];
  } catch (error) {
    throw error;
  }
}
