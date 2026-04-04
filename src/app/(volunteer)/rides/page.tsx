import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import {
  TripTypeBadge,
  AccessibilityIndicators,
  ZoneBadge,
} from "@/components/ride-badges";
import { ZoneFilter } from "./zone-filter";
import { AcceptButton } from "./accept-button";
import { type ZoneValue } from "@/lib/zones";
import { type Prisma } from "@/generated/prisma/client";
import { Avatar } from "@/components/avatar";

export default async function RideBoardPage({
  searchParams,
}: {
  searchParams: Promise<{ zone?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const zoneFilter = params.zone || "all";

  const where: Prisma.RideWhereInput = { status: "open" };
  if (zoneFilter !== "all") {
    where.zone = zoneFilter as ZoneValue;
  }

  if (!session?.user) return null;

  const rides = await prisma.ride.findMany({
    where,
    include: { client: true },
    orderBy: { appointmentDate: "asc" },
  });

  const volunteer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { address: true },
  });

  const mapsRouteUrl = (pickupAddress: string, destAddress: string) => {
    const origin = volunteer?.address ? encodeURIComponent(volunteer.address) : "";
    const waypoint = encodeURIComponent(pickupAddress);
    const dest = encodeURIComponent(destAddress);
    if (origin) {
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&waypoints=${waypoint}&destination=${dest}`;
    }
    return `https://www.google.com/maps/dir/?api=1&origin=${waypoint}&destination=${dest}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Open Rides</h1>

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
            return (
              <Card key={ride.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <Avatar src={ride.client?.pictureUrl} name={ride.seniorName} size="md" />
                      <p className="text-xl font-bold text-gray-900">
                        {ride.seniorName}
                      </p>
                    </div>

                    <p className="text-base font-medium text-gray-800">
                      {new Date(ride.appointmentDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      at {ride.appointmentTime}
                    </p>

                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium text-gray-700">Pickup:</span>{" "}
                        {ride.pickupAddress}
                      </p>
                      <p>
                        <span className="font-medium text-gray-700">
                          {ride.facilityName ? `${ride.facilityName}:` : "Drop-off:"}
                        </span>{" "}
                        {ride.destinationAddress}
                      </p>
                    </div>

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

                    <a
                      href={mapsRouteUrl(ride.pickupAddress, ride.destinationAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      📍 View Route in Maps
                    </a>
                  </div>

                  <div className="sm:self-center">
                    <AcceptButton
                      rideId={ride.id}
                      userId={session.user.id}
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
