# sean-keane.com v2: Design and Build Plan

This document is the source of truth for the v2 rebuild of sean-keane.com. Read it fully before touching code. It describes what the site is for, what v1 got right and where it fell short, the target architecture, the design direction, the security design, and a phased plan where every phase ships to production on its own and can be rolled back.

The plan builds on the existing codebase. It is not a rewrite. Structure, folder layout, visual identity, and the ideas that made v1 distinctive are preserved and improved. Where something is replaced, the reason is written down.

---

## 1. Purpose and principles

### What the site is

A personal portfolio for Sean Keane: Security Operations Engineer at Microsoft, based in Portland, Oregon, dual Irish and Canadian citizen, former Team Canada 800m runner, software developer by training. The site should read as a capable professional with a life, open to interesting conversations, not as a job seeker. Two audiences share it: colleagues and managers who might stumble across it, and recruiters or companies who might reach out. It has to work for both without hedging.

The site is also itself a demonstration. A security engineer's portfolio should be visibly well built: locked down, fast, accessible, and maintained. The developer page (a private admin area for updating content without redeploying) is a feature of the site, not a chore.

### Principles

1. Build on what exists. Keep the folder structure, the section order, the palette family, the fixed icon navbar, the splash and desk videos, the leveling-up moment on contact, and the developer page. Improve them; do not replace them for novelty.
2. Security is a feature. Every phase leaves the site at least as secure as before. Phase 2 is dedicated to it.
3. Ship in phases. Each phase has a goal, an explicit scope, acceptance tests, and a rollback. A phase is done when its acceptance tests pass in production, not when the code compiles.
4. Two machines, one contract. Development happens on a Mac; production runs on a Windows 11 PC at home. The configuration contract (Section 4) is settled in Phase 0 and re-verified at the end of every phase, because deployment configuration has been the source of most past pain.
5. Nothing generic. The site should look like one person's work. Section 5 lists the visual patterns to avoid and the ones to keep.
6. The repository is public and is part of the portfolio. Commit messages, comments, the README, and PR descriptions describe the work itself. No tooling attribution, trailers, or footers of any kind.

---

## 2. Current state (v1)

### Stack

- Frontend: React 18 single-page app created with Create React App (`react-scripts` 5), React Router 6, Sass, MUI (Card and carousel only), FontAwesome icons, animate.css, react-toastify. Built with `npm run build`, served in production by `npx serve -s build -l 3000`.
- Backend: ASP.NET Core on .NET 8 using the classic `Program.cs` + `Startup.cs` layout, Entity Framework Core with MySQL, Serilog to console and rolling files, Swagger in Development only. Listens on `https://localhost:5001`.
- Data: MySQL 8 on the Windows host, one table (`Certifications`) with certificate images stored as binary blobs.
- Edge: Cloudflare DNS with a Docker DDNS updater; Nginx Proxy Manager in Docker terminating TLS for `sean-keane.com`, proxying `/api` to the backend and everything else to the frontend on port 3000.
- Repo: `github.com/CanadianRunner/Software_Engineering_Capstone`. `production_v1` is what is deployed and is frozen as the rollback target (tag `v1-final`). All v2 work happens on the `v2` branch.

### Folder layout (preserved in v2)

```
Software_Engineering_Capstone/
  portfolio-page/                 React frontend
    public/
    src/
      assets/                     images and video
      components/
        Main/                     one component per section, plus Developer page
        Navbar.js, LoginModal.js
      scss/                       one stylesheet per section, master-styles.scss
      services/
  portfolio-page-backend/         ASP.NET Core API
    Controllers/
    Data/                         DbContext and seed data
    Migrations/
    Models/
    Properties/
    images/certifications/        seed images
    Program.cs, Startup.cs
  start-portfolio.ps1             Windows startup script
  docs/                           (new in v2) this document, deploy and restart guides
```

### What v1 got right

- A clear single-page structure: splash, about, skills, certifications carousel, education, projects, contact.
- A fixed left navbar of icons, indexed to the sections, with a yellow hover and active state. Distinctive; keep it.
- A restrained teal and mint palette that already leans dark.
- The developer page: certificate upload with image and metadata, edit, delete, search, and a CSV report.
- Real content in Sean's voice, with personality anchors (Barry's tea, poutine, Portland rain).
- The leveling-up animation when a contact message is sent.

### Known gaps

Security

- The developer login compares a plaintext username and password from configuration and returns `{ success: true }`. Nothing is issued (no cookie, no token), so the API cannot tell an admin from anyone else.
- `POST`, `PUT`, and `DELETE /api/Certifications` have no authorization. Anyone can modify or delete data with a single request.
- The `/developer` route is not guarded; the login modal only gates the navbar icon.
- The backend runs in the Development environment in production (`launchSettings.json` sets it, and the startup script does not override it). API errors return developer exception pages with stack traces. Swagger is not reachable from the internet because Nginx only proxies `/api`, but the error pages are.
- Antiforgery is configured in `Startup.cs` but never used.
- A Firebase configuration is committed in `src/services/firebase.js` and never imported. EmailJS identifiers are hardcoded in `Contact.js`, and EmailJS itself no longer reliably delivers.

