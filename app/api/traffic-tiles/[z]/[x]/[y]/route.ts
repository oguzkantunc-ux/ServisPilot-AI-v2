export async function GET(_: Request, context: { params: { z: string; x: string; y: string } }) {
  const key = process.env.TOMTOM_API_KEY;
  if (!key) return new Response('TOMTOM_API_KEY eksik', { status: 500 });
  const { z, x, y } = context.params;
  const url = `https://api.tomtom.com/traffic/map/4/tile/flow/relative0/${z}/${x}/${y}.png?key=${key}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return new Response('Trafik katmanı alınamadı', { status: 502 });
  return new Response(await res.arrayBuffer(), {
    headers: { 'content-type': 'image/png', 'cache-control': 'public, s-maxage=60, stale-while-revalidate=120' },
  });
}
