# Architecture baseline

ISSUE-001 / REQ-001–003: One Express process serves static assets and REST routes. A better-sqlite3 database uses WAL and local persistent storage. The app factory accepts a database instance so tests never use production startup configuration. No authentication or external services. Node 22 is the deployment runtime.

Stock mutation and its append-only historical snapshot execute in a single immediate database transaction. Database constraints guard quantity bounds; metadata replacement cannot modify quantity. Product deletion preserves history using a nullable foreign key and snapshot fields.

Docker uses a stable named volume, non-root runtime and health probe. Jenkins tests precede build and gated deployment. No network Docker daemon. One deployment instance is supported.
