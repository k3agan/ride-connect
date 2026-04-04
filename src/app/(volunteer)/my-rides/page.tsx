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

export default async function MyRidesPage() {
  const session = await auth();
  if (!session?.user) return null;

  const rides = await prisma.ride.findMany({
    where: { claimedById: session.user.id },
    orderBy: { appointmentDate: "asc" },
  });

  const upcoming = rides.filter(
    (r) => r.status === "claimed" || r.status === "in_progress"
  );
  const past = rides.filter(
    (r) => r.status === "completed" || r.status === "cancelled"
  );

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
                available rides
              </a>{" "}
              to claim one.
            </p>
          </Card>
        ) : (
          upcoming.map((ride) => (
            <RideCard key={ride.id} ride={ride} showActions />
          ))
        )}
      </section>

      {past.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Past Rides</h2>
          {past.map((ride) => (
            <RideCard key={ride.id} ride={ride} showActions={false} />
          ))}
        </section>
      )}
    </div>
  );
}

function RideCard({
  ride,
  showActions,
}: {
  ride: {
    id: string;
    seniorName: string;
    seniorPhone: string;
    pickupAddress: string;
    destinationAddress: string;
    appointmentDate: Date;
    appointmentTime: string;
    appointmentDuration: string;
    tripType: "one_way" | "round_trip" | "one_way_possible";
    mobilityAid: "none" | "walker" | "cane" | "wheelchair" | "other";
    mobilityAidNotes: string | null;
    assistanceInOut: boolean;
    zone: "north_van" | "west_van" | "downtown_van" | "other";
    status: "available" | "claimed" | "in_progress" | "completed" | "cancelled";
    notes: string | null;
  };
  showActions: boolean;
}) {
  const mapsUrl = (address: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

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

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">
              {ride.seniorName}
            </h3>

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
              href={mapsUrl(ride.pickupAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm text-blue-600 hover:underline"
            >
              Open in Maps →
            </a>
          </div>

          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-700">Appointment</p>
            <p className="text-base text-gray-900">
              {ride.destinationAddress}
            </p>
            <a
              href={mapsUrl(ride.destinationAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm text-blue-600 hover:underline"
            >
              Open in Maps →
            </a>
          </div>
        </div>

        <AccessibilityIndicators
          mobilityAid={ride.mobilityAid}
          mobilityAidNotes={ride.mobilityAidNotes}
          assistanceInOut={ride.assistanceInOut}
        />

        {ride.notes && (
          <p className="text-sm text-gray-500 italic">Note: {ride.notes}</p>
        )}

        {showActions && (
          <RideActions ride={ride} />
        )}
      </div>
    </Card>
  );
}
