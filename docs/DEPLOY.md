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

4. Create the backend settings. Copy `appsettings.Example.json` to
   `appsettings.Development.json` and fill in the values. For the Compose database
   the connection string is:

   ```
   server=localhost;port=3306;database=portfolio_dev;user=portfolio;password=portfolio
   ```

   `appsettings.Development.json` is ignored by git and must never be committed.

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

## Windows: updating production

Production runs the `v2` branch. `start-portfolio.ps1` starts every part of the stack;
`docs/RESTART.md` describes what it does and how to restart pieces by hand.

1. Stop the running backend and frontend windows (close them or press Ctrl+C in each).

2. Back up the database before any release that includes a migration.

   ```
   mysqldump -u root -p portfolio > C:\backups\portfolio-YYYY-MM-DD.sql
   ```

3. Pull the release.

   ```
   cd C:\Users\seank\Documents\code\Software_Engineering_Capstone
   git fetch origin
   git checkout v2
   git pull --ff-only
   ```

   If git refuses because an untracked `portfolio-page\.env.production` would be
   overwritten, delete the local file first. The committed one is correct for production.

4. Apply migrations if the release includes any.

   ```
   cd portfolio-page-backend
   dotnet ef database update
   ```

5. Confirm `appsettings.Production.json` (or `appsettings.Development.json` while the
   environment is still Development, see Section 4 of the design document) contains
   every key present in `appsettings.Example.json`. New keys are listed in the phase
   notes for the release.

6. Start the stack.

   ```
   cd ..
   .\start-portfolio.ps1
   ```

7. Verify.

   ```
   .\scripts\smoke.ps1
   .\scripts\smoke.ps1 -Api https://sean-keane.com -Web https://sean-keane.com
   ```

8. Open `https://sean-keane.com` in a browser and check the certification carousel loads.

## Rollback

```
git checkout production_v1
```

Then repeat steps 6 and 7. `production_v1` is frozen at tag `v1-final` and ignores any
tables added by v2, so no database change is needed for a rollback unless a phase's
notes say otherwise.

## End-of-phase checklist

Copy into the phase notes and fill in.

- [ ] Mac: fresh clone runs following this document alone.
- [ ] Mac: `scripts/smoke.sh` passes.
- [ ] Windows: pull, build, restart following this document.
- [ ] Windows: `scripts\smoke.ps1` passes locally and against `https://sean-keane.com`.
- [ ] `appsettings.Example.json` lists every key used by the release.
- [ ] `.env.development` and `.env.production` unchanged, or the change is recorded.
- [ ] `docs/RESTART.md` still accurate.
