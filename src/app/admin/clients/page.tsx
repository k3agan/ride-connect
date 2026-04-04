import { prisma } from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { rides: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <Link href="/admin/clients/new">
          <Button size="lg">+ New Client</Button>
        </Link>
      </div>

      {clients.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500 text-lg">No clients registered yet.</p>
          <p className="mt-2 text-sm text-gray-400">
            Register clients to quickly create ride requests.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <Link key={client.id} href={`/admin/clients/${client.id}`}>
              <Card className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-gray-900">
                        {client.name}
                      </span>
                      {client.mobilityAid !== "none" && (
                        <Badge variant="info">{client.mobilityAid}</Badge>
                      )}
                      {client.assistanceInOut && (
                        <Badge variant="warning">Assist In/Out</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-x-3">
                      <span>{client.phone}</span>
                      <span>·</span>
                      <span>{client.address}</span>
                    </div>
                    {client.generalNotes && (
                      <p className="text-sm text-gray-400 italic">{client.generalNotes}</p>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    {client._count.rides} ride{client._count.rides !== 1 ? "s" : ""}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
