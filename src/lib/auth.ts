import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import { prisma } from "./db";

const emailProvider = EmailProvider({
  server: process.env.RESEND_API_KEY
    ? {
        host: "smtp.resend.com",
        port: 465,
        auth: {
          user: "resend",
          pass: process.env.RESEND_API_KEY,
        },
      }
    : {
        host: "localhost",
        port: 25,
        auth: { user: "", pass: "" },
      },
  from: process.env.EMAIL_FROM || "noreply@example.com",
  ...(process.env.RESEND_API_KEY
    ? {}
    : {
        sendVerificationRequest: async ({ identifier, url }) => {
          console.log(`\n[DEV] Magic link for ${identifier}:\n${url}\n`);
        },
      }),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [emailProvider],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/check-email",
    error: "/login/error",
  },
  callbacks: {
    async session({ session, user }) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, role: true, name: true, preferredZones: true },
      });
      if (dbUser) {
        session.user.id = dbUser.id;
        session.user.role = dbUser.role;
        session.user.name = dbUser.name;
        session.user.preferredZones = dbUser.preferredZones;
      }
      return session;
    },
  },
});
