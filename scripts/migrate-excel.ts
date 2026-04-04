/**
 * Phase 0: Excel-to-Postgres migration script.
 *
 * Parses the organization's existing schedule spreadsheet and inserts
 * ride records into the database. Handles real-world data quirks:
 *   - Duration strings with embedded trip types ("5 hours(Oneway Possibility)")
 *   - Split rows (name on one row, phone on the next)
 *   - Inconsistent phone formats
 *   - Missing fields
 *
 * Usage: npx tsx scripts/migrate-excel.ts <path-to-xlsx>
 */

import "dotenv/config";
import { PrismaClient, type TripType, type MobilityAid, type Zone } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as XLSX from "xlsx";
import path from "path";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

interface RawRow {
  date: string | null;
  clientName: string | null;
  phone: string | null;
  address: string | null;
  mobilityAid: string | null;
  assistanceInOut: string | null;
  time: unknown;
  duration: string | null;
  appointmentLocation: string | null;
  notes: string | null;
}

function formatPhone(raw: string | null): string {
  if (!raw) return "";
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw.trim();
}

function parseDuration(raw: string | null): { duration: string; tripType: TripType } {
  if (!raw) return { duration: "1 hour", tripType: "round_trip" };

  const lower = raw.toLowerCase().trim();

  if (lower === "oneway" || lower === "one way") {
    return { duration: "0", tripType: "one_way" };
  }

  let tripType: TripType = "round_trip";
  if (lower.includes("oneway possibility") || lower.includes("one way possibility")) {
    tripType = "one_way_possible";
  } else if (lower.includes("oneway") || lower.includes("one way")) {
    tripType = "one_way";
  }

  const cleaned = raw
    .replace(/\(.*?\)/g, "")
    .replace(/~/g, "")
    .trim();

  if (!cleaned) return { duration: "1 hour", tripType };
  return { duration: cleaned, tripType };
}

function parseMobilityAid(raw: string | null): {
  aid: MobilityAid;
  notes: string | null;
} {
  if (!raw || raw.toLowerCase() === "no" || raw.toLowerCase() === "none") {
    return { aid: "none", notes: null };
  }

  const lower = raw.toLowerCase();
  let aid: MobilityAid = "other";
  const notesParts: string[] = [];

  if (lower.includes("walker")) {
    aid = "walker";
  } else if (lower.includes("cane")) {
    aid = "cane";
  } else if (lower.includes("wheelchair")) {
    aid = "wheelchair";
  } else if (lower === "maybe") {
    return { aid: "other", notes: "May need mobility aid" };
  }

  if (lower.includes("visual impairment")) notesParts.push("Visual impairment");
  if (lower.includes("speech impediment")) notesParts.push("Speech impediment");
  if (lower.includes("foldable")) notesParts.push("Foldable");

  return {
    aid,
    notes: notesParts.length > 0 ? notesParts.join(", ") : null,
  };
}

function parseAssistance(raw: string | null): boolean {
  if (!raw) return false;
  return raw.toLowerCase().trim() === "yes";
}

function guessZone(address: string): Zone {
  const lower = address.toLowerCase();
  if (lower.includes("north van") || lower.includes("north vancouver") || lower.includes("lonsdale")) {
    return "north_van";
  }
  if (lower.includes("west van") || lower.includes("west vancouver") || lower.includes("bellevue") || lower.includes("marine dr")) {
    return "west_van";
  }
  if (lower.includes("vancouver") || lower.includes("vgh") || lower.includes("granville") || lower.includes("alberni") || lower.includes("st. paul")) {
    return "downtown_van";
  }
  return "other";
}

function parseDate(raw: unknown): Date | null {
  if (raw instanceof Date) return raw;
  if (typeof raw === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + raw * 86400000);
  }
  if (typeof raw !== "string" || !raw) return null;

  const months: Record<string, number> = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  };

  const match = raw.match(/(\w+),\s+(\w+)\s+(\d+)/);
  if (match) {
    const monthName = match[2].toLowerCase();
    const day = parseInt(match[3].replace(/\D/g, ""), 10);
    const month = months[monthName];
    if (month !== undefined) {
      return new Date(2025, month, day);
    }
  }
  return null;
}

function parseTime(raw: unknown): string {
  if (raw instanceof Date) {
    return raw.toTimeString().slice(0, 5);
  }
  if (typeof raw === "number") {
    const totalMinutes = Math.round(raw * 24 * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }
  if (typeof raw === "string") {
    const match = raw.match(/(\d{1,2}):(\d{2})/);
    if (match) return `${match[1].padStart(2, "0")}:${match[2]}`;
  }
  return "09:00";
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/migrate-excel.ts <path-to-xlsx>");
    process.exit(1);
  }

  const resolved = path.resolve(filePath);
  console.log(`Reading spreadsheet: ${resolved}`);

  const workbook = XLSX.readFile(resolved, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const headerRow = rawRows[0];
  console.log(`Columns: ${(headerRow || []).map(String).join(", ")}`);
  console.log(`Total rows (including header): ${rawRows.length}`);

  let imported = 0;
  let skipped = 0;
  let pendingName: string | null = null;

  for (let i = 1; i < rawRows.length; i++) {
    const cells = rawRows[i];
    if (!cells || cells.length === 0) continue;

    const raw: RawRow = {
      date: cells[0] != null ? String(cells[0]) : null,
      clientName: cells[1] != null ? String(cells[1]) : null,
      phone: cells[2] != null ? String(cells[2]) : null,
      address: cells[3] != null ? String(cells[3]) : null,
      mobilityAid: cells[4] != null ? String(cells[4]) : null,
      assistanceInOut: cells[5] != null ? String(cells[5]) : null,
      time: cells[6] ?? null,
      duration: cells[7] != null ? String(cells[7]) : null,
      appointmentLocation: cells[8] != null ? String(cells[8]) : null,
      notes: cells[9] != null ? String(cells[9]) : null,
    };

    // Handle split rows: name on one line, data on another
    if (raw.clientName && !raw.date && !raw.phone && !raw.address) {
      pendingName = raw.clientName;
      continue;
    }

    const clientName = raw.clientName || pendingName;
    pendingName = null;

    if (!clientName || !raw.address) {
      skipped++;
      continue;
    }

    const appointmentDate = raw.date ? parseDate(raw.date) : null;
    if (!appointmentDate) {
      console.warn(`  Row ${i + 1}: Could not parse date "${raw.date}", skipping.`);
      skipped++;
      continue;
    }

    const appointmentTime = parseTime(raw.time);
    const { duration, tripType } = parseDuration(raw.duration);
    const { aid: mobilityAid, notes: mobilityAidNotes } = parseMobilityAid(raw.mobilityAid);
    const assistanceInOut = parseAssistance(raw.assistanceInOut);
    const zone = guessZone(raw.address);

    await prisma.ride.create({
      data: {
        seniorName: clientName.trim(),
        seniorPhone: formatPhone(raw.phone),
        pickupAddress: raw.address.trim(),
        destinationAddress: (raw.appointmentLocation || "TBD").trim(),
        appointmentDate,
        appointmentTime,
        appointmentDuration: duration,
        tripType,
        mobilityAid,
        mobilityAidNotes,
        assistanceInOut,
        zone,
        status: "completed",
        notes: raw.notes?.trim() || null,
      },
    });

    imported++;
    console.log(
      `  ✓ ${clientName.trim()} — ${appointmentDate.toDateString()} ${appointmentTime} [${zone}] [${tripType}]`
    );
  }

  console.log(`\nDone. Imported: ${imported}, Skipped: ${skipped}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
