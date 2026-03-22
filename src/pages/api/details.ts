import type { APIRoute } from 'astro';

export const prerender = false;

const TMDB_BASE = 'https://api.themoviedb.org/3';

export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id');
  const type = url.searchParams.get('type');

  if (!id || !['movie', 'tv'].includes(type ?? '')) {
    return new Response(JSON.stringify({ success: false, error: 'id and type (movie|tv) are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await fetch(
      `${TMDB_BASE}/${type}/${id}?api_key=${import.meta.env.TMDB_API_KEY}`
    );
    if (!res.ok) throw new Error(`TMDb error: ${res.status}`);
    const data = await res.json();

    if (type === 'movie') {
      return new Response(JSON.stringify({
        success: true,
        id: data.id,
        title: data.title,
        media_type: 'movie',
        runtime: data.runtime || 0,
        poster_path: data.poster_path,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const avgRuntime = data.episode_run_time?.[0] || 45;
    const seasons = (data.seasons ?? [])
      .filter((s: any) => s.season_number > 0 && s.episode_count > 0)
      .map((s: any) => ({
        season_number: s.season_number,
        name: s.name,
        episode_count: s.episode_count,
        totalMinutes: s.episode_count * avgRuntime,
      }));

    return new Response(JSON.stringify({
      success: true,
      id: data.id,
      name: data.name,
      media_type: 'tv',
      poster_path: data.poster_path,
      seasons,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Failed to fetch details' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
