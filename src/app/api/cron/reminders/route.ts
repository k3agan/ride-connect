import { prisma } from "@/lib/db";
import { notifyRideReminder, notifyCallReminder } from "@/lib/notifications";
import { NextResponse } from "next/server";

/**
 * Cron endpoint: sends reminders for upcoming rides.
 * Intended to be called by Vercel Cron or an external scheduler
 * daily. Sends:
 * - 2-day-before "call client" reminders
 * - 24h and 2h before appointment reminders
 *
 * Protected by a simple bearer token (CRON_SECRET env var).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  let sent = 0;

  // 2-day-before "call client" reminders for confirmed rides
  const ridesIn2Days = await prisma.ride.findMany({
    where: {
      status: "confirmed",
      claimedById: { not: null },
      appointmentDate: {
        gte: new Date(in2Days.toISOString().split("T")[0]),
        lte: new Date(new Date(in2Days.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]),
      },
    },
  });

  for (const ride of ridesIn2Days) {
    const alreadySent = await prisma.notification.findFirst({
      where: {
        rideId: ride.id,
        type: "call_reminder",
      },
    });

    if (!alreadySent) {
      await notifyCallReminder(ride);
      await prisma.notification.create({
        data: {
          userId: ride.claimedById!,
          rideId: ride.id,
          type: "call_reminder",
          channel: "email",
          sentAt: new Date(),
          status: "sent",
        },
      });
      sent++;
    }
  }

  // 24h and 2h appointment reminders for confirmed rides
  const ridesUpcoming = await prisma.ride.findMany({
    where: {
      status: "confirmed",
      claimedById: { not: null },
      OR: [
        {
          appointmentDate: {
            gte: new Date(in24Hours.toISOString().split("T")[0]),
            lte: new Date(in25Hours.toISOString().split("T")[0]),
          },
        },
        {
          appointmentDate: {
            equals: new Date(now.toISOString().split("T")[0]),
          },
        },
      ],
    },
  });

  for (const ride of ridesUpcoming) {
    const [hours, minutes] = ride.appointmentTime.split(":").map(Number);
    const appointmentDateTime = new Date(ride.appointmentDate);
    appointmentDateTime.setHours(hours, minutes, 0, 0);

    const hoursUntil =
      (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if ((hoursUntil > 23 && hoursUntil < 25) || (hoursUntil > 1.5 && hoursUntil < 2.5)) {
      const alreadySent = await prisma.notification.findFirst({
        where: {
          rideId: ride.id,
          type: "reminder",
          sentAt: { gte: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
        },
      });

      if (!alreadySent) {
        await notifyRideReminder(ride);
        await prisma.notification.create({
          data: {
            userId: ride.claimedById!,
            rideId: ride.id,
            type: "reminder",
            channel: "email",
            sentAt: new Date(),
            status: "sent",
          },
        });
        sent++;
      }
    }
  }

  return NextResponse.json({
    sent,
    checked: ridesIn2Days.length + ridesUpcoming.length,
  });
}
