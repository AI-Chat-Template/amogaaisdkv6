import NextAuth, { User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { postgrest } from "./lib/postgrest";
import { getUserSessionDTO } from "./lib/dto";
import { getAllowedPaths } from "./lib/server-utils";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  
  pages: {
    signIn: "/signin",
  },
  providers: [
     Google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
     GitHub({
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  }),
    Credentials({
      name: "Sign in",
      id: "credentials",  
      credentials: {
        email: {
          label: "email",
          type: "email",
          placeholder: "example@gmail.com",
        },
        password: {
          name: "password",
          label: "Password",
          type: "password",
          placeholder: "Enter Password",
        },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const { data: user } = await postgrest
          .asAdmin()
          .from("user_catalog")
          .select("*")
          .eq("user_email", credentials.email as string)
          .eq("password", credentials.password as string)
          .single();

        if (!user) {
          return null;
        }
        
        const userSessionDTO = getUserSessionDTO(user);
        // console.log("userSessionDTO:"+ userSessionDTO)
        const allowedPaths = await getAllowedPaths(userSessionDTO);
        return { ...userSessionDTO, allowedPaths: allowedPaths };
      },
    }),
    Credentials({
      name: "Login with User ID",
      id: "user-id",
      credentials: {
        userId: {
          label: "User ID",
          type: "text",
          placeholder: "Enter User ID",
        },
      },
      authorize: async (credentials) => {
        console.log("Login with User ID",credentials)
        if (!credentials?.userId) {
          return null;
        }

        const { data: user } = await postgrest
          .from("user_catalog")
          .select("*")
          .eq("user_catalog_id", credentials.userId as string)
          .single();

        console.log("user",user)

        if (!user) {
          return null;
        }

        const userSessionDTO = getUserSessionDTO(user);
        const allowedPaths = await getAllowedPaths(userSessionDTO);
        return { ...userSessionDTO, allowedPaths: allowedPaths };
      },
    }),
    

  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const ignorePathsRegex =
        /^\/(api|_next\/static|_next\/image|favicon\.ico|sitemap\.xml|robots\.txt)/;
      if (ignorePathsRegex.test(nextUrl.pathname)) {
        return true;
      }

      // Shopify install/auth redirect
      if (
        nextUrl.pathname === "/" &&
        nextUrl.searchParams.has("hmac") &&
        nextUrl.searchParams.has("shop")
      ) {
        const redirectUrl = new URL("/api/shopify/auth", nextUrl.origin);
        for (const [key, value] of nextUrl.searchParams.entries()) {
          redirectUrl.searchParams.append(key, value);
        }
        // Create a new Headers object with the cookies
        const headers = new Headers();
        headers.append(
          "Set-Cookie",
          `shopify_app_state=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`
        );
        headers.append(
          "Set-Cookie",
          `shopify_app_state.sig=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`
        );
        headers.set("Location", redirectUrl.toString());
        return new Response(null, {
          status: 302,
          headers,
        });
      }

      const isLoggedIn = !!auth?.user;
      const publicPaths = ["/sign-in", "/sign-up", "/storesignin", "/storesignup","/signin","/(socialAuth)","/signup"];

      const isPublic = publicPaths.some((path) =>
        nextUrl.pathname.startsWith(path)
      );

      if (!isLoggedIn) {
        if (!isPublic) {
          const redirectUrl = new URL("/signin", nextUrl.origin);
          redirectUrl.searchParams.append("callbackUrl", nextUrl.pathname + nextUrl.search);
          return Response.redirect(redirectUrl);
        } else {
          return true;
        }
      }

      if (
        isLoggedIn &&
        ["/sign-in", "/sign-up", "/storesignin", "/storesignup", "/signin","/signup",].some((path) =>

          nextUrl.pathname.startsWith(path)
        )
      ) {
        return Response.redirect(new URL("/chatwithwoodata", nextUrl.origin));
      }

      const authAllowedPaths = ["/role-menu", "/settings", "/not-authorized","/Theme"];

      const isAuthAllowedPaths = authAllowedPaths.some((path) =>
        nextUrl.pathname.startsWith(path)
      );
      if (
        !isAuthAllowedPaths &&
        !(auth?.user?.allowedPaths || []).some((path) =>
          nextUrl.pathname.startsWith(path)
        )
      ) {
        if (process.env.STAGE === "dev") return true;
        console.log(
          "its not allwed page",
          nextUrl.pathname,
          "routes",
          auth?.user
        );
        return Response.redirect(new URL("/not-authorized", nextUrl.origin));
      }

      return true;
    },
 async signIn({ user, account }) {
  const provider = account?.provider;

  // Allow credentials login
  if (provider === "credentials") return true;

  // Only Google & GitHub reach here
  if (!user.email) return false;

  const { data: dbUser } = await postgrest
    .asAdmin()
    .from("user_catalog")
    .select("*")
    .eq("user_email", user.email)
    .maybeSingle();

  // ❌ Block if user not registered
  if (!dbUser) return false;

  // 🔐 Role enforcement
  const roles = Array.isArray(dbUser.roles_json)
    ? dbUser.roles_json
    : JSON.parse(dbUser.roles_json || "[]");

  if (!roles.includes("Store Manager")) return false;

  // ✅ Attach DB user for jwt()
  (user as any).__dbUser = dbUser;

  return true;
}

,

   jwt: async ({ token, user }) => {
  if (user) {
    const u = user as any;

    // ✅ GitHub login
    if (u.__dbUser) {
      const userSessionDTO = getUserSessionDTO(u.__dbUser);
      const allowedPaths = await getAllowedPaths(userSessionDTO);

      token.user = {
        ...userSessionDTO,
        allowedPaths,
      };
    }
    // ✅ Credentials login (unchanged)
    else {
      token.user = u;
    }

    token.id = token.user?.id;
    token.randomKey = token.user?.randomKey;
  }

  return token;
},

    session({ session, token }) {
     return {
  ...(session || {}), // Prevents spreading undefined
        user: {
          ...(session?.user || {}),
          ...(token?.user || {}),
          id: token?.id as string,
          randomKey: token?.randomKey,
          
        },
      };

    },
  },
  
});
