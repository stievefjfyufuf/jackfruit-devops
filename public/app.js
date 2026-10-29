const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const fmt = value => Number(value).toLocaleString();
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const state = { products: [], transactions: [], history: { items: [], total: 0 }, page: 'overview', offset: 0, health: null };
let toastTimer;
async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options, headers: { 'Content-Type': 'application/json', ...options.headers }, signal: AbortSignal.timeout(10000)
  });
  if (response.status === 204) return null;
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Request failed. Please try again.');
  return result;
}
function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4500);
}
function showError(error) {
  $('#load-error').hidden = false;
  $('#load-error').replaceChildren(document.createTextNode(`Could not load workspace data: ${error.message} `));
  const retry = document.createElement('button');
  retry.textContent = 'Retry'; retry.className = 'text-link'; retry.addEventListener('click', refresh);
  $('#load-error').append(retry);
}
function stat(title, value, icon, detail, warning = false) {
  return `<article class="stat ${warning ? 'stat-warning' : ''}"><div class="stat-top">${title}<span class="stat-icon" aria-hidden="true">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-bottom">${detail}</div></article>`;
}
function renderStats() {
  const products = state.products;
  const low = products.filter(p => p.quantity <= p.min_stock);
  const categories = [...new Set(products.map(p => p.category))];
  $('#nav-count').textContent = products.length;
  $('#alert-count').textContent = low.length;
  $('#stats').innerHTML = stat('Total products', fmt(products.length), '▧', '<b>Catalog</b> Active inventory items') +
    stat('Units on hand', fmt(products.reduce((sum, p) => sum + p.quantity, 0)), '▤', '<b>Available</b> Across all unit types') +
    stat('Low-stock alerts', fmt(low.length), '♧', `<b>${low.length ? 'Action needed' : 'All clear'}</b> At or below minimum`, true) +
    stat('Categories', fmt(categories.length), '◫', '<b>Organized</b> Industrial supplies');
  const previous = $('#category-filter').value;
  $('#category-filter').innerHTML = '<option value="">All categories</option>' + categories.sort().map(c => `<option value="${escape(c)}">${escape(c)}</option>`).join('');
  $('#category-filter').value = categories.includes(previous) ? previous : '';
  $('#category-options').innerHTML = categories.map(c => `<option value="${escape(c)}"></option>`).join('');
  $('#attention-list').innerHTML = low.slice(0, 3).map(p => `<div class="attention-item"><div><div class="attention-name" title="${escape(p.name)}">${escape(p.name)}</div><div class="attention-meta">${escape(p.sku)} · Min. ${fmt(p.min_stock)} ${escape(p.unit)}</div></div><span class="low-badge">${fmt(p.quantity)} left</span></div>`).join('') || '<div class="empty-state">All stocked up. No alerts right now.</div>';
  $('#table-title').innerHTML = `${state.page === 'alerts' ? 'Low-stock products' : 'Inventory catalog'} <span id="table-count" class="count-label"></span>`;
}
function renderProducts() {
  const search = $('#search').value.trim().toLowerCase();
  const category = $('#category-filter').value;
  const stock = state.page === 'alerts' ? 'low' : $('#status-filter').value;
  const products = state.products.filter(p => (!search || `${p.name} ${p.sku}`.toLowerCase().includes(search)) &&
    (!category || p.category === category) && (!stock || (stock === 'low' ? p.quantity <= p.min_stock : p.quantity > p.min_stock)));
  $('#table-count').textContent = `${products.length} products`;
  $('#product-summary').textContent = `Showing ${products.length} of ${state.products.length} products`;
  $('#product-rows').innerHTML = products.map(p => {
    const low = p.quantity <= p.min_stock;
    const status = p.quantity === 0 ? 'Out of stock' : low ? 'Low stock' : 'In stock';
    const percent = Math.min(100, Math.round(p.quantity / Math.max(p.min_stock * 3, 1) * 100));
    return `<tr><td><div class="product-cell"><span class="product-icon" aria-hidden="true">▧</span><div><div class="product-name">${escape(p.name)}</div><div class="product-sku">${escape(p.sku)}</div></div></div></td><td><span class="category">${escape(p.category)}</span></td><td><span class="quantity">${fmt(p.quantity)}<small>${escape(p.unit)}</small></span><span class="stock-meter ${low ? 'low' : ''}" aria-hidden="true"><i data-width="${percent}"></i></span></td><td><span class="badge ${p.quantity === 0 ? 'empty' : low ? 'low' : ''}">${status}</span></td><td>${escape(p.location) || '—'}</td><td><div class="actions"><button class="action-button" data-action="move" data-id="${p.id}" title="Record movement" aria-label="Record movement for ${escape(p.name)}">⇄</button><button class="action-button" data-action="edit" data-id="${p.id}" title="Edit product" aria-label="Edit ${escape(p.name)}">✎</button><button class="action-button delete" data-action="delete" data-id="${p.id}" title="Delete product" aria-label="Delete ${escape(p.name)}">×</button></div></td></tr>`;
  }).join('') || '<tr><td colspan="6" class="empty-state">No products found. Adjust your filters or add a product to get started.</td></tr>';
  $$('.stock-meter i').forEach(el => { el.style.width = `${el.dataset.width}%`; });
}
function renderChart() {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - 6 + index);
    return { date, IN: 0, OUT: 0 };
  });
  for (const transaction of state.transactions) {
    const date = new Date(transaction.created_at);
    const day = days.find(d => d.date.toDateString() === date.toDateString());
    if (day) day[transaction.type] += transaction.quantity;
  }
  const max = Math.max(1, ...days.flatMap(d => [d.IN, d.OUT]));
  $('#activity-chart').innerHTML = days.map(d => `<div class="chart-day"><div class="bars" title="${escape(d.date.toLocaleDateString())}: ${fmt(d.IN)} in, ${fmt(d.OUT)} out"><div class="bar" data-height="${Math.round(d.IN / max * 100)}"></div><div class="bar out" data-height="${Math.round(d.OUT / max * 100)}"></div></div><span>${d.date.toLocaleDateString(undefined, { weekday: 'short' })}</span></div>`).join('');
  $$('.bar').forEach(el => { el.style.height = `${el.dataset.height}%`; });
  $('#movement-total').textContent = `${fmt(days.reduce((sum, d) => sum + d.IN + d.OUT, 0))} units moved`;
}
function renderHistory() {
  $('#transaction-rows').innerHTML = state.history.items.map(t => `<tr><td><span class="product-name">TX-${String(t.id).padStart(5, '0')}</span><div class="product-sku">${escape(new Date(t.created_at).toLocaleString())}</div></td><td><span class="product-name">${escape(t.product_name)}</span><div class="product-sku">${escape(t.sku)}${t.product_id === null ? ' · Deleted product' : ''}</div></td><td><span class="badge ${t.type === 'OUT' ? 'low' : ''}">${t.type === 'IN' ? '↙ Stock in' : '↗ Stock out'}</span></td><td class="quantity">${t.type === 'IN' ? '+' : '−'}${fmt(t.quantity)}</td><td>${fmt(t.balance)}</td><td title="${escape(t.note)}">${escape(t.note) || '—'}</td></tr>`).join('') || '<tr><td colspan="6" class="empty-state">No movements yet. Record your first stock movement to see it here.</td></tr>';
  $('#transaction-summary').textContent = state.history.total ? `Showing ${state.offset + 1}–${state.offset + state.history.items.length} of ${state.history.total} movements` : '0 movements';
  $('#previous-page').disabled = state.offset === 0;
  $('#next-page').disabled = state.offset + 25 >= state.history.total;
}
async function loadHistory() {
  state.history = await api(`/transactions?limit=25&offset=${state.offset}&${$('#transaction-filter').value ? `type=${$('#transaction-filter').value}` : ''}`);
  renderHistory();
}
async function refresh() {
  try {
    const [products, transactions] = await Promise.all([api('/products'), api('/transactions?limit=500')]);
    state.products = products;
    // Retrieve every movement for an accurate chart, including busy demonstration datasets.
    const all = [...transactions.items];
    for (let offset = 500; offset < transactions.total; offset += 500) all.push(...(await api(`/transactions?limit=500&offset=${offset}`)).items);
    state.transactions = all;
    renderStats(); renderProducts(); renderChart();
    if (state.page === 'transactions') await loadHistory();
    $('#load-error').hidden = true;
    $('#updated-at').textContent = `Updated ${new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  } catch (error) { showError(error); }
}
const pages = {
  overview: ['Overview', 'Inventory overview', 'A clear view of your inventory. Every part, every movement.'],
  products: ['Products', 'Product inventory', 'Manage the parts and supplies that keep your operations moving.'],
  transactions: ['Stock movements', 'Stock movements', 'Trace every receipt and issue with a complete transaction history.'],
  alerts: ['Low-stock alerts', 'Low-stock alerts', 'Stay ahead of shortages. Replenish products at or below their minimum.'],
  health: ['Smart Health Monitor', 'Smart Health Monitor', 'Live visibility into the application that powers your inventory.']
};
function navigate() {
  const page = location.hash.slice(1);
  state.page = pages[page] ? page : 'overview';
  const [label, title, description] = pages[state.page];
  $('#breadcrumb').textContent = label; $('#page-title').textContent = title; $('#page-description').textContent = description;
  $$('nav a').forEach(el => el.classList.toggle('active', el.dataset.page === state.page));
  $('#stats').hidden = ['transactions','health'].includes(state.page);
  $('#overview-panel').hidden = state.page !== 'overview';
  $('#products-panel').hidden = !['overview','products','alerts'].includes(state.page);
  $('#transactions-panel').hidden = state.page !== 'transactions';
  $('#health-panel').hidden = state.page !== 'health';
  $('#status-filter').disabled = state.page === 'alerts';
  $('#sidebar').classList.remove('open'); $('#menu-toggle').setAttribute('aria-expanded', 'false');
  renderStats(); renderProducts();
  if (state.page === 'transactions') loadHistory().catch(showError);
  if (state.page === 'health') checkHealth();
}
let checking = false;
async function checkHealth() {
  if (checking) return;
  checking = true;
  $('#refresh-health').disabled = true;
  const start = performance.now();
  let health;
  try { health = await api('/health'); state.health = health; }
  catch { health = { status: 'error', database: 'unavailable', version: state.health?.version ?? 'Unknown' }; }
  const responseTime = Math.round(performance.now() - start);
  const ok = health.status === 'ok';
  if (ok) $('.environment>span:last-child').textContent = `v${health.version}`;
  $('#connection').innerHTML = `<i class="live-dot"></i>${ok ? 'System operational' : 'System unavailable'}`;
  $('#health-title').textContent = ok ? 'All systems operational' : 'System needs attention';
  $('#health-subtitle').textContent = ok ? 'The API is responding and your database is connected.' : 'Could not confirm a healthy API and database connection. Retry the check.';
  $('#health-cards').innerHTML = stat('API health', ok ? 'Operational' : 'Unavailable', '⌁', ok ? '<b>200 OK</b> Endpoint responding' : 'Check application logs', !ok) +
    stat('Database', health.database === 'connected' ? 'Connected' : 'Unavailable', '▤', health.database === 'connected' ? `<b>SQLite</b> ${health.response_time_ms} ms probe` : 'Connection probe failed', !ok) +
    stat('Response time', `${responseTime} ms`, '◷', 'Browser round trip · latest check') +
    stat('App version', escape(health.version), '◈', 'Package version · running release');
  $('#health-checked').textContent = new Date().toLocaleString();
  $('#health-uptime').textContent = health.uptime_seconds === undefined ? 'Unavailable' : `${Math.floor(health.uptime_seconds / 3600)}h ${Math.floor(health.uptime_seconds / 60) % 60}m ${health.uptime_seconds % 60}s`;
  $('#refresh-health').disabled = false; checking = false;
}
function openEditor(product) {
  const form = $('#product-form'); form.reset(); form.querySelector('.form-error').textContent = '';
  form.elements.id.value = product?.id ?? '';
  if (product) for (const key of ['sku','name','category','unit','min_stock','location']) form.elements[key].value = product[key];
  $('#editor-title').textContent = product ? 'Edit product' : 'Add product';
  $('#quantity-label').hidden = Boolean(product); form.elements.quantity.disabled = Boolean(product);
  $('#edit-hint').hidden = !product;
  $('#editor').showModal();
}
function availableStock() {
  const product = state.products.find(p => p.id === Number($('#movement-product').value));
  $('#available-stock').textContent = product ? `Available: ${fmt(product.quantity)} ${product.unit} · Minimum: ${fmt(product.min_stock)}` : '';
}
function openMovement(productId) {
  if (!state.products.length) return toast('Add a product before recording a movement.');
  const form = $('#movement-form'); form.reset(); form.querySelector('.form-error').textContent = '';
  $('#movement-product').innerHTML = state.products.map(p => `<option value="${p.id}">${escape(p.name)} (${escape(p.sku)})</option>`).join('');
  if (productId) $('#movement-product').value = productId;
  availableStock(); $('#movement').showModal();
}
async function submitForm(event, operation, message) {
  event.preventDefault();
  const form = event.target;
  const button = form.querySelector('[type="submit"]');
  button.disabled = true; form.querySelector('.form-error').textContent = '';
  try {
    await operation(Object.fromEntries(new FormData(form)));
    form.closest('dialog').close(); toast(message); await refresh();
  } catch (error) { form.querySelector('.form-error').textContent = error.message; }
  finally { button.disabled = false; }
}
$('#product-form').addEventListener('submit', event => submitForm(event, async data => {
  const productId = data.id; delete data.id;
  data.min_stock = Number(data.min_stock);
  if (!productId) data.quantity = Number(data.quantity);
  await api(productId ? `/products/${productId}` : '/products', { method: productId ? 'PUT' : 'POST', body: JSON.stringify(data) });
}, 'Product saved successfully.'));
$('#movement-form').addEventListener('submit', event => submitForm(event, async data => {
  data.product_id = Number(data.product_id); data.quantity = Number(data.quantity);
  await api('/transactions', { method: 'POST', body: JSON.stringify(data) });
}, 'Stock movement recorded.'));
$('#delete-form').addEventListener('submit', event => submitForm(event, data => api(`/products/${data.id}`, { method: 'DELETE' }), 'Product deleted. Transaction history preserved.'));
$('#product-rows').addEventListener('click', event => {
  const button = event.target.closest('[data-action]'); if (!button) return;
  const product = state.products.find(p => p.id === Number(button.dataset.id));
  if (button.dataset.action === 'edit') openEditor(product);
  if (button.dataset.action === 'move') openMovement(product.id);
  if (button.dataset.action === 'delete') {
    $('#delete-form').elements.id.value = product.id;
    $('#delete-description').textContent = `You are about to delete ${product.name} (${product.sku}), including its current balance of ${fmt(product.quantity)} ${product.unit}.`;
    $('#delete-form .form-error').textContent = ''; $('#delete-dialog').showModal();
  }
});
$('#add-product').addEventListener('click', () => openEditor());
$('#stock-action').addEventListener('click', () => openMovement());
$('.brand').setAttribute('aria-label', 'Jack Fruit DevOps overview');
$$('.close-dialog').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$('#movement-product').addEventListener('change', availableStock);
['search','category-filter','status-filter'].forEach(id => $(`#${id}`).addEventListener(id === 'search' ? 'input' : 'change', renderProducts));
$('#reset-filters').addEventListener('click', () => { $('#search').value = ''; $('#category-filter').value = ''; $('#status-filter').value = ''; renderProducts(); });
$('#transaction-filter').addEventListener('change', () => { state.offset = 0; loadHistory().catch(showError); });
$('#previous-page').addEventListener('click', () => { state.offset = Math.max(0, state.offset - 25); loadHistory().catch(showError); });
$('#next-page').addEventListener('click', () => { state.offset += 25; loadHistory().catch(showError); });
$('#refresh-health').addEventListener('click', checkHealth);
$('#menu-toggle').addEventListener('click', () => { const open = $('#sidebar').classList.toggle('open'); $('#menu-toggle').setAttribute('aria-expanded', String(open)); });
document.addEventListener('click', event => { if (innerWidth <= 700 && !event.target.closest('#sidebar, #menu-toggle')) { $('#sidebar').classList.remove('open'); $('#menu-toggle').setAttribute('aria-expanded','false'); } });
window.addEventListener('hashchange', navigate);
setInterval(() => { if (!document.hidden) checkHealth(); }, 15000);
navigate(); refresh(); checkHealth();
