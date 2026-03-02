"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordInput } from "@/components/password-input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FcGoogle } from "react-icons/fc";
import { Github, Mail, Phone, Send } from "lucide-react";
import { signIn } from "next-auth/react";
import { FaFacebook, FaLinkedin } from "react-icons/fa";
import { verifyEmailOtp,register,RegisterActionState } from "../actions";
import supabaseClient from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useState } from "react";

/* ---------------- EMAIL + PASSWORD SCHEMA ---------------- */

type RegisterInput = {
  user_email: string;
  password: string;
  first_name: string;
  last_name: string;
  user_mobile?: string;
};

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
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

  

const otpSendSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phone: z
    .string()
    .min(8, "Phone number is too short")
    .regex(/^[0-9+]+$/, "Phone number must contain only digits"),
  email: z.string().email("Invalid email address"),
});


export default function SignUpPage() {
     const [isLoading] = useState(false);
   
    const router = useRouter();

   const [state, formAction, pending] = useActionState<
  RegisterActionState,
  RegisterInput
>(register, { status: "idle" });


  const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        first_name: "",
        last_name: "",
        user_email: "",
        password: "",
        user_mobile: "",
        confirmPassword: "",
      },
    });

  useEffect(() => {
  if (pending || !state?.status) return;

  if (state.status === "user_exists") {
    toast.error(state.message ?? "Account already exists");
  } else if (state.status === "phone_exists") {
    toast.error(state.message ?? "Phone number already registered");
  } else if (state.status === "failed") {
    toast.error(state.message ?? "Signup failed");
  } else if (state.status === "invalid_data") {
    toast.error("Invalid form data");
  } else if (state.status === "success") {
    toast.success("Account created successfully");
    router.push("/role-menu");
  }
}, [state, pending, router]);

 

  /* ---------------- EMAIL OTP STATE ---------------- */

  const [otpEmail, setOtpEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  /* ---------------- SEND OTP ---------------- */
  const sendOtp = async () => {
    const formData = {
      firstName,
      lastName,
      phone,
      email: otpEmail.trim().toLowerCase(),
    };

    const parsed = otpSendSchema.safeParse(formData);

    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      }).then((r) => r.json());

      if (res.exists) {
        toast.error("Account already exists. Please login.");
        return;
      }

      const { error } = await supabaseClient.auth.signInWithOtp({
        email: formData.email,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setOtpSent(true);
      toast.success("OTP sent to your email");
    } catch {
      toast.error("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };




  /* ---------------- VERIFY OTP ---------------- */

  const verifyOtp = async () => {
    setLoading(true);

    try {
      const res = await verifyEmailOtp(
        otpEmail.trim().toLowerCase(),
        otp,
        firstName,
        lastName,
        phone
      );

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      if (res.mode === "login") {
        toast.success("Welcome back!");
        router.push("/dashboard");
        return;
      }

      toast.success("Signup successful!");
      router.push("/onboarding");
    } catch {
      toast.error("Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };





  return (
    <>
      <Tabs defaultValue="email">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="email">
            <Mail className="mr-1 h-4 w-4" /> Email
          </TabsTrigger>
          <TabsTrigger value="phone">
            <Phone className="mr-1 h-4 w-4" /> Phone
          </TabsTrigger>
          <TabsTrigger value="otp">
            <Send className="mr-1 h-4 w-4" /> Email OTP
          </TabsTrigger>
        </TabsList>

        {/* EMAIL + PASSWORD */}
        <TabsContent value="email">
  <Form {...form}>
    <form
    className="space-y-3 px-1"
            onSubmit={form.handleSubmit((v) =>
  startTransition(() =>
    formAction({
      user_email: v.user_email,
      password: v.password,
      first_name: v.first_name,
      last_name: v.last_name,
      user_mobile: v.user_mobile,
      // confirmPassword ❌ NOT SENT
    })
  )
)}

          >


      {/* FIRST NAME */}
      <FormField
        control={form.control}
        name="first_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>First Name</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter the first Name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* LAST NAME */}
      <FormField
        control={form.control}
        name="last_name"
        render={({ field }) => (
          <FormItem className="space-y-1">
            <FormLabel>Last Name</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter the last Name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* PHONE */}
      <FormField
        control={form.control}
        name="user_mobile"
        render={({ field }) => (
          <FormItem className="pt-1">
            <FormLabel>Phone Number</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter the phone number" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* EMAIL */}
      <FormField
        control={form.control}
        name="user_email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter the email address" />
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
              <PasswordInput {...field} placeholder="Enter the password" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* CONFIRM PASSWORD */}
      <FormField
        control={form.control}
        name="confirmPassword"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Confirm Password</FormLabel>
            <FormControl>
              <PasswordInput {...field} placeholder="Confirm the password" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Button  className="w-full my-2" disabled={isLoading}  >
        Create Account
      </Button>
    </form>
  </Form>
</TabsContent>


        {/* PHONE (PLACEHOLDER) */}
        <TabsContent value="phone">
          <Input placeholder="Phone number" />
          <Button className="mt-4 w-full">Send OTP</Button>
        </TabsContent>

        {/* EMAIL OTP */}
        <TabsContent value="otp" className="space-y-4">
          {!otpSent ? (
            <>
              <Input
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />

              <Input
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />

              <Input
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                placeholder="Email address"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
              />
              <Button
                className="w-full"
                onClick={sendOtp}
                disabled={loading}
              >
                Send OTP
              </Button>
            </>
          ) : (
            <>
              <Input
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <Button
                className="w-full"
                onClick={verifyOtp}
                disabled={loading}
              >
                Verify OTP
              </Button>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* SOCIAL LOGIN */}
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

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={() => signIn("google")}>
          <FcGoogle className="mr-2 h-4 w-4" />
          Google
        </Button>

        <Button variant="outline" onClick={() => signIn("github")}>
          <Github className="mr-2 h-4 w-4" />
          GitHub
        </Button>

        <Button variant="outline" onClick={() => signIn("facebook")}>
          <FaFacebook className="mr-2 h-4 w-4 text-blue-600" />
          Facebook
        </Button>

        <Button variant="outline" onClick={() => signIn("linkedin")}>
          <FaLinkedin className="mr-2 h-4 w-4 text-sky-700" />
          LinkedIn
        </Button>
      </div>
    </>
  );
}
