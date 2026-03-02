import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function downloadExcel({
  headers,
  rows,
  fileName = "report.xlsx",
}: {
  headers: string[];
  rows: any[][];
  fileName?: string;
}) {
  // Create worksheet
  const worksheetData = [headers, ...rows];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column width automatically
  const colWidths = headers.map((h) => ({
    wch: Math.max(15, h.length + 5),
  }));

  worksheet["!cols"] = colWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

  // Export
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, fileName);
}
