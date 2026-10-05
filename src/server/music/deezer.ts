/**
 * Server-only. Deezer's free public API — no auth. Used to find 30s preview MP3s
 * for tracks identified via Spotify (since Spotify's preview_url is mostly null now).
 *
 * Matching is strict on purpose: a preview is only ever taken from the same
 * recording (by ISRC) or the same song by the same artist. If neither turns up,
 * the track is skipped rather than played with some other song's audio.
 */

interface DeezerTrack {
  id: number;
  title: string;
  readable: boolean;
  preview: string;
  artist: { name: string };
}

export interface DeezerMatch {
  id: string;
  previewUrl: string;
}

// Release-version suffixes that differ between services, e.g. Spotify's
// "A Hard Day's Night - Remastered 2009" vs Deezer's "A Hard Day's Night (Remastered 2009)".
const VERSION_SUFFIX =
  /\s+[-–—]\s+.*\b(remaster(ed)?|remix(ed)?|live|from|version|edit|mono|stereo|single|radio|deluxe|anniversary|mix|soundtrack|\d{4})\b.*$/i;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/\b(feat|ft)\b\.?.*$/, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function normalizeTitle(title: string): string {
  return normalize(title.replace(VERSION_SUFFIX, ''));
}

function normalizeArtist(artist: string): string {
  return normalize(artist.replace(/^(the|ms\.?|mr\.?)\s+/i, ''));
}

function playable(t: DeezerTrack | null | undefined): t is DeezerTrack {
  return !!t && t.readable !== false && !!t.preview;
}

function toMatch(t: DeezerTrack): DeezerMatch {
  return { id: String(t.id), previewUrl: t.preview };
}

async function deezerGet<T>(path: string): Promise<T | null> {
  const res = await fetch(`https://api.deezer.com${path}`);
  if (!res.ok) return null;
  const data = (await res.json()) as T & { error?: unknown };
  return data.error ? null : data;
}

/** A specific Deezer track with a freshly signed preview URL (they expire after ~15 min). */
export async function getDeezerTrack(id: string): Promise<DeezerMatch | null> {
  if (!/^\d+$/.test(id)) return null;
  const t = await deezerGet<DeezerTrack>(`/track/${id}`);
  return playable(t) ? toMatch(t) : null;
}

/**
 * The Deezer track for a song: the exact recording by ISRC first, then another
 * release of the same song by the same artist. Never a different song.
 */
export async function findDeezerTrack(song: {
  isrc?: string | null;
  title: string;
  artist: string;
}): Promise<DeezerMatch | null> {
  if (song.isrc) {
    const byIsrc = await deezerGet<DeezerTrack>(`/track/isrc:${encodeURIComponent(song.isrc)}`);
    if (playable(byIsrc)) return toMatch(byIsrc);
  }

  const primaryArtist = song.artist.split(',')[0].trim();
  const cleanTitle = song.title.replace(VERSION_SUFFIX, '').replace(/\(.*?\)|\[.*?\]/g, '').trim();
  const results = await deezerGet<{ data?: DeezerTrack[] }>(
    `/search/track?q=${encodeURIComponent(`${primaryArtist} ${cleanTitle}`)}&limit=25`
  );

  const targetTitle = normalizeTitle(song.title);
  const targetArtist = normalizeArtist(primaryArtist);
  const hit = results?.data?.find(
    (t) =>
      playable(t) &&
      normalizeTitle(t.title) === targetTitle &&
      normalizeArtist(t.artist.name) === targetArtist
  );
  return hit ? toMatch(hit) : null;
}
