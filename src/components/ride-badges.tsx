import { Badge } from "@/components/ui/badge";
import { type RideStatus, type TripType, type MobilityAid, type Zone } from "@/generated/prisma/client";

const STATUS_CONFIG: Record<RideStatus, { label: string; variant: "success" | "warning" | "danger" | "info" | "default" }> = {
  available: { label: "Available", variant: "success" },
  claimed: { label: "Claimed", variant: "info" },
  in_progress: { label: "In Progress", variant: "warning" },
  completed: { label: "Completed", variant: "default" },
  cancelled: { label: "Cancelled", variant: "danger" },
};

export function StatusBadge({ status }: { status: RideStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

const TRIP_LABELS: Record<TripType, string> = {
  one_way: "One-Way",
  round_trip: "Round Trip",
  one_way_possible: "One-Way Possible",
};

export function TripTypeBadge({ tripType }: { tripType: TripType }) {
  return (
    <Badge variant={tripType === "round_trip" ? "default" : "warning"}>
      {TRIP_LABELS[tripType]}
    </Badge>
  );
}

const AID_LABELS: Record<MobilityAid, string> = {
  none: "",
  walker: "Walker",
  cane: "Cane",
  wheelchair: "Wheelchair",
  other: "Mobility Aid",
};

export function AccessibilityIndicators({
  mobilityAid,
  mobilityAidNotes,
  assistanceInOut,
}: {
  mobilityAid: MobilityAid;
  mobilityAidNotes: string | null;
  assistanceInOut: boolean;
}) {
  if (mobilityAid === "none" && !assistanceInOut) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {mobilityAid !== "none" && (
        <Badge variant="info">
          {AID_LABELS[mobilityAid]}
          {mobilityAidNotes ? ` — ${mobilityAidNotes}` : ""}
        </Badge>
      )}
      {assistanceInOut && (
        <Badge variant="warning">Assist In/Out</Badge>
      )}
    </div>
  );
}

const ZONE_LABELS: Record<Zone, string> = {
  north_van: "North Van",
  west_van: "West Van",
  downtown_van: "Downtown Van",
  other: "Other",
};

export function ZoneLabel({ zone }: { zone: Zone }) {
  return <span>{ZONE_LABELS[zone]}</span>;
}

export function ZoneBadge({ zone }: { zone: Zone }) {
  return <Badge variant="default">{ZONE_LABELS[zone]}</Badge>;
}
