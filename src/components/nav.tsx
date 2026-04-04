"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Session } from "next-auth";

interface NavProps {
  session: Session | null;
}

export function Nav({ session }: NavProps) {
  const pathname = usePathname();

  if (!session?.user) return null;

  const isAdmin = session.user.role === "admin";

  const links = isAdmin
    ? [
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/rides/new", label: "New Ride" },
      ]
    : [
        { href: "/rides", label: "Available Rides" },
        { href: "/my-rides", label: "My Rides" },
        { href: "/settings", label: "Settings" },
      ];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={isAdmin ? "/admin" : "/rides"} className="text-xl font-bold text-blue-700">
              RideConnect
            </Link>
          </div>

          <div className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              Hi, {session.user.name?.split(" ")[0]}
            </span>
            <Link
              href="/api/auth/signout"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-2 sm:px-6">
        <a
          href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.org"}`}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Need help? Contact{" "}
          {process.env.NEXT_PUBLIC_SUPPORT_PHONE || "(604) 555-0100"}
        </a>
      </div>
    </nav>
  );
}
