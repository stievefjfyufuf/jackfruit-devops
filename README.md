# Jack Fruit DevOps

A lightweight industrial inventory workspace for a university CI/CD demonstration. Express, vanilla HTML/CSS/JavaScript and persistent SQLite via better-sqlite3. No authentication, frontend build framework or external API credentials.

## Local Windows setup

Install **Node.js 22 LTS** (the project targets 22; see `.nvmrc`) and Git. Open PowerShell in this directory:

```powershell
node --version
npm ci
Copy-Item .env.example .env
npm test
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000). `npm run dev` enables server watch mode. Stop with Ctrl+C. On a fresh database, eight industrial products and their opening transactions appear automatically. If a Windows native prebuilt SQLite binary is unavailable, install Visual Studio Build Tools with Desktop development with C++ and Python 3, then retry `npm ci`. Never copy `node_modules` between Windows and Linux.

## Daily workflow

- **Overview:** stock totals, seven-day activity chart, low-stock shortlist and catalog. Units on hand is a numerical total across different units, not a valuation. Chart dates follow the browser's local timezone.
- **Products:** add, search, filter, edit or delete. SKU is unique ignoring case. Minimum stock is configurable per product. Products at or below their minimum are flagged, including zero stock.
- **Record movement:** receive stock (`IN`) or issue stock (`OUT`). Positive whole quantities only. An atomic SQLite transaction changes balance and records history together; insufficient stock returns HTTP 409 without changing either. Edit metadata through the product form; change quantities through movements.
- **Stock movements:** all opening and subsequent transactions, with type filter and pagination. History snapshots preserve product name and SKU after editing or deletion. Deleting a product removes its balance but retains its transactions; deleting is intended for demo catalog cleanup, not issuing stock.
- **Smart Health Monitor:** API status, database connectivity, measured browser round-trip time, SQLite probe time, uptime and package version. Checks every 15 seconds while the page is visible. Inventory refreshes on page load and after successful changes; reload to see changes made by another browser.

## Configuration

`npm start` and `npm run dev` load `.env` if present, using Node's built-in env-file support. Environment values already set by your shell take precedence. Direct `node src/server.js` and Docker use process environment variables only.

- `PORT`: local listening port, default `3000` (1–65535).
- `HOST`: listening address, default `127.0.0.1`. Container sets `0.0.0.0` internally.
- `DATABASE_PATH`: SQLite file, default `./data/inventory.sqlite`; relative paths resolve from the process working directory. Parent directories are created. Keep the database outside the source checkout for a non-Docker server.
- `SEED_DATA`: default `true`; set exactly `false` before first launch for an empty database. Initialization is marked once, so deleting samples does not reseed them on restart. Changing this later does not clear existing data.
- `NODE_ENV`: `development` locally, `production` in Docker.
- `HEALTHCHECK_URL`: optional URL override for `npm run healthcheck`; defaults to loopback and `PORT`.
- Compose-only `APP_PORT`: host port, default `3000`.
- Compose-only `BIND_ADDRESS`: host bind address, default `127.0.0.1`.
- Compose-only `APP_IMAGE`: image tag, default `jack-fruit-devops:local`.

`DATABASE_PATH` is fixed to `/app/data/inventory.sqlite` inside Compose. The stable named volume `jack-fruit-devops-data` persists independently of image tags, checkout directories and Compose project names. SQLite uses WAL, foreign keys, a busy timeout and database constraints. Run a single app container on local persistent storage; this is not a multi-host database architecture.

## API

All endpoints use JSON. Errors return `{ "error": "Readable message" }`. Product and movement quantities are integers up to 1,000,000,000. Use `Content-Type: application/json` for writes.

- `GET /api/health`: 200 with `status`, `database`, `response_time_ms` (database probe), `version`, `uptime_seconds`, `timestamp`; 503 if the database probe fails.
- `GET /api/products?search=bearing&category=Mechanical&low_stock=true`: product array, ordered by name. Search matches literal name/SKU substrings, case insensitive.
- `GET /api/products/:id`: single product; 404 if absent.
- `POST /api/products`: creates a product, 201. Required: `sku`, `name`, `category`, `unit`, `min_stock`. Optional: `quantity` (default 0), `location` (default empty). Nonzero opening quantity creates an `IN` transaction.
- `PUT /api/products/:id`: replaces editable metadata, 200. Same required fields, optional `location`. Quantity is intentionally rejected.
- `DELETE /api/products/:id`: 204, retaining historical snapshots.
- `GET /api/transactions?type=OUT&product_id=1&limit=25&offset=0`: `{items,total,limit,offset}`; default limit 100, max 500. Newest first. Filters optional; `product_id` refers to currently linked products.
- `POST /api/transactions`: `{ "product_id": 1, "type": "OUT", "quantity": 2, "note": "Work order 042" }`; 201 with saved transaction. `note` optional, max 300 characters.

Malformed IDs/fields/JSON return 400; duplicate SKU and insufficient/excess stock return 409; missing records return 404; oversized bodies return 413; unexpected failures return 500 without database details. All SQL values are bound parameters. Cross-origin browser writes are rejected, and frontend values are escaped before rendering.

Example creation in PowerShell:

```powershell
$product = @{sku='PMP-009';name='Hydraulic Pump';category='Mechanical';unit='pcs';quantity=10;min_stock=3;location='C-01'} | ConvertTo-Json
Invoke-RestMethod http://localhost:3000/api/products -Method Post -ContentType application/json -Body $product
Invoke-RestMethod http://localhost:3000/api/health
```

## Tests and build

```powershell
npm test
npm run check
npm run build
npm run healthcheck
```

`npm test` uses only Node's built-in test runner, temporary OS directories, ephemeral HTTP ports and seeding disabled. Tests ignore `DATABASE_PATH`, never start `src/server.js`, close the database/server and remove test data. Coverage includes CRUD, opening history, search/filtering, minimum threshold, in/out, atomic rejection, competing out requests, quantity bounds, invalid input/JSON, duplicate SKU, missing routes, cross-origin rejection, persistence and health success/failure.

`build` syntax-checks code and packages runtime sources/assets into `dist/`; no compiler is necessary. Docker builds separately from source. `healthcheck` requires a running server and exits nonzero on failure.

## Ubuntu 22.04 VPS / IDCloudHost

Use the VPS IP initially. No domain, GitHub connection or HTTPS is needed for local execution. Provision an Ubuntu 22.04 server, install Git, Node.js 22, and Docker Engine with the **Compose v2 plugin** using [Node's downloads](https://nodejs.org/en/download) (select version 22) and [Docker's Ubuntu installation guide](https://docs.docker.com/engine/install/ubuntu/). Install Jenkins and its supported Java runtime using the [Jenkins Linux guide](https://www.jenkins.io/doc/book/installing/linux/). Install `python3 make g++` if npm needs to compile SQLite. Check prerequisites:

```bash
node --version
npm --version
git --version
docker version
docker compose version
```

Copy the project or clone your repository, then:

```bash
npm ci
npm test
npm run build
docker compose -p jack-fruit-devops up -d --build --wait --wait-timeout 90
docker compose -p jack-fruit-devops ps
docker compose -p jack-fruit-devops exec -T app node scripts/healthcheck.js
```

Multi-stage Docker builds compile native dependencies in the builder and run as the unprivileged `node` user in a slim runtime. The database directory is owned by that user. Named volumes initialize that ownership automatically; if you substitute a bind mount, give its directory UID/GID 1000 ownership.

The host port defaults to loopback because this app intentionally has **no authentication**. For a remote demo, keep it private and open an SSH tunnel from your Windows computer:

```powershell
ssh -L 3000:127.0.0.1:3000 YOUR_USER@YOUR_VPS_IP
```

Then visit [http://localhost:3000](http://localhost:3000). For a deliberately public, temporary demonstration, set `BIND_ADDRESS=0.0.0.0` in the VPS `.env` and recreate the container; anyone who can reach it can modify inventory. Restrict access using IDCloudHost network firewall rules. Docker-published ports can bypass UFW rules; do not rely on UFW alone. A tunnel is sufficient without a domain or HTTPS.

For a direct Node deployment instead of Docker:

```bash
mkdir -p "$HOME/jack-fruit-data"
HOST=127.0.0.1 PORT=3000 NODE_ENV=production DATABASE_PATH="$HOME/jack-fruit-data/inventory.sqlite" npm start
```

Use a systemd service with a dedicated service account and absolute `WorkingDirectory`, `ExecStart` and database path for a persistent direct Node service. Docker's restart policy handles persistence of the container process in the demonstrated path.

### Preserve data and back up

Normal updates use `docker compose ... up -d`; never use `down -v`, `docker volume rm` or volume pruning on the production volume. The pipeline does not run any of these commands. Container replacement retains the same named volume. A second stack with this volume would share production data: use one deployment and use separate volume names for any staging environment.

Use SQLite's online backup API rather than copying a live WAL database file. On the VPS, from the project checkout:

```bash
docker compose -p jack-fruit-devops exec -T app node --input-type=module -e 'import Database from "better-sqlite3"; const db=new Database(process.env.DATABASE_PATH); await db.backup("/app/data/backup.sqlite"); db.close();'
mkdir -p backups
docker compose -p jack-fruit-devops cp app:/app/data/backup.sqlite ./backups/inventory.sqlite
```

Move backups off the VPS. To restore, stop the app, keep a copy of the current volume, replace the database from a verified backup and remove stale WAL/SHM sidecars **only while stopped**. Preserve ownership before restarting. Reverting an image does not roll back the database. This first version creates tables idempotently and does not include destructive migrations.

## GitHub and Jenkins overview

1. Create a GitHub repository. Run `git init`, `git add .`, `git commit -m "Initial inventory application"`, add your repository as `origin`, and push `main`. Keep `.env`, data, dependencies and build output untracked. No credentials are supplied in this project.
2. Install Jenkins on the Ubuntu VPS with a supported Java runtime. Install Pipeline and Git plugins, and GitHub Branch Source for a **Multibranch Pipeline**. Configure repository URL and a Jenkins-managed GitHub credential if private. Set script path to `Jenkinsfile`. Use branch discovery that builds `main`; never enable untrusted pull requests on a privileged deployment agent.
3. Ensure the selected Linux agent has Node.js **22**, npm, Git, Docker CLI and Compose v2. For a multi-agent Jenkins installation, replace `agent any` with the label of the intended Ubuntu deployment agent. The Jenkins user needs local Unix socket access to Docker, e.g. add it to the Docker group and restart its agent/service. Docker-group access is effectively root access, so limit who may edit the pipeline/repository. **Do not expose Docker on a TCP port**, set `DOCKER_HOST=tcp://...`, or chmod the socket to world-writable.
4. Initially leave `DEPLOY_ENABLED=false`. Run the pipeline and verify Checkout → Install → Test → Build. `npm ci` installs locked versions; `npm test` failures stop later stages. Build validates sources, archives `dist/`, and produces `jack-fruit-devops:build-BUILD_NUMBER`.
5. Enable `DEPLOY_ENABLED` for the intended deployment job, set `DEPLOY_BRANCH=main`, and rerun. `BRANCH_NAME` is supplied by Multibranch Pipeline. A plain Pipeline job intentionally skips deployment until you adapt its branch check. Parameters `APP_PORT` and `BIND_ADDRESS` are passed as environment values rather than interpolated shell commands. Defaults keep the host port on loopback.
6. Deploy uses a fixed Compose project and stable named volume, waits for container health, then runs a separate Post-Deploy Health Check in the running container. No SSH credentials are required when Jenkins and Docker run on the same VPS. Jobs on another host need an explicitly configured deployment mechanism; this file does not invent one.
7. Trigger manually for the demo; optionally configure a GitHub webhook to an accessible Jenkins endpoint with your own webhook secret. A webhook is not required. Set branch protections for reviewed changes before privileged deployment.

