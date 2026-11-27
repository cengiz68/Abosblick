import type { NextAuthConfig } from "next-auth";

const PUBLIC = ["/", "/login", "/register", "/pricing"];

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (PUBLIC.includes(pathname) || pathname.startsWith("/api/auth") || pathname.startsWith("/api/stripe/webhook") || pathname.startsWith("/api/cron")) return true;
      return !!auth?.user;
    },
    jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.uid && session.user) session.user.id = token.uid as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
