import type { APIRoute } from 'astro';
import { findPreviewUrl } from '../../../server/music/deezer';

export const prerender = false;

/**
 * Resolves a *fresh* Deezer preview URL for a single track on demand.
 *
 * Deezer preview URLs carry a signed `exp` token that expires ~15 minutes after
 * it is minted, so the URLs baked into the game payload go dead partway through a
 * game. The client calls this right before playing each song to get a live token.
 */
export const GET: APIRoute = async ({ url }) => {
  const title = url.searchParams.get('title');
  const artist = url.searchParams.get('artist');

  if (!title || !artist) {
    return new Response(
      JSON.stringify({ success: false, error: 'title and artist params required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const previewUrl = await findPreviewUrl(title, artist);
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
