declare module "@mapbox/mapbox-sdk/services/geocoding" {
  import { MapiRequest } from "@mapbox/mapbox-sdk/lib/classes/mapi-request";
  import { MapiResponse } from "@mapbox/mapbox-sdk/lib/classes/mapi-response";

  interface GeocodingService {
    forwardGeocode(config: {
      query: string;
      countries?: string[];
      limit?: number;
      proximity?: [number, number];
      types?: string[];
    }): MapiRequest;
    reverseGeocode(config: {
      query: [number, number];
      limit?: number;
    }): MapiRequest;
  }

  function geocodingService(config: {
    accessToken: string;
  }): GeocodingService;

  export default geocodingService;
}

declare module "@mapbox/mapbox-sdk/services/directions" {
  import { MapiRequest } from "@mapbox/mapbox-sdk/lib/classes/mapi-request";

  interface DirectionsService {
    getDirections(config: {
      waypoints: Array<{ coordinates: [number, number] }>;
      profile: "driving" | "walking" | "cycling";
      geometries?: string;
    }): MapiRequest;
  }

  function directionsService(config: {
    accessToken: string;
  }): DirectionsService;

  export default directionsService;
}

declare module "@mapbox/mapbox-sdk/services/matrix" {
  import { MapiRequest } from "@mapbox/mapbox-sdk/lib/classes/mapi-request";

  interface MatrixService {
    getMatrix(config: {
      points: [number, number][];
      profile: "driving" | "walking" | "cycling";
    }): MapiRequest;
  }

  function matrixService(config: {
    accessToken: string;
  }): MatrixService;

  export default matrixService;
}

