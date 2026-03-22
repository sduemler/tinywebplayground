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
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (width === 0 || height === 0) return;

    // Scale initial positions to fit the viewport with padding
    const padX = 80;
    const padY = 70;
    const scaleX = (width - padX * 2) / 1100; // data ranges from -550 to 550
    const scaleY = (height - padY * 2) / 700;  // data ranges from -350 to 350
    const scale = Math.min(scaleX, scaleY);

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

  return { nodes, links, dragStart, dragMove, dragEnd };
}
