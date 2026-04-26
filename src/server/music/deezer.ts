/**
 * Server-only. Deezer's free public API — no auth. Used to look up 30s preview MP3s
 * for tracks identified via Spotify (since Spotify's preview_url is mostly null now).
 */

interface DeezerTrack {
  id: number;
  title: string;
  preview: string;
  artist: { name: string };
}

interface DeezerSearchResponse {
  data: DeezerTrack[];
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/feat\.?|ft\.?/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

export async function findPreviewUrl(title: string, artist: string): Promise<string | null> {
  const primaryArtist = artist.split(',')[0].trim();
  const query = `artist:"${primaryArtist}" track:"${title}"`;

  let res = await fetch(
    `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=10`
  );
  if (!res.ok) return null;
  let data = (await res.json()) as DeezerSearchResponse;

  if (!data.data || data.data.length === 0) {
    res = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(`${primaryArtist} ${title}`)}&limit=10`
    );
    if (!res.ok) return null;
    data = (await res.json()) as DeezerSearchResponse;
  }

  if (!data.data || data.data.length === 0) return null;

  const targetTitle = normalize(title);
  const targetArtist = normalize(primaryArtist);

  const exact = data.data.find(
    (t) => normalize(t.title) === targetTitle && normalize(t.artist.name) === targetArtist
  );
  if (exact && exact.preview) return exact.preview;

  const partial = data.data.find(
    (t) => normalize(t.artist.name) === targetArtist && t.preview
  );
  if (partial) return partial.preview;

  const first = data.data.find((t) => t.preview);
  return first?.preview ?? null;
}
