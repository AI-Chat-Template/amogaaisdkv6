"use server";

import supabaseClient from "@/lib/supabaseClient";
import { postgrest } from "@/lib/postgrest";
import { z } from "zod";
import { signIn } from "@/auth";

export async function verifyEmailOtp(
  email: string,
  otp: string,
  firstName: string,
  lastName: string,
  phone: string
) {
  const normalizedEmail = email.trim().toLowerCase();

  // 1️⃣ VERIFY OTP
  const { data, error } = await supabaseClient.auth.verifyOtp({
    email: normalizedEmail,
    token: otp,
    type: "email",
  });

  if (error || !data?.user) {
    return { success: false, message: "Invalid or expired OTP" };
  }

  // 2️⃣ CHECK IF USER EXISTS
  const { data: existingUser } = await postgrest
    .asAdmin()
    .from("user_catalog")
    .select("user_catalog_id")
    .eq("user_email", normalizedEmail)
    .maybeSingle();

  // 🚫 EXISTING USER → LOGIN ONLY
  if (existingUser) {
    return { success: true, mode: "login" };
  }

  // 3️⃣ NEW USER → INSERT ONCE
  const { error: insertError } = await postgrest
    .asAdmin()
    .from("user_catalog")
    .insert({
      user_email: normalizedEmail,
      user_id: data.user.id,
      first_name: firstName,
      last_name: lastName,
      user_mobile: phone,
      emailverify: true,
    });

  if (insertError) {
    console.error("USER_CATALOG INSERT ERROR:", insertError);
    return {
      success: false,
      message: "Database error saving new user",
    };
  }

  return { success: true, mode: "signup" };
}


const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const authRegisterFormSchema = z.object({
  user_email: z.string().email(),
  password: z.string().min(6),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  user_mobile: z.string().optional(),

});

export interface LoginActionState {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
}

export const login = async (
  _: LoginActionState,
  formData: z.infer<typeof authFormSchema>
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.email,
      password: formData.password,
    });

    await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }
    return { status: "failed" };
  }
};

export interface RegisterActionState {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_exists"
    | "phone_exists"
    | "invalid_data";
  message?: string;
}

export const register = async (
  _: RegisterActionState,
  formData: z.infer<typeof authRegisterFormSchema>
): Promise<RegisterActionState> => {
  try {
    const validatedData = authRegisterFormSchema.parse(formData);

    // Check if email already exists
    const { data: userByEmail } = await postgrest.asAdmin()
      .from("user_catalog")
      .select("*")
      .eq("user_email", validatedData.user_email)
      .maybeSingle();

    if (userByEmail) {
      return { status: "user_exists", message: "Email already registered" };
    }

    // Check if mobile number exists (if provided)
    if (validatedData.user_mobile) {
      const { data: userByMobile } = await postgrest.asAdmin()
        .from("user_catalog")
        .select("*")
        .eq("user_mobile", validatedData.user_mobile)
        .maybeSingle();

      if (userByMobile) {
        return { status: "phone_exists", message: "Mobile number already registered" };
      }
    }

    // Insert new user
    const { data, error: insertError } = await (postgrest.asAdmin()
  .from("user_catalog") as any)
  .insert({
    user_email: validatedData.user_email,
    password: validatedData.password,
    first_name: validatedData.first_name,
    last_name: validatedData.last_name,
    user_mobile: validatedData.user_mobile ,
    app_name:"amogaaiapps",
    user_name: validatedData.user_email,
    roles_json:["Store Manager"],
  })
  


   if (insertError) {
  if (insertError?.details?.includes("user_mobile")) {
    return { status: "phone_exists", message: "Mobile number already registered" };
  }
  return { status: "failed", message: insertError?.message || "Failed to create user" };
}


    // Auto-login after successful registration
    await signIn("credentials", {
      email: validatedData.user_email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }
    return { status: "failed" };
  }
};