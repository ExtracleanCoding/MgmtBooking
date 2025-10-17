# Architecture & Feature Specification

## 1. Runtime overview
The management console is a single-page application. `index.html` renders a fixed layout (header, navigation container, empty view panels, and modal templates). `script.js` bootstraps the UI by registering navigation entries, selecting the default calendar view, and wiring an auto-backup timer. Each navigation click triggers `showView`, which tears down any rendered charts, toggles the relevant view container, and delegates to a dedicated renderer for the requested screen.

## 2. State model
All business entities are stored in a single in-memory `state` object with arrays for customers, staff, services, resources, bookings, blocked periods, expenses, transactions, waiting list entries, and settings flags. Supporting state tracks the current calendar view/date, billing pagination, active Chart.js instances, and drag-and-drop metadata. The state is hydrated from `localStorage` via `loadState`, which merges persisted settings with defaults (mock test rate/duration, SMS template, AI provider/model selections, auto-backup flag). Updates are persisted through a debounced `saveState` helper that serializes each array back into `localStorage`.

## 3. View renderers
`renderApp` seeds the navigation and calls `showView('month')`. `refreshCurrentView` maps the current view key to one of the following renderers:
- `renderDayView`, `renderWeekView`, `renderMonthView` build interactive calendars that respect the configured first day of week, working hours, blocked periods, and booking conflicts. Day/week cards show bookings with drag handles, plus quick-add affordances for empty future slots.
- `renderSummaryView` produces a filterable booking ledger (date range, customer, staff, resource) with optional AI analysis and CSV export.
- `renderBillingView` displays customer balances with pagination, invoice generation, payment reminders, bulk payment workflows, and AI-generated commentary.
- `renderServicesView`, `renderCustomersView`, `renderStaffView`, `renderResourcesView`, and `renderExpensesView` use a shared table builder. Rows expose edit/delete actions, while customers include progress tracking and lesson package sales shortcuts.
- `renderWaitingListView` orders queue entries by creation date, highlights availability conflicts, and offers “Book Now” shortcuts.
- `renderSettingsView` collects business profile information, SMS templates, lesson packages, AI configuration, backup controls, and destructive actions.
- `renderReportsView` aggregates analytics (income vs. expenses, service popularity, top customers, staff performance, peak hours) and renders Chart.js visualizations with optional AI summaries.

## 4. Modal workflows
`index.html` defines modals for all CRUD and operational flows: services, bookings, day summaries, invoices, customers, customer progress, staff, resources, expenses, blocked dates, package sales, generic dialogs, and lesson completions. `script.js` controls their lifecycle (open, populate, validate, save, close). Booking modals dynamically compute end times, enforce conflict detection, and handle package credit consumption. Customer progress modals manage skill checklists and AI-driven feedback generation. Expense and resource forms populate defaults during edits. Dialog modals centralize confirmation prompts.

## 5. Scheduling logic
Calendar renderers share helper utilities for conflict detection, drag-and-drop, and blocked period awareness. When a booking is dragged onto a new slot, validation ensures staff/resources are available, the time falls within working hours, and overlapping bookings are prevented. Blocked periods distinguish whole-school closures (“school holidays”) from individual instructor leave, surfacing annotations in the calendar cells. Waiting list entries reuse the same validation pipeline before promoting a booking.

## 6. Billing & financials
Billing view functions compute customer summaries (total billed, paid, outstanding), track pagination, and drive invoice generation. `openInvoiceModal` produces printable invoices populated with instructor payment details. Bulk payment recording and per-customer reminders update transactions while triggering toasts. CSV exports create spreadsheet-friendly ledgers, and Google Calendar export buttons embed bookings into instructors’ calendars.

## 7. Reporting & analytics
`renderReportsView` collates raw data into reporting datasets (income vs expense by month, service popularity, top customers, staff performance, peak booking hours). Chart.js charts are instantiated per report, tracked in `activeCharts`, and destroyed whenever the user navigates away to avoid memory leaks. AI prompts summarise activity, finances, and overall business health.

## 8. Settings, backups, and destructive actions
Settings management covers mock test defaults (and auto-creates the mock test service), instructor identity, invoice payment details, and SMS reminder templates (with placeholder substitution). Users can toggle auto-backup (downloads a JSON snapshot every 30 minutes), trigger manual backups, import saved JSON, or clear all data. Clearing data always triggers a backup download before wiping `localStorage` and reloading the app.

## 9. AI integrations
The AI subsystem supports Gemini, OpenAI, Perplexity, and OpenRouter via provider-specific `fetch` calls. Model lists can be refreshed per provider, and prompts power booking summaries, billing analysis, report commentary, customer progress summaries, and lesson feedback generation. Because API keys are stored in `localStorage`, the settings view surfaces an explicit security warning.

## 10. Ancillary site
`RRDrivingWeb_1.0.1.html` is an independent marketing page featuring responsive navigation, hero messaging, service pricing, testimonials, FAQ accordion, and a contact form. Tailwind styles and inline scripts add accessibility (ARIA attributes on the mobile menu, keyboard handlers) and lazy-loaded imagery for performance.

