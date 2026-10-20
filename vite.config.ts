import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    // Required for the sandbox preview host.
    allowedHosts: true,
    // The dev server should not reload the page when the API writes SQLite files
    // or when server-side code changes. Vite serves only the client.
    watch: {
      ignored: ['**/data/**', '**/server/**', '**/tests/**', '**/supabase/**', '**/*.db*'],
    },
    proxy: {
      // The browser only talks to the Vite origin; /api is proxied to Express.
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:3001',
        changeOrigin: false,
      },
    },
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
