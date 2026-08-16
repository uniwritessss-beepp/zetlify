// src/index.js – Serve website + API
import fs from 'fs';

// Read your HTML file (adjust path if needed)
const indexHtml = fs.readFileSync('./index.html', 'utf-8');

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ─── Serve index.html for the root path ──────────────
    if (path === '/') {
      return new Response(indexHtml, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // ─── API routes ──────────────────────────────────────
    // Your API endpoints go here
    if (path === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ─── 404 for everything else ──────────────────────────
    return new Response('Not found', { status: 404 });
  },
};