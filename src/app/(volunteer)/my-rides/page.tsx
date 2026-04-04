import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import {
  StatusBadge,
  TripTypeBadge,
  AccessibilityIndicators,
  ZoneBadge,
} from "@/components/ride-badges";
import { RideActions } from "./ride-actions";
import { Avatar } from "@/components/avatar";

export default async function MyRidesPage() {
  const session = await auth();
  if (!session?.user) return null;

  const rides = await prisma.ride.findMany({
    where: { claimedById: session.user.id },
    include: { client: true },
    orderBy: { appointmentDate: "asc" },
  });

  const volunteer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { address: true },
  });

  const upcoming = rides.filter(
    (r) => r.status === "booked" || r.status === "confirmed"
  );
  const past = rides.filter(
    (r) => r.status === "completed" || r.status === "deleted"
  );

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
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">My Rides</h1>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Upcoming</h2>
        {upcoming.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-gray-500">
              No upcoming rides. Browse{" "}
              <a href="/rides" className="text-blue-600 hover:underline">
                open rides
              </a>{" "}
              to accept one.
            </p>
          </Card>
        ) : (
          upcoming.map((ride) => (
            <RideCard key={ride.id} ride={ride} mapsRouteUrl={mapsRouteUrl} showActions />
          ))
        )}
      </section>

      {past.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Past Rides</h2>
          {past.map((ride) => (
            <RideCard key={ride.id} ride={ride} mapsRouteUrl={mapsRouteUrl} showActions={false} />
          ))}
        </section>
      )}
    </div>
  );
}

function RideCard({
  ride,
  mapsRouteUrl,
  showActions,
}: {
  ride: {
    id: string;
    seniorName: string;
    seniorPhone: string;
    pickupAddress: string;
    facilityName: string | null;
    destinationAddress: string;
    appointmentDate: Date;
    appointmentTime: string;
    appointmentDuration: string;
    tripType: "one_way" | "round_trip" | "one_way_possible";
    mobilityAid: "none" | "walker" | "cane" | "wheelchair" | "other";
    mobilityAidNotes: string | null;
    assistanceInOut: boolean;
    zone: "north_van" | "west_van" | "downtown_van" | "other";
    status: "open" | "booked" | "confirmed" | "completed" | "deleted";
    notes: string | null;
    volunteerNotes: string | null;
    kmDriven: number | null;
    actualDurationMinutes: number | null;
    client?: { pictureUrl: string | null } | null;
  };
  mapsRouteUrl: (pickup: string, dest: string) => string;
  showActions: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xl font-bold text-gray-900">
            {new Date(ride.appointmentDate).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}{" "}
            at {ride.appointmentTime}
          </span>
          <StatusBadge status={ride.status} />
        </div>

        {ride.status === "booked" && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-sm text-amber-800">
              Awaiting coordinator confirmation. You&apos;ll be notified once confirmed.
            </p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Avatar src={ride.client?.pictureUrl} name={ride.seniorName} size="md" />
              <h3 className="font-semibold text-gray-900">
                {ride.seniorName}
              </h3>
            </div>

            <a
              href={`tel:${ride.seniorPhone}`}
              className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-base font-medium text-green-700 hover:bg-green-100 transition-colors w-full sm:w-auto"
            >
              <span aria-hidden="true">📞</span>
              Call {ride.seniorName.split(" ")[0]} — {ride.seniorPhone}
            </a>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap gap-2">
              <TripTypeBadge tripType={ride.tripType} />
              <ZoneBadge zone={ride.zone} />
            </div>
            <p className="text-sm text-gray-500">
              Duration: {ride.appointmentDuration}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-700">Pickup</p>
            <p className="text-base text-gray-900">{ride.pickupAddress}</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ride.pickupAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm text-blue-600 hover:underline"
            >
              Open in Maps →
            </a>
          </div>

          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-700">
              {ride.facilityName ? `${ride.facilityName}` : "Appointment"}
            </p>
            <p className="text-base text-gray-900">
              {ride.destinationAddress}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ride.destinationAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm text-blue-600 hover:underline"
            >
              Open in Maps →
            </a>
          </div>

          <a
            href={mapsRouteUrl(ride.pickupAddress, ride.destinationAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            📍 View Full Route in Maps
          </a>
        </div>

        <AccessibilityIndicators
          mobilityAid={ride.mobilityAid}
          mobilityAidNotes={ride.mobilityAidNotes}
          assistanceInOut={ride.assistanceInOut}
        />

        {ride.notes && (
          <p className="text-sm text-gray-500 italic">Note: {ride.notes}</p>
        )}

        {ride.volunteerNotes && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
            <p className="text-sm font-medium text-blue-800">Your Notes</p>
            <p className="text-sm text-blue-700">{ride.volunteerNotes}</p>
          </div>
        )}

        {ride.status === "completed" && (ride.kmDriven || ride.actualDurationMinutes) && (
          <div className="flex gap-4 text-sm text-gray-500">
            {ride.kmDriven && <span>KM driven: {ride.kmDriven}</span>}
            {ride.actualDurationMinutes && <span>Duration: {ride.actualDurationMinutes} min</span>}
          </div>
        )}

        {showActions && (
          <RideActions ride={ride} />
        )}
      </div>
    </Card>
  );
}
