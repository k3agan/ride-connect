"use server";

import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { notifyNewRide, notifyRideClaimed, notifyRideCancelled } from "@/lib/notifications";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type TripType, type MobilityAid, type Zone, type RideStatus } from "@/generated/prisma/client";

interface CreateRideInput {
  seniorName: string;
  seniorPhone: string;
  pickupAddress: string;
  destinationAddress: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentDuration: string;
  tripType: TripType;
  mobilityAid: MobilityAid;
  mobilityAidNotes: string;
  assistanceInOut: boolean;
  zone: Zone;
  notes: string;
}

export async function createRide(input: CreateRideInput) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const ride = await prisma.ride.create({
    data: {
      seniorName: input.seniorName,
      seniorPhone: input.seniorPhone,
      pickupAddress: input.pickupAddress,
      destinationAddress: input.destinationAddress,
      appointmentDate: new Date(input.appointmentDate),
      appointmentTime: input.appointmentTime,
      appointmentDuration: input.appointmentDuration,
      tripType: input.tripType,
      mobilityAid: input.mobilityAid,
      mobilityAidNotes: input.mobilityAidNotes || null,
      assistanceInOut: input.assistanceInOut,
      zone: input.zone,
      notes: input.notes || null,
      createdById: session.user.id,
    },
  });

  await logAudit({
    rideId: ride.id,
    actorId: session.user.id,
    action: "created",
    newValues: {
      seniorName: ride.seniorName,
      appointmentDate: ride.appointmentDate.toISOString(),
      appointmentTime: ride.appointmentTime,
      zone: ride.zone,
    },
  });

  notifyNewRide(ride).catch(console.error);

  revalidatePath("/admin");
  revalidatePath("/rides");
  redirect("/admin");
}

export async function claimRide(rideId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride || ride.status !== "available") {
    return { error: "This ride has already been claimed or is no longer available." };
  }

  // Optimistic locking: only update if version hasn't changed
  const result = await prisma.ride.updateMany({
    where: {
      id: rideId,
      status: "available",
      version: ride.version,
    },
    data: {
      status: "claimed",
      claimedById: session.user.id,
      claimedAt: new Date(),
      version: ride.version + 1,
    },
  });

  if (result.count === 0) {
    return { error: "This ride has already been claimed by another volunteer." };
  }

  await logAudit({
    rideId,
    actorId: session.user.id,
    action: "claimed",
    oldValues: { status: "available" },
    newValues: { status: "claimed", claimedBy: session.user.id },
  });

  const updatedRide = await prisma.ride.findUnique({ where: { id: rideId } });
  if (updatedRide) {
    notifyRideClaimed(updatedRide, session.user.email).catch(console.error);
  }

  revalidatePath("/rides");
  revalidatePath("/my-rides");
  revalidatePath("/admin");
  return { success: true };
}

export async function unclaimRide(rideId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride) {
    return { error: "Ride not found." };
  }

  const isAdmin = session.user.role === "admin";
  const isClaimOwner = ride.claimedById === session.user.id;

  if (!isAdmin && !isClaimOwner) {
    return { error: "You can only cancel your own rides." };
  }

  await prisma.ride.update({
    where: { id: rideId },
    data: {
      status: "available",
      claimedById: null,
      claimedAt: null,
      version: { increment: 1 },
    },
  });

  await logAudit({
    rideId,
    actorId: session.user.id,
    action: "unclaimed",
    oldValues: { status: ride.status, claimedBy: ride.claimedById },
    newValues: { status: "available", claimedBy: null },
  });

  notifyRideCancelled(ride, session.user.name || session.user.email).catch(console.error);

  revalidatePath("/rides");
  revalidatePath("/my-rides");
  revalidatePath("/admin");
  return { success: true };
}

export async function updateRideStatus(rideId: string, status: RideStatus) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride) {
    return { error: "Ride not found." };
  }

  await prisma.ride.update({
    where: { id: rideId },
    data: { status, version: { increment: 1 } },
  });

  await logAudit({
    rideId,
    actorId: session.user.id,
    action: status === "completed" ? "completed" : "edited",
    oldValues: { status: ride.status },
    newValues: { status },
  });

  revalidatePath("/rides");
  revalidatePath("/my-rides");
  revalidatePath("/admin");
  return { success: true };
}

export async function cancelRide(rideId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride) {
    return { error: "Ride not found." };
  }

  await prisma.ride.update({
    where: { id: rideId },
    data: { status: "cancelled", version: { increment: 1 } },
  });

  await logAudit({
    rideId,
    actorId: session.user.id,
    action: "cancelled",
    oldValues: { status: ride.status },
    newValues: { status: "cancelled" },
  });

  revalidatePath("/admin");
  revalidatePath("/rides");
  return { success: true };
}
