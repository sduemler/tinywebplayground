const TMDB_BASE = 'https://api.themoviedb.org/3';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export const handler = async (event) => {
  const { query, page = '1' } = event.queryStringParameters || {};

  if (!query || query.trim().length < 2) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ success: false, error: 'Query must be at least 2 characters' }),
    };
  }

  try {
    const url = `${TMDB_BASE}/search/multi?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDb error: ${res.status}`);
    const data = await res.json();

    const results = data.results
      .filter((item) => item.poster_path && (item.media_type === 'movie' || item.media_type === 'tv'))
      .slice(0, 12);

    return {
      statusCode: 200,
      headers: { ...headers, 'Cache-Control': 'max-age=300' },
      body: JSON.stringify({ success: true, results, total_results: data.total_results }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: 'Search failed' }),
    };
  }
};
