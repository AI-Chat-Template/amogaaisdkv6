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
import { Github, Facebook } from "lucide-react";
import { register, RegisterActionState } from "../actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

const formSchema = z
  .object({
    first_name: z
      .string()
      .min(1, { message: "First name is required" })
      .regex(/^[A-Za-z]+$/, { message: "First name must contain only alphabets" }),

    last_name: z
      .string()
      .min(1, { message: "Last name is required" })
      .regex(/^[A-Za-z]+$/, { message: "Last name must contain only alphabets" }),

    user_email: z
      .string()
      .min(1, { message: "Please enter your email" })
      .email({ message: "Invalid email address" })
      .regex(/^[\w.+-]+@gmail\.com$/, {
        message: "Email must be @gmail.com at end",
      }),

    password: z
      .string()
      .min(1, {
        message: "Please enter your password",
      })
      .min(7, {
        message: "Password must be at least 7 characters long",
      }),
    confirmPassword: z.string(),

   user_mobile: z
  .string()
  .min(1, { message: "Mobile number is required" })
  .regex(/^\d+$/, { message: "Mobile number must contain only digits" }) // only numbers
  .length(10, { message: "Mobile number must be exactly 10 digits" }), // exactly 10 digits

    // Supports E.164 format (international numbers)
  business_name: z
  .string()
  .min(1, { message: "Business name is required" }),

business_number: z
  .string()
  .nonempty({ message: "Business number is required" }) // first check empty
  .min(4, { message: "Business number must be at least 4 digits" })
  .regex(/^\d+$/, { message: "Business number must contain only numbers" }),


  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

export default function SignUp() {
  const [isLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("storesignup");
  const [state, formAction, pending] = useActionState<
    RegisterActionState,
    z.infer<typeof formSchema>
  >(register, {
    status: "idle",
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      user_email: "",
      password: "",
      confirmPassword: "",
      user_mobile: "",
      business_name: "",
      business_number: "",
    },
  });

  useEffect(() => {
    if (pending || !state?.status) return;

    if (state?.status === "user_exists") {
      toast.error("Account already exists");
    }else if (state?.status === "phone_exists") {
      toast.error("Phone number already registered");
    } else if (state?.status === "failed") {
      if (state?.message) toast.error(state?.message);
      else toast.error("Failed to create account");
    } else if (state?.status === "invalid_data") {
      toast.error("Failed validating your submission!");
    } else if (state?.status === "success") {
      toast.success("Account created successfully");
      router.refresh();
    }
  }, [state, pending, router]);

  return (
    <Card className="p-6">
      <div className="mb-2 flex flex-col space-y-2 text-left">
        <h1 className="text-lg font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("description1")} <br />
          {t("description2")}{" "}
          <Link
            href="/storesignin"
            className="underline underline-offset-4 hover:text-primary"
          >
            {t("signinLink")}
          </Link>
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
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("firstName")} <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("lastName")} <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="user_email"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>
                      {t("email")} <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="name@gmail.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="user_mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("mobile")} <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="+1234567890" {...field} />
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
                    <FormLabel>
                      {t("password")} <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>
                      {t("confirmPassword")} <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="business_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("businessname")} <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Business Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="business_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("businessnumber")} <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button className="mt-2" disabled={isLoading}>
                {t("submit")}
              </Button>

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