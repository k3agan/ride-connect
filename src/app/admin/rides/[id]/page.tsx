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
      client: true,
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

      {ride.status === "booked" && (
        <div className="rounded-lg bg-amber-50 border-2 border-amber-400 p-4">
          <p className="font-medium text-amber-800">
            ⚠ This ride is booked but not yet confirmed. Please call the client and then confirm.
          </p>
        </div>
      )}

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
                <h3 className="font-semibold text-gray-900">Client</h3>
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
                  {ride.client && (
                    <>
                      {ride.client.mobilityAid !== "none" && (
                        <div>
                          <dt className="font-medium inline">Mobility Aid:</dt>{" "}
                          <dd className="inline capitalize">{ride.client.mobilityAid}</dd>
                        </div>
                      )}
                      {ride.client.assistanceInOut && (
                        <div>
                          <dd className="text-amber-700 font-medium">Needs assistance in/out of vehicle</dd>
                        </div>
                      )}
                      {ride.client.generalNotes && (
                        <div>
                          <dt className="font-medium inline">Client Notes:</dt>{" "}
                          <dd className="inline italic">{ride.client.generalNotes}</dd>
                        </div>
                      )}
                    </>
                  )}
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
                {ride.facilityName && (
                  <div>
                    <dt className="font-medium inline">Facility:</dt>{" "}
                    <dd className="inline">{ride.facilityName}</dd>
                  </div>
                )}
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
                      <dt className="font-medium inline">Booked at:</dt>{" "}
                      <dd className="inline">
                        {new Date(ride.claimedAt).toLocaleString()}
                      </dd>
                    </div>
                  )}
                  {ride.confirmedAt && (
                    <div>
                      <dt className="font-medium inline">Confirmed at:</dt>{" "}
                      <dd className="inline">
                        {new Date(ride.confirmedAt).toLocaleString()}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {ride.volunteerNotes && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Volunteer Notes</h3>
                <p className="text-sm text-gray-600 bg-blue-50 rounded-lg p-3">{ride.volunteerNotes}</p>
              </div>
            )}

            {ride.notes && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Ride Notes</h3>
                <p className="text-sm text-gray-600">{ride.notes}</p>
              </div>
            )}

            {ride.status === "completed" && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Trip Details</h3>
                <dl className="space-y-1 text-sm text-gray-600">
                  {ride.completedAt && (
                    <div>
                      <dt className="font-medium inline">Completed at:</dt>{" "}
                      <dd className="inline">{new Date(ride.completedAt).toLocaleString()}</dd>
                    </div>
                  )}
                  {ride.kmDriven != null && (
                    <div>
                      <dt className="font-medium inline">KM driven:</dt>{" "}
                      <dd className="inline">{ride.kmDriven}</dd>
                    </div>
                  )}
                  {ride.actualDurationMinutes != null && (
                    <div>
                      <dt className="font-medium inline">Actual duration:</dt>{" "}
                      <dd className="inline">{ride.actualDurationMinutes} minutes</dd>
                    </div>
                  )}
                </dl>
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
