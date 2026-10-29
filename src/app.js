import express from 'express';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
const MAX = 1000000000;
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function integer(value, field, min = 0, max = MAX) {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new HttpError(400, `${field} must be an integer between ${min} and ${max}.`);
  return value;
}
function string(value, field, max, optional = false) {
  if (optional && value === undefined) return '';
  if (typeof value !== 'string' || (!optional && !value.trim()) || value.trim().length > max) throw new HttpError(400, `${field} must be ${optional ? 'at most' : '1 to'} ${max} characters.`);
  return value.trim();
}
function body(req, allowed) {
  if (!req.body || Array.isArray(req.body) || typeof req.body !== 'object') throw new HttpError(400, 'A JSON object is required.');
  if (Object.keys(req.body).some(key => !allowed.includes(key))) throw new HttpError(400, 'Request contains unsupported fields.');
  return req.body;
}
function id(value) {
  if (!/^[1-9]\d*$/.test(value)) throw new HttpError(400, 'Invalid product ID.');
  return integer(Number(value), 'Product ID', 1, Number.MAX_SAFE_INTEGER);
}
function productInput(input) {
  return {
    sku: string(input.sku, 'SKU', 40), name: string(input.name, 'Name', 120),
    category: string(input.category, 'Category', 60), unit: string(input.unit, 'Unit', 20),
    min_stock: integer(input.min_stock, 'Minimum stock'), location: string(input.location, 'Location', 60, true)
  };
}
export function createApp(db) {
  const app = express();
  const started = Date.now();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin',
      'Content-Security-Policy': "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" });
    if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
    // Reject cross-origin browser writes; this application deliberately has no login.
    if (!['GET','HEAD','OPTIONS'].includes(req.method) && req.headers.origin) {
      let origin;
      try { origin = new URL(req.headers.origin); } catch { return next(new HttpError(403, 'Invalid request origin.')); }
      if (origin.host !== req.headers.host) return next(new HttpError(403, 'Cross-origin writes are not allowed.'));
    }
    next();
  });
  app.use(express.json({ limit: '32kb' }));
  const findProduct = productId => {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) throw new HttpError(404, 'Product not found.');
    return product;
  };
  const record = db.prepare('INSERT INTO transactions (product_id,product_name,sku,type,quantity,balance,note) VALUES (@product_id,@product_name,@sku,@type,@quantity,@balance,@note)');
  app.get('/api/health', (req, res) => {
    const start = performance.now();
    try {
      db.prepare('SELECT 1').get();
      res.json({ status: 'ok', database: 'connected', response_time_ms: Number((performance.now() - start).toFixed(2)), version,
        uptime_seconds: Math.floor((Date.now() - started) / 1000), timestamp: new Date().toISOString() });
    } catch {
      res.status(503).json({ status: 'error', database: 'disconnected', version, timestamp: new Date().toISOString() });
    }
  });
  app.get('/api/products', (req, res) => {
    const search = string(req.query.search ?? '', 'Search', 120, true);
    const category = string(req.query.category ?? '', 'Category', 60, true);
    if (req.query.low_stock !== undefined && !['true','false'].includes(req.query.low_stock)) throw new HttpError(400, 'low_stock must be true or false.');
    res.json(db.prepare(`SELECT * FROM products WHERE (instr(lower(name),lower(@search)) > 0 OR instr(lower(sku),lower(@search)) > 0)
      AND (@category = '' OR category = @category) AND (@low = 0 OR quantity <= min_stock) ORDER BY name`).all({ search, category, low: req.query.low_stock === 'true' ? 1 : 0 }));
  });
  app.get('/api/products/:id', (req, res) => res.json(findProduct(id(req.params.id))));
  app.post('/api/products', (req, res) => {
    const input = body(req, ['sku','name','category','unit','min_stock','location','quantity']);
    const product = productInput(input);
    const quantity = integer(input.quantity ?? 0, 'Opening quantity');
    const created = db.transaction(() => {
      const result = db.prepare('INSERT INTO products (sku,name,category,unit,min_stock,location,quantity) VALUES (@sku,@name,@category,@unit,@min_stock,@location,@quantity)').run({ ...product, quantity });
      if (quantity) record.run({ product_id: result.lastInsertRowid, product_name: product.name, sku: product.sku, type: 'IN', quantity, balance: quantity, note: 'Opening inventory' });
      return findProduct(result.lastInsertRowid);
    })();
    res.location(`/api/products/${created.id}`).status(201).json(created);
  });
  app.put('/api/products/:id', (req, res) => {
    const productId = id(req.params.id);
    findProduct(productId);
    const product = productInput(body(req, ['sku','name','category','unit','min_stock','location']));
    db.prepare("UPDATE products SET sku=@sku,name=@name,category=@category,unit=@unit,min_stock=@min_stock,location=@location,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=@id").run({ ...product, id: productId });
    res.json(findProduct(productId));
  });
  app.delete('/api/products/:id', (req, res) => {
    const productId = id(req.params.id);
    findProduct(productId);
    db.prepare('DELETE FROM products WHERE id = ?').run(productId);
    res.status(204).end();
  });
  app.get('/api/transactions', (req, res) => {
    const limit = req.query.limit === undefined ? 100 : integer(Number(req.query.limit), 'Limit', 1, 500);
    const offset = req.query.offset === undefined ? 0 : integer(Number(req.query.offset), 'Offset');
    const productId = req.query.product_id === undefined ? null : id(req.query.product_id);
    if (req.query.type !== undefined && !['IN','OUT'].includes(req.query.type)) throw new HttpError(400, 'Type must be IN or OUT.');
    const type = req.query.type ?? '';
    const filter = 'WHERE (@product_id IS NULL OR product_id=@product_id) AND (@type=\'\' OR type=@type)';
    const params = { product_id: productId, type };
    const total = db.prepare(`SELECT COUNT(*) AS total FROM transactions ${filter}`).get(params).total;
    res.json({ items: db.prepare(`SELECT * FROM transactions ${filter} ORDER BY id DESC LIMIT @limit OFFSET @offset`).all({ ...params, limit, offset }), total, limit, offset });
  });
  app.post('/api/transactions', (req, res) => {
    const input = body(req, ['product_id','type','quantity','note']);
    const productId = integer(input.product_id, 'Product ID', 1);
    if (!['IN','OUT'].includes(input.type)) throw new HttpError(400, 'Type must be IN or OUT.');
    const quantity = integer(input.quantity, 'Quantity', 1);
    const note = string(input.note, 'Note', 300, true);
    const transaction = db.transaction(() => {
      const product = findProduct(productId);
      const delta = input.type === 'IN' ? quantity : -quantity;
      const balance = product.quantity + delta;
      if (balance < 0) throw new HttpError(409, `Insufficient stock. Available: ${product.quantity} ${product.unit}.`);
      if (balance > MAX) throw new HttpError(409, 'Maximum stock quantity exceeded.');
      db.prepare("UPDATE products SET quantity=?, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").run(balance, productId);
      const result = record.run({ product_id: productId, product_name: product.name, sku: product.sku, type: input.type, quantity, balance, note });
      return db.prepare('SELECT * FROM transactions WHERE id=?').get(result.lastInsertRowid);
    }).immediate();
    res.status(201).json(transaction);
  });
  app.use('/api', (req, res) => res.status(404).json({ error: 'API endpoint not found.' }));
  app.use(express.static(fileURLToPath(new URL('../public', import.meta.url))));
  app.use((req, res) => res.status(404).type('text').send('Page not found.'));
  app.use((err, req, res, next) => {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'A product with this SKU already exists.' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body.' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request body is too large.' });
    const status = err.status || 500;
    if (status >= 500) console.error('Request failed:', err.message);
    res.status(status).json({ error: status >= 500 ? 'Internal server error.' : err.message });
  });
  return app;
}
