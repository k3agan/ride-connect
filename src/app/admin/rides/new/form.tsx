"use client";

import { useActionState, useState, useMemo, useEffect, useCallback, useRef } from "react";
import { createRide, getClientRideHistory } from "@/lib/actions/rides";
import { createLocation } from "@/lib/actions/locations";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { suggestZone } from "@/lib/zones";
import Link from "next/link";

type TripType = "one_way" | "round_trip" | "one_way_possible";
type Zone = "north_van" | "west_van" | "downtown_van" | "other";
type Direction = "to_appointment" | "from_appointment";

interface ClientRecord {
  id: string;
  name: string;
  address: string;
  phone: string;
  mobilityAid: string;
  assistanceInOut: boolean;
  generalNotes: string | null;
}

interface LocationRecord {
  id: string;
  name: string;
  address: string;
}

interface RideHistoryRecord {
  id: string;
  pickupAddress: string;
  facilityName: string | null;
  destinationAddress: string;
  appointmentDate: Date;
  appointmentTime: string;
  appointmentDuration: string;
  tripType: string;
  zone: string;
  notes: string | null;
  status: string;
}

/** Pre-fill from admin ride detail (?fromRide=) — same shape as history rows minus id/status/date */
export interface NewRideInitialTemplate {
  clientId: string;
  pickupAddress: string;
  facilityName: string | null;
  destinationAddress: string;
  appointmentTime: string;
  appointmentDuration: string;
  tripType: TripType;
  zone: Zone;
  notes: string | null;
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

function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function tripTypeLabel(t: string) {
  return t === "round_trip" ? "Round trip" : t === "one_way" ? "One-way" : "One-way possible";
}

export function NewRideForm({
  clients,
  locations,
  initialTemplate,
}: {
  clients: ClientRecord[];
  locations: LocationRecord[];
  initialTemplate?: NewRideInitialTemplate | null;
}) {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");

  const [direction, setDirection] = useState<Direction>("to_appointment");
  const [pickupAddress, setPickupAddress] = useState("");
  const [facilityName, setFacilityName] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [showNewLocation, setShowNewLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationAddress, setNewLocationAddress] = useState("");

  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentDuration, setAppointmentDuration] = useState("");
  const [tripType, setTripType] = useState<TripType>("round_trip");
  const [zone, setZone] = useState<Zone>("north_van");
  const [notes, setNotes] = useState("");

