"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { usePathname, useRouter } from "next/navigation";

export default function SocialAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const activeTab = pathname.includes("signup") ? "signup" : "signin";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md p-6 shadow-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Welcome</h1>
          <p className="text-sm text-muted-foreground pt-2">
            Sign in to your account or create a new one
          </p>
        </div>

        {/* LOGIN / SIGNUP TABS */}
        <Tabs value={activeTab} onValueChange={(v) => router.push(`/${v}`)}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="signin">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Form Content */}
        <div>{children}</div>
      </Card>
    </div>
  );
}