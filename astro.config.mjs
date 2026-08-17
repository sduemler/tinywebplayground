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
      manifest: {
        name: 'tinywebplayground',
        short_name: 'twp',
        description: 'A personal hub of tiny interactive web projects.',
        theme_color: '#fef9e7',
        background_color: '#fef9e7',
        display: 'standalone',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
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
