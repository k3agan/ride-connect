import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RideConnect — Senior Ride Coordination",
  description:
    "Connecting volunteer drivers with seniors who need rides to medical appointments.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
