"use client";

let pptxLoaded = false;

async function loadPptxScript(): Promise<void> {
  if (pptxLoaded) return;

  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject("Not in browser");

    // If already exists
    if ((window as any).pptxgen) {
      pptxLoaded = true;
      return resolve();
    }

    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js";
    script.async = true;

    script.onload = () => {
      pptxLoaded = true;
      resolve();
    };

    script.onerror = () => reject("Failed to load pptxgenjs");
    document.body.appendChild(script);
  });
}

export async function downloadPPT({
  storyText,
  headers,
  rows,
  chartRef,
  fileName = "report.pptx",
}: {
  storyText?: string;
  headers?: string[];
  rows?: string[][];
  chartRef?: HTMLCanvasElement | null;
  fileName?: string;
}) {
  await loadPptxScript();

  const pptxgen = (window as any).pptxgen;

  if (!pptxgen) {
    alert("PPT generator failed to load.");
    return;
  }

  const pptx = new pptxgen();

  // ---------------- Slide 1: Story ----------------
  const slide1 = pptx.addSlide();
  slide1.addText(storyText || "No Story", {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 5,
    fontSize: 20,
    bold: true,
    color: "333333",
  });

  // ---------------- Slide 2: Chart ----------------
  if (chartRef) {
    const img = chartRef.toDataURL("image/png");
    const slide2 = pptx.addSlide();

    slide2.addText("Chart", { x: 0.5, y: 0.3, fontSize: 24, bold: true });

    slide2.addImage({
      data: img,
      x: 0.5,
      y: 1,
      w: 9,
      h: 4.5,
    });
  }

  // ---------------- Slide 3: Table ----------------
  if (headers?.length && rows?.length) {
    const slide3 = pptx.addSlide();

    slide3.addText("Table", { x: 0.5, y: 0.3, fontSize: 24, bold: true });

    slide3.addTable([headers, ...rows], {
      x: 0.5,
      y: 1,
      w: 9,
      fontSize: 14,
      border: { pt: 1, color: "666666" },
      fill: "F2F2F2",
    });
  }

  await pptx.writeFile({ fileName });
}
