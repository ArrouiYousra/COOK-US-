"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Loader2, MapPin } from "lucide-react";
import { apiClient } from "@/lib/api/client";

interface Marker {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  description?: string;
  color?: string;
}

interface Route {
  origin: [number, number]; // [lat, lng]
  destination: [number, number]; // [lat, lng]
  color?: string;
}

interface MapboxMapProps {
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  markers?: Marker[];
  route?: Route;
  height?: string;
  className?: string;
  onMarkerClick?: (marker: Marker) => void;
  interactive?: boolean;
}

/**
 * Composant de carte Mapbox interactive
 * Style Uber-like avec marqueurs et itinéraires
 */
export function MapboxMap({
  center = [48.8566, 2.3522], // Paris par défaut
  zoom = 12,
  markers = [],
  route,
  height = "400px",
  className = "",
  onMarkerClick,
  interactive = true,
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const routeLayerRef = useRef<string | null>(null);

  // Initialiser la carte
  useEffect(() => {
    if (!mapContainer.current) return;

    const initMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Récupérer le token Mapbox
        let token: string;
        try {
          const tokenResponse = await apiClient.getMapboxToken();
          token = tokenResponse.token;
          
          if (!token || token === "votre_token_mapbox" || token.trim() === "") {
            throw new Error("Token Mapbox non configuré ou invalide. Veuillez configurer MAPBOX_ACCESS_TOKEN dans le backend.");
          }
        } catch (tokenError: any) {
          console.error("Erreur lors de la récupération du token Mapbox:", tokenError);
          const tokenErrorMessage = tokenError?.response?.data?.message || tokenError?.message || "Impossible de récupérer le token Mapbox";
          setError(tokenErrorMessage);
          setIsLoading(false);
          return;
        }

        // Vérifier que le token est valide (commence par pk.)
        if (!token.startsWith("pk.")) {
          console.error("Token Mapbox invalide. Le token doit commencer par 'pk.'");
          setError("Token Mapbox invalide. Veuillez vérifier la configuration dans le backend.");
          setIsLoading(false);
          return;
        }

        mapboxgl.accessToken = token;

        // Créer la carte
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [center[1], center[0]], // Mapbox utilise [lng, lat]
          zoom: zoom,
          interactive: interactive,
        });

        // Attendre que la carte soit chargée
        map.current.on("load", () => {
          setIsLoading(false);
        });

        map.current.on("error", (e: any) => {
          console.error("Mapbox error:", {
            error: e,
            errorType: e?.type,
            errorMessage: e?.error?.message || e?.message || "Erreur inconnue",
            errorCode: e?.error?.code,
            token: token ? `${token.substring(0, 10)}...` : "non défini",
          });
          
          let errorMessage = "Erreur lors du chargement de la carte";
          if (e?.error?.message) {
            errorMessage = e.error.message;
          } else if (e?.message) {
            errorMessage = e.message;
          } else if (e?.type === "style") {
            errorMessage = "Erreur de style de carte. Vérifiez le token Mapbox.";
          }
          
          setError(errorMessage);
          setIsLoading(false);
        });
      } catch (err: any) {
        console.error("Erreur lors de l'initialisation de la carte:", {
          error: err,
          message: err?.message,
          response: err?.response?.data,
          stack: err?.stack,
        });
        const errorMessage = err?.response?.data?.message || err?.message || "Impossible de charger la carte";
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      // Nettoyer les marqueurs
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // Nettoyer la route
      if (map.current && routeLayerRef.current) {
        if (map.current.getLayer(routeLayerRef.current)) {
          map.current.removeLayer(routeLayerRef.current);
        }
        if (map.current.getSource(routeLayerRef.current)) {
          map.current.removeSource(routeLayerRef.current);
        }
      }

      // Détruire la carte
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // Une seule fois au montage

  // Mettre à jour le centre et le zoom
  useEffect(() => {
    if (map.current) {
      map.current.setCenter([center[1], center[0]]);
      map.current.setZoom(zoom);
    }
  }, [center, zoom]);

  // Ajouter les marqueurs
  useEffect(() => {
    if (!map.current || !map.current.loaded()) return;

    // Supprimer les anciens marqueurs
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Ajouter les nouveaux marqueurs
    markers.forEach((markerData) => {
      const el = document.createElement("div");
      el.className = "custom-marker";
      el.style.width = "32px";
      el.style.height = "32px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = markerData.color || "#3b82f6";
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
      el.style.cursor = "pointer";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";

      // Icône de pin
      const pinIcon = document.createElement("div");
      pinIcon.innerHTML = "📍";
      pinIcon.style.fontSize = "16px";
      el.appendChild(pinIcon);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([markerData.lng, markerData.lat])
        .addTo(map.current!);

      // Popup avec informations
      if (markerData.title || markerData.description) {
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div class="p-2">
            ${markerData.title ? `<h3 class="font-semibold text-sm mb-1">${markerData.title}</h3>` : ""}
            ${markerData.description ? `<p class="text-xs text-muted-foreground">${markerData.description}</p>` : ""}
          </div>
        `);
        marker.setPopup(popup);
      }

      // Gestionnaire de clic
      if (onMarkerClick) {
        el.addEventListener("click", () => {
          onMarkerClick(markerData);
        });
      }

      markersRef.current.push(marker);
    });
  }, [markers, onMarkerClick]);

  // Ajouter l'itinéraire
  useEffect(() => {
    if (!map.current || !map.current.loaded() || !route) return;

    const drawRoute = async () => {
      try {
        // Supprimer l'ancienne route
        if (routeLayerRef.current) {
          if (map.current!.getLayer(routeLayerRef.current)) {
            map.current!.removeLayer(routeLayerRef.current);
          }
          if (map.current!.getSource(routeLayerRef.current)) {
            map.current!.removeSource(routeLayerRef.current);
          }
        }

        // Calculer l'itinéraire via l'API backend
        const distanceResult = await apiClient.calculateDistance(
          [route.origin[0], route.origin[1]],
          [route.destination[0], route.destination[1]],
          "driving"
        );

        // Pour l'instant, on trace une ligne droite
        // TODO: Utiliser l'API Directions de Mapbox pour obtenir le tracé réel
        const routeId = `route-${Date.now()}`;
        map.current!.addSource(routeId, {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [route.origin[1], route.origin[0]], // [lng, lat]
                [route.destination[1], route.destination[0]], // [lng, lat]
              ],
            },
            properties: {
              distance: distanceResult.result.distance_km,
              duration: distanceResult.result.duration_minutes,
            },
          },
        });

        map.current!.addLayer({
          id: routeId,
          type: "line",
          source: routeId,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": route.color || "#3b82f6",
            "line-width": 4,
            "line-opacity": 0.7,
          },
        });

        routeLayerRef.current = routeId;

        // Ajuster la vue pour inclure les deux points
        const bounds = new mapboxgl.LngLatBounds()
          .extend([route.origin[1], route.origin[0]])
          .extend([route.destination[1], route.destination[0]]);

        map.current!.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15,
        });
      } catch (error) {
        console.error("Erreur lors du tracé de l'itinéraire:", error);
      }
    };

    drawRoute();
  }, [route]);

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10 rounded-lg">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10 rounded-lg">
          <div className="text-center p-4">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />
    </div>
  );
}

