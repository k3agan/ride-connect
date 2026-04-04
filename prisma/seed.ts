import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "coordinator@example.org" },
    update: {},
    create: {
      email: "coordinator@example.org",
      name: "Janet (Coordinator)",
      phone: "(604) 555-0100",
      role: "admin",
    },
  });

  const volunteer1 = await prisma.user.upsert({
    where: { email: "antoinette@example.com" },
    update: {},
    create: {
      email: "antoinette@example.com",
      name: "Antoinette",
      phone: "(604) 555-0201",
      address: "123 Lonsdale Ave, North Vancouver",
      role: "volunteer",
      preferredZones: ["north_van", "west_van"],
    },
  });

  const volunteer2 = await prisma.user.upsert({
    where: { email: "david@example.com" },
    update: {},
    create: {
      email: "david@example.com",
      name: "David",
      phone: "(604) 555-0202",
      address: "456 Granville St, Vancouver",
      role: "volunteer",
      preferredZones: ["downtown_van"],
    },
  });

  // Client master data
  const barbara = await prisma.client.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Barbara Sidelmann",
      address: "1844 Purcell Way, North Vancouver",
      phone: "(604) 985-0907",
      mobilityAid: "none",
      assistanceInOut: false,
    },
  });

  const jill = await prisma.client.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Jill Sangster",
      address: "207-2190 Bellevue Avenue, West Vancouver",
      phone: "(604) 250-8288",
      mobilityAid: "walker",
      assistanceInOut: false,
      generalNotes: "Visual impairment",
    },
  });

  const bobi = await prisma.client.upsert({
    where: { id: "00000000-0000-0000-0000-000000000003" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Bobi Lukacs",
      address: "912 Bowron Court, North Vancouver",
      phone: "(604) 929-0577",
      mobilityAid: "walker",
      assistanceInOut: true,
      generalNotes: "Speech impediment",
    },
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(0, 0, 0, 0);

  await prisma.ride.createMany({
    data: [
      {
        clientId: barbara.id,
        seniorName: barbara.name,
        seniorPhone: barbara.phone,
        pickupAddress: barbara.address,
        destinationAddress: "144 West 15th Street, North Vancouver",
        facilityName: "Lions Gate Hospital",
        appointmentDate: tomorrow,
        appointmentTime: "07:15",
        appointmentDuration: "5 hours",
        tripType: "one_way_possible",
        mobilityAid: "none",
        assistanceInOut: false,
        zone: "north_van",
        status: "open",
        createdById: admin.id,
      },
      {
        clientId: jill.id,
        seniorName: jill.name,
        seniorPhone: jill.phone,
        pickupAddress: jill.address,
        destinationAddress: "VGH Eye Care Center",
        facilityName: "VGH Eye Care Center",
        appointmentDate: tomorrow,
        appointmentTime: "11:10",
        appointmentDuration: "1 hour",
        tripType: "round_trip",
        mobilityAid: "walker",
        mobilityAidNotes: "Visual impairment",
        assistanceInOut: false,
        zone: "west_van",
        status: "open",
        createdById: admin.id,
      },
      {
        clientId: bobi.id,
        seniorName: bobi.name,
        seniorPhone: bobi.phone,
        pickupAddress: bobi.address,
        destinationAddress: "63 West 6th Ave, Vancouver",
        facilityName: "Vancouver General Hospital",
        appointmentDate: nextWeek,
        appointmentTime: "10:20",
        appointmentDuration: "1 hour",
        tripType: "round_trip",
        mobilityAid: "walker",
        mobilityAidNotes: "Speech impediment",
        assistanceInOut: true,
        zone: "north_van",
        status: "open",
        createdById: admin.id,
      },
    ],
  });

  console.log("Seeded users:", admin.email, volunteer1.email, volunteer2.email);
  console.log("Seeded clients:", barbara.name, jill.name, bobi.name);
  console.log("Seeded 3 sample rides");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
