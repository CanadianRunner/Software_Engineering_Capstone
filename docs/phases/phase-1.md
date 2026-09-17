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

### 1.9 Pin the Node version (runs before 1.8)

Goal: both machines build with the same Node line, and Vite can move to its current major.
Files: `portfolio-page/.nvmrc` (new), `portfolio-page/package.json` (`engines` field, Vite 7 and matching React plugin), `docs/DESIGN.md` Section 4 runtime table, `docs/DEPLOY.md` prerequisites and launch checklist.
Work: the owner installs the current Node LTS on the Mac first. Then pin it in `.nvmrc` and `engines`, bump Vite to 7, rebuild, re-run the visual diff, record the Node version in Section 4, and add "install the pinned Node version" to the launch checklist.
Done-check: `node --version` matches `.nvmrc`; `npm run build` on Vite 7 passes; visual diff at 1440 clean; docs updated.

### 1.8 Acceptance and phase notes

Goal: close the phase.
Files: `docs/phases/phase-1.md`, `docs/DEPLOY.md` (Mac steps now say `npm run dev`; rehearsal env var name updated), `docs/RESTART.md` if the frontend commands changed.
Work: visual diff at 1440 against the Phase 0 baseline; bundle size recorded (Phase 0 CRA baseline: main JS 133.52 kB, main CSS 9.99 kB gzipped); `npm audit` and `dotnet list package --vulnerable`; Section 4 re-verified; Windows rehearsal instructions ready for the owner.
Done-check: every acceptance box above ticked or marked deferred with a reason; merge summary written to the outbox.

## Notes

### 1.1 Visual diff script (done 2026-09-16)

`node scripts/visual-diff.mjs` captures `http://localhost:3000` at 1440 wide with the installed Chrome, compares against `docs/phases/screenshots/phase-0-v2-1440.png` with pixelmatch, writes capture and diff images to a temp folder, and exits non-zero if any pixel differs outside the ignored boxes. `--update` rewrites the baseline; `--url`, `--width`, `--baseline`, `--ignore x,y,w,h`, `--wait`, `--threshold`, `--out` override the defaults. Dependencies (puppeteer-core, pixelmatch, pngjs) are dev dependencies of `portfolio-page`; the script resolves them from there.

Three regions are ignored by default at 1440 because they differ between captures of the same build: the chevrons under the splash, the desk video, and the resize grip of the contact textarea (anti-aliasing varies by a few pixels). Done-check on the Phase 0 CRA build: two consecutive runs, 0 differing pixels outside the ignored boxes.

### 1.2 Vite scaffold alongside CRA (done 2026-09-16)

Vite 6 and the React plugin added as dev dependencies (Vite 7 needs Node 20.19; this Mac has 20.18). `index.html` now sits at the frontend root with the module script; `public/index.html` stays for CRA until 1.6. `src/main.jsx` is the entry; `src/index.js` only imports it so CRA still boots. Fourteen components renamed to `.jsx`, same folders and names. `vite.config.js` sets the `build` output folder, port 3000 with `strictPort`, and the `@` alias, plus a temporary `define` that maps the CRA variable name to `VITE_API_BASE` until 1.3 removes it. Both env files carry both keys for now.

Scripts: `dev`, `build`, `preview` are Vite; `start`, `build:cra`, `test` remain CRA until 1.6.

Checks: Vite build 129.53 kB JS and 10.32 kB CSS gzipped (CRA: 133.55 kB and 9.99 kB). Smoke green on the Vite build served with `npx serve -s build -l 3000`. Visual diff at 1440: 0 differing pixels outside the ignored boxes. CRA build and the 4 tests still pass.

Learned: the production build has an empty API base by design, so a local visual diff needs `VITE_API_BASE=https://localhost:5001 npm run build` (the Phase 0 baseline was built the same way with the CRA variable). Vite prints a CJS deprecation notice because `package.json` has no `"type": "module"`; that changes in 1.6 when react-scripts is gone.

### 1.3 API base and service module (done 2026-09-16)

`src/services/api.js` reads `VITE_API_BASE` once and exposes `apiUrl` plus the five requests the app makes (list, create, update, delete certifications; login). Home, Carousel, Developer, and LoginModal import from it; no component builds a URL. The temporary `define` bridge left `vite.config.js`, and the `REACT_APP_BACKEND_CALL` lines left both env files. Carousel had a fourth fetch that the Phase 0 inventory missed.

Checks: Vite build, smoke, and visual diff clean. The CRA build still compiles. The three Jest suites now fail with "Cannot use 'import.meta' outside a module" because Jest under react-scripts parses modules as CommonJS; every suite reaches `api.js` through LoginModal. This is the gap 1.5 (Vitest) closes; nothing is patched in the CRA test setup.

### 1.4 Sass modules (done 2026-09-16)

`@import 'master-styles.scss'` became `@use 'master-styles' as *` in the eight section stylesheets. `master-styles.scss` holds only variables, so `as *` keeps every `$name` reference unchanged. The Google Fonts `@import url(...)` lines are plain CSS and stay. Sass 1.78 emits no deprecation warnings either way; the migration is done ahead of Sass 1.80, where `@import` starts warning. Visual diff clean, CRA build still compiles.
