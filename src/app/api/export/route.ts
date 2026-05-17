import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateToken } from "@/lib/auth";

function escapeCsvField(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(headers: string[], rows: string[][]): string {
  const headerLine = headers.join(",");
  const dataLines = rows.map((row) => row.map(escapeCsvField).join(","));
  return [headerLine, ...dataLines].join("\n");
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const session = validateToken(token);
    if (!session) {
      return NextResponse.json({ error: "Session expirée ou invalide" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const eventId = searchParams.get("eventId");
    const format = searchParams.get("format") || "csv";

    if (!type || !eventId) {
      return NextResponse.json({ error: "Paramètres type et eventId requis" }, { status: 400 });
    }

    if (format !== "csv") {
      return NextResponse.json({ error: "Seul le format CSV est supporté" }, { status: 400 });
    }

    // Verify event ownership
    const event = await db.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true, title: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });
    }

    if (event.organizerId !== session.userId) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    let csvContent: string;
    let filename: string;

    switch (type) {
      case "guests": {
        const guests = await db.guest.findMany({
          where: { eventId },
          include: { table: { select: { name: true, number: true } } },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        });

        const headers = [
          "Prénom", "Nom", "Email", "Téléphone", "Statut",
          "Table", "Siège", "Accompagnateur", "Nom accompagnateur",
          "Exigences alimentaires", "Code QR", "Date d'enregistrement", "Date de confirmation"
        ];

        const rows = guests.map((g) => [
          g.firstName,
          g.lastName,
          g.email || "",
          g.phone || "",
          g.status,
          g.table ? `${g.table.number} - ${g.table.name}` : "",
          g.seatNumber ? String(g.seatNumber) : "",
          g.plusOne ? "Oui" : "Non",
          g.plusOneName || "",
          g.dietaryReq || "",
          g.qrCode || "",
          g.checkedInAt ? new Date(g.checkedInAt).toLocaleString("fr-FR") : "",
          g.confirmedAt ? new Date(g.confirmedAt).toLocaleString("fr-FR") : "",
        ]);

        csvContent = buildCsv(headers, rows);
        const safeTitle = event.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
        filename = `${safeTitle}_invites.csv`;
        break;
      }

      case "tables": {
        const tables = await db.table.findMany({
          where: { eventId },
          include: {
            guests: {
              select: {
                firstName: true,
                lastName: true,
                status: true,
                seatNumber: true,
              },
              orderBy: [{ lastName: "asc" }],
            },
          },
          orderBy: { number: "asc" },
        });

        const headers = [
          "Numéro de table", "Nom de table", "Capacité", "Occupation actuelle",
          "VIP", "Invités assignés", "Statuts des invités"
        ];

        const rows = tables.map((t) => [
          String(t.number),
          t.name,
          String(t.capacity),
          String(t.currentOccupancy),
          t.isVip ? "Oui" : "Non",
          t.guests.map((g) => `${g.firstName} ${g.lastName}`).join("; "),
          t.guests.map((g) => g.status).join("; "),
        ]);

        csvContent = buildCsv(headers, rows);
        const safeTitle = event.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
        filename = `${safeTitle}_tables.csv`;
        break;
      }

      case "invitations": {
        const invitations = await db.invitation.findMany({
          where: { eventId },
          include: {
            guest: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        const headers = [
          "Invité - Prénom", "Invité - Nom", "Invité - Email", "Statut invité",
          "Lien unique", "Envoyée", "Date d'envoi", "Utilisée", "Date d'utilisation",
          "Date d'expiration", "Message personnel", "Date de création"
        ];

        const rows = invitations.map((inv) => [
          inv.guest.firstName,
          inv.guest.lastName,
          inv.guest.email || "",
          inv.guest.status,
          inv.uniqueLink,
          inv.isSent ? "Oui" : "Non",
          inv.sentAt ? new Date(inv.sentAt).toLocaleString("fr-FR") : "",
          inv.isUsed ? "Oui" : "Non",
          inv.usedAt ? new Date(inv.usedAt).toLocaleString("fr-FR") : "",
          inv.expiresAt ? new Date(inv.expiresAt).toLocaleString("fr-FR") : "",
          inv.message || "",
          new Date(inv.createdAt).toLocaleString("fr-FR"),
        ]);

        csvContent = buildCsv(headers, rows);
        const safeTitle = event.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
        filename = `${safeTitle}_invitations.csv`;
        break;
      }

      case "rsvp": {
        const guests = await db.guest.findMany({
          where: {
            eventId,
            status: { in: ["CONFIRMED", "DECLINED", "PRESENT"] },
          },
          include: { table: { select: { name: true, number: true } } },
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        });

        const headers = [
          "Prénom", "Nom", "Email", "Téléphone", "Statut RSVP",
          "Date de confirmation", "Date d'enregistrement",
          "Accompagnateur", "Nom accompagnateur", "Exigences alimentaires",
          "Table assignée"
        ];

        const rows = guests.map((g) => [
          g.firstName,
          g.lastName,
          g.email || "",
          g.phone || "",
          g.status,
          g.confirmedAt ? new Date(g.confirmedAt).toLocaleString("fr-FR") : "",
          g.checkedInAt ? new Date(g.checkedInAt).toLocaleString("fr-FR") : "",
          g.plusOne ? "Oui" : "Non",
          g.plusOneName || "",
          g.dietaryReq || "",
          g.table ? `${g.table.number} - ${g.table.name}` : "",
        ]);

        csvContent = buildCsv(headers, rows);
        const safeTitle = event.title.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
        filename = `${safeTitle}_rsvp.csv`;
        break;
      }

      default:
        return NextResponse.json(
          { error: "Type d'export invalide. Utilisez: guests, tables, invitations, rsvp" },
          { status: 400 }
        );
    }

    // Add BOM for Excel UTF-8 compatibility
    const bom = "\uFEFF";
    const csvWithBom = bom + csvContent;

    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'export des données" },
      { status: 500 }
    );
  }
}
