import { prisma } from "./db";
import { sendEmail } from "./email";
import { type Ride } from "@/generated/prisma/client";

const ZONE_LABELS: Record<string, string> = {
  north_van: "North Van",
  west_van: "Downtown Van",
  downtown_van: "Downtown Van",
  other: "Other",
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export async function notifyNewRide(ride: Ride) {
  const volunteers = await prisma.user.findMany({
    where: { role: "volunteer" },
    select: { email: true },
  });

  if (volunteers.length === 0) return;

  const emails = volunteers.map((v) => v.email);
  const zoneName = ZONE_LABELS[ride.zone] || ride.zone;

  await sendEmail({
    to: emails,
    subject: `New ride: ${zoneName} — ${formatDate(ride.appointmentDate)} at ${ride.appointmentTime}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px;">
        <h2 style="color: #1d4ed8;">New Ride Available</h2>
        <p>A new ride request has been posted:</p>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td style="padding: 8px; font-weight: bold;">Date</td><td style="padding: 8px;">${formatDate(ride.appointmentDate)} at ${ride.appointmentTime}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Zone</td><td style="padding: 8px;">${zoneName}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Trip Type</td><td style="padding: 8px;">${ride.tripType.replace(/_/g, " ")}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Duration</td><td style="padding: 8px;">${ride.appointmentDuration}</td></tr>
        </table>
        <p style="margin-top: 16px;">
          <a href="${process.env.AUTH_URL || "http://localhost:3000"}/rides" 
             style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-size: 16px;">
            View & Claim Ride
          </a>
        </p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
          You're receiving this because you're a registered volunteer with RideConnect.
        </p>
      </div>
    `,
  });

  for (const v of volunteers) {
    await prisma.notification.create({
      data: {
        userId: (await prisma.user.findUnique({ where: { email: v.email } }))!.id,
        rideId: ride.id,
        type: "new_ride",
        channel: "email",
        sentAt: new Date(),
        status: "sent",
      },
    });
  }
}

export async function notifyRideClaimed(ride: Ride, volunteerEmail: string) {
  await sendEmail({
    to: volunteerEmail,
    subject: `Ride confirmed: ${ride.seniorName} — ${formatDate(ride.appointmentDate)}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px;">
        <h2 style="color: #16a34a;">Ride Confirmed!</h2>
        <p>You've successfully claimed this ride:</p>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td style="padding: 8px; font-weight: bold;">Senior</td><td style="padding: 8px;">${ride.seniorName}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Phone</td><td style="padding: 8px;"><a href="tel:${ride.seniorPhone}">${ride.seniorPhone}</a></td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Date</td><td style="padding: 8px;">${formatDate(ride.appointmentDate)} at ${ride.appointmentTime}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Pickup</td><td style="padding: 8px;">${ride.pickupAddress}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Destination</td><td style="padding: 8px;">${ride.destinationAddress}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Duration</td><td style="padding: 8px;">${ride.appointmentDuration}</td></tr>
        </table>
        <p style="margin-top: 16px;">
          <a href="${process.env.AUTH_URL || "http://localhost:3000"}/my-rides"
             style="background: #1d4ed8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-size: 16px;">
            View My Rides
          </a>
        </p>
      </div>
    `,
  });

  // Also notify staff
  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    select: { email: true },
  });

  if (admins.length > 0) {
    const volunteer = await prisma.user.findUnique({
      where: { email: volunteerEmail },
      select: { name: true },
    });

    await sendEmail({
      to: admins.map((a) => a.email),
      subject: `Ride claimed: ${ride.seniorName} — ${volunteer?.name || volunteerEmail}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px;">
          <h2 style="color: #1d4ed8;">Ride Claimed</h2>
          <p><strong>${volunteer?.name || volunteerEmail}</strong> has claimed the ride for <strong>${ride.seniorName}</strong> on ${formatDate(ride.appointmentDate)} at ${ride.appointmentTime}.</p>
          <p>
            <a href="${process.env.AUTH_URL || "http://localhost:3000"}/admin/rides/${ride.id}"
               style="color: #1d4ed8;">View ride details →</a>
          </p>
        </div>
      `,
    });
  }
}

