import { useRef, useState, useEffect, useCallback } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
} from 'd3-force';
import type { GenreNode, Connection } from './types';
import { GENRES, CONNECTIONS } from './data';

export function useSimulation(width: number, height: number) {
  const simRef = useRef<Simulation<GenreNode, SimulationLinkDatum<GenreNode>> | null>(null);
  const nodesRef = useRef<GenreNode[]>([]);
  const [nodes, setNodes] = useState<GenreNode[]>([]);
  const [links, setLinks] = useState<Connection[]>(CONNECTIONS);
  const [initialTransform, setInitialTransform] = useState({ x: 0, y: 0, scale: 1 });
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (width === 0 || height === 0) return;

    // Scale initial positions to fit the viewport with padding
    const padX = 80;
    const padY = 70;
    const scaleX = (width - padX * 2) / 1200; // data ranges from -550 to 650
    const scaleY = (height - padY * 2) / 780;  // data ranges from -350 to 430
    // Floor at 0.45 so nodes don't get crushed on small screens
    const scale = Math.max(Math.min(scaleX, scaleY), 0.45);

    // Compute each node's home position (scaled from the original chalkboard layout)
    const homePositions = new Map<string, { x: number; y: number }>();
    const initialNodes: GenreNode[] = GENRES.map((g) => {
      const hx = g.x * scale + width / 2;
      const hy = g.y * scale + height / 2;
      homePositions.set(g.id, { x: hx, y: hy });
      return { ...g, x: hx, y: hy };
    });
    nodesRef.current = initialNodes;

    const linkDist = Math.min(width, height) * 0.1;

    // Gentle random drift force — gives each node a tiny random nudge each tick
    const driftForce = () => {
      for (const node of nodesRef.current) {
        if (node.fx != null) continue; // skip dragged nodes
        node.vx! += (Math.random() - 0.5) * 0.08;
        node.vy! += (Math.random() - 0.5) * 0.08;
      }
    };

    const sim = forceSimulation<GenreNode>(initialNodes)
      .force(
        'link',
        forceLink<GenreNode, SimulationLinkDatum<GenreNode>>(
          CONNECTIONS.map((c) => ({ ...c }))
        )
          .id((d) => d.id)
          .distance(linkDist)
          .strength(0.05)
      )
      .force('charge', forceManyBody().strength(-15))
      .force('collide', forceCollide<GenreNode>().radius((d) => d.label.length * 3 + 16).strength(0.5))
      // Anchor each node to its home position — preserves the original layout
      .force('homeX', forceX<GenreNode>((d) => homePositions.get(d.id)!.x).strength(0.15))
      .force('homeY', forceY<GenreNode>((d) => homePositions.get(d.id)!.y).strength(0.15))
      .force('drift', driftForce as any)
      .velocityDecay(0.88)
      .alphaDecay(0)
      .alphaTarget(0.003);

    // Run initial ticks to settle near home positions
    for (let i = 0; i < 200; i++) sim.tick();

    // Compute initial transform to fit/center the graph in the viewport
    const xs = nodesRef.current.map((n) => n.x!);
    const ys = nodesRef.current.map((n) => n.y!);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const graphPad = 80;
    const graphW = maxX - minX + graphPad * 2;
    const graphH = maxY - minY + graphPad * 2;
    const graphCenterX = (minX + maxX) / 2;
    const graphCenterY = (minY + maxY) / 2;

    let initScale = 1;
    let initX = 0;
    let initY = 0;

    if (graphW > width * 0.95 || graphH > height * 0.95) {
      initScale = Math.min(width / graphW, height / graphH) * 0.95;
      initX = width / 2 - graphCenterX * initScale;
      initY = height / 2 - graphCenterY * initScale;
    }

    setInitialTransform({ x: initX, y: initY, scale: initScale });

    sim.on('tick', () => {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        setNodes([...nodesRef.current]);
      });
    });

    simRef.current = sim;
    setNodes([...initialNodes]);
    setLinks(CONNECTIONS);

    return () => {
      cancelAnimationFrame(frameRef.current);
      sim.stop();
    };
  }, [width, height]);

  const dragStart = useCallback((id: string) => {
    const sim = simRef.current;
    if (!sim) return;
    sim.alphaTarget(0.03).restart();
    const node = nodesRef.current.find((n) => n.id === id);
    if (node) {
      node.fx = node.x;
      node.fy = node.y;
    }
  }, []);

  const dragMove = useCallback((id: string, x: number, y: number) => {
    const node = nodesRef.current.find((n) => n.id === id);
    if (node) {
      node.fx = x;
      node.fy = y;
    }
  }, []);

  const dragEnd = useCallback((id: string) => {
    const sim = simRef.current;
    if (!sim) return;
    sim.alphaTarget(0.003);
    const node = nodesRef.current.find((n) => n.id === id);
    if (node) {
      node.fx = null;
      node.fy = null;
    }
  }, []);

  return { nodes, links, initialTransform, dragStart, dragMove, dragEnd };
}