Frontend

- No responsive design. There are no active media queries. A toast tells mobile visitors the mobile layout is under construction. Elements collide and overlap at many widths.
- Content (about, education, skills, projects) is hardcoded in JSX. Only certifications are data-driven. `Data.js` is a dead duplicate of the certificate list.
- `react-scripts` is unmaintained. `gsap-trial` is a trial build not licensed for a live site. MUI, emotion, styled-components, Sass, and animate.css all coexist for very little use.
- `Home.js` assumes every certificate image is PNG regardless of what the API reports.

Backend and repo

- `GET /api/Certifications` returns every image as base64 inside one JSON payload.
- `UseExceptionHandler("/Home/Error")` points at a route that does not exist, so switching to the Production environment today would turn every error into an empty response.
- `Microsoft.EntityFrameworkCore.SqlServer` is referenced but unused (MySQL is the provider).
- Nine files in `src/assets` are unused (about 11 MB). `SiteExample.gif` in the repo root is 42 MB.

---

## 3. Target architecture

Same shape, hardened and modernized.

```
Browser
  |
  |  https://sean-keane.com  (Cloudflare proxy: DNS, TLS, WAF, Access on admin paths)
  v
Nginx Proxy Manager (Docker on Windows host)
  |-- /api/*      -> ASP.NET Core API   https://localhost:5001
  |-- /*          -> static frontend   http://localhost:3000  (serve -s build)
                          |
                          v
                     MySQL 8 (Windows service, localhost:3306)
                     App_Data/uploads   (uploaded images on disk)
```

Frontend: React 18 built with Vite, output to `portfolio-page/build/` so the existing serve command and Restart Guide keep working. Same components, same Sass, own lightweight components in place of MUI by the end of Phase 4.

Backend: same project, same `Program.cs` and `Startup.cs` structure. Cookie authentication, TOTP second factor, authorization on every write, rate limiting, antiforgery, JSON error responses, security headers, audit log, and a content model with admin endpoints under `/api/admin/*`.

Data: additive schema growth only (Section 8, working agreements), so `production_v1` continues to run against the v2 database if a rollback is ever needed.

---

## 4. Environment contract (Mac dev, Windows prod)

This section exists because configuration drift between the two machines has cost hours before. It is established in Phase 0 and checked at the end of every phase.

### Backend configuration files

| File | Committed | Contains | Used on |
|---|---|---|---|
| `appsettings.json` | yes | non-secret defaults: logging levels, allowed hosts, upload limits, cookie names, rate limits | both |
| `appsettings.Example.json` | yes | every key with placeholder values; the template for the two files below | reference |
| `appsettings.Development.json` | no (gitignored) | local MySQL connection string, local settings | Mac |
| `appsettings.Production.json` | no (gitignored) | production MySQL connection string, production settings | Windows |
| `Properties/launchSettings.json` | yes | `dotnet run` profiles; sets `ASPNETCORE_ENVIRONMENT=Development` | Mac |

Rules:

- No secret ever appears in a committed file. The backend `.gitignore` already excludes `appsettings.*.json` except the Example.
- `appsettings.Example.json` is updated in the same commit as any new configuration key.
- On Windows, `start-portfolio.ps1` sets `$env:ASPNETCORE_ENVIRONMENT`. It stays `Development` until Phase 2 delivers proper Production error handling, then flips to `Production` as a Phase 2 acceptance step.
- Passwords are never stored in configuration after Phase 2. Only hashes in the database.

### Frontend configuration

| File | Committed | Contains |
|---|---|---|
| `.env.development` | yes | `VITE_API_BASE=https://localhost:5001` |
| `.env.production` | yes | `VITE_API_BASE=` (empty: same-origin, so requests go to `/api/...` through Nginx) |

Vite only exposes variables prefixed `VITE_`. Nothing secret goes in either file. Third-party keys (email provider, bot protection secret) live on the backend.

### Runtime differences

| | Mac (development) | Windows (production) |
|---|---|---|
| Backend start | `dotnet run` in `portfolio-page-backend` (Development profile) | `start-portfolio.ps1` (sets environment, starts backend and frontend) |
| Frontend start | `npm run dev` (Vite dev server, port 3000, proxies nothing; calls the API directly) | `npm run build` then `npx serve -s build -l 3000` |
| TLS to backend | `dotnet dev-certs https --trust` once | existing dev certificate on localhost behind Nginx (unchanged) |
| MySQL | Docker Compose in `portfolio-page-backend/dev/docker-compose.yml`, database `portfolio_dev` | Windows service on 3306 |
| Environment | Development | Development until Phase 2, then Production |
| Swagger | on | off |
| Error responses | developer page | JSON problem details, no stack traces |

