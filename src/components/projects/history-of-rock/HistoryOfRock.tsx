import { useState, useRef, useCallback, useEffect } from 'react';
import { useSimulation } from './useSimulation';
import GenreGraph from './GenreGraph';
import ArtistPanel from './ArtistPanel';
import styles from './HistoryOfRock.module.css';

export default function HistoryOfRock() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [hoveredGenre, setHoveredGenre] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const { nodes, links, dragStart, dragMove, dragEnd } = useSimulation(size.width, size.height);

  const selectedNode = selectedGenre ? nodes.find((n) => n.id === selectedGenre) : null;

  // Calculate screen position for the artist panel
  const getScreenPos = useCallback(() => {
    if (!selectedNode || !containerRef.current) return { x: 0, y: 0 };
    // The node positions are in SVG coordinate space
    // We need to account for pan/zoom but for now use raw positions
    return { x: selectedNode.x ?? 0, y: selectedNode.y ?? 0 };
  }, [selectedNode]);

  const screenPos = getScreenPos();

  return (
    <div ref={containerRef} className={styles.chalkboard}>
      <h1 className={styles.title}>HISTORY OF ROCK</h1>
      {size.width > 0 && (
        <GenreGraph
          nodes={nodes}
          links={links}
          selectedGenre={selectedGenre}
          hoveredGenre={hoveredGenre}
          onSelect={setSelectedGenre}
          onHover={setHoveredGenre}
          onDragStart={dragStart}
          onDragMove={dragMove}
          onDragEnd={dragEnd}
          width={size.width}
          height={size.height}
        />
      )}
      {selectedNode && selectedNode.artists.length > 0 && (
        <ArtistPanel
          genre={selectedNode}
          screenX={screenPos.x}
          screenY={screenPos.y}
          containerWidth={size.width}
          containerHeight={size.height}
          onClose={() => setSelectedGenre(null)}
        />
      )}
      <div className={styles.hint}>Click a genre to see its artists · Drag to move · Scroll to zoom</div>
    </div>
  );
}
