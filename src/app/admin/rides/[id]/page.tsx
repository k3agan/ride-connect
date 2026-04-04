import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  StatusBadge,
  TripTypeBadge,
  AccessibilityIndicators,
  ZoneBadge,
} from "@/components/ride-badges";
import { AdminRideActions } from "../../ride-actions";

export default async function RideDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const ride = await prisma.ride.findUnique({
    where: { id },
    include: {
      claimedBy: { select: { name: true, email: true, phone: true } },
      createdBy: { select: { name: true } },
    },
  });

  if (!ride) notFound();

  const auditLog = await prisma.rideAuditLog.findMany({
    where: { rideId: id },
    include: { actor: { select: { name: true, role: true } } },
    orderBy: { timestamp: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Ride: {ride.seniorName}
      </h1>

      <Card>
        <CardBody>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={ride.status} />
              <TripTypeBadge tripType={ride.tripType} />
              <ZoneBadge zone={ride.zone} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Senior</h3>
                <dl className="space-y-1 text-sm text-gray-600">
                  <div>
                    <dt className="font-medium inline">Name:</dt>{" "}
                    <dd className="inline">{ride.seniorName}</dd>
                  </div>
                  <div>
                    <dt className="font-medium inline">Phone:</dt>{" "}
                    <dd className="inline">
                      <a href={`tel:${ride.seniorPhone}`} className="text-blue-600 hover:underline">
                        {ride.seniorPhone}
                      </a>
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Appointment</h3>
                <dl className="space-y-1 text-sm text-gray-600">
                  <div>
                    <dt className="font-medium inline">Date:</dt>{" "}
                    <dd className="inline">
                      {new Date(ride.appointmentDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium inline">Time:</dt>{" "}
                    <dd className="inline">{ride.appointmentTime}</dd>
                  </div>
                  <div>
                    <dt className="font-medium inline">Duration:</dt>{" "}
                    <dd className="inline">{ride.appointmentDuration}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Addresses</h3>
              <dl className="space-y-1 text-sm text-gray-600">
                <div>
                  <dt className="font-medium inline">Pickup:</dt>{" "}
                  <dd className="inline">{ride.pickupAddress}</dd>
                </div>
                <div>
                  <dt className="font-medium inline">Destination:</dt>{" "}
                  <dd className="inline">{ride.destinationAddress}</dd>
                </div>
              </dl>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Accessibility</h3>
              <AccessibilityIndicators
                mobilityAid={ride.mobilityAid}
                mobilityAidNotes={ride.mobilityAidNotes}
                assistanceInOut={ride.assistanceInOut}
              />
              {ride.mobilityAid === "none" && !ride.assistanceInOut && (
                <p className="text-sm text-gray-500">No accessibility requirements</p>
              )}
            </div>

            {ride.claimedBy && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Assigned Volunteer</h3>
                <dl className="space-y-1 text-sm text-gray-600">
                  <div>
                    <dt className="font-medium inline">Name:</dt>{" "}
                    <dd className="inline">{ride.claimedBy.name}</dd>
                  </div>
                  <div>
                    <dt className="font-medium inline">Email:</dt>{" "}
                    <dd className="inline">{ride.claimedBy.email}</dd>
                  </div>
                  {ride.claimedBy.phone && (
                    <div>
                      <dt className="font-medium inline">Phone:</dt>{" "}
                      <dd className="inline">{ride.claimedBy.phone}</dd>
                    </div>
                  )}
                  {ride.claimedAt && (
                    <div>
                      <dt className="font-medium inline">Claimed at:</dt>{" "}
                      <dd className="inline">
                        {new Date(ride.claimedAt).toLocaleString()}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {ride.notes && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Notes</h3>
                <p className="text-sm text-gray-600">{ride.notes}</p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100">
              <AdminRideActions rideId={ride.id} status={ride.status} />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">History</h2>
        </CardHeader>
        <CardBody>
          {auditLog.length === 0 ? (
            <p className="text-sm text-gray-500">No history recorded.</p>
          ) : (
            <ol className="space-y-3">
              {auditLog.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-start gap-3 text-sm text-gray-600"
                >
                  <span className="shrink-0 text-xs text-gray-400 font-mono min-w-[140px]">
                    {new Date(entry.timestamp).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                  <span>
                    <span className="font-medium capitalize">{entry.action}</span>
                    {entry.actor && (
                      <>
                        {" "}
                        by {entry.actor.name} ({entry.actor.role})
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