### Line endings

Add a `.gitattributes` in Phase 0: `* text=auto` and `*.ps1 text eol=crlf`. This stops the CRLF/LF churn between the two machines.

### Deploy checklist

Lives in `docs/DEPLOY.md` (written in Phase 0, revised whenever a phase changes it). The end of every phase runs the checklist on the Windows box and records the result in the phase notes.

---

## 5. Design direction

### Identity

The site belongs to a runner turned developer turned security engineer who lives in the rain and drinks strong tea. It should feel calm, dark, and precise, with one warm note. Confident without being loud. The signature elements from v1 carry that identity and stay:

- The splash video on load, with the chevron scroll cue beneath it.
- The desk video beside the About card.
- The fixed left icon rail, indexed to sections, with the yellow hover and active state.
- Icons that react to hover in the Skills section.
- Project cards that reveal their title on hover.
- The leveling-up moment when a contact message sends.

### Palette

Dark-first, derived from v1's own colors rather than a generic dark theme. v1 already used these; v2 promotes the dark teal to the base.

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#2C3333` | page background |
| `--ink-2` | `#395B64` | raised surfaces: navbar, cards, form fields |
| `--sea` | `#A5C9CA` | secondary text, icons, borders |
| `--mist` | `#E7F6F2` | primary text on dark; light surfaces where used |
| `--brass` | `#FDE46D` | the one warm accent: hover, active, focus, the level-up moment |
| `--navy` | `#213D58` | deep accent for the splash and contact areas |

Rules: brass is used sparingly and always means "you can act here" or "you are here". Never use it for decoration. No gradients as decoration. No pure black and no `#111`-style near-blacks; the base is teal-black on purpose. Contrast: all text meets WCAG AA against its background (mist on ink is well above).

A light theme is out of scope until the dark theme is finished. If added later it uses the same tokens with mist as the base.

### Typography

Work Sans is already loaded by v1 and suits the site. Use it as the single family: weight and size carry hierarchy, not additional typefaces. Self-host the font files (no runtime request to Google Fonts; this also simplifies the content security policy). Type scale set with `clamp()` so headings scale with the viewport. Body line length under 75 characters. No all-caps labels, no eyebrow labels above headings, no single accent-colored word inside a headline.

### Layout

Single page, sections stacked, as in v1. Desktop keeps the left rail with content offset to the right. Below 900px the rail becomes a bottom tab bar with the same icons and the same brass active state, so the navigation idea survives the translation to mobile. Content is left-aligned inside a centered column; the About and Education cards keep their card treatment because they are the two "paper" moments on a dark page; everything else sits directly on the background.

### Motion

One orchestrated moment on load (the splash video and chevrons). After that, motion only answers the visitor: hover states, the level-up on send, the carousel advancing. No scroll-triggered fade-ins on every section. `prefers-reduced-motion` disables autoplay video (poster image shown instead) and all non-essential animation.

### Patterns to avoid

These read as templated regardless of subject. Do not introduce them:

- Identical rounded cards with the same soft shadow for every kind of content.
- Gradient washes, glassmorphism, glowing borders.
- Tracked-out all-caps labels, numbered "01 / 02 / 03" markers where the content is not a sequence, middle-dot separated meta strings, arrows appended to link text.
- A near-black background with a single acid-green or vermilion accent.
- Scroll-reveal animation on every section and hover lift on every element.
- Stock hero copy ("Building the future", "Crafting digital experiences"). Copy stays in Sean's voice (Section 6).

### Responsiveness targets

Mobile-first CSS. Breakpoints: 360 (small phone), 600 (large phone / small tablet), 900 (tablet / laptop), 1200 (desktop). Verified widths for every section: 320, 375, 390, 414, 600, 768, 900, 1024, 1280, 1440, 1920. Requirements at all widths: no horizontal overflow, nothing overlapping, touch targets at least 44px, visible keyboard focus, text never smaller than 14px, videos never wider than the viewport, the admin pages fully usable on a phone.

---

## 6. Content and voice

Copy is warm, plainly written, and a little self-deprecating. It leads with the Microsoft security role and lets the rest of the person show through: Portland, the dual citizenship, the tea, the running. It never reads as a cover letter, never uses disclaimers about job status, and never uses corporate filler. Existing About copy is the tone reference.

Sections for v2, in order, all editable from the developer page after Phase 3:

1. Splash (video, name, one line)
2. About
3. What I work on (security operations, identity, automation; written for a general reader)
4. Projects (this site and its security work belong here; other projects as data)
5. Certifications (carousel, admin-managed)
6. Education
7. Contact

