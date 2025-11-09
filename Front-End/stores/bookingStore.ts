import { create } from "zustand";
import type { Booking, BookingState } from "@/types";

interface BookingStore extends BookingState {
  setBookings: (bookings: Booking[]) => void;
  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  removeBooking: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Store Zustand pour la gestion des réservations
 */
export const useBookingStore = create<BookingStore>((set) => ({
  bookings: [],
  isLoading: false,
  error: null,
  setBookings: (bookings) => set({ bookings }),
  addBooking: (booking) =>
    set((state) => ({
      bookings: [...state.bookings, booking],
    })),
  updateBooking: (id, updates) =>
    set((state) => ({
      bookings: state.bookings.map((booking) =>
        booking.id === id ? { ...booking, ...updates } : booking
      ),
    })),
  removeBooking: (id) =>
    set((state) => ({
      bookings: state.bookings.filter((booking) => booking.id !== id),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));


