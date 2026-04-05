"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateZonePreferences, updateAddress } from "./actions";

const ZONES = [
  { value: "north_van", label: "North Van" },
  { value: "west_van", label: "West Van" },
  { value: "downtown_van", label: "Downtown Van" },
  { value: "other", label: "Other" },
];

export function PreferencesForm({
  userId,
  currentZones,
  currentAddress,
}: {
  userId: string;
  currentZones: string[];
  currentAddress: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(currentZones));
  const [address, setAddress] = useState(currentAddress);
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
      await updateAddress(userId, address);
      setSaved(true);
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Home Address
        </label>
        <p className="text-sm text-gray-500">
          Used as the starting point for Google Maps route planning on ride cards.
        </p>
        <input
          id="address"
          type="text"
          value={address}
          onChange={(e) => { setAddress(e.target.value); setSaved(false); }}
          placeholder="e.g. 123 Lonsdale Ave, North Vancouver"
          className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-base shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Zone Preferences
        </label>
        <p className="text-sm text-gray-500">
          Select the zones you prefer to drive in. This helps you filter the
          ride board to rides near you.
        </p>
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
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save Settings"}
        </Button>
        {saved && (
          <span className="text-sm text-green-600">Settings saved!</span>
        )}
      </div>
    </div>
  );
}
