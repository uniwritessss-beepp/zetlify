// src/index.js – Step 1: Router only
import { Router } from 'itty-router';

const router = Router();

router.get('/', () => {
  return new Response('Hello from Router!');
});

export default {
  async fetch(request) {
    return router.handle(request);
  },
};