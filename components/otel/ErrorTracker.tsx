// "use client";

// import { useEffect } from "react";
// import { otelError } from "@/lib/otel/otel-logger";

// export default function ErrorTracker() {
//   useEffect(() => {
//     window.addEventListener("error", (e) => {
//       otelError("JS_ERROR", {
//         message: e.message,
//         file: e.filename,
//         page: window.location.pathname,
//       });
//     });

//     window.addEventListener("unhandledrejection", (e) => {
//       otelError("PROMISE_REJECTION", {
//         reason: String(e.reason),
//         page: window.location.pathname,
//       });
//     });
//   }, []);

//   return null;
// }
