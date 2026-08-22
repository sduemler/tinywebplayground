import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MappedPlace } from "./types";
import styles from "./MapView.module.css";

interface Props {
  places: MappedPlace[];
  selectedId: string | null;
  onSelect: (videoId: string) => void;
}

/** Which preset framing the map is currently showing, if either. */
type View = "all" | "tokyo" | null;

const TOKYO: L.LatLngTuple = [35.68, 139.75];
const TOKYO_ZOOM = 11;
// A safe starting view, replaced by a real fit once the container has a size.
const JAPAN_CENTER: L.LatLngTuple = [36.2, 137.5];
const JAPAN_ZOOM = 5;
const FIT_PADDING: L.PointTuple = [40, 40];

function pinIcon(selected: boolean) {
  return L.divIcon({
    className: "",
    html: `<span class="${styles.pin} ${selected ? styles.pinSelected : ""}"></span>`,
    iconSize: selected ? [22, 22] : [16, 16],
    iconAnchor: selected ? [11, 11] : [8, 8],
  });
}

const boundsOf = (places: MappedPlace[]) =>
  L.latLngBounds(places.map((p) => [p.lat, p.lng] as L.LatLngTuple));

export default function MapView({ places, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  // onSelect is read from a ref so re-renders never tear down the markers.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const [view, setView] = useState<View>("all");
  // Distinguishes our own flyTo/fitBounds from the user panning or zooming, so
  // moving the map by hand clears the pressed button but our own moves do not.
  const programmaticRef = useRef(false);

  const moveMap = (run: (map: L.Map) => void) => {
    const map = mapRef.current;
    if (!map) return;
    programmaticRef.current = true;
    run(map);
  };

  // Leaflet touches `window`, so it may only run in the browser. This effect
  // is intentionally mount-only: the marker set is static once built.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: true,
      zoomControl: true,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      },
    ).addTo(map);

    for (const place of places) {
      const marker = L.marker([place.lat, place.lng], {
        icon: pinIcon(false),
        title: place.shopName ?? place.title,
        riseOnHover: true,
      })
        .addTo(map)
        .on("click", () => onSelectRef.current(place.videoId));
      markersRef.current.set(place.videoId, marker);
    }

    // Open on the whole of Japan. Guarded so the resulting zoom event isn't
    // mistaken for the user moving the map, which would clear the pressed button.
    programmaticRef.current = true;
    map.setView(JAPAN_CENTER, JAPAN_ZOOM);

    // fitBounds measures the container, but on mount the grid hasn't sized it
    // yet, which yields a wildly over-zoomed view. Wait for the first non-zero
    // size, then fit for real.
    let fitted = false;
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (fitted || !box || box.width === 0 || box.height === 0) return;
      fitted = true;
      programmaticRef.current = true;
      map.invalidateSize();
      if (places.length) {
        map.fitBounds(boundsOf(places), { padding: FIT_PADDING });
      }
      observer.disconnect();
    });
    observer.observe(containerRef.current);

    const releaseGuard = () => {
      programmaticRef.current = false;
    };
    const clearPreset = () => {
      if (!programmaticRef.current) setView(null);
    };
    map.on("moveend", releaseGuard);
    map.on("dragstart", clearPreset);
    map.on("zoomstart", clearPreset);

    mapRef.current = map;
    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, [places]);

  // Highlight the selected pin and bring it into view.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const [id, marker] of markersRef.current) {
      marker.setIcon(pinIcon(id === selectedId));
    }
    if (!selectedId) return;
    const marker = markersRef.current.get(selectedId);
    if (!marker) return;
    // Zoomed to a single shop now, so neither preset framing is showing.
    setView(null);
    moveMap((m) =>
      m.flyTo(marker.getLatLng(), Math.max(m.getZoom(), 15), { duration: 0.7 }),
    );
  }, [selectedId]);

  const showAll = () => {
    if (!places.length) return;
    setView("all");
    moveMap((m) =>
      m.flyToBounds(boundsOf(places), { padding: FIT_PADDING, duration: 0.8 }),
    );
  };

  const showTokyo = () => {
    setView("tokyo");
    moveMap((m) => m.flyTo(TOKYO, TOKYO_ZOOM, { duration: 0.8 }));
  };

  return (
    <div className={styles.wrap}>
      <div
        ref={containerRef}
        className={styles.map}
        aria-label="Map of shops featured in the series"
      />
      <div className={styles.controls}>
        <button
          type="button"
          onClick={showTokyo}
          aria-pressed={view === "tokyo"}
          className={view === "tokyo" ? styles.controlActive : undefined}
        >
          Tokyo
        </button>
        <button
          type="button"
          onClick={showAll}
          aria-pressed={view === "all"}
          className={view === "all" ? styles.controlActive : undefined}
        >
          All Japan
        </button>
      </div>
    </div>
  );
}
