import type { APIRoute } from 'astro';

export const prerender = false;

const TMDB_BASE = 'https://api.themoviedb.org/3';

export const GET: APIRoute = async ({ url }) => {
  const raw = url.searchParams.get('ids') ?? '';
  const ids = raw.split(',').map(Number).filter(Boolean);

  if (ids.length === 0) {
    return new Response(JSON.stringify({ success: true, posters: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = import.meta.env.TMDB_API_KEY;

  const posters = await Promise.all(
    ids.map(async (id) => {
      try {
        const res = await fetch(`${TMDB_BASE}/movie/${id}?api_key=${apiKey}`);
        if (!res.ok) return { id, poster_path: null };
        const data = await res.json();
        return { id, poster_path: data.poster_path ?? null };
      } catch {
        return { id, poster_path: null };
      }
    })
  );

  return new Response(JSON.stringify({ success: true, posters }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'max-age=86400',
    },
  });
};
