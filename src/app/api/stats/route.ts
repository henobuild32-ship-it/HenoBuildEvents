import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "eventId est requis" },
        { status: 400 }
      );
    }

    // Get event with basic info
    const event = await db.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        date: true,
        maxGuests: true,
        isPublished: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    // Get guest statistics
    const guests = await db.guest.findMany({
      where: { eventId },
      select: { status: true, plusOne: true },
    });

    const totalGuests = guests.length;
    const invitedCount = guests.filter((g) => g.status === "INVITED").length;
    const confirmedCount = guests.filter((g) => g.status === "CONFIRMED").length;
    const declinedCount = guests.filter((g) => g.status === "DECLINED").length;
    const presentCount = guests.filter((g) => g.status === "PRESENT").length;
    const plusOneCount = guests.filter((g) => g.plusOne).length;

    // Get table statistics
    const tables = await db.table.findMany({
      where: { eventId },
      select: {
        id: true,
        name: true,
        number: true,
        capacity: true,
        currentOccupancy: true,
        isVip: true,
      },
    });

    const totalTables = tables.length;
    const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);
    const totalOccupancy = tables.reduce((sum, t) => sum + t.currentOccupancy, 0);
    const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

    const vipTables = tables.filter((t) => t.isVip);
    const regularTables = tables.filter((t) => !t.isVip);

    // Get invitation statistics
    const invitations = await db.invitation.findMany({
      where: { eventId },
      select: { isSent: true, isUsed: true },
    });

    const totalInvitations = invitations.length;
    const sentInvitations = invitations.filter((i) => i.isSent).length;
    const usedInvitations = invitations.filter((i) => i.isUsed).length;
    const pendingInvitations = totalInvitations - sentInvitations;

    // Get gallery stats
    const galleryCount = await db.galleryItem.count({
      where: { eventId },
    });

    const photoCount = await db.galleryItem.count({
      where: { eventId, type: "PHOTO" },
    });

    const videoCount = await db.galleryItem.count({
      where: { eventId, type: "VIDEO" },
    });

    // Calculate response rate
    const responseRate = totalGuests > 0
      ? Math.round(((confirmedCount + declinedCount + presentCount) / totalGuests) * 100)
      : 0;

    // Calculate confirmation rate (confirmed + present vs total)
    const confirmationRate = totalGuests > 0
      ? Math.round(((confirmedCount + presentCount) / totalGuests) * 100)
      : 0;

    return NextResponse.json({
      stats: {
        event: {
          id: event.id,
          title: event.title,
          date: event.date,
          maxGuests: event.maxGuests,
          isPublished: event.isPublished,
        },
        guests: {
          total: totalGuests,
          invited: invitedCount,
          confirmed: confirmedCount,
          declined: declinedCount,
          present: presentCount,
          plusOnes: plusOneCount,
          responseRate,
          confirmationRate,
        },
        tables: {
          total: totalTables,
          totalCapacity,
          totalOccupancy,
          occupancyRate,
          vipCount: vipTables.length,
          regularCount: regularTables.length,
          availableSeats: totalCapacity - totalOccupancy,
          details: tables.map((t) => ({
            id: t.id,
            name: t.name,
            number: t.number,
            capacity: t.capacity,
            occupancy: t.currentOccupancy,
            available: t.capacity - t.currentOccupancy,
            isVip: t.isVip,
            occupancyPercentage: t.capacity > 0
              ? Math.round((t.currentOccupancy / t.capacity) * 100)
              : 0,
          })),
        },
        invitations: {
          total: totalInvitations,
          sent: sentInvitations,
          pending: pendingInvitations,
          used: usedInvitations,
        },
        gallery: {
          total: galleryCount,
          photos: photoCount,
          videos: videoCount,
        },
        overall: {
          completionScore: Math.round(
            ((totalGuests > 0 ? 1 : 0) * 25) +
            (totalTables > 0 ? 1 : 0) * 25 +
            (event.isPublished ? 1 : 0) * 25 +
            (responseRate / 100) * 25
          ),
          healthStatus:
            responseRate >= 75 ? "excellent" :
            responseRate >= 50 ? "good" :
            responseRate >= 25 ? "fair" : "needs_attention",
        },
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}
