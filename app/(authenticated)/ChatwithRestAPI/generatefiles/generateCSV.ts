export function downloadCSV({
  headers,
  rows,
  fileName = "data.csv",
}: {
  headers: string[];
  rows: any[][];
  fileName?: string;
}) {
  // Convert to CSV string
  let csvContent = "";

  // Header row
  csvContent += headers.join(",") + "\n";

  // Data rows
  rows.forEach((row) => {
    const formatted = row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`);
    csvContent += formatted.join(",") + "\n";
  });

  // Create blob
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  // Trigger download
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