Failures before Deploy prevent replacement of the running app. A failure during Deploy or the final health check marks the pipeline failed but **does not automatically restore the previous container**. Keep the previous successful image tag, inspect `docker compose logs --tail=100 app`, then roll back deliberately:

```bash
APP_IMAGE=jack-fruit-devops:build-PREVIOUS_NUMBER docker compose -p jack-fruit-devops up -d --no-build --wait
```

Use a real existing previous build number. Run the health check again. Jenkins pipeline timeout is 20 minutes; concurrent builds of this job are disabled. Use one deployment job per volume. Image retention and offsite backups are operator responsibilities.

## CI/CD demonstration procedure

1. On localhost, add a product with opening quantity 10 and minimum 5. Receive 3 units; issue 9. Show the balance 4 and the low-stock alert. Try issuing 5; show the rejection and unchanged balance/history.
2. Edit its minimum, search its SKU, filter its category and inspect its transaction history. Open Smart Health Monitor and the raw health endpoint.
3. Run `npm test` and `npm run build` locally. Commit/push a small visible UI text change, then run Jenkins.
4. In a temporary branch, deliberately break a test, push and build it. Show the Test stage failing and Build/Deploy being skipped. Restore the test afterward. Do not change real production data to simulate failure.
5. On `main`, enable deployment. Show image build, healthy container and post-deploy probe. Use the SSH tunnel to show the updated UI and version.
6. Add a recognizable product, run another deployment or restart the container, and show it still exists. This demonstrates persistence. To demonstrate a version change, change `package.json` version, run `npm install --package-lock-only`, commit both files, and update the version assertion in the health test.

## Project layout

`src/` contains database, app factory and server lifecycle. `public/` contains browser assets. `test/` contains isolated HTTP integration tests. `scripts/` contains packaging and health commands. `Dockerfile`, `docker-compose.yml` and `Jenkinsfile` define deployment. See `docs/software-engineering/10-implementation.md` for implementation verification notes and `outputs/VERIFICATION.md` for checks actually run in this workspace.
