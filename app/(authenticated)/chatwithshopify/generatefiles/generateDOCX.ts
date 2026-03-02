import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  ImageRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  TableLayoutType,
} from "docx";
import { saveAs } from "file-saver";

export async function downloadDOC({
  storyText,
  headers,
  rows,
  chartRef,
  fileName = "report.docx",
}: {
  storyText?: string;
  headers?: string[];
  rows?: string[][];
  chartRef?: HTMLCanvasElement | null;
  fileName?: string;
}) {
  const docChildren: any[] = [];

  // ------------------------------------------------
  // 1️⃣ TABLE FIRST — FULL WIDTH & FIXED LAYOUT
  // ------------------------------------------------
  if (headers && rows) {
    const columnCount = headers.length;

    // Title
    docChildren.push(
      new Paragraph({
        text: "Table",
        heading: "Heading1",
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      })
    );

    const tableRows: TableRow[] = [];

    // Header row
    tableRows.push(
      new TableRow({
        tableHeader: true,
        children: headers.map(
          (h) =>
            new TableCell({
              width: { size: 100 / columnCount, type: WidthType.PERCENTAGE },
              shading: { fill: "E8E8E8" },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: h, bold: true }),
                  ],
                }),
              ],
            })
        ),
      })
    );

    // Data rows
    rows.forEach((row) => {
      tableRows.push(
        new TableRow({
          children: row.map(
            (cell) =>
              new TableCell({
                width: { size: 100 / columnCount, type: WidthType.PERCENTAGE },
                children: [new Paragraph(String(cell))],
              })
          ),
        })
      );
    });

    // Styled full-width table
    docChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        rows: tableRows,
        borders: {
          top: { size: 1, style: BorderStyle.SINGLE },
          bottom: { size: 1, style: BorderStyle.SINGLE },
          left: { size: 1, style: BorderStyle.SINGLE },
          right: { size: 1, style: BorderStyle.SINGLE },
          insideHorizontal: { size: 1, style: BorderStyle.SINGLE },
          insideVertical: { size: 1, style: BorderStyle.SINGLE },
        },
      })
    );

    // Spacing before chart
    docChildren.push(
      new Paragraph({ text: "", spacing: { after: 400 } })
    );
  }

  // ------------------------------------------------
  // 2️⃣ CHART SECOND
  // ------------------------------------------------
  if (chartRef) {
    const imageBase64 = chartRef.toDataURL("image/png").split(",")[1];

    // Title
    docChildren.push(
      new Paragraph({
        text: "Chart",
        heading: "Heading1",
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );

    // Chart image
    docChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0)),
            transformation: { width: 550, height: 300 },
            type: "png",
          }),
        ],
        spacing: { after: 400 },
      })
    );
  }

  // ------------------------------------------------
  // 3️⃣ STORY LAST
  // ------------------------------------------------
  if (storyText) {
    docChildren.push(
      new Paragraph({
        text: storyText,
        spacing: { before: 200, after: 200 },
      })
    );
  }

  // ------------------------------------------------
  // Build DOCX
  // ------------------------------------------------
  const doc = new Document({
    sections: [{ children: docChildren }],
  });

  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, fileName);
}
