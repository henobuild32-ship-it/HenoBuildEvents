import { db } from "../src/lib/db";

async function seedTimeline() {
  console.log("🌱 Seeding timeline items...");

  // Find the test event
  const event = await db.event.findFirst({
    where: { title: "Mariage de Sarah & Karim" },
  });

  if (!event) {
    console.log("❌ Test event not found");
    return;
  }

  // Check if timeline items already exist
  const existing = await db.timelineItem.count({
    where: { eventId: event.id },
  });

  if (existing > 0) {
    console.log(`⏭️  Timeline already has ${existing} items, skipping...`);
    return;
  }

  const timelineItems = [
    {
      title: "Préparation & Accueil",
      startTime: "09:00",
      duration: 60,
      description: "Accueil des invités et préparation finale de la salle",
      location: "Salle de préparation",
      color: "#d4a853",
      status: "A_VENIR" as const,
      sortOrder: 0,
      eventId: event.id,
    },
    {
      title: "Cérémonie religieuse",
      startTime: "10:30",
      duration: 90,
      description: "Cérémonie de mariage à l'église avec échange des vœux",
      location: "Église Saint-Augustin",
      color: "#e879f9",
      status: "A_VENIR" as const,
      sortOrder: 1,
      eventId: event.id,
    },
    {
      title: "Photos de groupe",
      startTime: "12:00",
      duration: 60,
      description: "Séance photo avec les familles et les invités",
      location: "Jardin du Château",
      color: "#34d399",
      status: "A_VENIR" as const,
      sortOrder: 2,
      eventId: event.id,
    },
    {
      title: "Cocktail d'accueil",
      startTime: "13:30",
      duration: 90,
      description: "Cocktail dinatoire avec amuse-bouches et champagne",
      location: "Terrasse panoramique",
      color: "#f59e0b",
      status: "A_VENIR" as const,
      sortOrder: 3,
      eventId: event.id,
    },
    {
      title: "Déjeuner",
      startTime: "15:00",
      duration: 120,
      description: "Repas gastronomique avec menu à thème marocain",
      location: "Grande Salle",
      color: "#60a5fa",
      status: "A_VENIR" as const,
      sortOrder: 4,
      eventId: event.id,
    },
    {
      title: "Discours & Toasts",
      startTime: "17:30",
      duration: 45,
      description: "Discours des témoins et toasts en l'honneur des mariés",
      location: "Grande Salle",
      color: "#a78bfa",
      status: "A_VENIR" as const,
      sortOrder: 5,
      eventId: event.id,
    },
    {
      title: "Ouverture de la piste de danse",
      startTime: "18:30",
      duration: 180,
      description: "Soirée dansante avec DJ et animations",
      location: "Salle de réception",
      color: "#fb7185",
      status: "A_VENIR" as const,
      sortOrder: 6,
      eventId: event.id,
    },
    {
      title: "Feu d'artifice & Clôture",
      startTime: "22:00",
      duration: 30,
      description: "Spectacle de feu d'artifice grandiose pour clôturer la soirée",
      location: "Jardin principal",
      color: "#fbbf24",
      status: "A_VENIR" as const,
      sortOrder: 7,
      eventId: event.id,
    },
  ];

  for (const item of timelineItems) {
    await db.timelineItem.create({ data: item });
  }

  console.log(`✅ Created ${timelineItems.length} timeline items for "${event.title}"`);
}

seedTimeline()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
