"use client";

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Slider } from '@/components/ui/slider';
import type { ServiceAreaMapProps } from '@/types/ServiceAreaMapProps';

// Fix default marker icon issue with bundlers. `_getIconUrl` is private and not
// in Leaflet's types, so the cast is the only way to reach it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DraggableMarker = ({ position, onDragEnd }: {
  position: [number, number];
  onDragEnd: (lat: number, lng: number) => void;
}) => {
  const markerRef = useRef<L.Marker>(null);

  return (
    <Marker
      position={position}
      draggable
      ref={markerRef}
      eventHandlers={{
        dragend: () => {
          const marker = markerRef.current;
          if (marker) {
            const { lat, lng } = marker.getLatLng();
            onDragEnd(lat, lng);
          }
        },
      }}
    />
  );
};

const MapClickHandler = ({ onClick }: {
  onClick: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const FitServiceArea = ({ center, radiusKm }: { center: [number, number]; radiusKm: number }) => {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLng(center).toBounds(radiusKm * 2000);
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15, animate: true });
  }, [center, radiusKm, map]);

  return null;
};

const ServiceAreaMap = ({
  latitude,
  longitude,
  radiusKm,
  onLocationChange,
  onRadiusChange,
}: ServiceAreaMapProps) => {
  const hasPin = latitude !== null && longitude !== null;

  return (
    <div className="space-y-4 pb-4">
      <label className="text-sm font-medium">Service Area</label>
      <p className="text-sm text-muted-foreground">Drop a pin on your store location and set the radius you would like to receive order requests for. You will not be penalized for declining orders.</p>
      <div className="h-[300px] rounded-lg overflow-hidden border relative z-0">
        <MapContainer center={[-25.2744, 133.7751]} zoom={4} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapClickHandler onClick={onLocationChange} />
          {hasPin && (
            <>
              <FitServiceArea center={[latitude!, longitude!]} radiusKm={radiusKm} />
              <DraggableMarker
                position={[latitude!, longitude!]}
                onDragEnd={onLocationChange}
              />
              <Circle
                center={[latitude!, longitude!]}
                radius={radiusKm * 1000}
                pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1 }}
              />
            </>
          )}
        </MapContainer>
      </div>

      {!hasPin && (
        <p className="text-sm text-muted-foreground">Click on the map to set your location, then drag to adjust.</p>
      )}

      {/* Radius slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Delivery Radius</label>
          <span className="text-sm text-muted-foreground">{radiusKm} km</span>
        </div>
        <Slider
          aria-label="Delivery radius in kilometres"
          value={[radiusKm]}
          min={1}
          max={500}
          step={1}
          onValueChange={(value) => onRadiusChange(value[0])}
          className="[&_[data-slot=slider-track]]:bg-slate-200 [&_[data-slot=slider-range]]:bg-slate-900 [&_[data-slot=slider-thumb]]:border-slate-900"
        />
      </div>
    </div>
  );
};

export default ServiceAreaMap;
