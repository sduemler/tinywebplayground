import type { APIRoute } from 'astro';
import { findDeezerTrack, getDeezerTrack } from '../../../server/music/deezer';

export const prerender = false;

/**
 * Resolves a *fresh* Deezer preview URL for a single track on demand.
 *
 * Deezer preview URLs carry a signed `exp` token that expires ~15 minutes after
 * it is minted, so the URLs baked into the game payload go dead partway through a
 * game. The client calls this right before playing each song to get a live token.
 */
export const GET: APIRoute = async ({ url }) => {
  // `id` is the exact Deezer track picked when the game was built. `title` +
  // `artist` only serve games saved before tracks carried that ID.
  const id = url.searchParams.get('id');
  const title = url.searchParams.get('title');
  const artist = url.searchParams.get('artist');

  if (!id && (!title || !artist)) {
    return new Response(
      JSON.stringify({ success: false, error: 'id, or title and artist, required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const match = id ? await getDeezerTrack(id) : await findDeezerTrack({ title: title!, artist: artist! });
    const previewUrl = match?.previewUrl;
    if (!previewUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'No preview found for this track' }),
        { status: 404, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      );
    }

    return new Response(JSON.stringify({ success: true, previewUrl }), {
      status: 200,
      // Never cache: the token inside the URL is short-lived.
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : 'Preview lookup failed',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  }
};
