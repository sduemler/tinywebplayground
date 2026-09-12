// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';
import AstroPWA from '@vite-pwa/astro';

export default defineConfig({
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
        globPatterns: ['**/*.{css,js,html,svg,png,webp,ico,woff,woff2}'],
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
    devFeatures: { edgeFunctions: false },
  }),
  image: {
    service: passthroughImageService(),
  },
});
