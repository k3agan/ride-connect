import { prisma } from "@/lib/db";
import { NewRideForm, type NewRideInitialTemplate } from "./form";
import { type TripType, type Zone } from "@/generated/prisma/client";

export default async function NewRidePage({
  searchParams,
}: {
  searchParams: Promise<{ fromRide?: string }>;
}) {
  const params = await searchParams;
  const fromRideId = params.fromRide;

  const [clients, locations, sourceRide] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.location.findMany({ orderBy: { name: "asc" } }),
    fromRideId
      ? prisma.ride.findFirst({
          where: { id: fromRideId, status: { not: "deleted" } },
          select: {
            clientId: true,
            pickupAddress: true,
            facilityName: true,
            destinationAddress: true,
            appointmentTime: true,
            appointmentDuration: true,
            tripType: true,
            zone: true,
            notes: true,
          },
        })
      : null,
  ]);

  let initialTemplate: NewRideInitialTemplate | null = null;
  if (sourceRide?.clientId) {
    initialTemplate = {
      clientId: sourceRide.clientId,
      pickupAddress: sourceRide.pickupAddress,
      facilityName: sourceRide.facilityName,
      destinationAddress: sourceRide.destinationAddress,
      appointmentTime: sourceRide.appointmentTime,
      appointmentDuration: sourceRide.appointmentDuration,
      tripType: sourceRide.tripType as TripType,
      zone: sourceRide.zone as Zone,
      notes: sourceRide.notes,
    };
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">New Ride Request</h1>
      {initialTemplate && (
        <p className="text-sm text-gray-600">
          Pre-filled from an existing ride — set the new date (and adjust anything else if needed), then publish.
        </p>
      )}
      <NewRideForm
        key={fromRideId ?? "new"}
        clients={clients}
        locations={locations}
        initialTemplate={initialTemplate}
      />
    </div>
  );
}
