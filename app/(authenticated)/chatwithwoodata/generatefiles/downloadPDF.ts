import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs = pdfFonts.vfs;

export async function generatePDF({
  storyText,
  table,
  chartRef,
  chartTitle = "Chart",
  tableTitle = "Table",
}: {
  storyText?: string;
  table?: { headers: string[]; rows: any[][] } | null;
  chartRef?: HTMLCanvasElement | null;
  chartTitle?: string;
  tableTitle?: string;
}) {
  const content: any[] = [];

  // -------------------------------------------
  // 1️⃣ STORY FIRST
  // -------------------------------------------
  if (storyText) {
    content.push({
      text: storyText,
      style: "story",
      margin: [0, 0, 0, 25],
    });
  }

  // -------------------------------------------
  // 2️⃣ CHART
  // -------------------------------------------
  if (chartRef) {
    content.push({
      text: chartTitle,
      style: "sectionTitle",
      alignment: "center",
      margin: [0, 0, 0, 12],
    });

    const chartImage = chartRef.toDataURL("image/png");

    content.push({
      image: chartImage,
      width: 500,
      alignment: "center",
      margin: [0, 0, 0, 25],
    });
  }

  // -------------------------------------------
  // 3️⃣ TABLE
  // -------------------------------------------
  if (table?.headers?.length && table?.rows?.length) {
    content.push({
      text: tableTitle,
      style: "sectionTitle",
      alignment: "center",
      margin: [0, 0, 0, 15],
    });

    const columnWidths = table.headers.map(() => "*");

    const tableBody = [
      // Header Row
      table.headers.map((h) => ({
        text: h,
        bold: true,
        fillColor: "#eeeeee",
        margin: [4, 3],
      })),

      // Data Rows
      ...table.rows.map((row, i) =>
        row.map((cell) => ({
          text: String(cell),
          margin: [4, 3],
          fillColor: i % 2 === 0 ? "#ffffff" : "#fafafa",
        }))
      ),
    ];

    content.push({
      width: "100%",
      table: {
        headerRows: 1,
        widths: columnWidths,
        body: tableBody,
      },
      layout: {
        hLineWidth: () => 0.6,
        vLineWidth: () => 0.3,
        hLineColor: () => "#bbbbbb",
        vLineColor: () => "#bbbbbb",
      },
      margin: [0, 0, 0, 20],
    });
  }

  // -------------------------------------------
  // FINAL DOCUMENT
  // -------------------------------------------
  const docDefinition = {
    pageMargins: [20, 40, 20, 40],
    content,
    styles: {
      sectionTitle: {
        fontSize: 18,
        bold: true,
      },
      story: {
        fontSize: 12,
        lineHeight: 1.4,
      },
    },
    defaultStyle: {
      fontSize: 9,
    },
  };

  pdfMake.createPdf(docDefinition).download("storereport.pdf");
}
