import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find the existing event
  const event = await prisma.event.findFirst({
    where: { title: "Mariage de Sarah & Karim" },
  });

  if (!event) {
    console.error("Event not found. Please seed events first.");
    process.exit(1);
  }

  console.log(`Seeding budget expenses for event: ${event.title} (${event.id})`);

  // Check if expenses already exist for this event
  const existing = await prisma.expense.count({ where: { eventId: event.id } });
  if (existing > 0) {
    console.log(`Found ${existing} existing expenses. Skipping seed.`);
    await prisma.$disconnect();
    return;
  }

  const expenses = [
    {
      name: "Saveurs d'Orient",
      category: "TRAITER",
      amount: 4500,
      vendor: "Traiteur Saveurs d'Orient",
      date: new Date("2025-01-15"),
      status: "PAID",
    },
    {
      name: "Salle du Château de Versailles",
      category: "LIEU",
      amount: 8000,
      vendor: "Château de Versailles",
      date: new Date("2025-01-10"),
      status: "PAID",
    },
    {
      name: "Lumière d'Or",
      category: "PHOTOGRAPHIE",
      amount: 2500,
      vendor: "Photographe Lumière d'Or",
      date: new Date("2025-02-01"),
      status: "PENDING",
    },
    {
      name: "DJ Karim Mix",
      category: "MUSIQUE",
      amount: 1200,
      vendor: "DJ Karim Mix",
      date: new Date("2025-01-20"),
      status: "PAID",
    },
    {
      name: "Roses & Co",
      category: "FLEURISTE",
      amount: 1800,
      vendor: "Fleuriste Roses & Co",
      date: new Date("2025-02-10"),
      status: "PENDING",
    },
    {
      name: "Robe de mariée Couture Paris",
      category: "TENUES",
      amount: 3500,
      vendor: "Couture Paris",
      date: new Date("2025-01-05"),
      status: "PAID",
    },
    {
      name: "Bus navette",
      category: "TRANSPORT",
      amount: 800,
      vendor: "Transport Navette Express",
      date: new Date("2025-02-15"),
      status: "PENDING",
    },
    {
      name: "Art Floral",
      category: "DECORATION",
      amount: 2200,
      vendor: "Décoration Art Floral",
      date: new Date("2025-01-25"),
      status: "PAID",
    },
    {
      name: "Pâtisserie Royale",
      category: "TRAITER",
      amount: 600,
      vendor: "Pâtisserie Royale",
      date: new Date("2025-02-05"),
      status: "PENDING",
    },
    {
      name: "Faire-part Imprimerie Luxe",
      category: "AUTRES",
      amount: 400,
      vendor: "Imprimerie Luxe",
      date: new Date("2025-01-12"),
      status: "PAID",
    },
  ];

  for (const expense of expenses) {
    await prisma.expense.create({
      data: {
        ...expense,
        eventId: event.id,
      },
    });
  }

  console.log(`✅ Created ${expenses.length} budget expenses`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
