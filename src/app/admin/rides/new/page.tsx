import { NewRideForm } from "./form";

export default function NewRidePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">New Ride Request</h1>
      <NewRideForm />
    </div>
  );
}
