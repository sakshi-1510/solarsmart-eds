const OFFERS_SHEET = '/offers.json';

function getRemainingMs(offer) {
  if (!offer.expires) return null;
  return Math.max(0, new Date(offer.expires).getTime() - Date.now());
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const { searchParams } = url;
  const requestedId = searchParams.get('id');

  try {
    const { origin } = url;
    const resp = await fetch(`${origin}${OFFERS_SHEET}`);
    if (!resp.ok) throw new Error('Sheet unavailable');
    const json = await resp.json();
    const offers = json.data || [];

    const now = new Date();

    const activeOffers = offers.filter((o) => {
      if (o.active !== 'true') return false;
      if (o.expires) {
        const expiry = new Date(o.expires);
        if (expiry < now) return false;
      }
      return true;
    });

    if (requestedId) {
      const offer = activeOffers.find((o) => o.id === requestedId);
      return new Response(JSON.stringify({
        offer: offer || null,
        remainingMs: offer ? getRemainingMs(offer) : null,
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    const offer = activeOffers[0] || null;
    return new Response(JSON.stringify({
      offer,
      remainingMs: offer ? getRemainingMs(offer) : null,
      totalActive: activeOffers.length,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to load offers', offer: null }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}