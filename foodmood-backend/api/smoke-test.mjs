// End-to-end smoke test against an in-memory MongoDB.
// Verifies: app boots, auth (register+login+me), inventory CRUD, consume → stats update,
// recommend (rule-based fallback since ML_SERVICE_URL is empty), notifications.

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

const mongod = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongod.getUri();
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';
process.env.OCR_SERVICE_URL = 'http://localhost:9999';   // unused in this test
process.env.ML_SERVICE_URL = '';                          // force rule-based fallback

const { createApp } = await import('./src/app.js');
const { connectDB } = await import('./src/config/db.js');

await connectDB();

// Seed one recipe so /recipes/recommend has something to rank.
const Recipe = (await import('./src/models/Recipe.js')).default;
await Recipe.create({
  name: 'Test Salad',
  image: 'x',
  cookingTime: 10,
  servings: 2,
  ingredients: [
    { name: 'Tomato', amount: '2', normalizedName: 'tomato' },
    { name: 'Carrot', amount: '1', normalizedName: 'carrot' },
  ],
  instructions: ['mix'],
});

const app = createApp();
const server = app.listen(0);
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;

function call(method, path, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));
}

const results = [];
function check(name, cond, extra = '') {
  results.push({ name, pass: !!cond, extra });
  console.log(`${cond ? '✓' : '✗'}  ${name}${extra ? '  ' + extra : ''}`);
}

// 1. Health
const h = await call('GET', '/health');
check('GET /health', h.status === 200 && h.body.ok === true);

// 2. Register
const reg = await call('POST', '/api/auth/register', {
  body: { name: 'Yerkanat', email: 'y@example.com', password: 'password123' },
});
check('POST /api/auth/register', reg.status === 201 && reg.body.token);
const token = reg.body.token;

// 3. Login
const login = await call('POST', '/api/auth/login', {
  body: { email: 'y@example.com', password: 'password123' },
});
check('POST /api/auth/login', login.status === 200 && login.body.token);

// 4. Me
const me = await call('GET', '/api/auth/me', { token });
check('GET /api/auth/me', me.status === 200 && me.body.user?.email === 'y@example.com');

// 5. Bad login
const badLogin = await call('POST', '/api/auth/login', {
  body: { email: 'y@example.com', password: 'wrong' },
});
check('Login wrong password → 401', badLogin.status === 401);

// 6. Auth required
const noauth = await call('GET', '/api/inventory');
check('Inventory without token → 401', noauth.status === 401);

// 7. Add item
const tomorrow = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
const addItem = await call('POST', '/api/inventory', {
  token,
  body: { name: 'Tomato', category: 'Veggies', quantity: 5, unit: 'pcs', price: 3.49, expiryDate: tomorrow },
});
check('POST /api/inventory (Tomato)', addItem.status === 201 && addItem.body.item?.id);
const tomatoId = addItem.body.item.id;

// 8. Batch add
const batch = await call('POST', '/api/inventory/batch', {
  token,
  body: {
    items: [
      { name: 'Milk', category: 'Dairy', quantity: 1, unit: 'L', price: 2.99, expiryDate: tomorrow },
      { name: 'Carrot', category: 'Veggies', quantity: 1, unit: 'kg', price: 1.99, expiryDate: tomorrow },
    ],
  },
});
check('POST /api/inventory/batch (2 items)', batch.status === 201 && batch.body.items.length === 2);

// 9. List inventory
const list = await call('GET', '/api/inventory', { token });
check('GET /api/inventory (3 items)', list.status === 200 && list.body.items.length === 3);

// 10. Patch
const patch = await call('PATCH', `/api/inventory/${tomatoId}`, {
  token,
  body: { quantity: 6 },
});
check('PATCH /api/inventory/:id', patch.status === 200 && patch.body.item.quantity === 6);

// 11. Consume (stats should update)
const consume = await call('POST', `/api/inventory/${tomatoId}/consume`, { token });
check(
  'POST /api/inventory/:id/consume updates stats',
  consume.status === 200 && consume.body.stats.foodSavedKg > 0
);

// 12. Recipe recommend (rule-based fallback)
const rec = await call('GET', '/api/recipes/recommend/me?limit=5', { token });
check(
  'GET /api/recipes/recommend/me uses fallback ranker',
  rec.status === 200 && Array.isArray(rec.body.recipes) && rec.body.recipes.length >= 1
);

// 13. Stats
const stats = await call('GET', '/api/stats/me', { token });
check('GET /api/stats/me', stats.status === 200 && typeof stats.body.stats.foodSavedKg === 'number');

// 14. Notifications (expiry alerts — Tomato expired but already consumed; Milk/Carrot remain)
const notifs = await call('GET', '/api/notifications', { token });
check(
  'GET /api/notifications returns live expiry alerts',
  notifs.status === 200 && Array.isArray(notifs.body.notifications) && notifs.body.notifications.length >= 1
);

// 15. Validation error
const badAdd = await call('POST', '/api/inventory', {
  token,
  body: { name: '', quantity: -5 },
});
check('Validation rejects bad body → 400', badAdd.status === 400);

// 16. 404
const notFound = await call('GET', '/api/nope');
check('Unknown route → 404', notFound.status === 404);

server.close();
await mongoose.disconnect();
await mongod.stop();

const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed === 0 ? 0 : 1);
