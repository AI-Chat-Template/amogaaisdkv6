// // lib/otel-logger.ts
// export async function sendLogToServer(record: {
//   severity: string;
//   message: string;
//   attributes?: any;
// }) {
//   try {
//     await fetch("/api/otel/logs", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         resourceLogs: [
//           {
//             scopeLogs: [
//               {
//                 logRecords: [
//                   {
//                     severityText: record.severity,
//                     body: { stringValue: record.message },
//                     attributes: record.attributes || {},
//                     timeUnixNano: Date.now() * 1_000_000,
//                   },
//                 ],
//               },
//             ],
//           },
//         ],
//       }),
//     });
//   } catch (e) {
//     console.error("SEND LOG FAILED:", e);
//   }
// }

// export function otelInfo(message: string, attributes: any = {}) {
//   sendLogToServer({ severity: "INFO", message, attributes });
// }

// export function otelError(message: string, attributes: any = {}) {
//   sendLogToServer({ severity: "ERROR", message, attributes });
// }
