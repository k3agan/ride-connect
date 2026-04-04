import { auth } from "@/lib/auth";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PreferencesForm } from "./preferences-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">
            Zone Preferences
          </h2>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-gray-500 mb-4">
            Select the zones you prefer to drive in. This helps you filter the
            ride board to rides near you.
          </p>
          <PreferencesForm
            userId={session.user.id}
            currentZones={session.user.preferredZones || []}
          />
        </CardBody>
      </Card>
    </div>
  );
}