export async function notifyRideCancelled(ride: Ride, cancelledByName: string) {
  // Notify staff
  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    select: { email: true },
  });

  if (admins.length > 0) {
    await sendEmail({
      to: admins.map((a) => a.email),
      subject: `Ride unclaimed: ${ride.seniorName} — ${formatDate(ride.appointmentDate)}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px;">
          <h2 style="color: #dc2626;">Ride Unclaimed</h2>
          <p><strong>${cancelledByName}</strong> has cancelled their claim on the ride for <strong>${ride.seniorName}</strong> on ${formatDate(ride.appointmentDate)} at ${ride.appointmentTime}.</p>
          <p>This ride is now available again for other volunteers.</p>
          <p>
            <a href="${process.env.AUTH_URL || "http://localhost:3000"}/admin/rides/${ride.id}"
               style="color: #1d4ed8;">View ride details →</a>
          </p>
        </div>
      `,
    });
  }

  // Re-notify volunteers that it's available
  const volunteers = await prisma.user.findMany({
    where: { role: "volunteer" },
    select: { email: true },
  });

  if (volunteers.length > 0) {
    const zoneName = ZONE_LABELS[ride.zone] || ride.zone;
    await sendEmail({
      to: volunteers.map((v) => v.email),
      subject: `Ride available again: ${zoneName} — ${formatDate(ride.appointmentDate)} at ${ride.appointmentTime}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px;">
          <h2 style="color: #1d4ed8;">Ride Available Again</h2>
          <p>A previously claimed ride is now available:</p>
          <table style="border-collapse: collapse; width: 100%;">
            <tr><td style="padding: 8px; font-weight: bold;">Date</td><td style="padding: 8px;">${formatDate(ride.appointmentDate)} at ${ride.appointmentTime}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Zone</td><td style="padding: 8px;">${zoneName}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Duration</td><td style="padding: 8px;">${ride.appointmentDuration}</td></tr>
          </table>
          <p style="margin-top: 16px;">
            <a href="${process.env.AUTH_URL || "http://localhost:3000"}/rides"
               style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-size: 16px;">
              View & Claim Ride
            </a>
          </p>
        </div>
      `,
    });
  }
}

export async function notifyRideReminder(ride: Ride) {
  if (!ride.claimedById) return;

  const volunteer = await prisma.user.findUnique({
    where: { id: ride.claimedById },
    select: { email: true, name: true },
  });

  if (!volunteer) return;

  await sendEmail({
    to: volunteer.email,
    subject: `Reminder: ${ride.seniorName} — ${formatDate(ride.appointmentDate)} at ${ride.appointmentTime}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px;">
        <h2 style="color: #1d4ed8;">Upcoming Ride Reminder</h2>
        <p>Hi ${volunteer.name},</p>
        <p>This is a reminder about your upcoming ride:</p>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td style="padding: 8px; font-weight: bold;">Senior</td><td style="padding: 8px;">${ride.seniorName}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Phone</td><td style="padding: 8px;"><a href="tel:${ride.seniorPhone}">${ride.seniorPhone}</a></td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Date</td><td style="padding: 8px;">${formatDate(ride.appointmentDate)} at ${ride.appointmentTime}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Pickup</td><td style="padding: 8px;">${ride.pickupAddress}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Destination</td><td style="padding: 8px;">${ride.destinationAddress}</td></tr>
        </table>
        <p style="margin-top: 16px;">
          <a href="${process.env.AUTH_URL || "http://localhost:3000"}/my-rides"
             style="background: #1d4ed8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-size: 16px;">
            View My Rides
          </a>
        </p>
      </div>
    `,
  });
}
