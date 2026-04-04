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
      role: "volunteer",
      preferredZones: ["downtown_van"],
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
        seniorName: "Barbara Sidelmann",
        seniorPhone: "(604) 985-0907",
        pickupAddress: "1844 Purcell Way, North Vancouver",
        destinationAddress: "144 West 15th Street, North Vancouver",
        appointmentDate: tomorrow,
        appointmentTime: "07:15",
        appointmentDuration: "5 hours",
        tripType: "one_way_possible",
        mobilityAid: "none",
        assistanceInOut: false,
        zone: "north_van",
        status: "available",
        createdById: admin.id,
      },
      {
        seniorName: "Jill Sangster",
        seniorPhone: "(604) 250-8288",
        pickupAddress: "207-2190 Bellevue Avenue, West Vancouver",
        destinationAddress: "VGH Eye Care Center",
        appointmentDate: tomorrow,
        appointmentTime: "11:10",
        appointmentDuration: "1 hour",
        tripType: "round_trip",
        mobilityAid: "walker",
        mobilityAidNotes: "Visual impairment",
        assistanceInOut: false,
        zone: "west_van",
        status: "available",
        createdById: admin.id,
      },
      {
        seniorName: "Bobi Lukacs",
        seniorPhone: "(604) 929-0577",
        pickupAddress: "912 Bowron Court, North Vancouver",
        destinationAddress: "63 West 6th Ave, Vancouver",
        appointmentDate: nextWeek,
        appointmentTime: "10:20",
        appointmentDuration: "1 hour",
        tripType: "round_trip",
        mobilityAid: "walker",
        mobilityAidNotes: "Speech impediment",
        assistanceInOut: true,
        zone: "north_van",
        status: "available",
        createdById: admin.id,
      },
    ],
  });

  console.log("Seeded users:", admin.email, volunteer1.email, volunteer2.email);
  console.log("Seeded 3 sample rides");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
