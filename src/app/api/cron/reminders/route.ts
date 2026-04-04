import { prisma } from "@/lib/db";
import { notifyRideReminder } from "@/lib/notifications";
import { NextResponse } from "next/server";

/**
 * Cron endpoint: sends reminders for upcoming rides.
 * Intended to be called by Vercel Cron or an external scheduler
 * every hour. Sends reminders at 24h and 2h before appointment.
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
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  // Find rides happening in ~24 hours or ~2 hours
  const rides = await prisma.ride.findMany({
    where: {
      status: "claimed",
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

  let sent = 0;
  for (const ride of rides) {
    const [hours, minutes] = ride.appointmentTime.split(":").map(Number);
    const appointmentDateTime = new Date(ride.appointmentDate);
    appointmentDateTime.setHours(hours, minutes, 0, 0);

    const hoursUntil =
      (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Send reminder if appointment is ~24h or ~2h away
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
        sent++;
      }
    }
  }

  return NextResponse.json({ sent, checked: rides.length });
}
