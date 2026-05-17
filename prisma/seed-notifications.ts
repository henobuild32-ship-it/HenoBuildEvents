import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding notifications...");

  // Find the test user
  const user = await prisma.user.findUnique({
    where: { email: "test@henobuild.com" },
  });

  if (!user) {
    console.error("❌ Test user not found (test@henobuild.com). Please run the main seed first.");
    process.exit(1);
  }

  // Find the first event for this user
  const event = await prisma.event.findFirst({
    where: { organizerId: user.id },
  });

  // Find some guests for this event
  const guests = event
    ? await prisma.guest.findMany({
        where: { eventId: event.id },
        take: 5,
      })
    : [];

  // Clear existing notifications for the test user
  await prisma.notification.deleteMany({
    where: { userId: user.id },
  });

  const now = Date.now();

  const notifications = [
    {
      userId: user.id,
      type: "EVENT_REMINDER" as const,
      title: "Rappel d'événement",
      message: event
        ? `Votre événement "${event.title}" est dans 3 jours`
        : "Vous avez un événement à venir dans 3 jours",
      eventId: event?.id || null,
      guestId: null,
      link: event ? `/dashboard?eventId=${event.id}` : null,
      isRead: false,
      createdAt: new Date(now - 30 * 60 * 1000), // 30 min ago
    },
    {
      userId: user.id,
      type: "RSVP_CONFIRMED" as const,
      title: "Confirmation RSVP",
      message: guests[0]
        ? `${guests[0].firstName} ${guests[0].lastName} a confirmé sa présence`
        : "Un invité a confirmé sa présence",
      eventId: event?.id || null,
      guestId: guests[0]?.id || null,
      link: event ? `/dashboard?eventId=${event.id}&tab=guests` : null,
      isRead: false,
      createdAt: new Date(now - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      userId: user.id,
      type: "GUEST_ARRIVED" as const,
      title: "Invité arrivé",
      message: guests[1]
        ? `${guests[1].firstName} ${guests[1].lastName} vient d'arriver à l'événement`
        : "Un invité vient d'arriver à l'événement",
      eventId: event?.id || null,
      guestId: guests[1]?.id || null,
      link: event ? `/dashboard?eventId=${event.id}&tab=guests` : null,
      isRead: false,
      createdAt: new Date(now - 3 * 60 * 60 * 1000), // 3 hours ago
    },
    {
      userId: user.id,
      type: "MESSAGE_RECEIVED" as const,
      title: "Nouveau message",
      message: guests[2]
        ? `${guests[2].firstName} ${guests[2].lastName} vous a envoyé un message`
        : "Vous avez reçu un nouveau message",
      eventId: event?.id || null,
      guestId: guests[2]?.id || null,
      link: event ? `/dashboard?eventId=${event.id}&tab=messages` : null,
      isRead: false,
      createdAt: new Date(now - 5 * 60 * 60 * 1000), // 5 hours ago
    },
    {
      userId: user.id,
      type: "TABLE_ASSIGNED" as const,
      title: "Table assignée",
      message: guests[3]
        ? `${guests[3].firstName} ${guests[3].lastName} a été assigné(e) à la Table VIP`
        : "Un invité a été assigné à une table",
      eventId: event?.id || null,
      guestId: guests[3]?.id || null,
      link: event ? `/dashboard?eventId=${event.id}&tab=tables` : null,
      isRead: true,
      readAt: new Date(now - 10 * 60 * 60 * 1000),
      createdAt: new Date(now - 12 * 60 * 60 * 1000), // 12 hours ago
    },
    {
      userId: user.id,
      type: "INVITATION_SENT" as const,
      title: "Invitation envoyée",
      message: "15 invitations ont été envoyées avec succès",
      eventId: event?.id || null,
      guestId: null,
      link: event ? `/dashboard?eventId=${event.id}&tab=invitations` : null,
      isRead: true,
      readAt: new Date(now - 20 * 60 * 60 * 1000),
      createdAt: new Date(now - 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      userId: user.id,
      type: "RSVP_DECLINED" as const,
      title: "RSVP décliné",
      message: guests[4]
        ? `${guests[4].firstName} ${guests[4].lastName} a décliné l'invitation`
        : "Un invité a décliné l'invitation",
      eventId: event?.id || null,
      guestId: guests[4]?.id || null,
      link: event ? `/dashboard?eventId=${event.id}&tab=guests` : null,
      isRead: true,
      readAt: new Date(now - 30 * 60 * 60 * 1000),
      createdAt: new Date(now - 36 * 60 * 60 * 1000), // 1.5 days ago
    },
    {
      userId: user.id,
      type: "EVENT_UPDATED" as const,
      title: "Événement mis à jour",
      message: event
        ? `Les détails de "${event.title}" ont été modifiés`
        : "Les détails d'un événement ont été modifiés",
      eventId: event?.id || null,
      guestId: null,
      link: event ? `/dashboard?eventId=${event.id}` : null,
      isRead: true,
      readAt: new Date(now - 40 * 60 * 60 * 1000),
      createdAt: new Date(now - 48 * 60 * 60 * 1000), // 2 days ago
    },
    {
      userId: user.id,
      type: "GENERAL" as const,
      title: "Bienvenue sur HenoBuild Event",
      message: "Commencez par créer votre premier événement ! Découvrez toutes les fonctionnalités de la plateforme.",
      eventId: null,
      guestId: null,
      link: null,
      isRead: true,
      readAt: new Date(now - 70 * 60 * 60 * 1000),
      createdAt: new Date(now - 72 * 60 * 60 * 1000), // 3 days ago
    },
  ];

  for (const notif of notifications) {
    await prisma.notification.create({
      data: notif,
    });
  }

  console.log(`✅ Created ${notifications.length} notifications for ${user.email}`);
  console.log(`   - ${notifications.filter(n => !n.isRead).length} unread`);
  console.log(`   - ${notifications.filter(n => n.isRead).length} read`);
  console.log(`   - Event: ${event?.title || "N/A"}`);
  console.log(`   - Guests linked: ${notifications.filter(n => n.guestId).length}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
