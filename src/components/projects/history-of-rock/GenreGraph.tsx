import { useRef, useCallback, useState, useEffect } from 'react';
import type { GenreNode, Connection } from './types';
import { CONNECTIONS } from './data';
import styles from './GenreGraph.module.css';

interface Props {
  nodes: GenreNode[];
  links: Connection[];
  selectedGenre: string | null;
  hoveredGenre: string | null;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
  onDragStart: (id: string) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string) => void;
  width: number;
  height: number;
}

// Returns the point on the edge of an ellipse (rx, ry) centered at (cx, cy)
// in the direction of (dx, dy) from the center
function ellipseEdge(cx: number, cy: number, rx: number, ry: number, dx: number, dy: number) {
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return { x: cx, y: cy };
  const ux = dx / dist;
  const uy = dy / dist;
  const t = 1 / Math.sqrt((ux * ux) / (rx * rx) + (uy * uy) / (ry * ry));
  return { x: cx + ux * t, y: cy + uy * t };
}

function getConnectedIds(genreId: string): Set<string> {
  const connected = new Set<string>();
  connected.add(genreId);
  for (const c of CONNECTIONS) {
    if (c.source === genreId) connected.add(c.target);
    if (c.target === genreId) connected.add(c.source);
  }
  return connected;
}

function isConnectionRelated(conn: Connection, genreId: string): boolean {
  return conn.source === genreId || conn.target === genreId;
}

