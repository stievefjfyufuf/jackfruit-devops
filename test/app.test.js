import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { openDatabase } from '../src/database.js';
import { createApp } from '../src/app.js';

let dir, db, server, base;
beforeEach(async () => {
  // Never consult DATABASE_PATH or the production directory.
  dir = mkdtempSync(join(tmpdir(), 'jack-fruit-test-'));
  db = openDatabase(join(dir, 'test.sqlite'), { seed: false });
  server = createApp(db).listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
});
afterEach(async () => {
  await new Promise(resolve => server.close(resolve));
  if (db.open) db.close();
  rmSync(dir, { recursive: true, force: true });
});
async function request(path, method = 'GET', body) {
  const response = await fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, data: response.status === 204 ? null : await response.json() };
}
const sample = () => ({ sku: 'BRG-001', name: 'Bearing', category: 'Mechanical', unit: 'pcs', quantity: 10, min_stock: 5, location: 'A-01' });
const add = async (overrides = {}) => (await request('/api/products', 'POST', { ...sample(), ...overrides })).data;
test('product CRUD and opening inventory history', async () => {
  const created = await request('/api/products', 'POST', sample());
  assert.equal(created.status, 201);
  const product = created.data;
  assert.equal((await request(`/api/products/${product.id}`)).data.name, 'Bearing');
  assert.equal((await request('/api/products')).data.length, 1);
  const { quantity, ...updated } = sample();
  const result = await request(`/api/products/${product.id}`, 'PUT', { ...updated, name: 'Updated bearing', min_stock: 12 });
  assert.equal(result.status, 200); assert.equal(result.data.quantity, 10); assert.equal(result.data.name, 'Updated bearing');
  assert.equal((await request('/api/products?low_stock=true')).data.length, 1);
  assert.equal((await request(`/api/products/${product.id}`, 'DELETE')).status, 204);
  assert.equal((await request(`/api/products/${product.id}`)).status, 404);
  const history = (await request('/api/transactions')).data.items;
  assert.equal(history[0].product_id, null); assert.equal(history[0].product_name, 'Bearing'); assert.equal(history[0].balance, 10);
});
test('stock in and stock out update balance and append immutable records', async () => {
  const product = await add();
  let result = await request('/api/transactions', 'POST', { product_id: product.id, type: 'IN', quantity: 5, note: 'PO-123' });
  assert.equal(result.status, 201); assert.equal(result.data.balance, 15);
  result = await request('/api/transactions', 'POST', { product_id: product.id, type: 'OUT', quantity: 15 });
  assert.equal(result.status, 201); assert.equal(result.data.balance, 0);
  assert.equal((await request(`/api/products/${product.id}`)).data.quantity, 0);
  assert.equal((await request('/api/transactions')).data.total, 3);
});
test('insufficient stock rolls back quantity and history', async () => {
  const product = await add();
  const result = await request('/api/transactions', 'POST', { product_id: product.id, type: 'OUT', quantity: 11 });
  assert.equal(result.status, 409);
  assert.equal((await request(`/api/products/${product.id}`)).data.quantity, 10);
  assert.equal((await request('/api/transactions')).data.total, 1);
});
test('competing stock-out requests cannot create negative inventory', async () => {
  const product = await add({ quantity: 1 });
  const results = await Promise.all(Array.from({ length: 5 }, () => request('/api/transactions', 'POST', { product_id: product.id, type: 'OUT', quantity: 1 })));
  assert.equal(results.filter(r => r.status === 201).length, 1);
  assert.equal(results.filter(r => r.status === 409).length, 4);
  assert.equal((await request(`/api/products/${product.id}`)).data.quantity, 0);
  assert.equal((await request('/api/transactions')).data.total, 2);
});
test('rejects invalid products, duplicate SKU and quantity edits', async () => {
  for (const invalid of [{ name: '' }, { sku: ' ' }, { category: 1 }, { unit: '' }, { quantity: -1 }, { quantity: 1.2 }, { min_stock: -2 }, { min_stock: '5' }, { name: 'x'.repeat(121) }, { quantity: 1000000001 }, { extra: true }]) {
    assert.equal((await request('/api/products', 'POST', { ...sample(), ...invalid })).status, 400);
  }
  for (const invalid of [null, [], 'text']) assert.equal((await request('/api/products', 'POST', invalid)).status, 400);
  const product = await add();
  assert.equal((await request('/api/products', 'POST', { ...sample(), sku: 'brg-001' })).status, 409);
  assert.equal((await request(`/api/products/${product.id}`, 'PUT', sample())).status, 400);
});
test('rejects invalid transactions and nonexistent products', async () => {
  const product = await add();
  for (const invalid of [{ quantity: 0 }, { quantity: -1 }, { quantity: 1.5 }, { quantity: '2' }, { type: 'ADJUST' }, { product_id: '1' }, { note: 'x'.repeat(301) }, { extra: true }]) {
    assert.equal((await request('/api/transactions', 'POST', { product_id: product.id, type: 'IN', quantity: 1, ...invalid })).status, 400);
  }
  assert.equal((await request('/api/transactions', 'POST', { product_id: 999, type: 'IN', quantity: 1 })).status, 404);
  assert.equal((await request('/api/products/nope')).status, 400);
  assert.equal((await request('/api/transactions?limit=0')).status, 400);
  assert.equal((await request('/api/transactions?type=INVALID')).status, 400);
});
test('upper bound cannot overflow inventory', async () => {
  const product = await add({ quantity: 1000000000 });
  assert.equal((await request('/api/transactions', 'POST', { product_id: product.id, type: 'IN', quantity: 1 })).status, 409);
  assert.equal((await request(`/api/products/${product.id}`)).data.quantity, 1000000000);
});
test('search, category, threshold boundary and history pagination', async () => {
  const product = await add({ quantity: 5 });
  await add({ sku: 'EL-002', name: 'Motor', category: 'Electrical' });
  assert.equal((await request('/api/products?search=bEaR&category=Mechanical')).data[0].id, product.id);
  assert.equal((await request('/api/products?low_stock=true')).data.length, 1);
  assert.equal((await request('/api/products?search=%25')).data.length, 0);
  const page = await request(`/api/transactions?product_id=${product.id}&type=IN&limit=1&offset=0`);
  assert.equal(page.data.total, 1); assert.equal(page.data.items.length, 1);
});
test('health checks a live database and returns 503 when disconnected', async () => {
  let result = await request('/api/health');
  assert.equal(result.status, 200); assert.equal(result.data.status, 'ok'); assert.equal(result.data.database, 'connected');
  assert.equal(result.data.version, '1.0.0'); assert.equal(typeof result.data.response_time_ms, 'number');
  db.close(); result = await request('/api/health');
  assert.equal(result.status, 503); assert.equal(result.data.database, 'disconnected');
});
test('malformed JSON, oversized bodies, missing routes and cross-origin writes', async () => {
  let response = await fetch(`${base}/api/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' });
  assert.equal(response.status, 400);
  response = await fetch(`${base}/api/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'x'.repeat(40000) }) });
  assert.equal(response.status, 413);
  assert.equal((await request('/api/missing')).status, 404);
  response = await fetch(`${base}/api/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://another.example' }, body: JSON.stringify(sample()) });
  assert.equal(response.status, 403);
  response = await fetch(base);
  assert.equal(response.status, 200); assert.match(await response.text(), /Jack Fruit/);
  assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'none'/);
});
test('database survives reopen and sample seeding happens only once', async () => {
  const path = join(dir, 'seed.sqlite');
  let seeded = openDatabase(path);
  assert.equal(seeded.prepare('SELECT COUNT(*) AS n FROM products').get().n, 8);
  seeded.exec('DELETE FROM products'); seeded.close();
  seeded = openDatabase(path);
  assert.equal(seeded.prepare('SELECT COUNT(*) AS n FROM products').get().n, 0);
  assert.equal(seeded.prepare('SELECT COUNT(*) AS n FROM transactions').get().n, 8);
  seeded.close();
  const product = await add();
  db.close();
  db = openDatabase(join(dir, 'test.sqlite'), { seed: false });
  assert.equal(db.prepare('SELECT quantity FROM products WHERE id=?').get(product.id).quantity, 10);
});
