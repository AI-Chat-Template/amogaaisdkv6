"use client";

import React, { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import {
  FileSearch,
  BarChart,
  ClipboardList,
  Lightbulb,
  Bot as BotIcon,
  Copy,
  MoreHorizontal,
  MoreVertical,
  Star,
  Flag,
  Archive,
  Share2,
  Check,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Volume2   // ✅ ADDED
} from "lucide-react";
import { generatePDF } from "@/app/(authenticated)/chatwithwoodata/generatefiles/downloadPDF";
import { downloadCSV } from "@/app/(authenticated)/chatwithwoodata/generatefiles/generateCSV";
import { downloadDOC } from "@/app/(authenticated)/chatwithwoodata/generatefiles/generateDOCX";
// import { downloadPPT } from "@/app/(authenticated)/chatwithwoodata/generatefiles/generatePPT";

import DataDisplay, { ChartConfig, TableData } from "./DataDisplay";
import {
  DropdownMenu,
  DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { downloadExcel } from "../generatefiles/generateExcel";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
});

// ---------- Types ----------
type VisualContent = {
  type: "chart" | "table" | "card"|"map";
  data: any;
};

type Message = {
  role: "user" | "assistant" | "error";
  content: string | VisualContent;
};

type ChatBodyProps = {
  chatUuid: string;
  messages: Message[];
  isLoading?: boolean;
  errorMessage?: string | null;
};

// ---------- Suggestions ----------
const suggestions = [
  { title: "Analyze Documents", description: "Get insights from your files", icon: FileSearch },
  { title: "Create Visualization", description: "Generate charts from your data", icon: BarChart },
  { title: "Summarize Content", description: "Extract key information quickly", icon: ClipboardList },
  { title: "Get Insights", description: "Receive smart recommendations", icon: Lightbulb },
];
let pptxLoaded = false;

async function loadPptxScript(): Promise<void> {
  if (pptxLoaded) return;
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject("Not in browser");
    if ((window as any).PptxGenJS || (window as any).pptxgen) {
      pptxLoaded = true;
      return resolve();
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js";
    script.async = true;
    script.onload = () => { pptxLoaded = true; resolve(); };
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
  storyText?: string,
  headers?: string[],
  rows?: string[][],
  chartRef?: HTMLCanvasElement | null,
  fileName?: string,
}) {
  await loadPptxScript();
  const pptxgen = (window as any).PptxGenJS || (window as any).pptxgen;
  if (!pptxgen) {
    alert("PPT generator failed to load");
    return;
  }

  const pptx = new pptxgen();

  // Slide 1: Story
  const slide1 = pptx.addSlide();
  slide1.addText(storyText || "No Story", {
    x: 0.5, y: 0.5, w: 9, h: 5,
    fontSize: 20, bold: true, color: "333333"
  });

  // Slide 2: Chart
  if (chartRef) {
    const img = chartRef.toDataURL("image/png");
    const slide2 = pptx.addSlide();
    slide2.addText("Chart", { x: 0.5, y: 0.3, fontSize: 24, bold: true });
    slide2.addImage({ data: img, x: 0.5, y: 1, w: 9, h: 4.5 });
  }

  // Slide 3: Table
  if (headers?.length && rows?.length) {
    const slide3 = pptx.addSlide();
    slide3.addText("Table", { x: 0.5, y: 0.3, fontSize: 24, bold: true });
    slide3.addTable([headers, ...rows], {
      x: 0.5, y: 1, w: 9,
      fontSize: 14,
      border: { pt: 1, color: "666666" },
      fill: "F2F2F2",
    });
  }

  await pptx.writeFile({ fileName });
}



