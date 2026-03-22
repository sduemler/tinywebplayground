import type { APIRoute } from 'astro';

export const prerender = false;

const TMDB_BASE = 'https://api.themoviedb.org/3';

export const GET: APIRoute = async ({ url }) => {
  const query = url.searchParams.get('query');
  const page = url.searchParams.get('page') ?? '1';

  if (!query || query.trim().length < 2) {
    return new Response(JSON.stringify({ success: false, error: 'Query must be at least 2 characters' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await fetch(
      `${TMDB_BASE}/search/multi?api_key=${import.meta.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`
    );
    if (!res.ok) throw new Error(`TMDb error: ${res.status}`);
    const data = await res.json();

    const results = data.results
      .filter((item: any) => item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv'))
      .slice(0, 12);

    return new Response(JSON.stringify({ success: true, results, total_results: data.total_results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=300' },
    });
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Search failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
