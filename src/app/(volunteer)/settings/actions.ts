"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { type Zone } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

export async function updateZonePreferences(userId: string, zones: string[]) {
  const session = await auth();
  if (!session?.user || session.user.id !== userId) {
    throw new Error("Unauthorized");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { preferredZones: zones as Zone[] },
  });

  revalidatePath("/settings");
}
