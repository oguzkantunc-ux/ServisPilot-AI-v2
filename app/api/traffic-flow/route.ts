import { NextRequest } from 'next/server';
export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams;
  const lat = q.get('lat'); const lon = q.get('lon');
  const key = process.env.TOMTOM_API_KEY;
  if (!lat || !lon) return Response.json({ error: 'lat/lon gerekli' }, { status: 400 });
  if (!key) return Response.json({ error: 'TOMTOM_API_KEY tanımlı değil' }, { status: 500 });
  const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${key}&point=${lat},${lon}`;
  const res = await fetch(url, { cache: 'no-store' });
  const data = await res.json();
  if (!res.ok || !data.flowSegmentData) return Response.json({ error: 'TomTom flow isteği başarısız' }, { status: 502 });
  const s = data.flowSegmentData;
  return Response.json({ currentSpeed: s.currentSpeed, freeFlowSpeed: s.freeFlowSpeed, confidence: s.confidence, roadClosure: s.roadClosure });
}
