import { NextRequest } from 'next/server';
export async function GET(req: NextRequest) {
  const bbox = new URL(req.url).searchParams.get('bbox');
  const key = process.env.TOMTOM_API_KEY;
  if (!bbox) return Response.json({ error: 'bbox gerekli' }, { status: 400 });
  if (!key) return Response.json({ error: 'TOMTOM_API_KEY tanımlı değil' }, { status: 500 });
  const fields = encodeURIComponent('{incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,delay,events{description},from,to}}}');
  const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${key}&bbox=${bbox}&fields=${fields}&language=tr-TR&timeValidityFilter=present`;
  const res = await fetch(url, { cache: 'no-store' });
  return new Response(await res.text(), { status: res.ok ? 200 : 502, headers: { 'content-type': 'application/json' } });
}
