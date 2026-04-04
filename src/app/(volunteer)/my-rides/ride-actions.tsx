"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { unclaimRide, updateRideStatus } from "@/lib/actions/rides";

interface RideActionsProps {
  ride: {
    id: string;
    seniorName: string;
    pickupAddress: string;
    destinationAddress: string;
    appointmentDate: Date;
    appointmentTime: string;
    appointmentDuration: string;
    status: string;
  };
}

export function RideActions({ ride }: RideActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    if (!confirm("Are you sure you want to cancel this ride? It will be made available for other volunteers.")) return;
    startTransition(async () => {
      await unclaimRide(ride.id);
    });
  };

  const handleComplete = () => {
    if (!confirm("Mark this ride as completed?")) return;
    startTransition(async () => {
      await updateRideStatus(ride.id, "completed");
    });
  };

  const handleDownloadICS = () => {
    const dateStr = new Date(ride.appointmentDate).toISOString().split("T")[0];
    const [hours, minutes] = ride.appointmentTime.split(":");
    const start = new Date(ride.appointmentDate);
    start.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const durationMatch = ride.appointmentDuration.match(/(\d+)/);
    const durationHours = durationMatch ? parseInt(durationMatch[1]) : 1;
    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

    const fmt = (d: Date) =>
      d
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, "");

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//RideConnect//EN",
      "BEGIN:VEVENT",
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:Drive ${ride.seniorName}`,
      `LOCATION:${ride.pickupAddress}`,
      `DESCRIPTION:Pickup: ${ride.pickupAddress}\\nDestination: ${ride.destinationAddress}\\nDuration: ${ride.appointmentDuration}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ride-${ride.seniorName.replace(/\s+/g, "-").toLowerCase()}-${dateStr}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
      <Button
        variant="secondary"
        size="md"
        onClick={handleDownloadICS}
      >
        📅 Add to Calendar
      </Button>

      {ride.status === "claimed" && (
        <Button
          variant="success"
          size="md"
          onClick={handleComplete}
          disabled={isPending}
        >
          ✓ Mark Completed
        </Button>
      )}

      <Button
        variant="danger"
        size="md"
        onClick={handleCancel}
        disabled={isPending}
      >
        Cancel My Claim
      </Button>
    </div>
  );
}
