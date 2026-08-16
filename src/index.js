// src/index.js
import { Router } from 'itty-router';
import { MongoClient } from 'mongodb';

const router = Router();

// ─── MongoDB connection ──────────────────────
let cachedDb = null;
async function getDb() {
  if (cachedDb) return cachedDb;
  const uri = env.MONGODB_URI; // set in Cloudflare Dashboard
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  cachedDb = client.db('subscription_hub');
  return cachedDb;
}

// ─── API Routes ──────────────────────────────
router.get('/api/health', async () => {
  const db = await getDb();
  return new Response(JSON.stringify({ status: 'ok', database: !!db }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// ─── Static files (serve index.html) ────────
router.get('*', async () => {
  // If you have index.html in the Worker's assets (using the `assets` config),
  // you can return it; otherwise, serve from a public bucket or embed it.
  // For simplicity, we'll just return a basic response.
  return new Response('Hello from Worker!', {
    headers: { 'Content-Type': 'text/html' },
  });
});

export default {
  async fetch(request, env, ctx) {
    // Add CORS headers
    const response = await router.handle(request, env, ctx).catch(() => {
      return new Response('Not found', { status: 404 });
    });
    // If response is a plain object, wrap it
    if (response && !(response instanceof Response)) {
      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return response;
  },
};