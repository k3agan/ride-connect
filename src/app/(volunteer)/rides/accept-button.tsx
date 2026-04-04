"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { acceptRide } from "@/lib/actions/rides";

export function AcceptButton({
  rideId,
}: {
  rideId: string;
  userId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleAccept = () => {
    if (!confirm("Accept this ride? You'll see full address and contact details after the coordinator confirms.")) return;
    setError(null);
    startTransition(async () => {
      const result = await acceptRide(rideId);
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
        onClick={handleAccept}
        disabled={isPending}
        className="min-w-[180px]"
      >
        {isPending ? "Accepting..." : "Accept Ride"}
      </Button>
      {error && <p className="text-sm text-red-600 text-right">{error}</p>}
    </div>
  );
}
