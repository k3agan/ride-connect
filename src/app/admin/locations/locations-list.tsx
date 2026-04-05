"use client";

import { useState } from "react";
import { createLocation, updateLocation, deleteLocation } from "@/lib/actions/locations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface LocationRecord {
  id: string;
  name: string;
  address: string;
}

export function LocationsList({ locations }: { locations: LocationRecord[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const startEdit = (loc: LocationRecord) => {
    setEditingId(loc.id);
    setEditName(loc.name);
    setEditAddress(loc.address);
  };

  const handleUpdate = async () => {
    if (!editingId || !editName.trim() || !editAddress.trim()) return;
    setSaving(true);
    try {
      await updateLocation(editingId, { name: editName, address: editAddress });
      setEditingId(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newAddress.trim()) return;
    setSaving(true);
    try {
      await createLocation({ name: newName, address: newAddress });
      setNewName("");
      setNewAddress("");
      setShowNew(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this saved location?")) return;
    await deleteLocation(id);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {locations.length === 0 && !showNew && (
        <Card className="p-8 text-center">
          <p className="text-gray-500 text-lg">No saved locations yet.</p>
          <p className="mt-1 text-sm text-gray-400">
            Add common facilities like LGH, Dialysis Centre, etc. so you can
            select them quickly when creating rides.
          </p>
        </Card>
      )}

      {locations.map((loc) => (
        <Card key={loc.id}>
          <CardBody>
            {editingId === loc.id ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Name"
                    value={editName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                  />
                  <Input
                    label="Address"
                    value={editAddress}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditAddress(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleUpdate} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{loc.name}</p>
                  <p className="text-sm text-gray-500">{loc.address}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => startEdit(loc)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(loc.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      ))}

      {showNew ? (
        <Card>
          <CardBody>
            <div className="space-y-3">
              <p className="font-semibold text-gray-900">Add New Location</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Name"
                  value={newName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewName(e.target.value)}
                  placeholder="e.g. LGH, Dialysis Centre"
                />
                <Input
                  label="Address"
                  value={newAddress}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAddress(e.target.value)}
                  placeholder="Full street address"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreate} disabled={saving || !newName.trim() || !newAddress.trim()}>
                  {saving ? "Saving..." : "Add Location"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowNew(false);
                    setNewName("");
                    setNewAddress("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Button size="lg" onClick={() => setShowNew(true)}>
          + Add New Location
        </Button>
      )}
    </div>
  );
}
