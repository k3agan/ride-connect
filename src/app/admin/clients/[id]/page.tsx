import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ClientForm } from "../client-form";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
  });

  if (!client) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Edit Client: {client.name}
      </h1>
      <ClientForm client={client} />
    </div>
  );
}
