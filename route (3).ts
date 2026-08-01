import { NextRequest } from 'next/server';

interface Point { lat: number; lng: number }

export async function POST(req: NextRequest) {
  const apiKey = process.env.TOMTOM_API_KEY;
  if (!apiKey) return Response.json({ error: 'TOMTOM_API_KEY tanımlı değil' }, { status: 500 });

  const body = await req.json().catch(() => null) as { points?: Point[] } | null;
  const points = body?.points;
  if (!points || points.length < 2) return Response.json({ error: 'En az iki nokta gerekli' }, { status: 400 });
  if (points.length > 150) return Response.json({ error: 'En fazla 150 nokta desteklenir' }, { status: 400 });

  const locations = points.map((p) => `${p.lat},${p.lng}`).join(':');
  const params = new URLSearchParams({
    key: apiKey,
    traffic: 'true',
    travelMode: 'car',
    routeType: 'fastest',
    routeRepresentation: 'polyline',
    computeTravelTimeFor: 'all',
    instructionsType: 'text',
    language: 'tr-TR',
  });
  const url = `https://api.tomtom.com/routing/1/calculateRoute/${locations}/json?${params}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok || !data.routes?.length) {
      return Response.json({ error: data?.detailedError?.message || 'TomTom rota isteği başarısız' }, { status: 502 });
    }
    const route = data.routes[0];
    const legs = (route.legs || []).map((leg: any) => ({
      points: (leg.points || []).map((p: any) => [p.latitude, p.longitude]),
      lengthMeters: leg.summary?.lengthInMeters || 0,
      travelTimeSeconds: leg.summary?.travelTimeInSeconds || 0,
      trafficDelaySeconds: leg.summary?.trafficDelayInSeconds || 0,
    }));
    return Response.json({
      points: legs.flatMap((leg: any, index: number) => index ? leg.points.slice(1) : leg.points),
      legs,
      lengthMeters: route.summary?.lengthInMeters || 0,
      travelTimeSeconds: route.summary?.travelTimeInSeconds || 0,
      trafficDelaySeconds: route.summary?.trafficDelayInSeconds || 0,
      noTrafficTravelTimeSeconds: route.summary?.noTrafficTravelTimeInSeconds || route.summary?.historicalTrafficTravelTimeInSeconds || 0,
    });
  } catch (error) {
    return Response.json({ error: 'Rota servisine ulaşılamadı', detail: String(error) }, { status: 500 });
  }
}