A "Now" style section for near-future updates (for example graduate school) can be added from the developer page when the time comes without a deploy. That is the point of Phase 3.

The README is part of the portfolio. It gets rewritten in Phase 5 in the same voice, describing the architecture and the security design, with a new short demo recording replacing `SiteExample.gif`.

---

## 7. Security design

### Threat model

A public site on a home network with a single administrator. Assets: the integrity of the public content, the admin credential, the home network behind the proxy, the contact channel. Realistic threats: credential stuffing against the login, unauthorized writes to the unprotected API, CSRF against an authenticated admin, stack-trace and version leakage, bot abuse of the contact form, denial of service against the home connection, and anything that turns the web server into a foothold on the LAN.

### Controls (delivered in Phase 2 unless noted)

Authentication

- Single admin account in a `Users` table. Password stored as a salted hash using the framework's `PasswordHasher` (PBKDF2). No plaintext credential anywhere.
- First admin created through a one-time setup endpoint gated by a random setup token from configuration; the endpoint returns 404 once any user exists, and the token is deleted from configuration afterwards.
- Cookie session: `HttpOnly`, `Secure`, `SameSite=Strict`, 30-minute sliding expiry, 8-hour absolute expiry, cookie name without framework fingerprint. Unauthenticated API calls receive `401` JSON, never a redirect.
- TOTP second factor (RFC 6238) required at login once enrolled. Secret encrypted at rest with the data protection API. Ten hashed recovery codes generated at enrollment, single use. Replay protection by remembering the last accepted time step. Enrollment, re-enrollment, and recovery-code regeneration from the developer page.
- Change password from the developer page; requires the current password and the TOTP code; ends all other sessions.

Authorization

- `[Authorize]` on every endpoint that writes, and on everything under `/api/admin/*`. Public endpoints are `GET` only.
- Frontend route guard on `/developer` backed by `/api/auth/me`; the guard is UX, the server is the control.

Abuse resistance

- Rate limiting on `/api/auth/*`: 5 attempts per minute per client IP, `429` with `Retry-After`. Account lockout for 15 minutes after 10 consecutive failures. Client IP taken from the proxy chain (Cloudflare `CF-Connecting-IP`, then Nginx forwarded headers), configured through the forwarded-headers middleware with the known proxy trusted.
- Antiforgery on all state-changing requests: token issued at `/api/auth/csrf`, sent back in the `X-CSRF-TOKEN` header, validated server-side. Combined with `SameSite=Strict`.
- Upload validation: allowed types by magic bytes (PNG, JPEG, WebP), 5 MB limit, random server-generated filenames, stored outside the web root and served through a controller.
- Contact form (Phase 3): `POST /api/contact` with server-side validation, a honeypot field, Cloudflare Turnstile verification, and per-IP rate limiting; mail sent from the backend through a transactional provider so no third-party key ever ships to the browser.

Hardening

- Production environment on Windows with `AddProblemDetails` and a JSON exception handler in place of `/Home/Error`. No stack traces or framework versions in responses. The `Server` header removed.
- Security headers on API responses (middleware) and on the HTML (Nginx Proxy Manager custom config, documented in `docs/OPS.md`): `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `frame-ancestors 'none'`. HSTS at Cloudflare. The CSP starts permissive enough for MUI's injected styles and tightens in Phase 6 once MUI is gone.
- CORS narrowed to `https://sean-keane.com` and `https://localhost:3000`; no plain-http origins.
- Audit log table: timestamp, actor, action, target, client IP, user agent, outcome. Written for every login attempt, TOTP event, password change, and content mutation. Viewable from the developer page.
- Serilog request logging kept; sensitive fields (passwords, codes, tokens) never logged. Log files rotate and are gitignored.
- Dependencies: `npm audit` and `dotnet list package --vulnerable` run in every phase; findings fixed or recorded.

Edge (Phase 7)

- Cloudflare Access (Zero Trust, free tier) in front of `/developer*` and `/api/admin/*` with a policy allowing only Sean's email through one-time PIN or an identity provider. This is a second, independent gate; the app-level controls remain the primary ones.
- Verify the DNS record is proxied (orange cloud). Restrict the origin to Cloudflare's IP ranges at the Nginx layer, or move to a Cloudflare Tunnel and close the router port forwards entirely. Tunnel is the stronger option and removes the DDNS container; decide in Phase 7 after testing.
- Cloudflare WAF rate-limiting rule on `/api/auth/*` as a coarse outer limit.

---

## 8. Content model (Phase 3)

Additive schema. Every migration has a working `Down`. `production_v1` keeps working throughout because it only reads `Certifications` columns that are never renamed or dropped.

