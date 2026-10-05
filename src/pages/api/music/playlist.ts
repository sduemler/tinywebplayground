import type { APIRoute } from 'astro';
import { enrichTrackIds, getBucketIds } from '../../../server/music/pool';

export const prerender = false;

const SONGS_PER_GAME = 10;
const CANDIDATE_BUFFER = 30;
const PLAYLIST_ID_RE = /^[A-Za-z0-9]+$/;

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const GET: APIRoute = async ({ url }) => {
  const id = url.searchParams.get('id');
  if (!id || !PLAYLIST_ID_RE.test(id)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid playlist id' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Only the preset tapes: reading a pasted Spotify playlist needs its owner
    // signed in, which this app's client-credentials flow can't do.
    const bucketIds = getBucketIds(id);
    if (!bucketIds) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unknown tape' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const candidates = shuffle(bucketIds).slice(0, CANDIDATE_BUFFER);
    const tracks = await enrichTrackIds(candidates, SONGS_PER_GAME);

    if (tracks.length < SONGS_PER_GAME) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Only found ${tracks.length} playable tracks on this tape. Try a different one.`,
        }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ success: true, tracks }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : 'Playlist fetch failed',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
