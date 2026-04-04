"use client";

import { Button } from "@/components/ui/button";
import { cancelRide, unclaimRide } from "@/lib/actions/rides";
type RideStatus = "available" | "claimed" | "in_progress" | "completed" | "cancelled";
import { useTransition } from "react";

export function AdminRideActions({
  rideId,
  status,
}: {
  rideId: string;
  status: RideStatus;
}) {
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    if (!confirm("Are you sure you want to cancel this ride?")) return;
    startTransition(() => {
      cancelRide(rideId);
    });
  };

  const handleUnclaim = () => {
    if (!confirm("Remove the volunteer assignment and make this ride available again?")) return;
    startTransition(() => {
      unclaimRide(rideId);
    });
  };

  return (
    <div className="flex flex-col gap-1">
      {status === "claimed" && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleUnclaim}
          disabled={isPending}
        >
          Reassign
        </Button>
      )}
      {(status === "available" || status === "claimed") && (
        <Button
          variant="danger"
          size="sm"
          onClick={handleCancel}
          disabled={isPending}
        >
          Cancel Ride
        </Button>
      )}
    </div>
  );
}
