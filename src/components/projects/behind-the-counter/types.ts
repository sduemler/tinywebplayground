export interface Place {
  videoId: string;
  title: string;
  shopName: string | null;
  lat: number | null;
  lng: number | null;
  city: string | null;
  uploadDate: string | null;
  durationSec: number | null;
  thumbnail: string;
  mapsUrl: string | null;
  needsReview: boolean;
}

/** A place that actually has coordinates, so it can be put on the map. */
export type MappedPlace = Place & { lat: number; lng: number };

export function isMapped(place: Place): place is MappedPlace {
  return place.lat !== null && place.lng !== null;
}
