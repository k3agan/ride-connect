"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type MobilityAid } from "@/generated/prisma/client";

interface ClientInput {
  name: string;
  address: string;
  phone: string;
  mobilityAid: MobilityAid;
  assistanceInOut: boolean;
  generalNotes: string;
}

export async function createClient(input: ClientInput) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  await prisma.client.create({
    data: {
      name: input.name,
      address: input.address,
      phone: input.phone,
      mobilityAid: input.mobilityAid,
      assistanceInOut: input.assistanceInOut,
      generalNotes: input.generalNotes || null,
    },
  });

  revalidatePath("/admin/clients");
  redirect("/admin/clients");
}

export async function updateClient(clientId: string, input: ClientInput) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  await prisma.client.update({
    where: { id: clientId },
    data: {
      name: input.name,
      address: input.address,
      phone: input.phone,
      mobilityAid: input.mobilityAid,
      assistanceInOut: input.assistanceInOut,
      generalNotes: input.generalNotes || null,
    },
  });

  revalidatePath("/admin/clients");
  redirect("/admin/clients");
}

export async function getClients() {
  return prisma.client.findMany({
    orderBy: { name: "asc" },
  });
}

export async function searchClients(query: string) {
  return prisma.client.findMany({
    where: {
      name: { contains: query, mode: "insensitive" },
    },
    orderBy: { name: "asc" },
    take: 20,
  });
}
