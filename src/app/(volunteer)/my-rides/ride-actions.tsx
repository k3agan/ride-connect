"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { unclaimRide, completeRide, updateVolunteerNotes } from "@/lib/actions/rides";

interface RideActionsProps {
  ride: {
    id: string;
    seniorName: string;
    pickupAddress: string;
    destinationAddress: string;
    facilityName: string | null;
    appointmentDate: Date;
    appointmentTime: string;
    appointmentDuration: string;
    status: string;
    volunteerNotes: string | null;
  };
}

export function RideActions({ ride }: RideActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(ride.volunteerNotes || "");

  const handleCancel = () => {
    if (!confirm("Are you sure you want to cancel this ride? It will be made available for other volunteers.")) return;
    startTransition(async () => {
      await unclaimRide(ride.id);
    });
  };

  const handleSaveNotes = () => {
    startTransition(async () => {
      await updateVolunteerNotes(ride.id, notes);
      setShowNotes(false);
    });
  };

  const handleComplete = () => {
    if (!confirm("Mark this ride as completed? KM and duration will be calculated automatically.")) return;
    startTransition(async () => {
      await completeRide(ride.id);
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

    const description = [
      `Pickup: ${ride.pickupAddress}`,
      ride.facilityName ? `Facility: ${ride.facilityName}` : null,
      `Destination: ${ride.destinationAddress}`,
      `Duration: ${ride.appointmentDuration}`,
      ride.volunteerNotes ? `Notes: ${ride.volunteerNotes}` : null,
    ].filter(Boolean).join("\\n");

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//RideConnect//EN",
      "BEGIN:VEVENT",
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:Drive ${ride.seniorName}${ride.facilityName ? ` to ${ride.facilityName}` : ""}`,
      `LOCATION:${ride.pickupAddress}`,
      `DESCRIPTION:${description}`,
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
    <div className="space-y-3 pt-3 border-t border-gray-100">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="md" onClick={handleDownloadICS}>
          📅 Add to Calendar
        </Button>

        <Button
          variant="secondary"
          size="md"
          onClick={() => setShowNotes(!showNotes)}
        >
          ✏️ {ride.volunteerNotes ? "Edit Notes" : "Add Notes"}
        </Button>

        {ride.status === "confirmed" && (
          <Button
            variant="success"
            size="md"
            onClick={handleComplete}
            disabled={isPending}
          >
            {isPending ? "Completing..." : "✓ Complete Ride"}
          </Button>
        )}

        <Button
          variant="danger"
          size="md"
          onClick={handleCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>

      {showNotes && (
        <div className="rounded-lg border border-gray-200 p-3 space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Pickup notes (e.g., &quot;Pick up at P1 elevator at 12:10&quot;)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Add details after calling the client..."
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveNotes} disabled={isPending}>
              {isPending ? "Saving..." : "Save Notes"}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShowNotes(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
