import { useState, useRef, useCallback, useEffect } from 'react';
import { useSimulation } from './useSimulation';
import GenreGraph from './GenreGraph';
import GenreTimeline from './GenreTimeline';
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

  const isMobile = size.width > 0 && size.width < 640;

  const { nodes, links, initialTransform, dragStart, dragMove, dragEnd } = useSimulation(
    isMobile ? 0 : size.width,
    isMobile ? 0 : size.height,
  );

  const selectedNode = selectedGenre ? nodes.find((n) => n.id === selectedGenre) : null;

  const getScreenPos = useCallback(() => {
    if (!selectedNode || !containerRef.current) return { x: 0, y: 0 };
    return { x: selectedNode.x ?? 0, y: selectedNode.y ?? 0 };
  }, [selectedNode]);

  const screenPos = getScreenPos();

  return (
    <div ref={containerRef} className={styles.chalkboard}>
      <h1 className={styles.title}>HISTORY OF ROCK</h1>
      {isMobile ? (
        <GenreTimeline selectedGenre={selectedGenre} onSelect={setSelectedGenre} />
      ) : (
        <>
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
              initialTransform={initialTransform}
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
        </>
      )}
      <div className={styles.hint}>
        {isMobile
          ? 'Tap a genre to explore · Scroll to see more'
          : 'Click a genre to see its artists · Drag to move · Scroll to zoom'}
      </div>
    </div>
  );
}
