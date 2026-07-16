import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

/**
 * Edge-safe subset of the NextAuth config. Imported by the middleware so we
 * never accidentally pull bcrypt / Prisma into the edge runtime bundle.
 * The full config (with the Credentials provider) lives in `auth.ts`.
 */
export const authConfig = {
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: Role }).role = token.role as Role;
      }
      return session;
    },
    authorized: async ({ auth: session, request }) => {
      const { pathname } = request.nextUrl;
      const isPublic =
        pathname === "/login" ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/_next") ||
        pathname === "/favicon.ico";
      if (isPublic) return true;

      const user = session?.user as { role?: Role } | undefined;
      if (!user) return false;

      const buyerOnly = pathname.startsWith("/rfq/new");
      const supplierBidRoute = /^\/api\/rfqs\/[^/]+\/bids$/.test(pathname);

      if (buyerOnly && user.role !== "BUYER") return false;
      if (supplierBidRoute && request.method === "POST" && user.role !== "SUPPLIER") return false;

      return true;
    },
  },
} satisfies NextAuthConfig;
