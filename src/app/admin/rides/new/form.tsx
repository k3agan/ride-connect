"use client";

import { useActionState, useState, useMemo } from "react";
import { createRide } from "@/lib/actions/rides";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { suggestZone } from "@/lib/zones";
import Link from "next/link";
type TripType = "one_way" | "round_trip" | "one_way_possible";
type Zone = "north_van" | "west_van" | "downtown_van" | "other";

interface ClientRecord {
  id: string;
  name: string;
  address: string;
  phone: string;
  mobilityAid: string;
  assistanceInOut: boolean;
  generalNotes: string | null;
}

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

export function NewRideForm({ clients }: { clients: ClientRecord[] }) {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [zone, setZone] = useState<Zone>("north_van");

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId),
    [clients, selectedClientId]
  );

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    const q = clientSearch.toLowerCase();
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, clientSearch]);

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setPickupAddress(client.address);
      const suggested = suggestZone(client.address);
      setZone(suggested);
      setClientSearch("");
    }
  };

  const handleAddressBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const suggested = suggestZone(e.target.value);
    setZone(suggested);
  };

  async function handleSubmit(_prev: unknown, formData: FormData) {
    if (!selectedClientId) {
      return { error: "Please select a client." };
    }
    try {
      await createRide({
        clientId: selectedClientId,
        pickupAddress: formData.get("pickupAddress") as string,
        facilityName: formData.get("facilityName") as string,
        destinationAddress: formData.get("destinationAddress") as string,
        appointmentDate: formData.get("appointmentDate") as string,
        appointmentTime: formData.get("appointmentTime") as string,
        appointmentDuration: formData.get("appointmentDuration") as string,
        tripType: formData.get("tripType") as TripType,
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
              Client
            </legend>

            {!selectedClient ? (
              <div className="space-y-2">
                <Input
                  label="Search clients"
                  value={clientSearch}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setClientSearch(e.target.value)}
                  placeholder="Type a client name..."
                />
                <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
                  {filteredClients.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No clients found.{" "}
                      <Link href="/admin/clients/new" className="text-blue-600 hover:underline">
                        Register a new client
                      </Link>
                    </div>
                  ) : (
                    filteredClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleClientSelect(client.id)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <p className="font-medium text-gray-900">{client.name}</p>
                        <p className="text-sm text-gray-500">{client.phone} — {client.address}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{selectedClient.name}</p>
                    <p className="text-sm text-gray-600">{selectedClient.phone}</p>
                    <p className="text-sm text-gray-600">{selectedClient.address}</p>
                    {selectedClient.mobilityAid !== "none" && (
                      <p className="text-sm text-gray-600">Mobility: {selectedClient.mobilityAid}</p>
                    )}
                    {selectedClient.assistanceInOut && (
                      <p className="text-sm text-gray-600">Needs assistance in/out</p>
                    )}
                    {selectedClient.generalNotes && (
                      <p className="text-sm text-gray-500 italic mt-1">{selectedClient.generalNotes}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedClientId("");
                      setPickupAddress("");
                    }}
                  >
                    Change
                  </Button>
                </div>
              </div>
            )}
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
              value={pickupAddress}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPickupAddress(e.target.value)}
              onBlur={handleAddressBlur}
            />
            <Input
              label="Facility Name"
              name="facilityName"
              placeholder="e.g. St. Antonius Hospital"
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
            <Button type="submit" size="lg" disabled={isPending || !selectedClientId}>
              {isPending ? "Publishing..." : "Publish Ride Request"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
