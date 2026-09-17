# Phase 1: Vite migration

Goal: replace Create React App with Vite while keeping the folder structure and the production serving command unchanged.

Branch: `v2-phase-1-vite`, merged into `v2` by pull request when acceptance passes.

Out of scope: styling, MUI removal, responsiveness, auth. No target framework change on the backend without approval.

## Acceptance

- [ ] `npm run build` produces `build/`; `npx serve -s build -l 3000` serves the site; screenshots at 1440 match the Phase 0 baseline.
- [ ] `npm run test` and `npm run lint` pass.
- [ ] Bundle size recorded in the phase notes (baseline for Phase 6).
- [ ] Windows rehearsal passes (separate clone, ports 5002 and 3001, database `portfolio_v2`; smoke script green). Windows deploy: deferred to launch.
- [ ] `npm audit` and `dotnet list package --vulnerable` run; findings fixed or recorded.
- [ ] Environment contract (design document Section 4) re-verified on the Mac; `.env.*` files renamed to `VITE_` keys.

Rollback: revert the merge on `v2`; production_v1 unaffected.

## Packages

Each package is one session. Done-checks are run before the handoff is written.

### 1.1 Visual diff script

Goal: a repeatable comparison against the stored 1440 baseline so every later package can prove the page is unchanged.
Files: `scripts/visual-diff.mjs`, `scripts/README` note in `docs/DEPLOY.md` if needed, `docs/phases/screenshots/`.
Work: capture a full-page screenshot of `http://localhost:3000` at 1440 wide using the installed Chrome (puppeteer-core and pixelmatch as dev dependencies, subject to the dependency rule), compare to `docs/phases/screenshots/phase-0-v2-1440.png`, write a diff image and print the differing pixel count and bounding boxes. Accept an ignore list for the two animated regions (chevrons, desk video).
Done-check: run against the current CRA build served on 3000; reports zero differing pixels outside the ignored regions.

### 1.2 Vite scaffold alongside CRA

Goal: Vite builds the existing source without removing CRA yet.
Files: `portfolio-page/index.html` (moved from `public/`), `src/main.jsx` (from `src/index.js`), `vite.config.js`, `package.json` (add `vite`, `@vitejs/plugin-react`; add `dev`, `build`, `preview` scripts), `.env.development`, `.env.production` (`REACT_APP_BACKEND_CALL` becomes `VITE_API_BASE`).
Work: `build.outDir = 'build'`, dev server on port 3000, `@` alias for `src/`. Rename components containing JSX from `.js` to `.jsx`, same folders and names.
Done-check: `npm run build` produces `build/`; `npx serve -s build -l 3000` serves the site; smoke script green.

### 1.3 API base and service module

Goal: no component builds a URL itself.
Files: `src/services/api.js` (new), `Home.jsx`, `Developer.jsx`, `LoginModal.jsx`, `Contact.jsx` if it calls the API.
Work: `api.js` reads `import.meta.env.VITE_API_BASE` and exposes the request helpers the components need; components import from it.
Done-check: `grep -r "REACT_APP\|process.env" src` returns nothing; carousel and developer page work against the local backend; smoke script green.

### 1.4 Sass modules

Goal: no Sass deprecation warnings in the Vite build.
Files: `src/scss/*.scss`.
Work: migrate `@import` to `@use`/`@forward` where the warnings appear; nothing else in the stylesheets changes.
Done-check: `npm run build` prints no Sass deprecation warnings; visual diff (1.1) clean.

### 1.5 Vitest and ESLint

Goal: tests and lint run without react-scripts.
Files: `vite.config.js` (test block), `src/setupTests.js`, the three existing test files, `eslint.config.js` (new), `package.json` (`test`, `lint` scripts; add `vitest`, `jsdom`, `eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`; remove the `eslintConfig` block).
Work: existing tests pass unchanged apart from imports; lint config carries the same rules CRA applied.
Done-check: `npm run test` passes 4 of 4; `npm run lint` passes (the two warnings recorded in Phase 0 are fixed or explicitly allowed).

### 1.6 Remove CRA

Goal: react-scripts and its leftovers are gone.
Files: `package.json`, `package-lock.json`, `public/index.html` (deleted), `browserslist` block, `.dockerignore`/`Dockerfile` if they reference CRA scripts.
Work: remove `react-scripts`, `css-loader`, `@babel/plugin-proposal-private-property-in-object`, the `start` and `eject` scripts; `npm ci` from a clean tree.
Done-check: `npm ci && npm run build && npm run test && npm run lint` all pass; `npm audit` count recorded, expected to drop sharply.

### 1.7 .NET 10 provider check (report only)

Goal: know whether the backend can move to .NET 10 later.
Files: none changed in the repository.
Work: check NuGet for a stable `MySql.EntityFrameworkCore` release targeting .NET 10 and EF Core 10, and for the matching `Microsoft.EntityFrameworkCore` 10.x and `Serilog.AspNetCore`, `Swashbuckle.AspNetCore` compatibility; note the .NET 10 SDK version installed on the Mac.
Done-check: findings written to the phase notes and to the outbox handoff with a recommendation. No target framework change in this phase without approval.

### 1.8 Acceptance and phase notes

Goal: close the phase.
Files: `docs/phases/phase-1.md`, `docs/DEPLOY.md` (Mac steps now say `npm run dev`; rehearsal env var name updated), `docs/RESTART.md` if the frontend commands changed.
Work: visual diff at 1440 against the Phase 0 baseline; bundle size recorded (Phase 0 CRA baseline: main JS 133.52 kB, main CSS 9.99 kB gzipped); `npm audit` and `dotnet list package --vulnerable`; Section 4 re-verified; Windows rehearsal instructions ready for the owner.
Done-check: every acceptance box above ticked or marked deferred with a reason; merge summary written to the outbox.

## Notes

To be filled in as packages complete.
