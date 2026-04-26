import type { APIRoute } from 'astro';
import { buildDailyPool, enrichTrackIds } from '../../../server/music/pool';
import { seededShuffle } from '../../../server/music/seed';

export const prerender = false;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SONGS_PER_GAME = 10;
const CANDIDATE_BUFFER = 30;

export const GET: APIRoute = async ({ url }) => {
  const date = url.searchParams.get('date');
  if (!date || !DATE_RE.test(date)) {
    return new Response(
      JSON.stringify({ success: false, error: 'date param required (YYYY-MM-DD)' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const pool = buildDailyPool();
    if (pool.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Pool is empty' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const shuffled = seededShuffle(pool, `daily:${date}`);
    const candidates = shuffled.slice(0, CANDIDATE_BUFFER);
    const tracks = await enrichTrackIds(candidates, SONGS_PER_GAME);

    if (tracks.length < SONGS_PER_GAME) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Only found ${tracks.length} playable tracks for ${date}`,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ success: true, date, tracks }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=3600',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : 'Daily fetch failed',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
