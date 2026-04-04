import { prisma } from "@/lib/db";
import { NewRideForm } from "./form";

export default async function NewRidePage() {
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">New Ride Request</h1>
      <NewRideForm clients={clients} />
    </div>
  );
}
