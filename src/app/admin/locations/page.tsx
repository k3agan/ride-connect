import { prisma } from "@/lib/db";
import { LocationsList } from "./locations-list";

export default async function LocationsPage() {
  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Locations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Define frequently-used facilities and locations. When creating a ride,
            select a saved location to auto-fill the name and address.
          </p>
        </div>
      </div>
      <LocationsList locations={locations} />
    </div>
  );
}
