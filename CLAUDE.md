# EPAL ERP — Project Context

> Auto-loaded by Claude Code each session. Keep this current so we never lose context between sessions.

## What this project is
A **single-page, single-file ERP UI prototype** for the **EPAL Group** (Bangladesh-based holding company with 8 sister concerns). It is a static front-end demo — **no backend, no build step, no framework**. Pure HTML + inline CSS + vanilla JS in one giant file. Deployed via **GitHub Pages**.

The owner ("the boss") / stakeholder is **MD**; many design decisions are tagged in the code with `MD: <date>` comments — these mark boss-requested changes. Honor those comments; don't undo MD decisions without being asked.

## Files
| File | Size | Purpose |
|------|------|---------|
| [erp-combined.html](erp-combined.html) | ~15,300 lines | **The main app & single source of truth.** All CSS, JS, panels, RBAC. The Travel module's HTML now lives in `travel.html` and is injected here at runtime. |
| [travel.html](travel.html) | ~3,980 lines | **Travel module — HTML fragment** (the `tv-*` panels). Extracted verbatim from `erp-combined.html`. NOT a standalone page (no html/head/body). Injected into combined at parse time. |
| [erp-combined.backup.html](erp-combined.backup.html) | — | Local pre-extraction backup (gitignored; git history also has it). |
| [index.html](index.html) | tiny | Redirect → `erp-combined.html`. |
| [ai-companion/](ai-companion/) | ~14 MB | **EON** — modular 3D AI companion (Three.js). Embedded in `erp-combined.html`. |
| [features/](features/) | — | Earlier `window.TravelPortal`-based feature prototypes (Quotation, Tasks, Visa-Pro, Ticketing-Pro, Compliance, Expense, States). **Not currently wired** — to be re-added as native erp panels inside `travel.html`. |

## Architecture: the Travel module split (MD: 29-Jun-2026)
- **`erp-combined.html` is the ONE source of truth.** The Travel module's panel HTML was **extracted (moved, nothing deleted)** into `travel.html` to shrink combined.
- `erp-combined.html` loads it back **in place during page parse**: a small inline loader does a synchronous `XMLHttpRequest` for `travel.html` and `document.write`s it into `.erp-content` exactly where the panels used to be. Result: identical DOM, IDs, events, JS and DB — the user cannot tell it's external. (Needs http(s); works on GitHub Pages, not `file://`.)
- The Travel module's **CSS, JS, sidebar nav, RBAC entries (`erpPanels`/`erpTitles`/`G.tvSvc`) all stay in `erp-combined.html`** and are unchanged.
- **Develop all Travel UI in `travel.html`** going forward (add new `.erp-panel#erp-panel-<id>` sections there); combined reflects them automatically. Any new nav item / `erpPanels` / `erpTitles` / RBAC entry for a new panel still goes in `erp-combined.html` (small one-liners).

## Prototyping rules (important)
- This is **UI design only** — mock data + localStorage, no backend.
- **Every newly added thing gets a `New` badge** so the user can see what changed.
- **Never delete** existing Travel/ERP content — it mirrors the live operational system. Adding is fine; deleting is prohibited.
- A new feature must render **all its sections** so the user can test-input immediately.
- Switch role to **Travels Agent** (top-right "View As") to see the Travel section (RBAC-gated to `agent`/`admin`/`superadmin`).

## EON AI companion
- Lives entirely in `ai-companion/`; embedded via an import-map (`three`) + 3 CSS links + `<script type="module" src="ai-companion/js/main.js">`.
- Auto-boots, walks around, reacts to typing/clicks/forms, persists to localStorage. Needs a server (ES modules) — works on GitHub Pages, not `file://`. Resolves its own paths via `import.meta.url`. The `✕` chip hides it.

## How the app works (architecture)
- **No router / no framework.** Everything is one HTML document.
- Screens: `#login-screen` (currently disabled — boots straight into ERP per `MD: 27-Jun-2026`), `#erp-screen`, `#crm-screen`.
- **Navigation = panel switching.** Each module is a `<div id="erp-panel-<id>">`. The JS function **`showErpPanel(id, navEl)`** (~line 15961) hides all panels (removes `.active`), shows the chosen one, updates the sidebar highlight and breadcrumb title.
  - `erpPanels` = array of all panel ids; `erpTitles` = id → title map. **Add new panels to both.**
- Sidebar is collapsible (`toggleSidebar()`, `MD: 18-Jun-2026`).
- **Quick-access tabs**: drag any sidebar item to pin it (`MD: 18-Jun-2026`).
- Persistent **news bulletin ticker** under the topbar.
- Tabs/chips within panels toggle via `classList.add/remove('active')` patterns (e.g. `psm-tab`, `psc-chip`).
- ESC key closes modals (global keydown handler).

