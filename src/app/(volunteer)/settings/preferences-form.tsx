"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateZonePreferences } from "./actions";

const ZONES = [
  { value: "north_van", label: "North Van" },
  { value: "west_van", label: "West Van" },
  { value: "downtown_van", label: "Downtown Van" },
  { value: "other", label: "Other" },
];

export function PreferencesForm({
  userId,
  currentZones,
}: {
  userId: string;
  currentZones: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(currentZones));
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const toggle = (zone: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(zone)) next.delete(zone);
      else next.add(zone);
      return next;
    });
    setSaved(false);
  };

  const handleSave = () => {
    startTransition(async () => {
      await updateZonePreferences(userId, Array.from(selected));
      setSaved(true);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {ZONES.map((z) => (
          <button
            key={z.value}
            type="button"
            onClick={() => toggle(z.value)}
            className={`rounded-lg px-5 py-3 text-base font-medium transition-colors border-2 ${
              selected.has(z.value)
                ? "bg-blue-50 border-blue-500 text-blue-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {z.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save Preferences"}
        </Button>
        {saved && (
          <span className="text-sm text-green-600">Preferences saved!</span>
        )}
      </div>
    </div>
  );
}
