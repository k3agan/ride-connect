import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import {
  TripTypeBadge,
  AccessibilityIndicators,
  ZoneBadge,
} from "@/components/ride-badges";
import { ZoneFilter } from "./zone-filter";
import { ClaimButton } from "./claim-button";
import { suggestZone, type ZoneValue } from "@/lib/zones";
import { type Prisma } from "@/generated/prisma/client";

const ZONE_LABELS: Record<string, string> = {
  north_van: "North Van",
  west_van: "West Van",
  downtown_van: "Downtown Van",
  other: "Other",
};

export default async function RideBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ zone?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const zoneFilter = params.zone || "all";

  const where: Prisma.RideWhereInput = { status: "available" };
  if (zoneFilter !== "all") {
    where.zone = zoneFilter as ZoneValue;
  }

  const rides = await prisma.ride.findMany({
    where,
    orderBy: { appointmentDate: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Available Rides</h1>

      <ZoneFilter currentZone={zoneFilter} />

      {rides.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-lg text-gray-500">
            No rides available right now.
          </p>
          <p className="mt-1 text-sm text-gray-400">
            We&apos;ll notify you when new ones are posted.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {rides.map((ride) => {
            const destZone = suggestZone(ride.destinationAddress);
            return (
              <Card key={ride.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2 flex-1">
                    <p className="text-xl font-bold text-gray-900">
                      {new Date(ride.appointmentDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      at {ride.appointmentTime}
                    </p>

                    <p className="text-base text-gray-700">
                      {ZONE_LABELS[ride.zone]} → {ZONE_LABELS[destZone] || "Other"}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <TripTypeBadge tripType={ride.tripType} />
                      <ZoneBadge zone={ride.zone} />
                      <span className="text-sm text-gray-500">
                        ~{ride.appointmentDuration}
                      </span>
                    </div>

                    <AccessibilityIndicators
                      mobilityAid={ride.mobilityAid}
                      mobilityAidNotes={ride.mobilityAidNotes}
                      assistanceInOut={ride.assistanceInOut}
                    />
                  </div>

                  <div className="sm:self-center">
                    <ClaimButton
                      rideId={ride.id}
                      userId={session!.user.id}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
