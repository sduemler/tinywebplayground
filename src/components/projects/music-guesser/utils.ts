export async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function stripTitleSuffix(title: string): string {
  return title
    .replace(/\s*[-–—]\s*((\d{4}\s+)?remaster(ed)?|deluxe|bonus|expanded|anniversary|mono|stereo|live|single|album|radio)\b.*/i, '')
    .replace(/\s*\(([^)]*\b(remaster(ed)?|deluxe|bonus|expanded|anniversary|edition|version|mono|stereo|live|single|radio|mix|feat\.?|ft\.?|with)\b[^)]*)\)/gi, '')
    .replace(/\s*\[([^\]]*\b(remaster(ed)?|deluxe|bonus|expanded|anniversary|edition|version|mono|stereo|live|single|radio|mix|feat\.?|ft\.?|with)\b[^\]]*)\]/gi, '')
    .trim();
}

function stripArtistFeat(artist: string): string {
  return artist
    .replace(/\s*(feat\.?|ft\.?|with|&|,)\s+.*/i, '')
    .trim();
}

export function isDuplicateVersion(
  result: { id: string; title: string; artist: string },
  target: { id: string; title: string; artist: string },
): boolean {
  if (result.id === target.id) return false;
  const titleA = normalize(stripTitleSuffix(result.title));
  const titleB = normalize(stripTitleSuffix(target.title));
  if (titleA !== titleB) return false;
  const artistA = normalize(stripArtistFeat(result.artist));
  const artistB = normalize(stripArtistFeat(target.artist));
  return artistA === artistB || artistA.includes(artistB) || artistB.includes(artistA);
}

export function getLocalDateString(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getSnippetSeconds(attempt: number, extendActive: boolean): number {
  if (extendActive) return 30;
  if (attempt === 0) return 5;
  if (attempt === 1) return 7;
  return 10;
}
