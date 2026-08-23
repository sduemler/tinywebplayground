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
  adapter: netlify(),
  image: {
    service: passthroughImageService(),
  },
});
