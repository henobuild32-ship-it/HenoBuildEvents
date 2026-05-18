import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

const registerSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  phone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse body
    const body = await request.json();

    // Validate data
    const validated = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: {
        email: validated.email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "Un compte avec cet email existe déjà",
        },
        {
          status: 409,
        }
      );
    }

    /**
     * TEMPORAIRE
     * Mot de passe simple sans hash
     * Pour les tests uniquement
     */
    const passwordHash = validated.password;

    // Create user
    const user = await db.user.create({
      data: {
        email: validated.email,
        passwordHash,
        firstName: validated.firstName,
        lastName: validated.lastName,
        name: `${validated.firstName} ${validated.lastName}`,
        phone: validated.phone || null,
        role: "organizer",
      },
    });

    // Create token/session
    const token = createSession(user.id);

    // Remove password before sending response
    const { passwordHash: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        success: true,
        message: "Compte créé avec succès",
        token,
        user: userWithoutPassword,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Registration error:", error);

    // Zod validation error
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: error.issues,
        },
        {
          status: 400,
        }
      );
    }

    // Prisma/database error
    return NextResponse.json(
      {
        error: "Erreur lors de la création du compte",
      },
      {
        status: 500,
      }
    );
  }
}