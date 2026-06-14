const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../invoices.db'), { verbose: console.log });

// Create invoices table
db.prepare(`
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT NOT NULL,
    date TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_address TEXT,
    month_year TEXT,
    items TEXT, -- JSON string of items
    taxable_value REAL,
    sgst REAL,
    cgst REAL,
    igst REAL,
    round_off REAL,
    grand_total REAL,
    chairman_signature TEXT,
    customer_signature TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

module.exports = db;