| Table | Purpose | Key columns |
|---|---|---|
| `Users` | admin account | `Id`, `Username`, `PasswordHash`, `TotpSecret` (encrypted), `TotpEnabled`, `RecoveryCodes` (hashed, JSON), `FailedAttempts`, `LockoutUntil`, `CreatedAt`, `LastLoginAt` |
| `AuditEvents` | audit log | `Id`, `OccurredAt`, `Actor`, `Action`, `Target`, `ClientIp`, `UserAgent`, `Outcome`, `Details` |
| `SiteSections` | editable text blocks | `Key` (about, what-i-do, education, now), `Title`, `BodyMarkdown`, `Visible`, `SortOrder`, `UpdatedAt` |
| `Projects` | project cards | `Id`, `Title`, `Blurb`, `RepoUrl`, `LiveUrl`, `ImagePath`, `Visible`, `SortOrder` |
| `Skills` | skill icons | `Id`, `Name`, `Category`, `IconKey`, `Visible`, `SortOrder` |
| `Certifications` | existing table, extended | add `ImagePath`, `CredentialUrl`, `Visible`, `SortOrder`; `ImageData` kept until images are migrated to disk, then nulled |
| `MediaFiles` | uploads | `Id`, `Path`, `ContentType`, `Bytes`, `Sha256`, `UploadedAt` |
| `ContactMessages` | optional copy of sent messages | `Id`, `ReceivedAt`, `Name`, `Email`, `Body`, `ClientIp` |

API surface

- Public, `GET` only: `/api/content` (one aggregated payload for the home page: sections, projects, skills, certification metadata; no image bytes), `/api/certifications/{id}/image` and `/api/media/{id}` (images with `Cache-Control` and `ETag`), `/api/health`.
- Auth: `/api/auth/csrf`, `/api/auth/login`, `/api/auth/totp` (second step), `/api/auth/logout`, `/api/auth/me`, `/api/auth/setup` (one-time).
- Admin, cookie + TOTP + antiforgery required: `/api/admin/sections`, `/api/admin/projects`, `/api/admin/skills`, `/api/admin/certifications`, `/api/admin/media`, `/api/admin/security` (password, TOTP, sessions), `/api/admin/audit`.
- `/api/contact` (`POST`, public, rate limited, Turnstile verified).

Markdown in `SiteSections` is rendered on the client and sanitized before rendering. Trusting the admin is not a reason to skip sanitization.

---

## 9. Phases

Each phase: Goal, Scope, Out of scope, Tasks, Acceptance, Rollback, Explore. Work happens on a branch named `v2-phase-N-short-name`, merged into `v2` by pull request when acceptance passes. Phase notes (what changed, what was learned, checklist results) go in `docs/phases/phase-N.md`.

### Phase 0: Foundations

Goal: a clean, reproducible starting point on both machines with zero visible change to the live site.

Scope

- Branching: tag `v1-final` at the current `production_v1`, create `v2` from it.
- `.gitattributes` for line endings.
- Remove dead code and dependencies: `src/services/firebase.js` and the `firebase` package, `gsap-trial`, the unused files in `src/assets` (verify each with a reference search before deleting), `Data.js`, the commented-out debugging code in `Home.js`. Run a dependency audit (`npx depcheck`) and remove what it confirms unused. Remove `Microsoft.EntityFrameworkCore.SqlServer` from the backend and confirm `dotnet build` and `dotnet ef migrations list` still succeed.
- Environment contract (Section 4): `appsettings.Example.json` complete; `.env.development` and `.env.production` created (still using `REACT_APP_` names until Phase 1); Docker Compose for local MySQL with a `portfolio_dev` database; `docs/DEPLOY.md` and `docs/RESTART.md` written (the Restart Guide converted from the existing document and corrected).
- `scripts/smoke.sh` (Mac) and `scripts/smoke.ps1` (Windows): hit `/api/Certifications` and the frontend root, check status codes and that certification count is greater than zero.
- Frontend: the Mac can run the full stack locally against the local database with seed data.

Out of scope: any UI change, any auth change, any schema change.

Acceptance

- `git diff v1-final v2 --stat` shows only deletions, config, docs, and scripts.
- Full stack runs on the Mac from a fresh clone following `docs/DEPLOY.md` alone.
- Windows: pull `v2`, build, restart; smoke script passes; site visually identical (screenshots compared at 1440 width).

Rollback: `git checkout production_v1`, rebuild, restart.

Explore: whether `serve` should be replaced by having the backend host the built frontend (one process instead of two). Record the trade-offs in the phase notes; decide in Phase 7.

### Phase 1: Vite migration

Goal: replace Create React App with Vite while keeping the folder structure and the production serving command unchanged.

Scope

