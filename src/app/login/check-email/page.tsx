import { Card, CardBody } from "@/components/ui/card";

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-700">RideConnect</h1>
        </div>

        <Card>
          <CardBody>
            <div className="text-center space-y-4 py-4">
              <div className="text-5xl">📧</div>
              <h2 className="text-xl font-semibold text-gray-900">
                Check your email
              </h2>
              <p className="text-gray-600">
                We sent you a sign-in link. Click the link in the email to log
                in. The link will expire in 24 hours.
              </p>
              <p className="text-sm text-gray-500">
                Don&apos;t see it? Check your spam folder, or{" "}
                <a href="/login" className="text-blue-600 hover:underline">
                  try again
                </a>
                .
              </p>
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
