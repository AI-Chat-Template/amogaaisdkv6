// "use client";
// import { useEffect } from "react";
// import { log } from "@/lib/otel";

// export default function ClickTracker() {
//   useEffect(() => {
//     function handler(e: any) {
//       const t = e.target as HTMLElement;
//       log("INFO", "CLICK", {
//         page: window.location.pathname,
//         element: t.tagName,
//         text: t.innerText?.slice(0, 40) || "",
//       });
//     }

//     document.addEventListener("click", handler);
//     return () => document.removeEventListener("click", handler);
//   }, []);

//   return null;
// }
