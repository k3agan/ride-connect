"use client";

import Link from "next/link";

const ZONES = [
  { value: "all", label: "All Zones" },
  { value: "north_van", label: "North Van" },
  { value: "west_van", label: "West Van" },
  { value: "downtown_van", label: "Downtown Van" },
  { value: "other", label: "Other" },
];

export function ZoneFilter({ currentZone }: { currentZone: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ZONES.map((z) => (
        <Link
          key={z.value}
          href={z.value === "all" ? "/rides" : `/rides?zone=${z.value}`}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            currentZone === z.value
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          {z.label}
        </Link>
      ))}
    </div>
  );
}
