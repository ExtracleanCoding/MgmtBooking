# Ray Ryan Management System

A single-page scheduling and business management dashboard tailored for a driving school. The app runs entirely in the browser, storing operational data in `localStorage` and rendering multiple feature-specific views (calendar, billing, reporting, settings) without any backend services.

## Tech stack
- **HTML/CSS** rendered through `index.html` and styled with a custom theme layered on Tailwind utility classes.
- **JavaScript** business logic contained in `script.js`, which orchestrates state management, view rendering, CRUD operations, AI integrations, and exports.
- **Chart.js** for data visualization inside the reporting and billing screens.

## Application layout
- `index.html` bootstraps the shell: a header, dynamic navigation, empty view containers, and reusable modal markup for bookings, services, customers, resources, expenses, blocking periods, invoicing, package sales, completion workflows, and alerts.
- `script.js` registers navigation items, swaps the active view, and destroys/rebuilds content on demand using dedicated renderers for each screen.
- `style.css` provides the retro-inspired theme, button system, and layout primitives that sit alongside Tailwind classes.

## Data model & persistence
- All entities (customers, staff, services, resources, bookings, transactions, expenses, waiting list entries, blocked periods, and settings) live inside a single `state` object in memory.
- The app loads defaults, merges saved settings, and writes updates back to `localStorage` through debounced save helpers, ensuring resilience against partial writes.
- Optional 30-minute auto-backups download JSON snapshots, and manual backup/import utilities round out data safety tooling.

## Core features by view
- **Calendar (day/week/month):** drag-and-drop booking grid that honours working hours, blocked periods, and staff leave; double-click opens booking forms while existing bookings expose quick actions.
- **Summary:** filterable booking ledger with AI-assisted insights and CSV export.
- **Billing:** per-customer receivables dashboard with pagination, invoice generation, clipboard reminders, bulk payment tools, AI financial summaries, and spreadsheet export.
- **Entity lists (Services, Customers, Staff, Resources, Expenses):** shared table renderer with CRUD modals, including skill tracking and package sales from customer records.
- **Waiting List:** prioritised queue that checks slot availability and allows instant booking promotion.
- **Settings:** business profile, SMS template placeholders, lesson packages, AI provider configuration, and destructive-data safeguards.
- **Reports:** Chart.js-driven analytics for income vs. expenses, service popularity, top performers, and peak hours with AI-generated commentary.

## Automations & integrations
- Google Calendar export links for individual bookings to streamline instructor scheduling.
- CSV exporters for summary, billing, and aggregate reports.
- AI helpers (Gemini, OpenAI, Perplexity, OpenRouter) provide narrative summaries for bookings, finances, and customer progress, with explicit warnings about client-side API key storage.

## Additional assets
- `RRDrivingWeb_1.0.1.html` is a standalone marketing microsite with responsive navigation, FAQ accordion, and tailored branding for the public-facing driving school presence.

## Running the app
Open `index.html` in a modern browser. All data persists locally; export backups or clear data from the Settings view when needed.
