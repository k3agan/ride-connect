"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getLocations() {
  return prisma.location.findMany({
    orderBy: { name: "asc" },
  });
}

export async function createLocation(input: { name: string; address: string }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const location = await prisma.location.create({
    data: {
      name: input.name.trim(),
      address: input.address.trim(),
    },
  });

  revalidatePath("/admin/locations");
  revalidatePath("/admin/rides/new");
  return location;
}

export async function updateLocation(id: string, input: { name: string; address: string }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const location = await prisma.location.update({
    where: { id },
    data: {
      name: input.name.trim(),
      address: input.address.trim(),
    },
  });

  revalidatePath("/admin/locations");
  revalidatePath("/admin/rides/new");
  return location;
}

export async function deleteLocation(id: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  await prisma.location.delete({ where: { id } });

  revalidatePath("/admin/locations");
  revalidatePath("/admin/rides/new");
  return { success: true };
}
