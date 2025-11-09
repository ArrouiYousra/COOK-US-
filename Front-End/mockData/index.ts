import type { User, Cook, Dish, Booking, Review } from "@/types";

/**
 * Données de test pour le développement
 * À remplacer par les appels API réels
 */

export const mockUsers: User[] = [
  {
    id: "1",
    name: "Jean Dupont",
    email: "jean.dupont@example.com",
    avatarUrl: "/avatars/jean.jpg",
    phone: "+33612345678",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    name: "Marie Martin",
    email: "marie.martin@example.com",
    avatarUrl: "/avatars/marie.jpg",
    phone: "+33687654321",
    createdAt: "2024-01-16T10:00:00Z",
    updatedAt: "2024-01-16T10:00:00Z",
  },
];

export const mockDishes: Dish[] = [
  {
    id: "1",
    cookId: "2",
    name: "Bœuf Bourguignon",
    description: "Plat traditionnel mijoté au vin rouge",
    price: 35,
    imageUrl: "/dishes/boeuf-bourguignon.jpg",
    category: "Plat principal",
    allergens: ["gluten", "lactose"],
  },
  {
    id: "2",
    cookId: "2",
    name: "Tarte Tatin",
    description: "Dessert aux pommes caramélisées",
    price: 12,
    imageUrl: "/dishes/tarte-tatin.jpg",
    category: "Dessert",
    allergens: ["gluten", "lactose"],
  },
];

export const mockCooks: Cook[] = [
  {
    id: "3",
    name: "Thomas Dubois",
    email: "thomas.dubois@example.com",
    avatarUrl: "/images/low-angle-male-chef-hacher-les-legumes-dans-la-cuisine.jpg",
    phone: "+33611111111",
    createdAt: "2024-01-17T10:00:00Z",
    updatedAt: "2024-01-17T10:00:00Z",
    siret: "23456789012345",
    bio: "Chef spécialisé en cuisine méditerranéenne et healthy, 8 ans d'expérience",
    dishes: [],
    rating: 4.9,
    reviewCount: 32,
    location: {
      latitude: 48.8606,
      longitude: 2.3376,
      address: "22 Avenue des Champs-Élysées",
      city: "Paris",
      zipCode: "75008",
    },
    specialties: ["Méditerranéenne", "Healthy"],
    pricePerPerson: 40,
    maxGuests: 6,
    documents: {
      siretUrl: "/documents/siret-sophie.pdf",
      identityUrl: "/documents/identity-sophie.pdf",
    },
  },
  {
    id: "2",
    name: "Marie Martin",
    email: "marie.martin@example.com",
    avatarUrl: "/images/chef-feminin-versant-soigneusement-la-sauce-sur-le-plat.jpg",
    phone: "+33687654321",
    createdAt: "2024-01-16T10:00:00Z",
    updatedAt: "2024-01-16T10:00:00Z",
    siret: "12345678901234",
    bio: "Chef passionnée de cuisine française traditionnelle avec 10 ans d'expérience",
    dishes: mockDishes,
    rating: 4.8,
    reviewCount: 24,
    location: {
      latitude: 48.8566,
      longitude: 2.3522,
      address: "15 Rue de la Paix",
      city: "Paris",
      zipCode: "75001",
    },
    specialties: ["Cuisine française", "Pâtisserie"],
    pricePerPerson: 35,
    maxGuests: 8,
    documents: {
      siretUrl: "/documents/siret-marie.pdf",
      identityUrl: "/documents/identity-marie.pdf",
    },
  },
  {
    id: "4",
    name: "Pierre Leclerc",
    email: "pierre.leclerc@example.com",
    avatarUrl: "/images/coup-moyen-smiley-homme-tenant-une-assiette-de-nourriture.jpg",
    phone: "+33622222222",
    createdAt: "2024-01-18T10:00:00Z",
    updatedAt: "2024-01-18T10:00:00Z",
    siret: "34567890123456",
    bio: "Chef expert en cuisine asiatique fusion, 12 ans d'expérience dans les restaurants étoilés",
    dishes: [],
    rating: 4.7,
    reviewCount: 18,
    location: {
      latitude: 48.8522,
      longitude: 2.3697,
      address: "8 Rue de Belleville",
      city: "Paris",
      zipCode: "75020",
    },
    specialties: ["Asiatique", "Fusion"],
    pricePerPerson: 45,
    maxGuests: 10,
    documents: {
      siretUrl: "/documents/siret-pierre.pdf",
      identityUrl: "/documents/identity-pierre.pdf",
    },
  },
];

export const mockBookings: Booking[] = [
  {
    id: "1",
    cookId: "2",
    userId: "1",
    date: "2024-12-25",
    time: "19:00",
    numberOfGuests: 4,
    status: "confirmed",
    totalPrice: 140,
    specialRequests: "Pas de noix",
    createdAt: "2024-11-01T10:00:00Z",
    updatedAt: "2024-11-01T10:00:00Z",
  },
];

export const mockReviews: Review[] = [
  {
    id: "1",
    bookingId: "1",
    cookId: "2",
    userId: "1",
    rating: 5,
    comment: "Excellente expérience, cuisine délicieuse et accueil chaleureux !",
    createdAt: "2024-12-26T10:00:00Z",
  },
];


