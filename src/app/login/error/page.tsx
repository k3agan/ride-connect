import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-700">RideConnect</h1>
        </div>

        <Card>
          <CardBody>
            <div className="text-center space-y-4 py-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Something went wrong
              </h2>
              <p className="text-gray-600">
                Your sign-in link may have expired. Please request a new one.
              </p>
              <Link href="/login">
                <Button size="lg">Resend Sign-In Link</Button>
              </Link>
            </div>
          </CardBody>
        </Card>

        <div className="text-center">
          <a
            href={`tel:${process.env.SUPPORT_PHONE || "(604) 555-0100"}`}
            className="text-sm text-blue-600 hover:underline"
          >
            Need help? Call{" "}
            {process.env.SUPPORT_PHONE || "(604) 555-0100"}
          </a>
        </div>
      </div>
    </div>
  );
}
