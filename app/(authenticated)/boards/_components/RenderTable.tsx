"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import React from "react";

const RenderTable = ({
  contentJson,
  apiToken,
}: {
  contentJson: any[];
  apiToken?: string;
}) => {
  // ✅ SAFE extraction
  const table = Array.isArray(contentJson)
    && contentJson.length > 0
    && Array.isArray(contentJson[0]?.table)
      ? contentJson[0].table
      : [];

  const type = contentJson?.[0]?.type;

  const [tableData, setTableData] = React.useState<any[]>([]);

  // ---------------- GRAPHQL ----------------
  React.useEffect(() => {
    if (type !== "graphql" || table.length === 0) return;

    const fetchGraphql = async (query: string, api: string) => {
      const response = await fetch("/api/boards/graphql", {
        method: "POST",
        body: JSON.stringify({ query, api }),
      });
      const result = await response.json();
      setTableData(result);
    };

    table.forEach(
      (item: { query: string; api: string }) => {
        fetchGraphql(item.query, item.api);
      }
    );
  }, [type, table]);

  // ---------------- REST API ----------------
  React.useEffect(() => {
    if (type !== "api" || table.length === 0) return;

    const fetchApiData = async (api: string) => {
      try {
        const response = await fetch(api, {
          method: "GET",
          headers: {
            Authorization: apiToken ?? "",
          },
        });
        const result = await response.json();
        setTableData(result);
      } catch (error) {
        console.error("Error fetching table data:", error);
      }
    };

    fetchApiData(table[0].api);
  }, [type, table, apiToken]);

  // ---------------- RENDER ----------------
  if (table.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic">
        This query does not produce table data.
      </p>
    );
  }

  if (!Array.isArray(tableData) || tableData.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic">
        No table data available.
      </p>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            {Object.keys(tableData[0]).map((column) => (
              <TableHead key={column} className="capitalize">
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {tableData.map((row, index) => (
            <TableRow key={index}>
              {Object.keys(tableData[0]).map((key) => (
                <TableCell key={key}>
                  {typeof row[key] === "object"
                    ? JSON.stringify(row[key], null, 2)
                    : row[key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RenderTable;