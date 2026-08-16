// src/index.js – Supabase + Cloudflare Worker (FIXED)
import { Router } from 'itty-router';

const router = Router();

// ─── SUPABASE HELPER (now uses globalThis.env) ──────────────
async function supabaseFetch(table, method = 'GET', body = null, filters = '') {
  const url = `${globalThis.env.SUPABASE_URL}/rest/v1/${table}${filters}`;
  const headers = {
    'apikey': globalThis.env.SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${globalThis.env.SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error ${res.status}: ${text}`);
  }
  if (res.status === 204) return { success: true };
  return res.json();
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
async function getBody(request) {
  try { return await request.json(); } catch { return {}; }
}

// ─── ROUTES ─────────────────────────────────────────

router.get('/api/health', async () => {
  try {
    await supabaseFetch('users', 'GET', null, '?limit=1');
    return new Response(JSON.stringify({ status: 'ok', database: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  } catch (err) {
    return new Response(JSON.stringify({ status: 'error', database: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
});

router.get('/api/subscriptions', async () => {
  try {
    const data = await supabaseFetch('subscriptions', 'GET', null, '?select=*');
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
});

router.post('/api/subscriptions', async (request) => {
  try {
    const body = await getBody(request);
    const newSub = { ...body, createdAt: new Date().toISOString() };
    const result = await supabaseFetch('subscriptions', 'POST', newSub, '');
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
});

router.post('/api/users/signup', async (request) => {
  try {
    const { name, username, password, whatsapp } = await getBody(request);
    if (!name || !username || !password || !whatsapp) {
      return new Response(JSON.stringify({ error: 'All fields required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }
    const existing = await supabaseFetch('users', 'GET', null, `?username=eq.${username}`);
    if (existing.length > 0) {
      return new Response(JSON.stringify({ error: 'Username already exists' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }
    // ⚠️ Plain text password – hash this in production!
    const newUser = { username, name, password, whatsapp, credits: 0, purchaseCount: 0 };
    await supabaseFetch('users', 'POST', newUser, '');
    const { password: _, ...safeUser } = newUser;
    return new Response(JSON.stringify({ success: true, user: safeUser }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
});

router.post('/api/users/login', async (request) => {
  try {
    const { username, password } = await getBody(request);
    const users = await supabaseFetch('users', 'GET', null, `?username=eq.${username}`);
    const user = users[0];
    if (!user || user.password !== password) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }
    const { password: _, ...safeUser } = user;
    return new Response(JSON.stringify({ success: true, user: safeUser }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
});

router.get('/api/deals', async () => {
  try {
    const data = await supabaseFetch('deals', 'GET', null, '?select=*');
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
});

router.get('*', () => {
  return new Response('Hello from Worker!', {
    headers: { 'Content-Type': 'text/html', ...corsHeaders() },
  });
});

export default {
  async fetch(request, env, ctx) {
    globalThis.env = env; // Make env available globally
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    try {
      const response = await router.handle(request, env, ctx);
      if (!response) return new Response('Not found', { status: 404, headers: corsHeaders() });
      if (!(response instanceof Response)) {
        return new Response(JSON.stringify(response), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        });
      }
      return response;
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }
  },
};