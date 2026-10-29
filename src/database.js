import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export function openDatabase(path, { seed = true } = {}) {
  if (path !== ':memory:') mkdirSync(dirname(resolve(path)), { recursive: true });
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT NOT NULL COLLATE NOCASE UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity BETWEEN 0 AND 1000000000),
      min_stock INTEGER NOT NULL DEFAULT 0 CHECK(min_stock BETWEEN 0 AND 1000000000),
      location TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT NOT NULL,
      sku TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('IN','OUT')),
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      balance INTEGER NOT NULL CHECK(balance >= 0),
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE INDEX IF NOT EXISTS transactions_product ON transactions(product_id);
    CREATE INDEX IF NOT EXISTS transactions_date ON transactions(created_at);
    CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `);
  // One-time marker prevents deleted demonstration data from reappearing on restart.
  db.transaction(() => {
    if (db.prepare("SELECT 1 FROM metadata WHERE key = 'initialized'").get()) return;
    if (seed && db.prepare('SELECT COUNT(*) AS count FROM products').get().count === 0) {
      const samples = [
        ['BRG-001','Deep Groove Bearing 6205','Mechanical','pcs',124,30,'A-01'],
        ['MTR-002','Three-phase Motor 2.2 kW','Electrical','pcs',8,10,'B-02'],
        ['BLT-003','Hex Bolt M12 × 50','Fasteners','pcs',840,200,'A-03'],
        ['SNS-004','Inductive Proximity Sensor','Electrical','pcs',26,15,'B-01'],
        ['VLV-005','Pneumatic Solenoid Valve','Pneumatics','pcs',12,15,'C-02'],
        ['BEL-006','Industrial V-Belt A42','Mechanical','pcs',45,20,'A-02'],
        ['LUB-007','Hydraulic Oil ISO VG 46','Consumables','liters',180,50,'D-01'],
        ['GLV-008','Cut-resistant Safety Gloves','Safety','pairs',6,20,'D-03']
      ];
      const insert = db.prepare('INSERT INTO products (sku,name,category,unit,quantity,min_stock,location) VALUES (?,?,?,?,?,?,?)');
      const history = db.prepare("INSERT INTO transactions (product_id,product_name,sku,type,quantity,balance,note) VALUES (?,?,?,'IN',?,?,?)");
      for (const row of samples) {
        const result = insert.run(...row);
        history.run(result.lastInsertRowid, row[1], row[0], row[4], row[4], 'Opening sample inventory');
      }
    }
    db.prepare("INSERT INTO metadata VALUES ('initialized','1')").run();
  })();
  return db;
}
