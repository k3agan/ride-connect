"use client";

import { Button } from "@/components/ui/button";
import { confirmRide, deleteRide, unclaimRide } from "@/lib/actions/rides";
type RideStatus = "open" | "booked" | "confirmed" | "completed" | "deleted";
import { useTransition } from "react";

export function AdminRideActions({
  rideId,
  status,
}: {
  rideId: string;
  status: RideStatus;
}) {
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    if (!confirm("Have you called the client? Confirming will notify the volunteer that the ride is officially theirs.")) return;
    startTransition(() => {
      confirmRide(rideId);
    });
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this ride?")) return;
    startTransition(() => {
      deleteRide(rideId);
    });
  };

  const handleUnclaim = () => {
    if (!confirm("Remove the volunteer assignment and make this ride open again?")) return;
    startTransition(() => {
      unclaimRide(rideId);
    });
  };

  return (
    <div className="flex flex-col gap-1">
      {status === "booked" && (
        <Button
          variant="success"
          size="sm"
          onClick={handleConfirm}
          disabled={isPending}
        >
          ✓ Confirm Ride
        </Button>
      )}
      {(status === "booked" || status === "confirmed") && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleUnclaim}
          disabled={isPending}
        >
          Reassign
        </Button>
      )}
      {(status === "open" || status === "booked" || status === "confirmed") && (
        <Button
          variant="danger"
          size="sm"
          onClick={handleDelete}
          disabled={isPending}
        >
          Delete Ride
        </Button>
      )}
    </div>
  );
}