function groupMessages(messages: Message[]) {
  const result: Array<{
    userText: string;
    chart?: ChartConfig;
    table?: TableData;
    map?: {
    title?: string;
    points: any[];
  };
    card?: {
      title: string;
      value: string | number;
      prefix?: string;
      suffix?: string;
      description?: string;
    };
    assistantText: string[];
  }> = [];

  let i = 0;

  while (i < messages.length) {
    const msg = messages[i];
    // 🔥 HANDLE STANDALONE ASSISTANT (RELOAD SAFE)
    if (
      msg.role === "assistant" &&
      typeof msg.content === "object" &&
      msg.content !== null
    ) {
      const content: any = msg.content;

      const hasCard = content.card?.data || (content.type === "card" && content.data);
      const hasStory = content.story?.content || content.type === "story";
      const hasMap = content.map?.data || content.type === "map";
      if (hasCard || hasStory) {
        result.push({
          userText: "",
          card: content.card?.data || content.data,
          chart: undefined,
          table: undefined,
           map: content.map?.data,
          assistantText: content.story?.content
            ? [content.story.content]
            : content.content
              ? [content.content]
              : [],
        });

        i++;
        continue;
      }
    }

    if (msg.role === "user") {
      const group = {
        userText: typeof msg.content === "string" ? msg.content : "",
        chart: undefined as ChartConfig | undefined,
        table: undefined as TableData | undefined,
        card: undefined as any,
        map: undefined as { title?: string; points: any[] } | undefined,
        assistantText: [] as string[],
      };

      let j = i + 1;

      while (j < messages.length) {
        const next = messages[j];
        if (next.role === "user") break;

        // ==============================
        // ASSISTANT OBJECT (LIVE + SAVED)
        // ==============================
        if (next.role === "assistant" && typeof next.content === "object" && next.content !== null) {
          const content: any = next.content;
           // ---------- MAP ----------
if (!group.map) {
  if (content.type === "map" && content.data) {
    group.map = content.data;
  }

  // reload-safe (if wrapped)
  if (content.map?.data) {
    group.map = content.map.data;
  }
}

          // ---------- CARD ----------
          // ---------- CARD (LIVE + RELOAD SAFE) ----------
          if (!group.card) {
            // case 1: live stream
            if (content.type === "card" && content.data) {
              group.card = content.data;
            }

            // case 2: persisted / reloaded
            if (content.card?.data) {
              group.card = content.card.data;
            }
          }

          // ---------- CHART ----------
          if (!group.chart) {
            const chart = content.type === "chart" ? content : content.chart;
            if (chart?.data) {
              const d = chart.data;
              group.chart = {
                type: d.type ?? "bar",
                title: d.title ?? "Chart",
                data: {
                  labels: d.chartData.map((r: any) => r[d.xAxisColumn]),
                  datasets: [
                    {
                      label: d.datasetLabel ?? "Data",
                      data: d.chartData.map((r: any) =>
                        Number(r[d.yAxisColumn])
                      ),
                    },
                  ],
                },
                options: d.options ?? {},
              };
            }
          }

          // ---------- TABLE ----------
          if (!group.table) {
            const table = content.type === "table" ? content : content.table;
            if (table?.data) {
              group.table = table.data.tableData ?? table.data;
            }
          }

          // ---------- STORY ----------
          if (content.type === "story" && typeof content.content === "string") {
            group.assistantText.push(content.content);
          }

          if (content.story?.content) {
            group.assistantText.push(content.story.content);
          }
        }

        // ---------- STRING TEXT ----------
        if (next.role === "assistant" && typeof next.content === "string") {
          group.assistantText.push(next.content);
        }

        j++;
      }

      result.push(group);
      i = j;
    } else {
      i++;
    }
  }

  return result;
}

// ---------- 🔊 INDIAN ENGLISH VOICE FUNCTION ----------
const speakText = (text: string) => {
  if (!window.speechSynthesis || !text) return;

  const synth = window.speechSynthesis;
  synth.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  const voices = synth.getVoices();

  // Priority: Indian English Voices
  const patterns = [
    /en-IN/i, /hi-IN/i, /india/i, /indian/i, /hindi/i,
    /Aditi/i, /Nisha/i, /Ravi/i, /Priya/i
  ];

  let selected = null;

  for (const pattern of patterns) {
    selected = voices.find(v => pattern.test(v.name) || pattern.test(v.lang));
    if (selected) break;
  }

  if (!selected) selected = voices[1] || voices[0];

  utter.voice = selected;
  utter.rate = 0.92;  // ✅ Slightly slow (not too fast)
  utter.pitch = 1;

  synth.speak(utter);
};

