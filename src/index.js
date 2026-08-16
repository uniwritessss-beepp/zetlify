// src/index.js – The absolute minimum
export default {
  async fetch(request) {
    return new Response('Hello from Worker!', {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
};