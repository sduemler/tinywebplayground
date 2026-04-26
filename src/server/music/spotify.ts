/**
 * Server-only. Do not import from client components.
 * Spotify Web API helper using Client Credentials flow.
 */

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cached: CachedToken | null = null;

export async function getSpotifyToken(): Promise<string> {
  if (cached && Date.now() < cached.expiresAt) {
    return cached.token;
  }

  const clientId = import.meta.env.SPOTIFY_CLIENT_ID;
  const clientSecret = import.meta.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET');
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Spotify token request failed: ${res.status} ${body}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };

  cached = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cached.token;
}

export async function spotifyFetch<T>(path: string): Promise<T> {
  const token = await getSpotifyToken();
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Spotify API ${path} failed: ${res.status} ${body}`);
  }
  return (await res.json()) as T;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: {
    images: Array<{ url: string; width: number; height: number }>;
    release_date: string;
  };
}

export interface SpotifySearchResponse {
  tracks: { items: SpotifyTrack[] };
}

export interface SpotifyPlaylistResponse {
  tracks: {
    items: Array<{ track: SpotifyTrack | null }>;
    next: string | null;
  };
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
}

export async function searchTracks(query: string, limit = 8): Promise<SpotifyTrack[]> {
  const data = await spotifyFetch<SpotifySearchResponse>(
    `/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`
  );
  return data.tracks.items;
}

export async function getArtist(artistId: string): Promise<SpotifyArtist> {
  return spotifyFetch<SpotifyArtist>(`/artists/${artistId}`);
}
