import { prisma } from "./db";
import { type Prisma } from "@/generated/prisma/client";

type JsonValue = Prisma.InputJsonValue;

export async function logAudit(params: {
  rideId: string;
  actorId: string | null;
  action: string;
  oldValues?: JsonValue | null;
  newValues?: JsonValue | null;
}) {
  await prisma.rideAuditLog.create({
    data: {
      rideId: params.rideId,
      actorId: params.actorId,
      action: params.action,
      oldValues: params.oldValues ?? undefined,
      newValues: params.newValues ?? undefined,
    },
  });
}
