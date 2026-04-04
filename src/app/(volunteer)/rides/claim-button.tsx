"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { claimRide } from "@/lib/actions/rides";

export function ClaimButton({
  rideId,
}: {
  rideId: string;
  userId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClaim = () => {
    if (!confirm("Claim this ride? You'll see full address and contact details after confirming.")) return;
    setError(null);
    startTransition(async () => {
      const result = await claimRide(rideId);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="lg"
        variant="success"
        onClick={handleClaim}
        disabled={isPending}
        className="min-w-[180px]"
      >
        {isPending ? "Claiming..." : "Claim This Ride"}
      </Button>
      {error && <p className="text-sm text-red-600 text-right">{error}</p>}
    </div>
  );
}
