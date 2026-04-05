/**
 * Static distance estimation for Greater Vancouver rides.
 *
 * Uses zone-based averages plus trip-type multipliers. These are rough
 * estimates calibrated for a volunteer driving from their home in the
 * zone, picking up a client, driving to an appointment, and returning.
 *
 * Average city driving speed in Vancouver: ~28-32 km/h including
 * traffic, lights, parking. We use 30 km/h.
 */

const AVG_SPEED_KMH = 30;

// Typical total round-trip KM by zone (home → pickup → appointment → home)
const ZONE_BASE_KM: Record<string, number> = {
  north_van: 20,
  west_van: 24,
  downtown_van: 30,
  other: 26,
};

export function estimateRideDistance(
  zone: string,
  tripType: string,
): { kmDriven: number; estimatedMinutes: number } {
  const baseKm = ZONE_BASE_KM[zone] || 26;

  // Round trips add ~60% more driving (return the client, then drive home)
  const km = tripType === "round_trip" ? Math.round(baseKm * 1.6) : baseKm;

  const minutes = Math.round((km / AVG_SPEED_KMH) * 60);

  return { kmDriven: km, estimatedMinutes: minutes };
}
