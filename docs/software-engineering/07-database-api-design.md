# Database and API baseline

ISSUE-001 / REQ-001: `products` stores unique case-insensitive SKU, name/category/unit/location, quantity, minimum stock and timestamps. `transactions` stores nullable product link, product name/SKU snapshot, IN/OUT, positive quantity, resulting balance, note and timestamp. `metadata` records one-time database initialization.

API-001: `/api/products` GET/POST and `/api/products/:id` GET/PUT/DELETE. PUT replaces metadata only. POST optionally records opening quantity. Literal substring search and category/low-stock filtering.

API-002: `/api/transactions` GET with bounded pagination/type/product filters and POST for atomic movements. Reject insufficient stock with 409.

API-003: `/api/health` probes the live database and returns 200/503 with status and version. All API errors are JSON; see README for complete fields and bounds.
