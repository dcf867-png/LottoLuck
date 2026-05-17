const TX_URL =
  'https://www.texaslottery.com/export/sites/lottery/Games/Mega_Millions/Winning_Numbers/megamillions.csv'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS })
  }

  const cache = caches.default
  const cacheKey = new Request(TX_URL)
  const cached = await cache.match(cacheKey)
  if (cached) {
    const text = await cached.text()
    return new Response(text, {
      headers: { ...CORS, 'Content-Type': 'text/csv', 'X-Cache': 'HIT' },
    })
  }

  const upstream = await fetch(TX_URL)
  if (!upstream.ok) {
    return new Response('upstream error', { status: 502, headers: CORS })
  }

  const text = await upstream.text()

  // Cache for 2 hours — draws happen twice a week
  const toCache = new Response(text, {
    headers: { 'Content-Type': 'text/csv', 'Cache-Control': 'public, max-age=7200' },
  })
  context.waitUntil(cache.put(cacheKey, toCache))

  return new Response(text, {
    headers: { ...CORS, 'Content-Type': 'text/csv', 'X-Cache': 'MISS' },
  })
}
