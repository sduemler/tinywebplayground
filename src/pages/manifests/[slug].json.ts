export const prerender = true;

import type { APIRoute, GetStaticPaths } from "astro";
import { projects } from "@data/projects";

export const getStaticPaths: GetStaticPaths = () =>
  projects.map((p) => ({ params: { slug: p.slug } }));

export const GET: APIRoute = ({ params }) => {
  const project = projects.find((p) => p.slug === params.slug)!;
  return new Response(
    JSON.stringify({
      name: project.title,
      short_name: project.title,
      description: project.description,
      start_url: `/projects/${project.slug}/`,
      scope: `/projects/${project.slug}/`,
      display: "standalone",
      theme_color: project.accentColor,
      background_color: "#fef9e7",
      icons: [
        { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
        {
          src: "/pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    }),
    { headers: { "Content-Type": "application/manifest+json" } },
  );
};
