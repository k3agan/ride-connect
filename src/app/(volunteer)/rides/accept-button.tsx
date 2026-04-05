"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { acceptRide } from "@/lib/actions/rides";

export function AcceptButton({
  rideId,
}: {
  rideId: string;
  userId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAccept = () => {
    if (!confirm("Accept this ride? The coordinator will confirm your booking shortly.")) return;
    setError(null);
    startTransition(async () => {
      const result = await acceptRide(rideId);
      if (result?.error) {
        setError(result.error);
      } else {
        setAccepted(true);
        setTimeout(() => router.push("/my-rides"), 2000);
      }
    });
  };

  if (accepted) {
    return (
      <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-center min-w-[220px]">
        <p className="text-sm font-semibold text-green-800">Ride accepted!</p>
        <p className="text-xs text-green-700 mt-1">
          Awaiting coordinator confirmation. Redirecting to My Rides...
        </p>
      </div>
    );
  }

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