// ---------- Component ----------
export default function ChatBody({
  chatUuid,
  messages,
  isLoading = false,
  errorMessage = null,
}: ChatBodyProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);

    setTimeout(() => {
      setCopiedIndex(null);
    }, 3000);
  };
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!(window as any).PptxGenJS) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js";
      script.async = true;
      script.onload = () => console.log("PPTXGenJS loaded");
      script.onerror = () => console.error("Failed to load PPTXGenJS");
      document.body.appendChild(script);
    }
  }, []);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);


  const groups = groupMessages(messages);

  return (
    <div className="flex-1 overflow-y-auto px-1 sm:px-1 py-4 sm:py-6 bg-background">
      <div className="max-w-[800px] mx-auto space-y-4 sm:space-y-6">

        {/* Suggestions */}
        {!errorMessage && groups.length === 0 && !isLoading && (
          <div className="py-8 sm:py-10 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-5 sm:mb-7 rounded-full bg-muted flex items-center justify-center">
              <BotIcon className="w-7 h-7 sm:w-8 sm:h-8 text-foreground" />
            </div>
            <h1 className="font-bold text-2xl sm:text-3xl mb-2">Welcome to AI Chat</h1>
            <p className="text-muted-foreground mb-8 sm:mb-10 text-[15px] sm:text-[17px]">
              How can I help you today? Choose a suggestion below or start typing your own question.
            </p>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {suggestions.map((s) => (
                <Card
                  key={s.title}
                  className="
                    p-5
                    hover:bg-muted 
                    cursor-pointer 
                    transition 
                    min-h-[160px]
                    flex 
                    items-center 
                    justify-center
                  "
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <s.icon className="w-6 h-6 text-muted-foreground" strokeWidth={1.8} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base font-semibold">{s.title}</span>
                      <span className="text-sm text-muted-foreground mt-1">{s.description}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

          </div>
        )}

        {/* Render grouped messages */}
        {groups.map((g, idx) => (
          <React.Fragment key={idx}>

            {/* User bubble */}
            <div className="flex justify-end">
              <div className="bg-primary text-primary-foreground rounded-2xl px-2 py-2 sm:px-2 sm:py-2 max-w-[85%] text-sm whitespace-pre-wrap">
                {g.userText}
              </div>
            </div>

            {/* USER ACTIONS */}
            <div className="flex justify-end w-full mt-1 gap-3 text-xs text-muted-foreground px-3 relative">
              <button
                className="flex items-center gap-1 hover:text-foreground"
                onClick={() => handleCopy(g.userText, idx)}
              >
                {copiedIndex === idx ? (
                  <Check size={14} className="text-green-500" />
                ) : (
                  <Copy size={14} />
                )}
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hover:text-foreground">
                    <MoreHorizontal size={16} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>Options</DropdownMenuLabel>
                  <DropdownMenuItem className="flex gap-2"><Star size={14} /> Favorite</DropdownMenuItem>
                  <DropdownMenuItem className="flex gap-2"><Flag size={14} /> Flag</DropdownMenuItem>
                  <DropdownMenuItem className="flex gap-2"><Archive size={14} /> Archive</DropdownMenuItem>
                  <DropdownMenuItem className="flex gap-2"><Share2 size={14} /> Share</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {g.card && (
              <div className="mt-2">
                <Card className="w-[200px] p-4 flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">
                    {g.card.title}
                  </span>

                  <span className="text-2xl font-bold">
                    {g.card.prefix}{g.card.value}{g.card.suffix}
                  </span>

                  {g.card.description && (
                    <span className="text-xs text-muted-foreground">
                      {g.card.description}
                    </span>
                  )}
                </Card>
              </div>
            )}

            {/* Visuals */}
            {(g.chart || g.table) && (
              <div id={`chart-${idx}`} className="mt-1">
                <DataDisplay
                  title={g.chart?.title || g.table?.title || "Visualization"}
                  chartConfig={g.chart}
                  tableData={g.table}
                  className="w-full"
                />
              </div>
            )}

             {/* Map */}
              {g.map && (
              <div className="mt-2">
                <MapView
                  key={`chat-map-${idx}`} // ✅ REQUIRED
                  title={g.map.title}
                  points={g.map.points}
                />
              </div>
            )}


            {/* Assistant Text */}
            {g.assistantText.length > 0 && (
              <div className="flex justify-start mt-2">
                <div className="bg-muted rounded-2xl px-2 py-2 sm:px-4 sm:py-2 max-w-[90%] text-sm whitespace-pre-wrap">
                  {g.assistantText.join("\n\n")}
                </div>
              </div>
            )}

            {/* ASSISTANT ACTIONS */}
            {g.assistantText.length > 0 && (
              <div className="flex justify-between items-center w-full mt-1 text-xs text-muted-foreground px-3">

                <div className="flex gap-3">

                  {/* Copy */}
                  <button
                    className="hover:text-foreground flex items-center"
                    onClick={() => handleCopy(g.assistantText.join("\n\n"), idx + 1000)}
                  >
                    {copiedIndex === idx + 1000 ? (
                      <Check size={14} className="text-green-500" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>



                  {/* Like */}
                  <button className="hover:text-foreground flex items-center">
                    <ThumbsUp size={14} />
                  </button>

                  {/* Dislike */}
                  <button className="hover:text-foreground flex items-center">
                    <ThumbsDown size={14} />
                  </button>
                  {/* 🔊 Voice — ADDED EXACTLY HERE */}
                  <button
                    className="hover:text-foreground flex items-center"
                    onClick={() => speakText(g.assistantText.join("\n\n"))}
                  >
                    <Volume2 size={16} />
                  </button>
                  {/* Existing More Options */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="hover:text-foreground">
                        <MoreHorizontal size={16} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-44">
                      <DropdownMenuLabel>Options</DropdownMenuLabel>
                      <DropdownMenuItem className="flex gap-2"><Star size={14} /> Favorite</DropdownMenuItem>
                      <DropdownMenuItem className="flex gap-2"><Flag size={14} /> Flag</DropdownMenuItem>
                      <DropdownMenuItem className="flex gap-2"><Archive size={14} /> Archive</DropdownMenuItem>
                      <DropdownMenuItem className="flex gap-2"><Share2 size={14} /> Share</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                </div>

                {/* Right Vertical Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="hover:text-foreground">
                      <MoreVertical size={16} />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuLabel>Download</DropdownMenuLabel>

                    <DropdownMenuItem
                      onClick={() => {
                        const chartRef = document
                          .querySelector(`#chart-${idx}`)
                          ?.querySelector("canvas") as HTMLCanvasElement | null;

                        // 🔥 Convert TableData → PDF format
                        const table = g.table;

                        const normalizedTable = table
                          ? {
                            headers: table.columns.map((c) => c.header),
                            rows: table.rows.map((row) =>
                              table.columns.map((c) => String(row[c.key] ?? ""))
                            ),
                          }
                          : null;


                        generatePDF({
                          storyText: g.assistantText.join("\n\n"),
                          table: normalizedTable,
                          chartRef,
                        });
                      }}
                    >
                      <FileText size={14} className="mr-2" /> PDF
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => {
                        const table = g.table;
                        const chartRef = document
                          .querySelector(`#chart-${idx}`)
                          ?.querySelector("canvas") as HTMLCanvasElement | null;

                        const storyText = g.assistantText.join("\n\n");

                        const headers = table?.columns?.map((c) => c.header) ?? [];
                        const rows =
                          table?.rows?.map((row) =>
                            table.columns.map((c) => String(row[c.key] ?? ""))
                          ) ?? [];

                        downloadDOC({
                          storyText,
                          headers,
                          rows,
                          chartRef,
                          fileName: "chat-report.docx",
                        });
                      }}
                    >
                      <ClipboardList size={14} className="mr-2" /> Doc
                    </DropdownMenuItem>


                    {/* PPT — wrapped safely so NO TS error */}
                    {/* ---------- PPT DOWNLOAD (TS18048 FIXED) ---------- */}
                    <DropdownMenuItem
                      onClick={() => {
                        if (!g || !g.table || !g.table.columns || !g.table.rows) {
                          console.warn("No table available for PPT export");
                          return;
                        }

                        const headers = g.table.columns.map((c) => c.header);

                        const rows = g.table.rows.map((row) =>
                          g.table!.columns.map((c) => String(row[c.key] ?? ""))
                        );

                        const chartRef = document
                          .querySelector(`#chart-${idx}`)
                          ?.querySelector("canvas") as HTMLCanvasElement | null;


                        downloadPPT({
                          storyText: g.assistantText.join("\n\n"),
                          headers,
                          rows,
                          chartRef,
                          fileName: "report.pptx",
                        });
                      }}
                    >
                      <BarChart size={14} className="mr-2" /> PPT
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => {
                        const table = g.table;

                        if (!table?.columns || !table?.rows) {
                          console.warn("No table available for CSV export");
                          return;
                        }

                        const headers = table.columns.map((c) => c.header);

                        const rows = table.rows.map((row) =>
                          table.columns.map((c) => row[c.key])
                        );

                        downloadCSV({
                          headers,
                          rows,
                          fileName: "table-data.csv",
                        });
                      }}
                    >
                      <FileSearch size={14} className="mr-2" /> CSV
                    </DropdownMenuItem>

                    {/* EXCEL — wrapped safely */}
                    <DropdownMenuItem
                      onClick={() => {
                        if (!g?.table?.columns || !g?.table?.rows) {
                          console.warn("No table available for EXCEL export");
                          return;
                        }

                        const headers = g.table.columns.map((c) => c.header);
                        const rows = g.table.rows.map((row) =>
                          g.table!.columns.map((c) => String(row[c.key] ?? ""))
                        );

                        downloadExcel({
                          headers,
                          rows,
                          fileName: "excel-data.xlsx",
                        });
                      }}
                    >
                      <Lightbulb size={14} className="mr-2" /> Excel
                    </DropdownMenuItem>


                  </DropdownMenuContent>
                </DropdownMenu>

              </div>
            )}

          </React.Fragment>
        ))}

        {/* Loading */}
        {isLoading ? (
          <div className="flex justify-start">
            <div className="bg-muted px-2 py-2 rounded-2xl max-w-[85%] text-sm animate-pulse">
              Thinking...
            </div>
          </div>
        ) : errorMessage ? (
          <div className="flex justify-start">
            <div className="bg-destructive/10 text-destructive border border-destructive/40 rounded-2xl px-2 py-2 max-w-[85%] text-sm whitespace-pre-wrap break-words">
              {/* Error: */}
              <br />
              {errorMessage}
            </div>
          </div>
        ) : null}


        <div ref={bottomRef} />
      </div>
    </div>
  );
}
