/**
 * Zone detection utilities.
 * This file must be safe for both server and client components
 * (no Prisma imports).
 */

export type ZoneValue = "north_van" | "west_van" | "downtown_van" | "other";

export const ZONE_LABELS: Record<ZoneValue, string> = {
  north_van: "North Van",
  west_van: "West Van",
  downtown_van: "Downtown Van",
  other: "Other",
};

const ZONE_KEYWORDS: Record<ZoneValue, string[]> = {
  north_van: ["north vancouver", "north van", "lonsdale"],
  west_van: ["west vancouver", "west van", "bellevue", "marine dr"],
  downtown_van: [
    "vancouver",
    "vgh",
    "st. paul",
    "granville",
    "alberni",
    "west 6th",
    "west 15th",
  ],
  other: [],
};

export function suggestZone(address: string): ZoneValue {
  const lower = address.toLowerCase();
  for (const [zone, keywords] of Object.entries(ZONE_KEYWORDS)) {
    if (zone === "other") continue;
    for (const kw of keywords) {
      if (lower.includes(kw)) return zone as ZoneValue;
    }
  }
  return "other";
}
