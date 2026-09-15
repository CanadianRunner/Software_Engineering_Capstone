# Deploy checklist

How to bring the site up from a fresh clone on the Mac (development) and how to
update the Windows machine (production). The environment contract this follows is
Section 4 of `DESIGN.md`. Run the relevant checklist at the end of every phase and
record the result in `docs/phases/phase-N.md`.

## Prerequisites

| | Mac (development) | Windows (production) |
|---|---|---|
| .NET SDK | 8.0 | 8.0 |
| Node | 18 or later, with npm | 18 or later, with npm |
| MySQL | Docker Desktop (or another Docker engine) for the Compose file | MySQL 8 Windows service on port 3306 |
| Other | `dotnet-ef` tool (`dotnet tool install --global dotnet-ef`) | Docker Desktop for Nginx Proxy Manager and the DDNS updater |

## Mac: first run from a fresh clone

1. Clone and check out the working branch.

   ```
   git clone https://github.com/CanadianRunner/Software_Engineering_Capstone.git
   cd Software_Engineering_Capstone
   git checkout v2
   ```

2. Trust the local HTTPS development certificate once.

   ```
   dotnet dev-certs https --trust
   ```

3. Start the local database.

   ```
   cd portfolio-page-backend
   docker compose -f dev/docker-compose.yml up -d
   ```

   Wait until `docker compose -f dev/docker-compose.yml ps` shows the container healthy.

4. Create the backend settings. Copy `appsettings.Example.json` to `appsettings.json`
   and fill in the values. For the Compose database the connection string is:

   ```
   server=localhost;port=3306;database=portfolio_dev;user=portfolio;password=portfolio
   ```

   `appsettings.json` is ignored by git and must never be committed. The
   `Authentication` username and password are the developer page login until Phase 2
   replaces them; choose anything for local use.

5. Apply migrations and seed data, then start the backend.

   ```
   dotnet ef database update
   dotnet run
   ```

   The API listens on `https://localhost:5001`. Swagger is at `/swagger` in Development.

6. Start the frontend in a second terminal.

   ```
   cd portfolio-page
   npm ci
   npm start
   ```

   `.env.development` points the app at `https://localhost:5001`. Open `http://localhost:3000`.

7. Verify.

   ```
   scripts/smoke.sh
   ```

   All four checks print `ok`.

## Windows rehearsal (end of Phases 1 and 2)

Exercises the v2 stack on the Windows machine without touching the live site. Everything
lives in a separate folder, on separate ports, against a separate database. The live
`production_v1` checkout, its ports (5001 and 3000), and its database are not used.

One-time setup:

1. Create the rehearsal database and a user for it in the MySQL service.

   ```
   mysql -u root -p -e "CREATE DATABASE portfolio_v2; CREATE USER 'portfolio_v2'@'localhost' IDENTIFIED BY '<choose>'; GRANT ALL ON portfolio_v2.* TO 'portfolio_v2'@'localhost';"
   ```

2. Clone `v2` into its own folder.

   ```
   cd C:\Users\seank\Documents\code
   git clone https://github.com/CanadianRunner/Software_Engineering_Capstone.git portfolio-v2
   cd portfolio-v2
   git checkout v2
   ```

3. Copy `portfolio-page-backend\appsettings.Example.json` to `appsettings.json` in the
   same folder and point the connection string at `portfolio_v2` with the user above.

Each rehearsal:

1. `git pull --ff-only` in `portfolio-v2`.
2. Backend, in its own PowerShell window:

   ```
   cd portfolio-page-backend
   dotnet ef database update
   dotnet run --urls https://localhost:5002
   ```

   From Phase 2 on, add `--environment Production` to exercise the production error
   handling and headers.

3. Frontend, in a second window. The rehearsal build points at the rehearsal backend
   directly instead of going through Nginx:

   ```
   cd portfolio-page
   npm ci
   $env:REACT_APP_BACKEND_CALL = "https://localhost:5002"    # VITE_API_BASE from Phase 1
   npm run build
   npx serve -s build -l 3001
   ```

