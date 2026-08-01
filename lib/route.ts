import type { CalculatedRoute, LatLng, Passenger } from './types';

export function heuristicOrder(passengers: Passenger[], destination: LatLng): Passenger[] {
  if (!passengers.length) return [];
  const remaining = [...passengers];
  remaining.sort((a, b) => distanceSq(b, destination) - distanceSq(a, destination));
  const ordered: Passenger[] = [remaining.shift()!];
  while (remaining.length) {
    const last = ordered[ordered.length - 1];
    let best = 0;
    for (let i = 1; i < remaining.length; i++) {
      if (distanceSq(last, remaining[i]) < distanceSq(last, remaining[best])) best = i;
    }
    ordered.push(remaining.splice(best, 1)[0]);
  }
  return ordered;
}

function distanceSq(a: LatLng, b: LatLng) {
  const x = a.lat - b.lat;
  const y = a.lng - b.lng;
  return x * x + y * y;
}

export async function calculateRoadRoute(order: Passenger[], destination: LatLng): Promise<CalculatedRoute> {
  const res = await fetch('/api/route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ points: [...order, destination] }),
    cache: 'no-store',
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Rota hesaplanamadı');
  return body;
}

export function formatClock(start: string, elapsedSeconds: number) {
  const [h, m] = start.split(':').map(Number);
  const date = new Date();
  date.setHours(h || 0, m || 0, 0, 0);
  date.setSeconds(date.getSeconds() + elapsedSeconds);
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}
