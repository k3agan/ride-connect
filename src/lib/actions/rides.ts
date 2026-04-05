"use server";

import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { notifyNewRide, notifyRideBooked, notifyRideConfirmed, notifyRideCancelled } from "@/lib/notifications";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type TripType, type Zone } from "@/generated/prisma/client";
import { estimateRideDistance } from "@/lib/distance";

export async function getClientRideHistory(clientId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return prisma.ride.findMany({
    where: {
      clientId,
      status: { not: "deleted" },
    },
    orderBy: { appointmentDate: "desc" },
    take: 10,
    select: {
      id: true,
      pickupAddress: true,
      facilityName: true,
      destinationAddress: true,
      appointmentDate: true,
      appointmentTime: true,
      appointmentDuration: true,
      tripType: true,
      zone: true,
      notes: true,
      status: true,
    },
  });
}

interface CreateRideInput {
  clientId: string;
  pickupAddress: string;
  facilityName: string;
  destinationAddress: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentDuration: string;
  tripType: TripType;
  zone: Zone;
  notes: string;
}

export async function createRide(input: CreateRideInput) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const client = await prisma.client.findUnique({ where: { id: input.clientId } });
  if (!client) {
    throw new Error("Client not found");
  }

  const ride = await prisma.ride.create({
    data: {
      clientId: client.id,
      seniorName: client.name,
      seniorPhone: client.phone,
      pickupAddress: input.pickupAddress || client.address,
      facilityName: input.facilityName || null,
      destinationAddress: input.destinationAddress,
      appointmentDate: new Date(input.appointmentDate),
      appointmentTime: input.appointmentTime,
      appointmentDuration: input.appointmentDuration,
      tripType: input.tripType,
      mobilityAid: client.mobilityAid,
      assistanceInOut: client.assistanceInOut,
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
      clientName: client.name,
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

export async function acceptRide(rideId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride || ride.status !== "open") {
    return { error: "This ride has already been taken or is no longer available." };
  }

  const result = await prisma.ride.updateMany({
    where: {
      id: rideId,
      status: "open",
      version: ride.version,
    },
    data: {
      status: "booked",
      claimedById: session.user.id,
      claimedAt: new Date(),
      version: ride.version + 1,
    },
  });

  if (result.count === 0) {
    return { error: "This ride has already been taken by another volunteer." };
  }

  await logAudit({
    rideId,
    actorId: session.user.id,
    action: "booked",
    oldValues: { status: "open" },
    newValues: { status: "booked", claimedBy: session.user.id },
  });

  const updatedRide = await prisma.ride.findUnique({ where: { id: rideId } });
  if (updatedRide) {
    notifyRideBooked(updatedRide, session.user.name || session.user.email).catch(console.error);
  }

  revalidatePath("/rides");
  revalidatePath("/my-rides");
  revalidatePath("/admin");
  return { success: true };
}

export async function confirmRide(rideId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride || ride.status !== "booked") {
    return { error: "This ride is not in booked status." };
  }

  await prisma.ride.update({
    where: { id: rideId },
    data: {
      status: "confirmed",
      confirmedAt: new Date(),
      version: { increment: 1 },
    },
  });

  await logAudit({
    rideId,
    actorId: session.user.id,
    action: "confirmed",
    oldValues: { status: "booked" },
    newValues: { status: "confirmed" },
  });

  if (ride.claimedById) {
    notifyRideConfirmed(ride, ride.claimedById).catch(console.error);
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
      status: "open",
      claimedById: null,
      claimedAt: null,
      confirmedAt: null,
      version: { increment: 1 },
    },
  });

  await logAudit({
    rideId,
    actorId: session.user.id,
    action: "unclaimed",
    oldValues: { status: ride.status, claimedBy: ride.claimedById },
    newValues: { status: "open", claimedBy: null },
  });

  notifyRideCancelled(ride, session.user.name || session.user.email).catch(console.error);

  revalidatePath("/rides");
  revalidatePath("/my-rides");
  revalidatePath("/admin");
  return { success: true };
}

export async function completeRide(rideId: string) {
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
    return { error: "You can only complete your own rides." };
  }

  const { kmDriven, estimatedMinutes } = estimateRideDistance(ride.zone, ride.tripType);

  await prisma.ride.update({
    where: { id: rideId },
    data: {
      status: "completed",
      completedAt: new Date(),
      kmDriven,
      actualDurationMinutes: estimatedMinutes,
      version: { increment: 1 },
    },
  });

  await logAudit({
    rideId,
    actorId: session.user.id,
    action: "completed",
    oldValues: { status: ride.status },
    newValues: { status: "completed", kmDriven, estimatedMinutes },
  });

  revalidatePath("/rides");
  revalidatePath("/my-rides");
  revalidatePath("/admin");
  return { success: true };
}

export async function updateVolunteerNotes(rideId: string, volunteerNotes: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const ride = await prisma.ride.findUnique({ where: { id: rideId } });
  if (!ride || ride.claimedById !== session.user.id) {
    return { error: "You can only add notes to your own rides." };
  }

  await prisma.ride.update({
    where: { id: rideId },
    data: { volunteerNotes },
  });

  revalidatePath("/my-rides");
  return { success: true };
}

export async function deleteRide(rideId: string) {
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
    data: { status: "deleted", version: { increment: 1 } },
  });

  await logAudit({
    rideId,
    actorId: session.user.id,
    action: "deleted",
    oldValues: { status: ride.status },
    newValues: { status: "deleted" },
  });

  revalidatePath("/admin");
  revalidatePath("/rides");
  return { success: true };
}