- `index.html` moves to `portfolio-page/` root with `<script type="module" src="/src/main.jsx">`; `src/index.js` becomes `src/main.jsx`.
- Components containing JSX are renamed `.js` to `.jsx`. Same folders, same names otherwise.
- `process.env.REACT_APP_BACKEND_CALL` becomes `import.meta.env.VITE_API_BASE`; a single `src/services/api.js` builds request URLs so no component concatenates URLs itself.
- `vite.config.js`: `build.outDir = 'build'`, dev server on port 3000, `@` alias for `src/`.
- Sass: keep. Migrate `@import` to `@use`/`@forward` where the Sass deprecation warnings appear.
- Tests: Jest via `react-scripts` becomes Vitest + Testing Library; existing tests pass before and after.
- ESLint config moved to a standalone file; `npm run lint` and `npm run test` scripts exist and pass.
- Remove `react-scripts`, `css-loader`, and the Babel plugin that only existed for CRA.

Out of scope: styling, MUI removal, responsiveness, auth.

Acceptance

- `npm run build` produces `build/`; `npx serve -s build -l 3000` serves the site; screenshots at 1440 match Phase 0 baseline.
- `npm run test` and `npm run lint` pass.
- Bundle size recorded in the phase notes (baseline for Phase 6).
- Windows deploy checklist passes; Restart Guide needs no change.

Rollback: revert the merge on `v2`; production_v1 unaffected.

Explore: TypeScript. Not required; if adopted it happens file by file in later phases, not as a big-bang conversion.

### Phase 2: Security

Goal: the developer page and API are actually protected, and production runs as production.

Scope (backend)

- `Users` and `AuditEvents` tables (additive migration).
- One-time setup endpoint; password hashing; cookie authentication; `[Authorize]` on all writes; `/api/auth/*` endpoints as in Section 8.
- TOTP enrollment, verification, recovery codes.
- Rate limiting and lockout; forwarded-headers configuration for correct client IPs behind Cloudflare and Nginx.
- Antiforgery wired end to end.
- Upload validation on the certification endpoints (magic bytes, size, filename).
- Production error handling: `AddProblemDetails`, JSON exception handler replacing `/Home/Error`, `Server` header removed.
- Security headers middleware; Nginx custom config for the HTML documented in `docs/OPS.md`.
- CORS narrowed.

`Startup.cs` and `Program.cs` changes are limited to exactly this list, each one isolated in its own commit with a message explaining why: register authentication, antiforgery, rate limiter, problem details, and forwarded headers in `ConfigureServices`; add `UseForwardedHeaders`, `UseAuthentication` (before `UseAuthorization`), `UseRateLimiter`, the security headers middleware, and the problem-details exception handler in `Configure`. Nothing else in those files moves. Before the first of these commits, the session posts the full proposed diff of both files for review.

Scope (frontend)

- `RequireAuth` wrapper on `/developer`; `/api/auth/me` on load; login modal extended with the TOTP step; logout; the "Security" tab on the developer page (change password, enroll/re-enroll TOTP, regenerate recovery codes, view audit log).
- All admin requests go through `src/services/api.js`, which attaches the antiforgery header.
- `window.location.href` navigation replaced with the router.

Scope (operations)

- `start-portfolio.ps1` sets `ASPNETCORE_ENVIRONMENT=Production`. Tested first on the Mac by running the backend with `--environment Production` against the local database.
- `appsettings.Example.json` gains the new keys (cookie settings, rate limits, setup token placeholder, data protection key path).
- Data protection keys persisted to a known folder on both machines (`App_Data/keys`, gitignored) so cookies survive restarts.

Out of scope: content model, new admin features beyond security, styling.

Acceptance (all verified against production after deploy)

- `curl -X DELETE https://sean-keane.com/api/Certifications/1` returns `401`.
- Logged-in request without the antiforgery header returns `400`; with it, succeeds.
- Sixth login attempt within a minute returns `429`; after ten failures the account is locked and the audit log shows it.
- Login requires the TOTP code once enrolled; a used recovery code cannot be reused.
- Visiting `/developer` directly shows the login, and `/api/auth/me` returns `401` when logged out.
- Forcing an API error returns a JSON problem-details body with no stack trace; response headers include the security headers; `Server` header absent.
- Cookie inspected in the browser shows `HttpOnly`, `Secure`, `SameSite=Strict`.
- `npm audit` and `dotnet list package --vulnerable` clean or recorded.
- Rollback test: on the Mac, `production_v1` runs against the Phase 2 database.

Rollback: revert the environment flag in `start-portfolio.ps1` and check out `production_v1`. The new tables are ignored by v1.

Explore: passkeys (WebAuthn) as a future replacement for TOTP; session listing and remote sign-out.

### Phase 3: Content model and developer page v2

Goal: nearly every public section is editable from the developer page, images live on disk, and the contact form works again.

Scope

