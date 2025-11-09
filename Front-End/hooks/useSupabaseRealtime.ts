import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useBookingStore } from "@/stores/bookingStore";
import type { Booking } from "@/types";

/**
 * Hook pour écouter les mises à jour en temps réel des réservations via Supabase Realtime
 */
export function useSupabaseRealtime() {
  const { updateBooking, addBooking } = useBookingStore();

  useEffect(() => {
    // Écouter les changements sur la table bookings
    const channel = supabase
      .channel("bookings-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            addBooking(payload.new as Booking);
          } else if (payload.eventType === "UPDATE") {
            updateBooking(payload.new.id, payload.new as Partial<Booking>);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [updateBooking, addBooking]);
}


