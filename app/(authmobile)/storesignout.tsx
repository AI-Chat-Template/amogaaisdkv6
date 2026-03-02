// "use client";
// import { signOut } from "next-auth/react"
// import { LogOut } from "lucide-react";

// export function SignOutButton() {
//   return (
//     <div
//       onClick={() => signOut()}
//       className="relative flex items-center gap-2 text-sm outline-none transition-colors [&>svg]:size-4 [&>svg]:shrink-0"
//     >
//       <LogOut />
//       Sign Out
//     </div>
//   );
// }
"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });

    await signOut({ callbackUrl: "/login" });
  };

  return (
    <div
      onClick={handleLogout}
      className="flex items-center gap-2 text-sm cursor-pointer"
    >
      <LogOut />
      Sign Out
    </div>
  );
}
