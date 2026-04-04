"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn("email", { email, callbackUrl: "/" });
    setLoading(false);
  };

  return (
    <Card>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            required
          />

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Sending link..." : "Send Sign-In Link"}
          </Button>

          <p className="text-center text-sm text-gray-500">
            We&apos;ll email you a magic link to sign in. No password needed.
          </p>
        </form>
      </CardBody>
    </Card>
  );
}
