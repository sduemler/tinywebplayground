export function formatTime(totalMinutes: number): string {
  if (totalMinutes <= 0) return '0m';
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const mins = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function getPosterUrl(path: string | null, size = 'w185'): string {
  if (!path) return '';
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function getDisplayTitle(result: { title?: string; name?: string }): string {
  return result.title ?? result.name ?? 'Unknown';
}

export function getYear(result: { release_date?: string; first_air_date?: string }): string {
  const date = result.release_date ?? result.first_air_date;
  return date ? date.slice(0, 4) : '';
}

export async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}
