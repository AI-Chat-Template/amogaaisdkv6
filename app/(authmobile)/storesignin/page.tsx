"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/password-input";
import { startTransition, useActionState, useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Github, Facebook, Loader2 } from "lucide-react";
import { login, LoginActionState } from "../actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Please enter your email" })
    .email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(1, {
      message: "Please enter your password",
    })
    .min(7, {
      message: "Password must be at least 7 characters long",
    }),
});

export default function SignIn() {
  const [isLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("storesignin");
  const [state, formAction, pending] = useActionState<
    LoginActionState,
    { email: string; password: string }
  >(login, {
    status: "idle",
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    console.log("LOGIN STATE DEBUG →", state); 
    if (pending || !state?.status) return;
    if (state?.status === "failed") {
      toast.error("Invalid credentials!");
    } else if (state?.status === "invalid_data") {
      toast.error("Failed validating your submission!");
    } else if(state?.status=="Not Authorized"){
      toast.error("You don't have authorization to access this Store.");
    }else if (state?.status === "success") {
      router.refresh();
      toast.success("Logged in successfully!");
    }
  }, [state, pending, router]);

  return (
    <Card className="p-6">
      <div className="flex flex-col space-y-2 text-left">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("description")}
        </p>
      </div>
      <div className="grid gap-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) =>
              startTransition(() => formAction(v))
            )}
          >
            <div className="grid gap-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>{t("email")}</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <div className="flex items-center justify-between">
                      <FormLabel>{t("password")}</FormLabel>
                      <Link
                        href="#"
                        className="text-sm font-medium text-muted-foreground hover:opacity-75"
                      >
                        {t("forgotPassword")}
                      </Link>
                    </div>
                    <FormControl>
                      <PasswordInput placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="mt-2" disabled={isLoading || pending}>
                {t("submit")}
                {pending && <Loader2 className="animate-spin" />}
              </Button>
              <p className="text-sm text-muted-foreground">
                {t("newaccount")}{" "}
                <Link
                  href="/storesignup"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  {t("signupLink")}
                </Link>
              </p>
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {t("or")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  type="button"
                  disabled={isLoading}
                >
                  <Github className="h-4 w-4" /> {t("github")}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  type="button"
                  disabled={isLoading}
                >
                  <Facebook className="h-4 w-4" /> {t("facebook")}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
      <p className="mt-4 px-8 text-center text-sm text-muted-foreground">
        {t("agreeTerms")}{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          {t("termsOfService")}
        </a>{" "}
        {t("and")}{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          {t("privacyPolicy")}
        </a>
        .
      </p>
    </Card>
  );
}
