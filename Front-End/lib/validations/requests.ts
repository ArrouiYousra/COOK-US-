import { z } from "zod";

/**
 * Schéma de validation pour la création d'une demande
 */
export const createRequestSchema = z.object({
  title: z
    .string()
    .min(5, "Le titre doit contenir au moins 5 caractères")
    .max(100, "Le titre ne peut pas dépasser 100 caractères"),
  description: z
    .string()
    .min(20, "La description doit contenir au moins 20 caractères")
    .max(1000, "La description ne peut pas dépasser 1000 caractères"),
  date: z.string().min(1, "La date est requise"),
  timeSlot: z.string().min(1, "Le créneau horaire est requis"),
  guestCount: z
    .number()
    .min(1, "Au moins 1 personne est requise")
    .max(20, "Maximum 20 personnes"),
  budget: z
    .number()
    .min(0, "Le budget doit être positif")
    .max(10000, "Le budget maximum est de 10 000 €"),
  address: z
    .string()
    .min(10, "L'adresse doit contenir au moins 10 caractères")
    .max(200, "L'adresse ne peut pas dépasser 200 caractères"),
  setTable: z.boolean(),
  includeDishes: z.boolean(),
});

export type CreateRequestFormData = z.infer<typeof createRequestSchema>;

