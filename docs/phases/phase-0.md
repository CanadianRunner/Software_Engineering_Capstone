# Phase 0: Foundations

Goal: a clean, reproducible starting point on both machines with zero visible change to the live site.

Branch: `v2-phase-0-foundations`, merged into `v2` by pull request when acceptance passes.

## Scope

- [x] Branching: tag `v1-final` at the current `production_v1`, create `v2` from it.
- [x] `.gitattributes` for line endings (`* text=auto`, `*.ps1 text eol=crlf`).
- [x] Remove dead code and dependencies: `src/services/firebase.js` and the `firebase` package, `gsap-trial`, the unused files in `src/assets` (each verified with a reference search before deletion), `Data.js`, the commented-out debugging code in `Home.js`.
- [x] Dependency audit with `npx depcheck`; remove what it confirms unused.
- [x] Remove `Microsoft.EntityFrameworkCore.SqlServer` from the backend; confirm `dotnet build` and `dotnet ef migrations list` still succeed.
- [x] Environment contract: `appsettings.Example.json` complete; `.env.development` and `.env.production` created (still `REACT_APP_` names until Phase 1).
- [x] Docker Compose for local MySQL with a `portfolio_dev` database (`portfolio-page-backend/dev/docker-compose.yml`).
- [x] `docs/DEPLOY.md` and `docs/RESTART.md` written (Restart Guide converted from the existing document and corrected).
- [x] `scripts/smoke.sh` (Mac) and `scripts/smoke.ps1` (Windows): hit `/api/Certifications` and the frontend root, check status codes and that the certification count is greater than zero.
- [x] Full stack runs locally on the Mac against the local database with seed data.

Out of scope: any UI change, any auth change, any schema change.

## Acceptance

- [x] `git diff v1-final v2 --stat` shows only deletions, config, docs, and scripts (plus one package version bump for the vulnerability findings and the screenshot files).
- [x] Full stack runs on the Mac from a fresh clone following `docs/DEPLOY.md` alone.
- [x] Mac build screenshots at 1440 match the v1 baseline. Windows deploy: deferred to launch (design document, 2026-09-14 decision).
- [x] `npm audit` and `dotnet list package --vulnerable` run; findings fixed or recorded.
- [x] Environment contract (design document Section 4) re-verified on the Mac; corrected for `appsettings.json`. Windows: at the Phase 1 rehearsal.

## Rollback

`git checkout production_v1`, rebuild, restart.

## Explore

Whether `serve` should be replaced by having the backend host the built frontend (one process instead of two). Record the trade-offs here; decide in Phase 7.

## Notes so far

- Phase branches are named `v2-phase-N-short-name` (hyphen, not slash). Git cannot hold a branch `v2` and a branch `v2/...` at the same time. The design document was updated to match before it was committed.
- The certificate images deleted from `portfolio-page/src/assets` were only referenced by the dead `Data.js`. The same images remain in the database (seeded blobs) and in `portfolio-page-backend/images/certifications/`, which is what the carousel and the seed actually use.
- `contact.scss` carried a full commented-out copy of an earlier Contact component. It was removed with the Home.js debug code.
- Bundle after dependency removal (CRA, gzip): main JS 133.73 kB, main CSS 9.99 kB. Baseline for Phase 1.
- The `appsettings.json` row of the Section 4 table was wrong: the file has always been gitignored and per-machine. The design document was corrected in this phase; there is no committed settings file.

## Results

### Mac walkthrough (fresh clone, 2026-09-14)

Cloned the phase branch into a scratch directory and followed `docs/DEPLOY.md`.

First attempt exposed three machine-level blockers, all since resolved: Docker Desktop was not installed (the `docker` command was a dangling link), the dev certificate could not be created from a non-interactive shell (fixed by `dotnet dev-certs https --clean` then `--trust` in a terminal), and a Homebrew MySQL service held port 3306 (stopped with `brew services stop mysql`). Second attempt:

| Step | Result |
|---|---|
| Clone, check out branch | ok |
| `dotnet dev-certs https --trust` | ok, trusted certificate present |
| Docker Compose up | ok, container healthy in under 30 s |
| Copy `appsettings.Example.json` to `appsettings.json` | ok |
| `dotnet build` | ok, 0 warnings |
| `dotnet ef database update` | ok, three migrations applied: InitialCreate, SecondMigration, UpdateCertificationSchema |
| Seed data | 11 rows in `Certifications` |
| `dotnet run`, `npm start` | both up within 5 s |
| `scripts/smoke.sh` | all four checks ok (API 200, count 11, frontend 200, app shell present) |
| `npm ci`, `npm run build` | ok. main JS 133.52 kB, main CSS 9.99 kB after gzip. |
| `npm test` | ok, 3 suites, 4 tests |

### Screenshot comparison at 1440

`screenshots/phase-0-v1-baseline-1440.png` (built from tag `v1-final`) and `screenshots/phase-0-v2-1440.png` (this branch), both full-page captures of the production build served on port 3000 against the local backend. Same page height (5431 px). A pixel comparison finds differences only in two regions: the bouncing chevrons under the splash (x 679 to 760) and the desk video beside the About card (x 763 to 1419), both animated. Every other row is identical.

### Package bump

`dotnet list package --vulnerable` reported two High transitive advisories. Fixed in this phase by raising the EF Core packages from 8.0.8 to 8.0.31 and `MySql.EntityFrameworkCore` from 8.0.5 to 8.0.28. Build clean, migrations list unchanged, audit now reports no vulnerable packages.

`npm run build` and `npm test` also passed on the working checkout after every removal commit.

### Audits

`dotnet list package --vulnerable --include-transitive`: before the bump, `Microsoft.Extensions.Caching.Memory` 8.0.0 (GHSA-qj66-m88j-hmgj) and `System.Text.Json` 8.0.4 (GHSA-8g4q-xg66-9fp4), both High. After the bump: none.

`npm audit`: 68 findings (3 critical, 35 high, 15 moderate, 15 low). All but one are transitive dependencies of `react-scripts`, which is unmaintained and is removed in Phase 1; that removal is the fix. The one other direct finding is `react-router-dom`, fixable by a patch bump in Phase 1.

### Explore: backend serving the built frontend

Not decided; for Phase 7. Trade-offs noted now:

- One process instead of two: the backend would serve `build/` as static files with a fallback to `index.html`. One window on Windows, one thing to restart, one port for Nginx to proxy, and the same-origin API base needs no explanation.
- Against: the frontend could no longer be redeployed without restarting the API; static file serving and caching headers become the backend's job; the Vite dev server still runs separately on the Mac, so the two machines would differ more, not less.
- Middle option: keep `serve` but have `start-portfolio.ps1` manage it as a background job. Cheapest change, no architecture shift.

### Deviations from the design document

- Branch naming uses a hyphen (Section 9 and 10 updated).
- `appsettings.json` is per-machine and gitignored, not committed (Section 4 updated).
- Windows deploy deferred to a single launch; Phases 1 and 2 add a Windows rehearsal instead (Sections 1, 4, 9, 10 and the decision log updated).
- Package version bump included in Phase 0 rather than Phase 1, at the owner's request, to clear the audit.