- Tables and endpoints from Section 8. One-time migration of existing certificate blobs to files under `App_Data/uploads` (gitignored), then `ImageData` nulled.
- `/api/content` aggregated payload; the home page fetches once.
- Developer page restructured into tabs: Overview, Sections, Projects, Skills, Certifications (existing upload, edit, delete, search, CSV report), Media, Security, Audit log. Markdown editor with live preview for sections. Every list supports reorder and hide.
- `/api/contact` with Turnstile, honeypot, rate limiting, and mail via a transactional provider configured on the backend; EmailJS removed. The level-up animation plays on successful send, delivered as a small looping video rather than the 6.5 MB gif.
- Seed data in `DatabaseContext` moved to a proper data seeder so it no longer reads image files at model-building time.

Out of scope: visual redesign of the public sections (Phase 4). The developer page gets functional, responsive layout in this phase using the design tokens, and its final polish in Phase 4.

Acceptance

- Edit the About text on the developer page; reload the public site; the change is live with no deploy.
- Add a project with an image; it appears in the Projects section.
- Reorder and hide a certification; the carousel reflects it.
- Contact form delivers an email; a bot-style submission (honeypot filled) is rejected silently; a missing Turnstile token is rejected.
- Every admin action appears in the audit log.
- `GET /api/content` is under 50 KB; certificate images return `Cache-Control` and `ETag`.
- Developer page is usable at 375px width.
- Rollback test: `production_v1` still lists certifications (it reads `ImageData`; keep the blob column populated until the Phase 3 acceptance passes in production, then null it in a follow-up migration).

Rollback: check out `production_v1`; run the `Down` migration only if the blob column has already been nulled.

Explore: draft versus published states for sections; a PDF version of the certification report; a "Now" section template.

### Phase 4: Responsive design system and public sections

Goal: the public site looks finished and intentional at every width, in the dark-first palette, with every v1 signature moment preserved.

Scope

- Design tokens as CSS custom properties in `master-styles.scss` (palette, type scale, spacing, radii, breakpoints). All section stylesheets consume tokens.
- Self-hosted Work Sans.
- Navigation: left rail at 900px and above, bottom tab bar below; active section tracked with `IntersectionObserver`; brass hover and active states; keyboard navigable.
- Section by section, in this order, each with screenshots at all verified widths before moving on: Splash, About, What I work on, Skills, Certifications carousel, Education, Projects, Contact, Footer.
- Video handling: `playsInline`, `muted`, poster images, lazy loading below the fold, reduced-motion fallback to posters.
- MUI, emotion, and styled-components removed; the carousel replaced with an accessible touch-friendly implementation; animate.css replaced with the few keyframes actually used.
- Remove the mobile toast.
- Developer page restyled with the same tokens.

Out of scope: copy changes (Phase 5), performance work beyond what layout requires (Phase 6).

Acceptance

- No horizontal overflow and no overlapping elements at any verified width (automated check with Playwright screenshots plus a manual pass on a real phone).
- Lighthouse accessibility 95 or higher on mobile; keyboard-only navigation works end to end; focus visible everywhere; reduced motion respected.
- Every item in the Section 5 "signature elements" list is present and demonstrably working.
- Nothing from the Section 5 "patterns to avoid" list is present.
- Bundle size lower than the Phase 1 baseline.

Rollback: revert the merge; Phases 2 and 3 remain.

Explore: a light theme toggle; subtle scroll progress in the rail; hover previews of projects.

### Phase 5: Content refresh

Goal: the words match the person and the role.

Scope

- Rewrite section copy in Sean's voice with Sean, section by section, in the developer page (not in code). Lead with the security role; keep the personality anchors; no job-seeking language; no disclaimers.
- Projects: add this site as a project with a short description of the security design; review the other project cards; update images.
- README rewritten: what the site is, architecture, security design, how to run it. New short demo recording (a compressed MP4 or a small GIF) replaces `SiteExample.gif`; the large gif is deleted.
- Meta title and description finalized.

Acceptance: Sean approves every section; no placeholder text anywhere; README accurate to the deployed system.

Rollback: content is data; restore previous section text from the audit log or a database backup.

Explore: an occasional "Now" section; a short section on running.

### Phase 6: Performance, SEO, accessibility

Goal: fast on a phone on a bad connection, and correct for search and sharing.

Scope

- Media pipeline: videos re-encoded (H.264 MP4 plus WebM), sized for their display size, with posters; images converted to WebP with fallbacks; gifs replaced with video.
- Code splitting: the developer page and its editor load only when visited.
- Fonts subset and preloaded.
- Meta tags, Open Graph and Twitter cards, `robots.txt`, `sitemap.xml`, a `404` route, `Person` structured data.
- CSP tightened now that MUI's injected styles are gone.
- Full accessibility pass: landmarks, headings order, alt text, form labels and error messages, color contrast.

Acceptance: Lighthouse 90 or higher in all four categories on mobile; largest contentful paint under 2.5s on a simulated 4G connection; sharing the URL shows the correct card; CSP has no `unsafe-inline` for scripts.

