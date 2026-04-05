import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "./form";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect(session.user.role === "admin" ? "/admin" : "/rides");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-700">RideConnect</h1>
          <p className="mt-2 text-lg text-gray-600">
            Sign in to manage or claim rides
          </p>
        </div>

        <LoginForm />

        {(process.env.NODE_ENV !== "production" || process.env.DEMO_MODE) && (
          <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-4 space-y-2">
            <p className="text-sm font-semibold text-amber-800">
              Dev Mode — Quick Login
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="/api/dev-login?email=coordinator@example.org"
                className="block rounded-lg bg-blue-600 px-4 py-3 text-center text-base font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Log in as Aseman (Staff / Admin)
              </a>
              <a
                href="/api/dev-login?email=antoinette@example.com"
                className="block rounded-lg bg-green-600 px-4 py-3 text-center text-base font-medium text-white hover:bg-green-700 transition-colors"
              >
                Log in as Antoinette (Volunteer)
              </a>
              <a
                href="/api/dev-login?email=david@example.com"
                className="block rounded-lg bg-green-600 px-4 py-3 text-center text-base font-medium text-white hover:bg-green-700 transition-colors"
              >
                Log in as David (Volunteer)
              </a>
            </div>
          </div>
        )}

        <div className="text-center">
          <a
            href={`tel:${process.env.SUPPORT_PHONE || "(604) 555-0100"}`}
            className="text-sm text-blue-600 hover:underline"
          >
            Need help? Call{" "}
            {process.env.SUPPORT_PHONE || "(604) 555-0100"}
          </a>
        </div>
      </div>
    </div>
  );
}
