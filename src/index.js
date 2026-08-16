// src/index.js – API only (CORS fixed + safe returns)
export default {
  async fetch(request, env, ctx) {
    globalThis.env = env;

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // ─── CORS headers (includes cache-control) ──────────
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // ─── Supabase Helper ──────────────────────────────
    async function supabaseFetch(table, method = 'GET', body = null, filters = '') {
      try {
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
      } catch (err) {
        return { error: err.message };
      }
    }

    async function getBody(request) {
      try { return await request.json(); } catch { return {}; }
    }

    // ─── API Routes ─────────────────────────────────────

    // GET /api/health
    if (path === '/api/health' && method === 'GET') {
      return new Response(JSON.stringify({ status: 'ok', message: 'API is running' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // GET /api/subscriptions
    if (path === '/api/subscriptions' && method === 'GET') {
      try {
        const data = await supabaseFetch('subscriptions', 'GET', null, '?select=*');
        const result = Array.isArray(data) ? data : [];
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (err) {
        return new Response(JSON.stringify([]), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // POST /api/subscriptions
    if (path === '/api/subscriptions' && method === 'POST') {
      try {
        const body = await getBody(request);
        const newSub = { ...body, createdAt: new Date().toISOString() };
        const result = await supabaseFetch('subscriptions', 'POST', newSub, '');
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // GET /api/deals
    if (path === '/api/deals' && method === 'GET') {
      try {
        const data = await supabaseFetch('deals', 'GET', null, '?select=*');
        const result = Array.isArray(data) ? data : [];
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (err) {
        return new Response(JSON.stringify([]), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // GET /api/promotions
    if (path === '/api/promotions' && method === 'GET') {
      try {
        const data = await supabaseFetch('promotions', 'GET', null, '?select=*');
        const result = Array.isArray(data) ? data : [];
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (err) {
        return new Response(JSON.stringify([]), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // GET /api/social-services
    if (path === '/api/social-services' && method === 'GET') {
      try {
        const data = await supabaseFetch('socialServices', 'GET', null, '?select=*');
        const result = Array.isArray(data) ? data : [];
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (err) {
        return new Response(JSON.stringify([]), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // GET /api/faqs
    if (path === '/api/faqs' && method === 'GET') {
      try {
        const data = await supabaseFetch('faqs', 'GET', null, '?select=*');
        const result = Array.isArray(data) ? data : [];
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (err) {
        return new Response(JSON.stringify([]), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // GET /api/admin/settings
    if (path === '/api/admin/settings' && method === 'GET') {
      try {
        const data = await supabaseFetch('adminSettings', 'GET', null, '?select=*');
        // Return first settings document or empty object
        const result = Array.isArray(data) && data.length > 0 ? data[0] : {};
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (err) {
        return new Response(JSON.stringify({}), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // ─── 404 ──────────────────────────────────────────────
    return new Response(JSON.stringify({ error: 'API endpoint not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  },
};