export interface LatLng { lat: number; lng: number }
export interface Passenger extends LatLng { id: string; full_name: string; address: string }
export interface Destination extends LatLng { id: string; name: string; address: string }
export interface Vehicle { id: string; plate: string; model: string }
export interface Driver { id: string; full_name: string }

export interface RouteLeg {
  points: [number, number][];
  lengthMeters: number;
  travelTimeSeconds: number;
  trafficDelaySeconds: number;
}

export interface CalculatedRoute {
  points: [number, number][];
  legs: RouteLeg[];
  lengthMeters: number;
  travelTimeSeconds: number;
  trafficDelaySeconds: number;
  noTrafficTravelTimeSeconds: number;
}
