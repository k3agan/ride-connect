import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  StatusBadge,
  TripTypeBadge,
  AccessibilityIndicators,
  ZoneBadge,
} from "@/components/ride-badges";
import { AdminRideActions } from "./ride-actions";
import { Avatar } from "@/components/avatar";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status || "all";

  const where =
    statusFilter === "all"
      ? { status: { not: "deleted" as const } }
      : { status: statusFilter as "open" | "booked" | "confirmed" | "completed" | "deleted" };

  const rides = await prisma.ride.findMany({
    where,
    include: {
      claimedBy: { select: { name: true, email: true } },
      client: { select: { name: true, phone: true, pictureUrl: true } },
    },
    orderBy: { appointmentDate: "asc" },
  });

  const counts = await prisma.ride.groupBy({
    by: ["status"],
    _count: true,
  });

  const countMap: Record<string, number> = {};
  for (const c of counts) {
    countMap[c.status] = c._count;
  }
  const total = counts.reduce((sum: number, c: { _count: number }) => sum + c._count, 0);

  const filters = [
    { value: "all", label: `All (${total})` },
    { value: "open", label: `Open (${countMap["open"] || 0})` },
    { value: "booked", label: `Booked (${countMap["booked"] || 0})` },
    { value: "confirmed", label: `Confirmed (${countMap["confirmed"] || 0})` },
    { value: "completed", label: `Completed (${countMap["completed"] || 0})` },
    { value: "deleted", label: `Deleted (${countMap["deleted"] || 0})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/admin/clients">
            <Button variant="secondary" size="lg">Manage Clients</Button>
          </Link>
          <Link href="/admin/rides/new">
            <Button size="lg">+ New Ride Request</Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/admin" : `/admin?status=${f.value}`}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {rides.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500 text-lg">No rides found.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {rides.map((ride) => (
            <Card
              key={ride.id}
              className={`p-5 ${ride.status === "booked" ? "ring-2 ring-amber-400 bg-amber-50/30" : ""}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Avatar src={ride.client?.pictureUrl} name={ride.seniorName} size="sm" />
                    <span className="text-lg font-semibold text-gray-900">
                      {ride.seniorName}
                    </span>
                    <StatusBadge status={ride.status} />
                    <TripTypeBadge tripType={ride.tripType} />
                    <ZoneBadge zone={ride.zone} />
                  </div>

                  {ride.status === "booked" && (
                    <p className="text-sm font-medium text-amber-700">
                      ⚠ Action needed: Call client and confirm this ride
                    </p>
                  )}

                  <div className="grid gap-1 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Date:</span>{" "}
                      {new Date(ride.appointmentDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      at {ride.appointmentTime}
                    </p>
                    <p>
                      <span className="font-medium">From:</span> {ride.pickupAddress}
                    </p>
                    <p>
                      <span className="font-medium">To:</span>{" "}
                      {ride.facilityName ? `${ride.facilityName} — ` : ""}
                      {ride.destinationAddress}
                    </p>
                    <p>
                      <span className="font-medium">Duration:</span>{" "}
                      {ride.appointmentDuration}
                    </p>
                    <p>
                      <span className="font-medium">Phone:</span> {ride.seniorPhone}
                    </p>
                    {ride.claimedBy && (
                      <p>
                        <span className="font-medium">Driver:</span>{" "}
                        {ride.claimedBy.name} ({ride.claimedBy.email})
                      </p>
                    )}
                  </div>

                  <AccessibilityIndicators
                    mobilityAid={ride.mobilityAid}
                    mobilityAidNotes={ride.mobilityAidNotes}
                    assistanceInOut={ride.assistanceInOut}
                  />

                  {ride.notes && (
                    <p className="text-sm text-gray-500 italic">Note: {ride.notes}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2 sm:items-end">
                  <Link href={`/admin/rides/${ride.id}`}>
                    <Button variant="secondary" size="sm">
                      View Details
                    </Button>
                  </Link>
                  <AdminRideActions rideId={ride.id} status={ride.status} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
