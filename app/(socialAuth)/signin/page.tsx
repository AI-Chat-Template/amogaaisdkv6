"use client";

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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { Github } from "lucide-react";
import Link from "next/link";
import { FaFacebook, FaLinkedin } from "react-icons/fa";
import { login, LoginActionState } from "../actions";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";


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


export default function SignInPage() {
  const [isLoading] = useState(false);
    const router = useRouter();

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
    if (pending || !state?.status) return;
    if (state?.status === "failed") {
      toast.error("Invalid credentials!");
    } else if (state?.status === "invalid_data") {
      toast.error("Failed validating your submission!");
    } else if (state?.status === "success") {
      router.refresh();
      toast.success("Logged in successfully!");
    }
  }, [state, pending, router]);

  return (
    <>
      {/* FORM */}
    <Form {...form}>
  <form
    className="space-y-4"
    onSubmit={form.handleSubmit((v) =>
      startTransition(() => formAction(v))
    )}
  >
    {/* EMAIL */}
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input placeholder="you@example.com" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    {/* PASSWORD */}
    <FormField
      control={form.control}
      name="password"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Password</FormLabel>
          <FormControl>
            <PasswordInput placeholder="••••••••" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    {/* SUBMIT */}
    <Button className="w-full" disabled={pending}>
      {pending ? "Signing in..." : "Sign In"}
    </Button>
  </form>
</Form>


      {/* DIVIDER */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      {/* SOCIAL BUTTONS */}
      {/* <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          onClick={() => signIn("google")}
          className="flex items-center justify-center"
        >
          <FcGoogle className="mr-2 h-4 w-4" />
          Google
        </Button>

        <Button
          variant="outline"
          onClick={() => signIn("github")}
          className="flex items-center justify-center"
        >
          <Github className="mr-2 h-4 w-4" />
          GitHub
        </Button>
      </div> */}
      <div className="grid grid-cols-2 gap-3">
  {/* GOOGLE */}
  <Button
    variant="outline"
    className="flex items-center justify-center"
    onClick={() => signIn("google")}
  >
    <FcGoogle className="mr-2 h-4 w-4" />
    Google
  </Button>

  {/* GITHUB */}
  <Button
    variant="outline"
    className="flex items-center justify-center"
    onClick={() => signIn("github")}
  >
    <Github className="mr-2 h-4 w-4" />
    GitHub
  </Button>

  {/* FACEBOOK */}
  <Button
    variant="outline"
    className="flex items-center justify-center"
    onClick={() => signIn("facebook")}
  >
    <FaFacebook className="mr-2 h-4 w-4 text-blue-600" />
    Facebook
  </Button>

  {/* LINKEDIN */}
  <Button
    variant="outline"
    className="flex items-center justify-center"
    onClick={() => signIn("linkedin")}
  >
    <FaLinkedin className="mr-2 h-4 w-4 text-sky-700" />
    LinkedIn
  </Button>
</div>

    </>
  );
}
