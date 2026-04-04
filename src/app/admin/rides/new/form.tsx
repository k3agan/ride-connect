"use client";

import { useActionState, useState } from "react";
import { createRide } from "@/lib/actions/rides";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { suggestZone } from "@/lib/zones";
type TripType = "one_way" | "round_trip" | "one_way_possible";
type MobilityAid = "none" | "walker" | "cane" | "wheelchair" | "other";
type Zone = "north_van" | "west_van" | "downtown_van" | "other";

const MOBILITY_OPTIONS = [
  { value: "none", label: "None" },
  { value: "walker", label: "Walker" },
  { value: "cane", label: "Cane" },
  { value: "wheelchair", label: "Wheelchair" },
  { value: "other", label: "Other" },
];

const TRIP_TYPE_OPTIONS = [
  { value: "round_trip", label: "Round Trip" },
  { value: "one_way", label: "One-Way" },
  { value: "one_way_possible", label: "One-Way Possible" },
];

const ZONE_OPTIONS = [
  { value: "north_van", label: "North Van" },
  { value: "west_van", label: "West Van" },
  { value: "downtown_van", label: "Downtown Van" },
  { value: "other", label: "Other" },
];

export function NewRideForm() {
  const [mobilityAid, setMobilityAid] = useState<MobilityAid>("none");
  const [assistanceInOut, setAssistanceInOut] = useState(false);
  const [zone, setZone] = useState<Zone>("north_van");

  const handleAddressBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const suggested = suggestZone(e.target.value);
    setZone(suggested);
  };

  async function handleSubmit(_prev: unknown, formData: FormData) {
    try {
      await createRide({
        seniorName: formData.get("seniorName") as string,
        seniorPhone: formData.get("seniorPhone") as string,
        pickupAddress: formData.get("pickupAddress") as string,
        destinationAddress: formData.get("destinationAddress") as string,
        appointmentDate: formData.get("appointmentDate") as string,
        appointmentTime: formData.get("appointmentTime") as string,
        appointmentDuration: formData.get("appointmentDuration") as string,
        tripType: formData.get("tripType") as TripType,
        mobilityAid: formData.get("mobilityAid") as MobilityAid,
        mobilityAidNotes: formData.get("mobilityAidNotes") as string,
        assistanceInOut,
        zone: formData.get("zone") as Zone,
        notes: formData.get("notes") as string,
      });
    } catch {
      return { error: "Failed to create ride. Please try again." };
    }
  }

  const [state, formAction, isPending] = useActionState(handleSubmit, null);

  return (
    <Card>
      <CardBody>
        <form action={formAction} className="space-y-6">
          {state?.error && (
            <div className="rounded-lg bg-red-50 p-4 text-red-700">{state.error}</div>
          )}

          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-gray-900">
              Senior Information
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Senior's Name" name="seniorName" required />
              <Input
                label="Phone Number"
                name="seniorPhone"
                type="tel"
                placeholder="(604) 555-0100"
                required
              />
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-gray-900">
              Addresses
            </legend>
            <Input
              label="Pickup Address"
              name="pickupAddress"
              placeholder="Full street address"
              required
              onBlur={handleAddressBlur}
            />
            <Input
              label="Appointment Address"
              name="destinationAddress"
              placeholder="Clinic or hospital address"
              required
            />
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-gray-900">
              Appointment Details
            </legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Date" name="appointmentDate" type="date" required />
              <Input label="Time" name="appointmentTime" type="time" required />
              <Input
                label="Duration"
                name="appointmentDuration"
                placeholder="e.g. 1 hour"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Trip Type"
                name="tripType"
                options={TRIP_TYPE_OPTIONS}
              />
              <Select
                label="Zone"
                name="zone"
                options={ZONE_OPTIONS}
                value={zone}
                onChange={(e) => setZone(e.target.value as Zone)}
              />
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-gray-900">
              Accessibility
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Mobility Aid"
                name="mobilityAid"
                options={MOBILITY_OPTIONS}
                value={mobilityAid}
                onChange={(e) => setMobilityAid(e.target.value as MobilityAid)}
              />
              {mobilityAid !== "none" && (
                <Input
                  label="Mobility Notes"
                  name="mobilityAidNotes"
                  placeholder="e.g. Visual impairment, speech impediment"
                />
              )}
            </div>
            <Toggle
              label="Needs Assistance In/Out of Vehicle"
              checked={assistanceInOut}
              onChange={setAssistanceInOut}
            />
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-gray-900">
              Additional Notes
            </legend>
            <textarea
              name="notes"
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-base shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Any other details for the volunteer..."
            />
          </fieldset>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="submit" size="lg" disabled={isPending}>
              {isPending ? "Publishing..." : "Publish Ride Request"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
