# Phase 0: Foundations

Goal: a clean, reproducible starting point on both machines with zero visible change to the live site.

Branch: `v2-phase-0-foundations`, merged into `v2` by pull request when acceptance passes.

## Scope

- [ ] Branching: tag `v1-final` at the current `production_v1`, create `v2` from it.
- [ ] `.gitattributes` for line endings (`* text=auto`, `*.ps1 text eol=crlf`).
- [ ] Remove dead code and dependencies: `src/services/firebase.js` and the `firebase` package, `gsap-trial`, the unused files in `src/assets` (each verified with a reference search before deletion), `Data.js`, the commented-out debugging code in `Home.js`.
- [ ] Dependency audit with `npx depcheck`; remove what it confirms unused.
- [ ] Remove `Microsoft.EntityFrameworkCore.SqlServer` from the backend; confirm `dotnet build` and `dotnet ef migrations list` still succeed.
- [ ] Environment contract: `appsettings.Example.json` complete; `.env.development` and `.env.production` created (still `REACT_APP_` names until Phase 1).
- [ ] Docker Compose for local MySQL with a `portfolio_dev` database (`portfolio-page-backend/dev/docker-compose.yml`).
- [ ] `docs/DEPLOY.md` and `docs/RESTART.md` written (Restart Guide converted from the existing document and corrected).
- [ ] `scripts/smoke.sh` (Mac) and `scripts/smoke.ps1` (Windows): hit `/api/Certifications` and the frontend root, check status codes and that the certification count is greater than zero.
- [ ] Full stack runs locally on the Mac against the local database with seed data.

Out of scope: any UI change, any auth change, any schema change.

## Acceptance

- [ ] `git diff v1-final v2 --stat` shows only deletions, config, docs, and scripts.
- [ ] Full stack runs on the Mac from a fresh clone following `docs/DEPLOY.md` alone.
- [ ] Windows: pull `v2`, build, restart; smoke script passes; site visually identical (screenshots compared at 1440 width).
- [ ] `npm audit` and `dotnet list package --vulnerable` run; findings fixed or recorded.
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
- Docker is not installed on the Mac at the time of writing, so the Compose file is written but not yet exercised locally. Recorded as an open item for the Mac acceptance run.

## Results

To be filled in when the phase completes: checklist outcomes, screenshots under `docs/phases/screenshots/`, deviations from the design document and why, anything learned.
