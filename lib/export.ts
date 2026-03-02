import type { Table } from "@tanstack/react-table";

export function exportTableToCSV<TData>(
  /**
   * The table to export.
   * @type Table<TData>
   */
  table: Table<TData>,
  opts: {
    /**
     * The filename for the CSV file.
     * @default "table"
     * @example "tasks"
     */
    filename?: string;
    /**
     * The columns to exclude from the CSV file.
     * @default []
     * @example ["select", "actions"]
     */
    excludeColumns?: string[];

    /**
     * Whether to export only the selected rows.
     * @default false
     */
    onlySelected?: boolean;
  } = {}
): void {
  const {
    filename = "table",
    excludeColumns = [],
    onlySelected = false,
  } = opts;

  // Retrieve headers (column names)
  const headers = table
    .getAllLeafColumns()
    .map((column) => column.id)
    .filter((id) => !excludeColumns.includes(id));

  // Build CSV content
  const csvContent = [
    headers.join(","),
    ...(onlySelected
      ? table.getFilteredSelectedRowModel().rows
      : table.getRowModel().rows
    ).map((row) =>
      headers
        .map((header) => {
          const cellValue = row.getValue(header);
          // Handle values that might contain commas or newlines
          return typeof cellValue === "string"
            ? `"${cellValue.replace(/"/g, '""')}"`
            : cellValue;
        })
        .join(",")
    ),
  ].join("\n");

  // Create a Blob with CSV content
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  // Create a link and trigger the download
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportAllRecordsToCSV<TData>(
  table: Table<TData>,
  getAllFilteredRecordsFn: () => Promise<Record<string, unknown>[]>,
  opts: {
    /**
     * The filename for the CSV file.
     * @default "all_records"
     * @example "filtered_data"
     */
    filename?: string;
  } = {},
  excludeColumns: string[] = []
): Promise<void> {
  const { filename = "all_records" } = opts;

  try {
    // Fetch all filtered records
    const allRecords = await getAllFilteredRecordsFn();

    if (allRecords.length === 0) {
      console.warn("No records found to export.");
      return;
    }

    // Retrieve headers (keys from the first record)
    // const headers = Object.keys(allRecords[0]);
    const headers = table
      .getAllLeafColumns()
      .map((column) => column.id)
      .filter((id) => !excludeColumns.includes(id));

    // Build CSV content
    const csvContent = [
      headers.join(","), // Add headers
      ...allRecords.map((record) =>
        headers
          .map((header) => {
            const cellValue = record[header];
            // Handle values that might contain commas or newlines
            return typeof cellValue === "string"
              ? `"${cellValue.replace(/"/g, '""')}"`
              : cellValue;
          })
          .join(",")
      ),
    ].join("\n");

    // Create a Blob with CSV content
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Create a link and trigger the download
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error exporting all records to CSV:", error);
  }
}
