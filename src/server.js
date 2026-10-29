import { openDatabase } from './database.js';
import { createApp } from './app.js';

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.');
const host = process.env.HOST || '127.0.0.1';
const db = openDatabase(process.env.DATABASE_PATH || './data/inventory.sqlite', { seed: process.env.SEED_DATA !== 'false' });
const server = createApp(db).listen(port, host, () => console.log(`Jack Fruit DevOps · http://${host}:${port}`));
server.on('error', err => { console.error(err.message); db.close(); process.exitCode = 1; });
function shutdown() {
  server.close(() => { db.close(); process.exit(0); });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
