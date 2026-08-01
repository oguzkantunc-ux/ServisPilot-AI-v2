'use client';
import { useEffect } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { CalculatedRoute, Destination, Passenger } from '@/lib/types';

function icon(label: string | number, color = '#0F172A') {
  return L.divIcon({
    html: `<div style="background:${color};color:white;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-weight:700;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35)">${label}</div>`,
    className: '', iconSize: [30, 30], iconAnchor: [15, 15],
  });
}

function FitRoute({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => { if (points.length > 1) map.fitBounds(points, { padding: [35, 35] }); }, [map, points]);
  return null;
}

export default function RouteMap({ passengers, destination, route }: { passengers: Passenger[]; destination: Destination; route: CalculatedRoute | null }) {
  const center: [number, number] = route?.points[0] || [passengers[0].lat, passengers[0].lng];
  return (
    <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
      <TileLayer attribution='&copy; OpenStreetMap katkıda bulunanlar' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <TileLayer attribution='Traffic &copy; TomTom' url="/api/traffic-tiles/{z}/{x}/{y}" opacity={0.78} />
      {route?.points?.length ? <><Polyline positions={route.points} color="#0EA5E9" weight={7} opacity={0.92} /><FitRoute points={route.points} /></> : null}
      {passengers.map((p, i) => <Marker key={p.id} position={[p.lat, p.lng]} icon={icon(i + 1)}><Popup><b>{i + 1}. {p.full_name}</b><br />{p.address}</Popup></Marker>)}
      <Marker position={[destination.lat, destination.lng]} icon={icon('🏁', '#06B6D4')}><Popup><b>{destination.name}</b><br />{destination.address}</Popup></Marker>
    </MapContainer>
  );
}
