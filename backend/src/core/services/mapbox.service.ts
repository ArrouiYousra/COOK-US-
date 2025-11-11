import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding';
import mbxDirections from '@mapbox/mapbox-sdk/services/directions';
import mbxMatrix from '@mapbox/mapbox-sdk/services/matrix';
import dotenv from 'dotenv';

dotenv.config();

// Lazy initialization of Mapbox clients
let geocodingClient: ReturnType<typeof mbxGeocoding> | null = null;
let directionsClient: ReturnType<typeof mbxDirections> | null = null;
let matrixClient: ReturnType<typeof mbxMatrix> | null = null;

function getMapboxAccessToken(): string {
  if (!process.env.MAPBOX_ACCESS_TOKEN) {
    throw new Error(
      'MAPBOX_ACCESS_TOKEN is not defined in environment variables. Please add it to your .env file.'
    );
  }
  return process.env.MAPBOX_ACCESS_TOKEN;
}

function getGeocodingClient() {
  if (!geocodingClient) {
    geocodingClient = mbxGeocoding({ accessToken: getMapboxAccessToken() });
  }
  return geocodingClient;
}

function getDirectionsClient() {
  if (!directionsClient) {
    directionsClient = mbxDirections({ accessToken: getMapboxAccessToken() });
  }
  return directionsClient;
}

function getMatrixClient() {
  if (!matrixClient) {
    matrixClient = mbxMatrix({ accessToken: getMapboxAccessToken() });
  }
  return matrixClient;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  placeName: string;
  address: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface ReverseGeocodeResult {
  placeName: string;
  address: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface AddressSearchResult {
  id: string;
  placeName: string;
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface DistanceResult {
  distance: number; // in meters
  duration: number; // in seconds
}

export class MapboxService {
  /**
   * Geocode an address (address -> coordinates)
   */
  static async geocodeAddress(address: string, country?: string): Promise<GeocodeResult | null> {
    try {
      const client = getGeocodingClient();
      const response = await client
        .forwardGeocode({
          query: address,
          countries: country ? [country] : undefined,
          limit: 1,
        })
        .send();

      if (!response.body.features || response.body.features.length === 0) {
        return null;
      }

      const feature = response.body.features[0];
      const [longitude, latitude] = feature.center;

      // Extract address components
      const context = feature.context || [];
      const city = context.find((c: any) => c.id?.startsWith('place'))?.text;
      const postalCode = context.find((c: any) => c.id?.startsWith('postcode'))?.text;
      const countryCode = context.find((c: any) => c.id?.startsWith('country'))?.text;

      return {
        latitude,
        longitude,
        placeName: feature.place_name,
        address: feature.text || feature.place_name,
        city,
        postalCode,
        country: countryCode,
      };
    } catch (error) {
      console.error('Mapbox geocoding error:', error);
      throw new Error(`Failed to geocode address: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reverse geocode coordinates (coordinates -> address)
   */
  static async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<ReverseGeocodeResult | null> {
    try {
      const client = getGeocodingClient();
      const response = await client
        .reverseGeocode({
          query: [longitude, latitude],
          limit: 1,
        })
        .send();

      if (!response.body.features || response.body.features.length === 0) {
        return null;
      }

      const feature = response.body.features[0];
      const context = feature.context || [];
      const city = context.find((c: any) => c.id?.startsWith('place'))?.text;
      const postalCode = context.find((c: any) => c.id?.startsWith('postcode'))?.text;
      const countryCode = context.find((c: any) => c.id?.startsWith('country'))?.text;

      return {
        placeName: feature.place_name,
        address: feature.text || feature.place_name,
        city,
        postalCode,
        country: countryCode,
      };
    } catch (error) {
      console.error('Mapbox reverse geocoding error:', error);
      throw new Error(
        `Failed to reverse geocode: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Search addresses (autocomplete)
   */
  static async searchAddresses(
    query: string,
    country?: string,
    proximity?: [number, number] // [longitude, latitude]
  ): Promise<AddressSearchResult[]> {
    try {
      const client = getGeocodingClient();
      const response = await client
        .forwardGeocode({
          query,
          countries: country ? [country] : undefined,
          proximity: proximity,
          limit: 10,
          types: ['address', 'poi', 'place'],
        })
        .send();

      if (!response.body.features || response.body.features.length === 0) {
        return [];
      }

      return response.body.features.map((feature: any) => {
        const [longitude, latitude] = feature.center;
        const context = feature.context || [];
        const city = context.find((c: any) => c.id?.startsWith('place'))?.text;
        const postalCode = context.find((c: any) => c.id?.startsWith('postcode'))?.text;
        const countryCode = context.find((c: any) => c.id?.startsWith('country'))?.text;

        return {
          id: feature.id,
          placeName: feature.place_name,
          address: feature.text || feature.place_name,
          latitude,
          longitude,
          city,
          postalCode,
          country: countryCode,
        };
      });
    } catch (error) {
      console.error('Mapbox address search error:', error);
      throw new Error(
        `Failed to search addresses: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Calculate distance and duration between two points
   */
  static async calculateDistance(
    origin: [number, number], // [longitude, latitude]
    destination: [number, number], // [longitude, latitude]
    profile: 'driving' | 'walking' | 'cycling' = 'driving'
  ): Promise<DistanceResult | null> {
    try {
      const client = getDirectionsClient();
      const response = await client
        .getDirections({
          waypoints: [
            { coordinates: origin },
            { coordinates: destination },
          ],
          profile,
          geometries: 'geojson',
        })
        .send();

      if (!response.body.routes || response.body.routes.length === 0) {
        return null;
      }

      const route = response.body.routes[0];
      return {
        distance: route.distance, // in meters
        duration: route.duration, // in seconds
      };
    } catch (error) {
      console.error('Mapbox distance calculation error:', error);
      throw new Error(
        `Failed to calculate distance: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Calculate distance matrix for multiple points
   */
  static async calculateDistanceMatrix(
    coordinates: [number, number][], // Array of [longitude, latitude]
    profile: 'driving' | 'walking' | 'cycling' = 'driving'
  ): Promise<number[][] | null> {
    try {
      const client = getMatrixClient();
      const response = await client
        .getMatrix({
          points: coordinates,
          profile,
        })
        .send();

      if (!response.body.distances) {
        return null;
      }

      return response.body.distances; // Matrix of distances in meters
    } catch (error) {
      console.error('Mapbox distance matrix error:', error);
      throw new Error(
        `Failed to calculate distance matrix: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

