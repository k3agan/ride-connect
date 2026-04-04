"use client";

import { useActionState, useState } from "react";
import { createClient, updateClient } from "@/lib/actions/clients";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { ImageUpload } from "@/components/image-upload";
type MobilityAid = "none" | "walker" | "cane" | "wheelchair" | "other";

const MOBILITY_OPTIONS = [
  { value: "none", label: "None" },
  { value: "walker", label: "Walker" },
  { value: "cane", label: "Cane" },
  { value: "wheelchair", label: "Wheelchair" },
  { value: "other", label: "Other" },
];

interface ClientFormProps {
  client?: {
    id: string;
    name: string;
    address: string;
    phone: string;
    mobilityAid: MobilityAid;
    assistanceInOut: boolean;
    generalNotes: string | null;
    pictureUrl: string | null;
  };
}

export function ClientForm({ client }: ClientFormProps) {
  const isEditing = !!client;
  const [mobilityAid, setMobilityAid] = useState<MobilityAid>(client?.mobilityAid || "none");
  const [assistanceInOut, setAssistanceInOut] = useState(client?.assistanceInOut || false);
  const [pictureUrl, setPictureUrl] = useState<string | null>(client?.pictureUrl ?? null);

  async function handleSubmit(_prev: unknown, formData: FormData) {
    const input = {
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      phone: formData.get("phone") as string,
      mobilityAid: formData.get("mobilityAid") as MobilityAid,
      assistanceInOut,
      generalNotes: formData.get("generalNotes") as string,
      pictureUrl,
    };

    try {
      if (isEditing) {
        await updateClient(client.id, input);
      } else {
        await createClient(input);
      }
    } catch {
      return { error: "Failed to save client. Please try again." };
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

          <ImageUpload value={pictureUrl} onChange={setPictureUrl} />

          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-gray-900">
              Client Information
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full Name"
                name="name"
                required
                defaultValue={client?.name}
              />
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="(604) 555-0100"
                required
                defaultValue={client?.phone}
              />
            </div>
            <Input
              label="Home Address"
              name="address"
              placeholder="Full street address (used as default pickup)"
              required
              defaultValue={client?.address}
            />
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-gray-900">
              Accessibility
            </legend>
            <Select
              label="Mobility Aid"
              name="mobilityAid"
              options={MOBILITY_OPTIONS}
              value={mobilityAid}
              onChange={(e) => setMobilityAid(e.target.value as MobilityAid)}
            />
            <Toggle
              label="Needs Assistance In/Out of Vehicle"
              checked={assistanceInOut}
              onChange={setAssistanceInOut}
            />
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-gray-900">
              General Notes
            </legend>
            <textarea
              name="generalNotes"
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-base shadow-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Preferred language, dietary needs, other standing instructions..."
              defaultValue={client?.generalNotes || ""}
            />
          </fieldset>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="submit" size="lg" disabled={isPending}>
              {isPending
                ? "Saving..."
                : isEditing
                  ? "Update Client"
                  : "Register Client"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