Rollback: revert the merge.

Explore: prefetching the content payload; image CDN via Cloudflare.

### Phase 7: Operations

Goal: deploying, restarting, backing up, and monitoring are one command each and documented.

Scope

- `deploy.ps1` on Windows: pull `v2`, `npm ci`, `npm run build`, `dotnet publish`, restart the backend and frontend, run the smoke script, print a summary. Decide here whether the backend runs as a Windows service (NSSM or `sc.exe`) instead of a console window.
- Nightly `mysqldump` to a local folder with rotation; documented restore procedure tested once.
- `/api/health` checked by an external uptime monitor.
- Cloudflare: confirm proxied DNS; Access application for `/developer*` and `/api/admin/*`; WAF rate limit on `/api/auth/*`; either origin IP restriction at Nginx or a Cloudflare Tunnel replacing port forwards and the DDNS container.
- Decision from Phase 0 explore: whether the backend serves the built frontend, retiring `serve`.
- `docs/RESTART.md`, `docs/DEPLOY.md`, and `docs/OPS.md` brought fully up to date.

Acceptance: a reboot of the Windows box brings the site back with no manual steps; a fresh deploy from `v2` completes with one command; a restore from backup works on the Mac; `/developer` prompts for Cloudflare Access before the app login.

Rollback: each item is independent; revert individually.

Explore: staging subdomain served from the Mac for previewing phases before they hit Windows; container images for the whole stack.

---

## 10. Working agreements for the coding session

- Read this document and `docs/DEPLOY.md` before starting any phase. Work one phase at a time. Do not start the next phase until the current one's acceptance tests have passed in production and its phase notes are written.
- Branch per phase (`v2-phase-N-short-name`), pull request into `v2`, never into `production_v1`.
- Before writing code for a phase, write the acceptance checklist into `docs/phases/phase-N.md`. After the phase, fill it in with results, screenshots (stored under `docs/phases/screenshots/`), and anything learned.
- `Program.cs`, `Startup.cs`, `launchSettings.json`, `start-portfolio.ps1`, and `appsettings*.json` change only through tasks explicitly listed in this document, each in its own commit with the reason in the message. Propose the diff first and wait for approval.
- Never commit a secret. If one is found in the tree, stop and report it.
- Schema changes are additive only. Every migration has a working `Down`. Take a database backup before applying a migration in production.
- Preserve the folder structure. New top-level folders are limited to `docs/`, `scripts/`, and `portfolio-page-backend/dev/`.
- Ask before adding a dependency. Prefer removing one.
- Do not rewrite a component to change its style when a stylesheet change would do. Keep component names and section ids (`homeId`, `aboutMe`, `skillsId`, `educationId`, `projectsId`, `contactCard`) so the navbar indexing keeps working.
- Every UI change is reviewed as screenshots at the verified widths before it is called done.
- Commit messages are imperative and describe the change and why. No footers, trailers, signatures, or references to tooling. The same applies to pull request descriptions, code comments, and documentation.
- Keep `docs/RESTART.md` and `docs/DEPLOY.md` accurate whenever a phase changes how the stack starts or deploys.
- When something in this document turns out to be wrong or a better option appears, propose the change to the document first, then do the work.

---

## 11. Decision log

| Date | Decision | Reason |
|---|---|---|
| 2026-09-14 | Frontend migrates from CRA to Vite | CRA unmaintained; Vite keeps the folder structure and the `build/` output |
| 2026-09-14 | Cookie session, not JWT | Same-origin SPA with one admin; HttpOnly cookie is not readable by injected script and can be revoked server-side |
| 2026-09-14 | TOTP in Phase 2, not deferred | Previous credential exposure; second factor is cheap insurance |
| 2026-09-14 | Cloudflare Access in Phase 7 | Free tier, independent second gate; requires proxied DNS which is verified in that phase |
| 2026-09-14 | Small, enumerated `Startup.cs` edits accepted | Needed for authentication, rate limiting, and production error handling; each isolated and reviewed |
| 2026-09-14 | Work on branch `v2`; `production_v1` frozen and tagged `v1-final` | Always able to revert to the old site |
| 2026-09-14 | Additive-only migrations | `production_v1` must run against the v2 database |
| 2026-09-14 | EmailJS replaced with a backend contact endpoint | EmailJS unreliable; removes third-party keys from the browser |
| 2026-09-14 | Dark-first palette derived from v1 colors | Keep the site's identity; avoid a generic dark theme |
| 2026-09-14 | Keep splash video, desk video, icon rail, level-up moment | They are the site's signature |

Open questions

- Transactional email provider for the contact form (choose in Phase 3; free tier at this volume).
- Backend serving the built frontend versus keeping `serve` (decide in Phase 7 with Phase 0 notes).
- Windows service versus console windows for the backend (Phase 7).
- Light theme (after Phase 4).
