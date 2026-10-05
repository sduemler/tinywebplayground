/**
 * Server-only. Builds the daily pool from hardcoded track-ID buckets and
 * hydrates per-track metadata + Deezer previews on demand.
 *
 * Editorial playlist endpoints are blocked for new Spotify apps (Nov 2024 policy),
 * so we keep the IDs in tracks-data.ts and fetch metadata per track via
 * /tracks/{id} (the batch /tracks?ids= endpoint is gone for apps made after Feb 2026).
 */

import { spotifyFetch, type SpotifyTrack } from './spotify';
import { findDeezerTrack } from './deezer';
import { PLAYLIST_BUCKETS } from './tracks-data';

export interface EnrichedTrack {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  previewUrl: string;
  /** The exact Deezer track the preview comes from, so the client can refresh it by ID. */
  deezerId: string;
}

export const PRESET_PLAYLISTS: Array<{ id: string; label: string }> = PLAYLIST_BUCKETS.map(
  (b) => ({ id: b.spotifyId, label: b.label })
);

export function getBucketIds(spotifyId: string): string[] | null {
  const bucket = PLAYLIST_BUCKETS.find((b) => b.spotifyId === spotifyId);
  return bucket ? [...bucket.trackIds] : null;
}

let pooledIdsCache: { ids: string[]; cachedAt: number } | null = null;
const POOL_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

/** All track IDs across every bucket, deduped. Cheap — no API calls. */
export function buildDailyPool(): string[] {
  if (pooledIdsCache && Date.now() - pooledIdsCache.cachedAt < POOL_TTL_MS) {
    return pooledIdsCache.ids;
  }

  const seen = new Set<string>();
  const ids: string[] = [];
  for (const bucket of PLAYLIST_BUCKETS) {
    for (const id of bucket.trackIds) {
      if (!seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
  }

  pooledIdsCache = { ids, cachedAt: Date.now() };
  return ids;
}

// Spotify apps created after Feb 2026 can't use the batch /tracks?ids= endpoint,
// so tracks are looked up one at a time, a few in parallel.
const LOOKUP_CONCURRENCY = 4;

async function fetchTrack(id: string): Promise<SpotifyTrack | null> {
  try {
    return await spotifyFetch<SpotifyTrack>(`/tracks/${id}`);
  } catch {
    return null;
  }
}

function bestAlbumArt(images: Array<{ url: string; width: number; height: number }>): string {
  if (!images || images.length === 0) return '';
  const sorted = [...images].sort((a, b) => b.width - a.width);
  return sorted[0]?.url ?? '';
}

/**
 * Given a list of candidate track IDs, hydrate metadata + Deezer previews and
 * return up to `desiredCount` playable tracks. Drops anything without a preview.
 */
export async function enrichTrackIds(
  candidateIds: string[],
  desiredCount: number
): Promise<EnrichedTrack[]> {
  const enriched: EnrichedTrack[] = [];
  // Look up in candidate order and stop as soon as there are enough, so the
  // daily pick stays the same for everyone and spends as few calls as possible.
  for (let i = 0; i < candidateIds.length && enriched.length < desiredCount; i += LOOKUP_CONCURRENCY) {
    const batch = await Promise.all(candidateIds.slice(i, i + LOOKUP_CONCURRENCY).map(fetchTrack));
    const found = batch.filter((t): t is SpotifyTrack => t !== null);
    enriched.push(...(await enrichTracks(found, desiredCount - enriched.length)));
  }
  return enriched;
}

async function enrichTracks(
  candidates: SpotifyTrack[],
  desiredCount: number
): Promise<EnrichedTrack[]> {
  const enriched: EnrichedTrack[] = [];

  for (const t of candidates) {
    if (enriched.length >= desiredCount) break;

    const artistName = t.artists.map((a) => a.name).join(', ');
    const match = await findDeezerTrack({
      isrc: t.external_ids?.isrc,
      title: t.name,
      artist: artistName,
    });
    if (!match) continue;

    enriched.push({
      id: t.id,
      title: t.name,
      artist: artistName,
      albumArt: bestAlbumArt(t.album.images),
      previewUrl: match.previewUrl,
      deezerId: match.id,
    });
  }

  return enriched;
}
