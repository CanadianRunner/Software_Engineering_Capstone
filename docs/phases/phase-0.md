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
- [ ] Full stack runs locally on the Mac against the local database with seed data.

Out of scope: any UI change, any auth change, any schema change.

## Acceptance

- [ ] `git diff v1-final v2 --stat` shows only deletions, config, docs, and scripts.
- [ ] Full stack runs on the Mac from a fresh clone following `docs/DEPLOY.md` alone.
- [ ] Windows: pull `v2`, build, restart; smoke script passes; site visually identical (screenshots compared at 1440 width).
- [x] `npm audit` and `dotnet list package --vulnerable` run; findings fixed or recorded.
- [ ] Environment contract (design document Section 4) re-verified on both machines.

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

| Step | Result |
|---|---|
| Clone, check out branch | ok |
| `dotnet dev-certs https --trust` | failed: the keychain refused the new certificate from the non-interactive shell (`AppleCommonCryptoCryptographicException`). Needs a terminal where the keychain prompt can be answered. |
| Docker Compose up | not run: no Docker engine on this Mac (the `docker` command is a dangling link to a removed Docker.app). |
| Copy `appsettings.Example.json` to `appsettings.json` | ok |
| `dotnet build` | ok, 0 warnings |
| `dotnet ef migrations list --no-connect` | ok: InitialCreate, SecondMigration, UpdateCertificationSchema. The SqlServer removal did not affect the migrations. |
| `dotnet ef database update`, `dotnet run`, seed check | blocked on the two items above. A Homebrew MySQL is already listening on 3306 (launchd service) with a root password that is not on hand; it will also collide with the Compose port mapping until it is stopped. |
| `npm ci`, `npm run build` | ok. main JS 133.52 kB, main CSS 9.99 kB after gzip. |
| `npm test` | ok, 3 suites, 4 tests |
| `scripts/smoke.sh` | not run: needs the backend. |

`npm run build` and `npm test` also passed on the working checkout after every removal commit.

### Audits

`dotnet list package --vulnerable --include-transitive`: two transitive findings, both High, both pulled in by the .NET 8.0.8 package set: `Microsoft.Extensions.Caching.Memory` 8.0.0 (GHSA-qj66-m88j-hmgj) and `System.Text.Json` 8.0.4 (GHSA-8g4q-xg66-9fp4). Fix is to raise the EF Core and MySQL provider references to a newer 8.0.x patch; recorded here and proposed for Phase 1 alongside the frontend dependency work, since it changes package versions.

`npm audit`: 68 findings (3 critical, 35 high, 15 moderate, 15 low). All but one are transitive dependencies of `react-scripts`, which is unmaintained and is removed in Phase 1; that removal is the fix. The one other direct finding is `react-router-dom`, fixable by a patch bump in Phase 1.

### Not yet done

- Mac: database, backend run, seed check, and smoke script, blocked as above.
- Windows: pull, build, restart, smoke, and the 1440 screenshot comparison. Done by the owner from `docs/DEPLOY.md`.
- Explore note on the backend serving the built frontend: not written yet.