  const [rideHistory, setRideHistory] = useState<RideHistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const initialTemplateAppliedRef = useRef(false);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId),
    [clients, selectedClientId]
  );

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    const q = clientSearch.toLowerCase();
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, clientSearch]);

  const filteredLocations = useMemo(() => {
    if (!locationSearch) return locations;
    const q = locationSearch.toLowerCase();
    return locations.filter(
      (l) => l.name.toLowerCase().includes(q) || l.address.toLowerCase().includes(q)
    );
  }, [locations, locationSearch]);

  const loadHistory = useCallback(async (clientId: string, expandPanel = true) => {
    setLoadingHistory(true);
    try {
      const history = await getClientRideHistory(clientId);
      setRideHistory(history);
      if (expandPanel && history.length > 0) {
        setShowHistory(true);
      }
    } catch {
      setRideHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const handleClientSelect = useCallback(
    (clientId: string) => {
      setSelectedClientId(clientId);
      const client = clients.find((c) => c.id === clientId);
      if (client) {
        setPickupAddress(client.address);
        const suggested = suggestZone(client.address);
        setZone(suggested);
        setClientSearch("");
        setDirection("to_appointment");
        loadHistory(clientId);
      }
    },
    [clients, loadHistory]
  );

  const applyTemplateFromRide = useCallback(
    (
      ride: Pick<
        RideHistoryRecord,
        | "pickupAddress"
        | "facilityName"
        | "destinationAddress"
        | "appointmentTime"
        | "appointmentDuration"
        | "tripType"
        | "zone"
        | "notes"
      >,
      clientAddress: string,
      options?: { dismissHistory?: boolean; scrollToDate?: boolean }
    ) => {
      setFacilityName(ride.facilityName || "");
      setAppointmentTime(ride.appointmentTime);
      setAppointmentDuration(ride.appointmentDuration);
      setTripType(ride.tripType as TripType);
      setZone(ride.zone as Zone);
      setNotes(ride.notes || "");

      const matchedLocation = locations.find(
        (l) =>
          l.name === ride.facilityName ||
          l.address === ride.destinationAddress ||
          l.address === ride.pickupAddress
      );
      if (matchedLocation) {
        setSelectedLocationId(matchedLocation.id);
      } else {
        setSelectedLocationId("");
      }

      const clientAddr = clientAddress || "";
      const isReverse =
        clientAddr &&
        ride.destinationAddress.toLowerCase() === clientAddr.toLowerCase();

      if (isReverse) {
        setDirection("from_appointment");
        setPickupAddress(ride.pickupAddress);
        setDestinationAddress(clientAddr);
      } else {
        setDirection("to_appointment");
        setPickupAddress(clientAddr || ride.pickupAddress);
        setDestinationAddress(ride.destinationAddress);
      }

      if (options?.dismissHistory) {
        setShowHistory(false);
      }

      if (options?.scrollToDate !== false) {
        requestAnimationFrame(() => {
          dateInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          dateInputRef.current?.focus();
        });
      }
    },
    [locations]
  );

  const handleCopyRide = useCallback(
    (ride: RideHistoryRecord) => {
      const clientAddr = selectedClient?.address || "";
      applyTemplateFromRide(ride, clientAddr, { dismissHistory: true, scrollToDate: true });
    },
    [applyTemplateFromRide, selectedClient]
  );

  useEffect(() => {
    if (!initialTemplate || initialTemplateAppliedRef.current) return;
    const client = clients.find((c) => c.id === initialTemplate.clientId);
    if (!client) return;
    initialTemplateAppliedRef.current = true;
    setSelectedClientId(initialTemplate.clientId);
    setClientSearch("");
    applyTemplateFromRide(initialTemplate, client.address, {
      dismissHistory: true,
      scrollToDate: true,
    });
    setAppointmentDate("");
    void loadHistory(initialTemplate.clientId, false);
    setShowHistory(false);
  }, [initialTemplate, clients, applyTemplateFromRide, loadHistory]);

  const handleDirectionToggle = (newDirection: Direction) => {
    if (newDirection === direction) return;
    setDirection(newDirection);

    const clientAddr = selectedClient?.address || "";
    if (newDirection === "from_appointment") {
      setDestinationAddress(clientAddr);
      if (facilityName || destinationAddress) {
        setPickupAddress(destinationAddress || "");
      }
    } else {
      setPickupAddress(clientAddr);
      if (pickupAddress && pickupAddress !== clientAddr) {
        setDestinationAddress(pickupAddress);
      }
    }
  };

  const handleLocationSelect = (locationId: string) => {
    const location = locations.find((l) => l.id === locationId);
    if (location) {
      setSelectedLocationId(locationId);
      setFacilityName(location.name);
      if (direction === "to_appointment") {
        setDestinationAddress(location.address);
        const suggested = suggestZone(location.address);
        if (suggested !== "other") setZone(suggested);
      } else {
        setPickupAddress(location.address);
        const suggested = suggestZone(location.address);
        if (suggested !== "other") setZone(suggested);
      }
      setLocationSearch("");
    }
  };

  const handleSaveNewLocation = async () => {
    if (!newLocationName.trim() || !newLocationAddress.trim()) return;
    try {
      const loc = await createLocation({
        name: newLocationName.trim(),
        address: newLocationAddress.trim(),
      });
      setFacilityName(loc.name);
      if (direction === "to_appointment") {
        setDestinationAddress(loc.address);
      } else {
        setPickupAddress(loc.address);
      }
      setSelectedLocationId(loc.id);
      setShowNewLocation(false);
      setNewLocationName("");
      setNewLocationAddress("");
    } catch {
      // Location name may already exist
    }
  };

  useEffect(() => {
    if (tripType === "one_way") {
      setAppointmentDuration("0");
    }
  }, [tripType]);

  const handleAddressBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const suggested = suggestZone(e.target.value);
    if (suggested !== "other") setZone(suggested);
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
    <div className="space-y-6">
      {/* Previous rides panel — shown when a client is selected and has history */}
      {selectedClient && showHistory && rideHistory.length > 0 && (
        <Card>
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Previous Rides for {selectedClient.name}
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistory(false)}
                >
                  Dismiss
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Click a ride to copy its details. Only the date will need to be set.
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {rideHistory.map((ride) => (
                  <button
                    key={ride.id}
                    type="button"
                    onClick={() => handleCopyRide(ride)}
                    className="w-full text-left rounded-lg border border-gray-200 p-3 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatDate(ride.appointmentDate)}
                          </span>
                          <span className="text-sm text-gray-500">
                            at {ride.appointmentTime}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            {tripTypeLabel(ride.tripType)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 truncate">
                          {ride.facilityName
                            ? `${ride.facilityName} — `
                            : ""}
                          {ride.pickupAddress} → {ride.destinationAddress}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-medium text-blue-600">
                        Copy
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {selectedClient && loadingHistory && (
        <div className="text-center py-3 text-sm text-gray-500">
          Loading previous rides...
        </div>
      )}

      <Card>
        <CardBody>
          <form action={formAction} className="space-y-6">
            {state?.error && (
              <div className="rounded-lg bg-red-50 p-4 text-red-700">
                {state.error}
              </div>
            )}

            {/* Client selection */}
            <fieldset className="space-y-4">
              <legend className="text-lg font-semibold text-gray-900">
                Client
              </legend>

              {!selectedClient ? (
                <div className="space-y-2">
                  <Input
                    label="Search clients"
                    value={clientSearch}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setClientSearch(e.target.value)
                    }
                    placeholder="Type a client name..."
                  />
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200">
                    {filteredClients.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No clients found.{" "}
                        <Link
                          href="/admin/clients/new"
                          className="text-blue-600 hover:underline"
                        >
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
                          <p className="font-medium text-gray-900">
                            {client.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {client.phone} — {client.address}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {selectedClient.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedClient.phone}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedClient.address}
                      </p>
                      {selectedClient.mobilityAid !== "none" && (
                        <p className="text-sm text-gray-600">
                          Mobility: {selectedClient.mobilityAid}
                        </p>
                      )}
                      {selectedClient.assistanceInOut && (
                        <p className="text-sm text-gray-600">
                          Needs assistance in/out
                        </p>
                      )}
                      {selectedClient.generalNotes && (
                        <p className="text-sm text-gray-500 italic mt-1">
                          {selectedClient.generalNotes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {rideHistory.length > 0 && !showHistory && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setShowHistory(true)}
                        >
                          Previous Rides ({rideHistory.length})
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedClientId("");
                          setPickupAddress("");
                          setDestinationAddress("");
                          setFacilityName("");
                          setRideHistory([]);
                          setShowHistory(false);
                          setDirection("to_appointment");
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </fieldset>

            {/* Direction toggle */}
            {selectedClient && (
              <fieldset className="space-y-3">
                <legend className="text-lg font-semibold text-gray-900">
                  Direction
                </legend>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleDirectionToggle("to_appointment")}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      direction === "to_appointment"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Home → Appointment
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectionToggle("from_appointment")}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-l border-gray-200 ${
                      direction === "from_appointment"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Appointment → Home
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  {direction === "to_appointment"
                    ? `Pickup from ${selectedClient.name}'s home, drop off at appointment.`
                    : `Pickup from appointment location, drop off at ${selectedClient.name}'s home.`}
                </p>
              </fieldset>
            )}

            {/* Facility / Location selection */}
            <fieldset className="space-y-4">
              <legend className="text-lg font-semibold text-gray-900">
                {direction === "to_appointment" ? "Appointment Location" : "Pickup Location"}
              </legend>

              {locations.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Saved Locations
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {(locationSearch ? filteredLocations : locations).map(
                      (loc) => (
                        <button
                          key={loc.id}
                          type="button"
                          onClick={() => handleLocationSelect(loc.id)}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            selectedLocationId === loc.id
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                          }`}
                        >
                          {loc.name}
                        </button>
                      )
                    )}
                    <button
                      type="button"
                      onClick={() => setShowNewLocation(!showNewLocation)}
                      className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                    >
                      + Add New
                    </button>
                  </div>
                </div>
              )}

              {locations.length === 0 && !showNewLocation && (
                <button
                  type="button"
                  onClick={() => setShowNewLocation(true)}
                  className="w-full rounded-lg border border-dashed border-gray-300 p-3 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
                >
                  + Save a location for quick access (e.g., LGH, Dialysis Centre)
                </button>
              )}

              {showNewLocation && (
                <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700">
                    Save a new location
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      label="Location Name"
                      value={newLocationName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewLocationName(e.target.value)
                      }
                      placeholder="e.g. LGH, Dialysis Centre"
                    />
                    <Input
                      label="Address"
                      value={newLocationAddress}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewLocationAddress(e.target.value)
                      }
                      placeholder="Full street address"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveNewLocation}
                      disabled={
                        !newLocationName.trim() || !newLocationAddress.trim()
                      }
                    >
                      Save & Use
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowNewLocation(false);
                        setNewLocationName("");
                        setNewLocationAddress("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <Input
                label="Facility Name"
                name="facilityName"
                placeholder="e.g. LGH, Dialysis Centre"
                value={facilityName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setFacilityName(e.target.value);
                  setSelectedLocationId("");
                }}
              />
            </fieldset>

            {/* Addresses */}
            <fieldset className="space-y-4">
              <legend className="text-lg font-semibold text-gray-900">
                Addresses
              </legend>
              <Input
                label={
                  direction === "to_appointment"
                    ? "Pickup Address (client's home)"
                    : "Pickup Address (appointment location)"
                }
                name="pickupAddress"
                placeholder="Full street address"
                required
                value={pickupAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPickupAddress(e.target.value)
                }
                onBlur={handleAddressBlur}
              />
              <Input
                label={
                  direction === "to_appointment"
                    ? "Drop-off Address (appointment location)"
                    : "Drop-off Address (client's home)"
                }
                name="destinationAddress"
                placeholder={
                  direction === "to_appointment"
                    ? "Clinic or hospital address"
                    : "Client's home address"
                }
                required
                value={destinationAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDestinationAddress(e.target.value)
                }
                onBlur={handleAddressBlur}
              />
            </fieldset>

            {/* Appointment details */}
            <fieldset className="space-y-4">
              <legend className="text-lg font-semibold text-gray-900">
                Appointment Details
              </legend>
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  ref={dateInputRef}
                  label="Date"
                  name="appointmentDate"
                  type="date"
                  required
                  value={appointmentDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAppointmentDate(e.target.value)
                  }
                />
                <Input
                  label="Time"
                  name="appointmentTime"
                  type="time"
                  required
                  value={appointmentTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAppointmentTime(e.target.value)
                  }
                />
                <Input
                  label={
                    tripType === "one_way"
                      ? "Duration (N/A for one-way)"
                      : "Duration"
                  }
                  name="appointmentDuration"
                  placeholder={
                    tripType === "one_way" ? "0" : "e.g. 1 hour"
                  }
                  required
                  value={appointmentDuration}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAppointmentDuration(e.target.value)
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Trip Type"
                  name="tripType"
                  options={TRIP_TYPE_OPTIONS}
                  value={tripType}
                  onChange={(e) => setTripType(e.target.value as TripType)}
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

            {/* Notes */}
            <fieldset className="space-y-4">
              <legend className="text-lg font-semibold text-gray-900">
                Additional Notes
              </legend>
              <textarea
                name="notes"
                rows={3}
                className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-base shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Any other details for the volunteer..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </fieldset>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="submit"
                size="lg"
                disabled={isPending || !selectedClientId}
              >
                {isPending ? "Publishing..." : "Publish Ride Request"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
