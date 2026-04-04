import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

/**
 * Dev-only login endpoint. Creates a session directly for a user
 * by email, bypassing magic-link auth. Only works when NODE_ENV != production.
 *
 * Usage: GET /api/dev-login?email=coordinator@example.org
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production" && !process.env.DEMO_MODE) {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  const url = new URL(request.url);
  const email = url.searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "email parameter required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: `No user found with email: ${email}` }, { status: 404 });
  }

  const sessionToken = uuidv4();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expires,
    },
  });

  const useSecureCookie = request.url.startsWith("https://");
  const cookieName = useSecureCookie
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const cookieStore = await cookies();
  cookieStore.set(cookieName, sessionToken, {
    expires,
    httpOnly: true,
    sameSite: "lax",
    secure: useSecureCookie,
    path: "/",
  });

  const redirectTo = user.role === "admin" ? "/admin" : "/rides";
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
