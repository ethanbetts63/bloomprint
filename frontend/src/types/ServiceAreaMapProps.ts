export interface ServiceAreaMapProps {
  latitude: number | null;
  longitude: number | null;
  radiusKm: number;
  onLocationChange: (lat: number, lng: number) => void;
  onRadiusChange: (radius: number) => void;
  /** Show the selected area without allowing changes. */
  readOnly?: boolean;
}