## Modules / panels (high level)
- **Group Dashboard** — KPI hero cards, 8-company performance strip, office issues tracker, multi-bank cash position, lead funnel, AR aging, schedules.
- **Sister concerns** (each has its own dashboard): Epal Group, Epal IT Solutions, **Epal Travels**, Epal Properties, Epal Constructions, Wood Art Interiors, Epal Online Shop, Epal Manufacturing.
- **User Management** — All Users (category tabs), Add User (3-section form).
- **Business Operations / Products**, **Accounts & Finance**, **HRM**, **Payroll**, **Task** (Task Map: milestones, timers, weighted % progress), **Reports**, **Reminder**, **Marketing**, **Settings**, **Trash**.
- **Travels-specific modules**: Passport, Vendor & Agent, Portal Management, Air Ticketing, **Direct Sale** (6 tabs: Manage Tickets / Direct Sale / Refund / Re-Issue / Void / EMD, each with Payable + Receivable schedules), Manage Sales, Airlines, Country, States, Flight Schedule, Contract Flight, Invoice Template, Visa Processing.
- **Accounts modules**: Payment Daily Sheet (`pds-*`), Payment Schedule Center (`psc-*` / `psm-*`).

## Conventions
- **CSS naming**: module-prefixed (e.g. `vsa-*` visa, `biz-*` business ops, `tvd-*` travels dashboard, `pds-*` payment daily sheet, `psc-*`/`psm-*` payment schedule, `qt-*` quick tabs).
- **Color system**: CSS vars in `:root`. Each sister concern has its own accent var (`--travels`, `--it`, `--construction`, `--woodart`, `--properties`, `--onlineshop`, `--manufacturing`).
- **Fonts**: DM Sans (UI), DM Mono (numbers/code) via Google Fonts.
- **`MD: <date>` comments** = boss-requested design decisions. Preserve them.
- Section dividers use big `<!-- ===== TITLE ===== -->` comment banners — useful for navigation/grep.

## Working in this repo
- **Editing**: the main file is huge. Use Grep to locate a panel/function by id or by its `<!-- ===== -->` banner, then Read that region and Edit in place. Don't read the whole file.
- **No build / no install.** To preview: open the HTML in a browser (or the GitHub Pages URL).
- **Git**: branch is `main`; commits go straight to `main`. Recent work has been on the Task module and the new Travels employee portal.
- **Testing**: manual / visual only — there is no test suite.

## Current state (end of 2026-06-29 session)
**Architecture:** `erp-combined.html` is the product. The Travel module's panel HTML lives in `travel.html` (a fragment) and is injected into combined at parse time (sync XHR + `document.write`). All Travel CSS/JS/nav/RBAC stay in combined. Travel section is gated to the **Travels Agent** role (RBAC "View As", top-right). New feature panels live in `travel.html`; their logic is modular under `features/<id>/<id>.js`; each is registered in combined with a nav item + `erpPanels` + `erpTitles` + RBAC `tvSvc` (small one-liners). All new things carry a green **`New`** badge.

**28 new feature panels built this session** (all `New`-badged, role-gated, in collapsible sidebar groups):
- *Air Ticketing group:* Flight Booking (GDS-style + add-ons), Quotation Builder, Ticketing Deadlines (TTL), Refund Tracker, BSP/ADM Recon (+IATA API sync, fare audit, unused recovery), Fare-Drop Auto-Rebooker, Schedule-Change Handler, Refund Recovery Autopilot.
- *Vendor & Agent group:* Vendor/Agent Accounts (ledger + credit limit/terms/DSO-DPO), Commission (slabs/override).
- *Visa group:* Visa Approval Predictor, Umrah/Hajj Group Orchestrator.
- *Hotels & Services group:* Hotels & Packages, Other Services (catalog → feeds invoice add-ons), Living Itinerary Concierge.
- *Intelligence group:* Analytics/MIS, Profit Leak Detector, Fraud & Compliance Sentinel, Customer Travel-DNA, Agent Performance Coach, Task Board.
- *Automation group:* Document-Expiry Radar, OCR Document Vault, WhatsApp Booking Bot, Dynamic Markup Engine.
- *Setup & Tools group:* Integrations/API, Currency/FX, FX Exposure Guard.
- Each feature persists to its own `epal_tv_*` localStorage key; mostly self-contained vanilla JS with injected scoped CSS.

**EON AI:** embedded in `erp-combined.html`. Its Firebase brain (`eon-brain/eon-brain.js`) is NOT used (no Firestore). Instead `eon-brain/epal-brain.js` (loaded before the EON module) sets `window.EonBrain`, reading ALL ERP data (every `epal_*` store + on-screen non-`.tvx` tables) and powering meditate/alerts/Ask-EON. `isOwner()` returns true (demo).

**Polish:** `features/_shared/tv-polish.css` (scoped to `.tvx` class on all 28 new panels) — tabular numbers, focus rings, responsive tables, consistent KPI type, required-field `.req` markers.

**Conventions / preferences (this session):** never delete the user's existing Travel/ERP content — additive only; everything new gets a `New` badge; build features modularly under `features/`; keep the sidebar compact (collapsible groups, grouped by department/section). Permissions broadened in `.claude/settings.local.json`. Wiring edits are done via Node scripts (the files have mixed CRLF/LF; the Travel nav block is LF) and verified with div-balance + `node --check`.

**Possible next steps (not done):** right-align money columns properly (add `.num` to amount cells); standardize KPI card heights; deeper per-panel visual fine-tuning (needs a rendered view — no headless browser available here); port catalog add-ons into more invoices; link existing Manage-Vendor rows to specific party accounts.

---
*Update this file as the project evolves so the next session starts with full context.*
