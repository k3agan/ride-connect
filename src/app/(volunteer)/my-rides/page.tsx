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

  const completed = past.filter((r) => r.status === "completed");
  const totalKm = completed.reduce((sum, r) => sum + (r.kmDriven || 0), 0);
  const totalMinutes = completed.reduce((sum, r) => sum + (r.actualDurationMinutes || 0), 0);
  const uniqueClients = new Set(completed.map((r) => r.seniorName)).size;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">My Rides</h1>

      {completed.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{completed.length}</p>
            <p className="text-xs text-gray-500 mt-1">Rides Completed</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{uniqueClients}</p>
            <p className="text-xs text-gray-500 mt-1">Clients Helped</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{totalKm > 0 ? totalKm.toFixed(1) : "—"}</p>
            <p className="text-xs text-gray-500 mt-1">Est. KM</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">
              {totalMinutes > 0 ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : "—"}
            </p>
            <p className="text-xs text-gray-500 mt-1">Est. Time</p>
          </Card>
        </div>
      )}

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

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Ride History</h2>
        {past.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-gray-500">
              No past rides yet. Your completed rides will appear here.
            </p>
          </Card>
        ) : (
          past.map((ride) => (
            <HistoryCard key={ride.id} ride={ride} />
          ))
        )}
      </section>
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
            className="inline-flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-base font-medium text-blue-700 hover:bg-blue-100 transition-colors w-full sm:w-auto justify-center"
          >
            <span aria-hidden="true">📍</span> View Full Route in Maps
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

function HistoryCard({
  ride,
}: {
  ride: {
    id: string;
    seniorName: string;
    pickupAddress: string;
    facilityName: string | null;
    destinationAddress: string;
    appointmentDate: Date;
    appointmentTime: string;
    status: "open" | "booked" | "confirmed" | "completed" | "deleted";
    zone: "north_van" | "west_van" | "downtown_van" | "other";
    kmDriven: number | null;
    actualDurationMinutes: number | null;
    volunteerNotes: string | null;
    completedAt?: Date | null;
    client?: { pictureUrl: string | null } | null;
  };
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <Avatar src={ride.client?.pictureUrl} name={ride.seniorName} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-gray-900">{ride.seniorName}</span>
            <StatusBadge status={ride.status} />
            <ZoneBadge zone={ride.zone} />
          </div>
          <p className="text-sm text-gray-600">
            {new Date(ride.appointmentDate).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}{" "}
            at {ride.appointmentTime}
            {" · "}
            {ride.facilityName
              ? `${ride.facilityName}`
              : ride.destinationAddress}
          </p>
          {ride.volunteerNotes && (
            <p className="text-sm text-gray-400 italic truncate mt-0.5">
              Note: {ride.volunteerNotes}
            </p>
          )}
        </div>
        {ride.status === "completed" && (
          <div className="hidden sm:flex gap-4 text-sm text-gray-500 shrink-0">
            {ride.kmDriven != null && (
              <span className="text-center">
                <span className="block text-lg font-semibold text-gray-700">{ride.kmDriven}</span>
                <span className="text-xs">km</span>
              </span>
            )}
            {ride.actualDurationMinutes != null && (
              <span className="text-center">
                <span className="block text-lg font-semibold text-gray-700">{ride.actualDurationMinutes}</span>
                <span className="text-xs">min</span>
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
