const TMDB_BASE = 'https://api.themoviedb.org/3';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export const handler = async (event) => {
  const { id, type } = event.queryStringParameters || {};

  if (!id || !['movie', 'tv'].includes(type)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'id and type (movie|tv) are required' }),
    };
  }

  try {
    const res = await fetch(
      `${TMDB_BASE}/${type}/${id}?api_key=${process.env.TMDB_API_KEY}`
    );
    if (!res.ok) throw new Error(`TMDb error: ${res.status}`);
    const data = await res.json();

    if (type === 'movie') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          id: data.id,
          title: data.title,
          media_type: 'movie',
          runtime: data.runtime || 0,
          poster_path: data.poster_path,
        }),
      };
    }

    // TV: compute per-season time using show's average episode runtime
    const avgRuntime = data.episode_run_time?.[0] || 45;
    const seasons = (data.seasons || [])
      .filter((s) => s.season_number > 0 && s.episode_count > 0)
      .map((s) => ({
        season_number: s.season_number,
        name: s.name,
        episode_count: s.episode_count,
        totalMinutes: s.episode_count * avgRuntime,
      }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        id: data.id,
        name: data.name,
        media_type: 'tv',
        poster_path: data.poster_path,
        seasons,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Failed to fetch details' }),
    };
  }
};
