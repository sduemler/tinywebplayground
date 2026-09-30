// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';
import AstroPWA from '@vite-pwa/astro';

export default defineConfig({
  // Netlify sets URL to the site's primary URL at build time. It drives the
  // absolute canonical / og:image URLs in BaseLayout (skipped when unset).
  site: process.env.URL,
  integrations: [
    react(),
    AstroPWA({
      registerType: 'autoUpdate',
      manifest: false,
      // Astro 6+ builds each Vite environment separately, so the PWA plugin
      // otherwise resolves the adapter's server build dir instead of dist/.
      outDir: 'dist',
      workbox: {
        navigateFallback: undefined,
        // Images are left out of the precache: it runs on a visitor's first page
        // view and would pull every project's art (~5 MB). They're cached on
        // demand below instead, so pages already visited still work offline.
        globPatterns: ['**/*.{css,js,html,svg,ico,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ request, sameOrigin }) =>
              sameOrigin && request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  output: 'static',
  adapter: netlify({
    // This project has no edge functions (no edgeMiddleware, no edge handlers),
    // but the Netlify dev server still boots a local Deno process for them.
    // @netlify/edge-functions-dev runs `deno eval --allow-scripts ...`, a flag
    // Deno 2.9+ rejects on `eval`, so that process dies instantly and the
    // adapter throws an unhandled rejection on the first request:
    //   "Could not establish a connection to the Netlify Edge Functions
    //    local development server"
    // Dev-only setting; production builds are unaffected. Re-enable if this
    // project ever gains an edge function (and expect the error back until
    // the upstream flag bug is fixed — it is still present in 2.0.1).
    // `images` and `environmentVariables` are the adapter defaults; the type
    // requires all three keys once any is given.
    devFeatures: { edgeFunctions: false, images: true, environmentVariables: false },
  }),
  image: {
    service: passthroughImageService(),
  },
});
