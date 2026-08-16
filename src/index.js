// src/index.js – Manual routing (no itty-router)
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Route: /
    if (path === '/') {
      return new Response('Hello from Worker!', {
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Route: /api/health
    if (path === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok', message: 'Worker is running' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Route: /api/test
    if (path === '/api/test') {
      return new Response(JSON.stringify({ message: 'Test route works!' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 404 for everything else
    return new Response('Not found', { status: 404 });
  },
};