4. Verify and record the result in the phase notes.

   ```
   .\scripts\smoke.ps1 -Api https://localhost:5002 -Web http://localhost:3001
   ```

5. Close both windows when done. Nothing from the rehearsal is left running.

## Windows: launch (production cutover)

Deferred until v2 is complete and accepted on the Mac. Production runs the `v2` branch
after launch. `start-portfolio.ps1` starts every part of the stack; `docs/RESTART.md`
describes what it does and how to restart pieces by hand.

1. Stop the running backend and frontend windows (close them or press Ctrl+C in each).

2. Back up the database before any release that includes a migration.

   ```
   mysqldump -u root -p portfolio > C:\backups\portfolio-YYYY-MM-DD.sql
   ```

3. First v2 deploy only: remove the old untracked frontend environment file. v2 commits
   `portfolio-page\.env.production` with an empty API base, and git refuses to check out
   a tracked file over an untracked one with the same name.

   ```
   cd C:\Users\seank\Documents\code\Software_Engineering_Capstone
   del portfolio-page\.env.production
   ```

4. Pull the release.

   ```
   git fetch origin
   git checkout v2
   git pull --ff-only
   ```

5. Apply migrations if the release includes any.

   ```
   cd portfolio-page-backend
   dotnet ef database update
   ```

6. Confirm the existing `appsettings.json` in `portfolio-page-backend` contains every
   key present in `appsettings.Example.json`. New keys are listed in the phase notes
   for the release.

7. Start the stack.

   ```
   cd ..
   .\start-portfolio.ps1
   ```

8. Verify.

   ```
   .\scripts\smoke.ps1
   .\scripts\smoke.ps1 -Api https://sean-keane.com -Web https://sean-keane.com
   ```

9. Open `https://sean-keane.com` in a browser and check the certification carousel loads.
   Do not judge the frontend from `http://localhost:3000` on the Windows box; see the
   note in `RESTART.md` about the empty API base.

## Launch checklist

One-time steps the real cutover needs, collected as phases complete. Each phase that
adds a step edits this list in the same pull request. Not to be run before launch.

- [ ] Phase 0: back up the production database (`mysqldump`) before anything else.
- [ ] Phase 0: delete the untracked `portfolio-page\.env.production` before checking out `v2` (step 3 above).
- [ ] Phase 0: confirm the production `appsettings.json` has every key in `appsettings.Example.json`.
- [ ] Phase 2: set `ASPNETCORE_ENVIRONMENT=Production` in `start-portfolio.ps1`.
- [ ] Phase 2: create the admin account through the one-time setup endpoint using the setup token, then remove the token from `appsettings.json`.
- [ ] Phase 2: remove the interim Cloudflare rule that blocks non-GET requests to `/api/*`; the application's authentication replaces it.
- [ ] After launch: run `scripts\smoke.ps1` against `https://sean-keane.com` and check the developer page login end to end.

## Rollback

```
git checkout production_v1
```

Then repeat steps 7 and 8. `production_v1` is frozen at tag `v1-final` and ignores any
tables added by v2, so no database change is needed for a rollback unless a phase's
notes say otherwise.

## End-of-phase checklist

Copy into the phase notes and fill in.

- [ ] Mac: fresh clone runs following this document alone.
- [ ] Mac: `scripts/smoke.sh` passes.
- [ ] Windows rehearsal (Phases 1 and 2 only): `scripts\smoke.ps1` passes against ports 5002 and 3001.
- [ ] Launch checklist above updated with any new one-time step.
- [ ] `appsettings.Example.json` lists every key used by the release.
- [ ] `.env.development` and `.env.production` unchanged, or the change is recorded.
- [ ] `docs/RESTART.md` still accurate.
