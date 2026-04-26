/**
 * Server-only. Builds the daily pool from hardcoded track-ID buckets and
 * hydrates per-track metadata + Deezer previews on demand.
 *
 * Editorial playlist endpoints are blocked for new Spotify apps (Nov 2024 policy),
 * so we keep the IDs in tracks-data.ts and rely on /tracks?ids=... — which is still
 * accessible — to fetch metadata.
 */

import { spotifyFetch, type SpotifyTrack, type SpotifyArtist } from './spotify';
import { findPreviewUrl } from './deezer';
import { PLAYLIST_BUCKETS } from './tracks-data';

export interface EnrichedTrack {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  decade: string;
  genre: string;
  previewUrl: string;
}

export const PRESET_PLAYLISTS: Array<{ id: string; label: string }> = PLAYLIST_BUCKETS.map(
  (b) => ({ id: b.spotifyId, label: b.label })
);

export function getBucketIds(spotifyId: string): string[] | null {
  const bucket = PLAYLIST_BUCKETS.find((b) => b.spotifyId === spotifyId);
  return bucket ? [...bucket.trackIds] : null;
}

interface PlaylistItemsResponse {
  items: Array<{ track: SpotifyTrack | null }>;
  next: string | null;
}

/** Used only for user-created playlists pasted as a URL/ID — editorial IDs route through buckets. */
export async function fetchPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
  const tracks: SpotifyTrack[] = [];
  let path: string | null = `/playlists/${playlistId}/tracks?limit=100&fields=items(track(id,name,artists(id,name),album(images,release_date))),next`;

  while (path) {
    const data: PlaylistItemsResponse = await spotifyFetch<PlaylistItemsResponse>(path);
    for (const item of data.items) {
      if (item.track && item.track.id) tracks.push(item.track);
    }
    if (data.next) {
      const url = new URL(data.next);
      path = url.pathname.replace('/v1', '') + url.search;
    } else {
      path = null;
    }
  }

  return tracks;
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

export async function fetchTracksByIds(ids: string[]): Promise<SpotifyTrack[]> {
  const out: SpotifyTrack[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const data = await spotifyFetch<{ tracks: Array<SpotifyTrack | null> }>(
      `/tracks?ids=${chunk.join(',')}`
    );
    for (const t of data.tracks) {
      if (t) out.push(t);
    }
  }
  return out;
}

function getDecade(releaseDate: string): string {
  const year = parseInt(releaseDate.slice(0, 4), 10);
  if (Number.isNaN(year)) return 'unknown';
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s`;
}

function bestAlbumArt(images: Array<{ url: string; width: number; height: number }>): string {
  if (!images || images.length === 0) return '';
  const sorted = [...images].sort((a, b) => b.width - a.width);
  return sorted[0]?.url ?? '';
}

export async function batchFetchArtists(artistIds: string[]): Promise<Map<string, SpotifyArtist>> {
  const out = new Map<string, SpotifyArtist>();
  const unique = Array.from(new Set(artistIds));

  for (let i = 0; i < unique.length; i += 50) {
    const chunk = unique.slice(i, i + 50);
    const data = await spotifyFetch<{ artists: SpotifyArtist[] }>(
      `/artists?ids=${chunk.join(',')}`
    );
    for (const a of data.artists) {
      if (a) out.set(a.id, a);
    }
  }

  return out;
}

/**
 * Given a list of candidate track IDs, hydrate metadata + Deezer previews and
 * return up to `desiredCount` playable tracks. Drops anything without a preview.
 */
export async function enrichTrackIds(
  candidateIds: string[],
  desiredCount: number
): Promise<EnrichedTrack[]> {
  const tracks = await fetchTracksByIds(candidateIds);
  return enrichTracks(tracks, desiredCount);
}

export async function enrichTracks(
  candidates: SpotifyTrack[],
  desiredCount: number
): Promise<EnrichedTrack[]> {
  const artistIds = candidates.flatMap((t) => t.artists.map((a) => a.id));
  const artistMap = await batchFetchArtists(artistIds);

  const enriched: EnrichedTrack[] = [];

  for (const t of candidates) {
    if (enriched.length >= desiredCount) break;

    const artistName = t.artists.map((a) => a.name).join(', ');
    const previewUrl = await findPreviewUrl(t.name, artistName);
    if (!previewUrl) continue;

    const primaryArtistId = t.artists[0]?.id;
    const genres = primaryArtistId ? artistMap.get(primaryArtistId)?.genres ?? [] : [];
    const genre = genres[0] ?? 'unknown';

    enriched.push({
      id: t.id,
      title: t.name,
      artist: artistName,
      albumArt: bestAlbumArt(t.album.images),
      decade: getDecade(t.album.release_date),
      genre,
      previewUrl,
    });
  }

  return enriched;
}
