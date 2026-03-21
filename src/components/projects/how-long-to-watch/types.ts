export interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  media_type: 'movie' | 'tv';
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  overview: string;
}

export interface Season {
  season_number: number;
  name: string;
  episode_count: number;
  totalMinutes: number;
}

export interface ShowDetails {
  success: boolean;
  id: number;
  name: string;
  media_type: 'tv';
  poster_path: string | null;
  seasons: Season[];
}

export interface MovieDetails {
  success: boolean;
  id: number;
  title: string;
  media_type: 'movie';
  runtime: number;
  poster_path: string | null;
}

export type MediaDetails = ShowDetails | MovieDetails;

export interface WatchlistItem {
  id: string;
  mediaId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  totalMinutes: number;
  seasonNumbers?: number[];
}

export interface PresetMovie {
  id: number;
  title: string;
  runtime: number;
}

export interface Preset {
  id: string;
  title: string;
  description: string;
  category: string;
  totalMinutes: number;
  movies: PresetMovie[];
}
