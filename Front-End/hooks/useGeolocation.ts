import { useState, useEffect } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  isLoading: boolean;
}

/**
 * Hook pour obtenir la position géolocalisée de l'utilisateur
 */
export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      // Utiliser un callback pour éviter setState synchrone
      setTimeout(() => {
        setState({
          latitude: null,
          longitude: null,
          error: "La géolocalisation n'est pas supportée par votre navigateur",
          isLoading: false,
        });
      }, 0);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          isLoading: false,
        });
      },
      (error) => {
        setState({
          latitude: null,
          longitude: null,
          error: error.message,
          isLoading: false,
        });
      }
    );
  }, []);

  return state;
}