export default function GenreGraph({
  nodes,
  links,
  selectedGenre,
  hoveredGenre,
  onSelect,
  onHover,
  onDragStart,
  onDragMove,
  onDragEnd,
  width,
  height,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef<string | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const hasDragged = useRef(false);

  // Pan and zoom state
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const activeGenre = hoveredGenre || selectedGenre;
  const connectedIds = activeGenre ? getConnectedIds(activeGenre) : null;

  const screenToSvg = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      return {
        x: (clientX - rect.left - transform.x) / transform.scale,
        y: (clientY - rect.top - transform.y) / transform.scale,
      };
    },
    [transform]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, nodeId: string) => {
      e.stopPropagation();
      e.preventDefault();
      (e.target as Element).setPointerCapture(e.pointerId);
      draggingRef.current = nodeId;
      hasDragged.current = false;
      const pos = screenToSvg(e.clientX, e.clientY);
      dragStartPos.current = pos;
      onDragStart(nodeId);
    },
    [onDragStart, screenToSvg]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (draggingRef.current) {
        const pos = screenToSvg(e.clientX, e.clientY);
        if (dragStartPos.current) {
          const dx = pos.x - dragStartPos.current.x;
          const dy = pos.y - dragStartPos.current.y;
          if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            hasDragged.current = true;
          }
        }
        onDragMove(draggingRef.current, pos.x, pos.y);
      } else if (isPanning.current) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        setTransform((t) => ({
          ...t,
          x: panStart.current.tx + dx,
          y: panStart.current.ty + dy,
        }));
      }
    },
    [onDragMove, screenToSvg]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (draggingRef.current) {
        const nodeId = draggingRef.current;
        onDragEnd(nodeId);
        if (!hasDragged.current) {
          onSelect(selectedGenre === nodeId ? null : nodeId);
        }
        draggingRef.current = null;
        dragStartPos.current = null;
      }
      isPanning.current = false;
    },
    [onDragEnd, onSelect, selectedGenre]
  );

  const handleSvgPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (draggingRef.current) return;
      isPanning.current = true;
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        tx: transform.x,
        ty: transform.y,
      };
    },
    [transform]
  );

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((t) => {
      const newScale = Math.min(Math.max(t.scale * delta, 0.3), 3);
      const ratio = newScale / t.scale;
      return {
        scale: newScale,
        x: mouseX - (mouseX - t.x) * ratio,
        y: mouseY - (mouseY - t.y) * ratio,
      };
    });
  }, []);

  const handleSvgClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as Element).tagName === 'svg' || (e.target as Element).classList.contains(styles.background)) {
        onSelect(null);
      }
    },
    [onSelect]
  );

  // Prevent default wheel behavior for zoom
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const prevent = (e: WheelEvent) => e.preventDefault();
    svg.addEventListener('wheel', prevent, { passive: false });
    return () => svg.removeEventListener('wheel', prevent);
  }, []);

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <svg
      ref={svgRef}
      className={styles.svg}
      width={width}
      height={height}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerDown={handleSvgPointerDown}
      onClick={handleSvgClick}
      onWheel={handleWheel}
    >
      <defs>
        <filter id="chalk-texture" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" />
        </filter>
        <marker
          id="arrow"
          viewBox="0 0 10 7"
          refX="10"
          refY="3.5"
          markerWidth="8"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,3.5 L0,7 Z" fill="rgba(232,228,212,0.85)" />
        </marker>
        <marker
          id="arrow-highlighted"
          viewBox="0 0 10 7"
          refX="10"
          refY="3.5"
          markerWidth="8"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,3.5 L0,7 Z" fill="rgba(240,216,120,0.95)" />
        </marker>
      </defs>

      <rect className={styles.background} width={width} height={height} fill="transparent" />

      <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
        {/* Connection lines */}
        {links.map((link) => {
          const source = nodeMap.get(link.source);
          const target = nodeMap.get(link.target);
          if (!source || !target || source.x == null || target.x == null) return null;

          const dimmed = activeGenre && !isConnectionRelated(link, activeGenre);
          const highlighted = activeGenre && isConnectionRelated(link, activeGenre);

          // Compute exact ellipse-edge endpoints using the same rx/ry as the rendered bubbles
          const dx = target.x! - source.x!;
          const dy = target.y! - source.y!;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist === 0) return null;
          const srcRx = source.label.length * 3 + 16;
          const tgtRx = target.label.length * 3 + 16;
          const bubbleRy = 18;
          const srcEdge = ellipseEdge(source.x!, source.y!, srcRx, bubbleRy, dx, dy);
          const tgtEdge = ellipseEdge(target.x!, target.y!, tgtRx, bubbleRy, -dx, -dy);
          const sx = srcEdge.x;
          const sy = srcEdge.y;
          const tx = tgtEdge.x;
          const ty = tgtEdge.y;

          const midX = (sx + tx) / 2;
          const midY = (sy + ty) / 2;

          return (
            <g key={`${link.source}-${link.target}`}>
              <line
                x1={sx}
                y1={sy}
                x2={tx}
                y2={ty}
                className={`${styles.connection} ${dimmed ? styles.dimmed : ''} ${highlighted ? styles.highlighted : ''}`}
                markerEnd={highlighted ? 'url(#arrow-highlighted)' : 'url(#arrow)'}
              />
              {link.bridgeArtist && (
                <text
                  x={midX}
                  y={midY - 8}
                  className={`${styles.bridgeLabel} ${dimmed ? styles.dimmed : ''}`}
                  textAnchor="middle"
                >
                  {link.bridgeArtist}
                </text>
              )}
            </g>
          );
        })}

        {/* Genre nodes */}
        {nodes.map((node) => {
          if (node.x == null || node.y == null) return null;

          const isSelected = selectedGenre === node.id;
          const isHovered = hoveredGenre === node.id;
          const dimmed = activeGenre && !connectedIds?.has(node.id);
          const radius = node.label.length * 3 + 16;

          return (
            <g
              key={node.id}
              transform={`translate(${node.x},${node.y})`}
              className={`${styles.node} ${isSelected ? styles.selected : ''} ${isHovered ? styles.hovered : ''} ${dimmed ? styles.dimmed : ''}`}
              onPointerDown={(e) => handlePointerDown(e, node.id)}
              onPointerEnter={() => onHover(node.id)}
              onPointerLeave={() => onHover(null)}
              role="button"
              tabIndex={0}
              aria-label={`${node.label}${node.artists.length > 0 ? ` - ${node.artists.length} artists` : ''}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(selectedGenre === node.id ? null : node.id);
                }
              }}
            >
              <ellipse
                rx={radius}
                ry={18}
                className={styles.bubble}
                filter="url(#chalk-texture)"
              />
              <text
                className={styles.label}
                textAnchor="middle"
                dy="0.35em"
                filter="url(#chalk-texture)"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
