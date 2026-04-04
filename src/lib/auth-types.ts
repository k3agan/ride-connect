import { Role, Zone } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      preferredZones: Zone[];
      image?: string | null;
    };
  }
}
