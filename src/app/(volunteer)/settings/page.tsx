import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PreferencesForm } from "./preferences-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { address: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">
            Your Details
          </h2>
        </CardHeader>
        <CardBody>
          <PreferencesForm
            userId={session.user.id}
            currentZones={session.user.preferredZones || []}
            currentAddress={user?.address || ""}
          />
        </CardBody>
      </Card>
    </div>
  );
}
