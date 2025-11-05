# Regression Test Plan — Ray Ryan Management System

## 1. Scope & Objectives
- Validate that the single-page management dashboard (calendar, CRM, billing, reporting, and settings) works end-to-end after style updates or feature changes.
- Exercise all persisted entities (`customers`, `staff`, `resources`, `services`, `bookings`, `expenses`, `transactions`, `waitingList`, `settings`) plus analytics, reminders, and integrations.
- Catch regressions across both light/dark themes and ensure data integrity when exporting/importing backups.

## 2. Test Environment & Data
- Browser: Chromium-based (Chrome/Edge 119+) and Firefox latest; test mobile via responsive mode at 390×844.
- Serve `index.html` via `python -m http.server 8080` (or any static host) from repo root.
- Import `testdata.json` through **Settings → Import Backup** before executing functional cases.
- Run the console suite in `automated-test.js` first; address any failures before continuing.
- Clear `localStorage` between major runs (`Application` tab → Storage → Clear site data) to confirm clean installs.

## 3. Regression Suite Overview
| Area | Key Scenarios | Owner Notes |
|------|---------------|-------------|
| Navigation & Global UI | Keyboard nav, global search, notifications, theme toggle, clock | Verify new 3D styling renders correctly in both themes |
| Calendar & Scheduling | Month/Week/Day views, quick add, drag/drop, conflict warnings, blocked periods | Include reminder scheduling and auto-backup heartbeat |
| Entity CRUD | Customers, Staff, Services, Resources, Waiting List | Confirm validation, sanitisation (`sanitizeHTML`), skill matrices |
| Booking Lifecycle | Create/edit/delete, status transitions, credits, payments, reminders | Cover package pricing, instructor availability, multi-resource |
| Billing & Transactions | Customer summary, pagination, filters, bulk payment, invoice/export | Validate outstanding totals, reminders, and transactions table |
| Expenses & Profitability | Expense CRUD, category splits, linking to reports | Confirm totals feed reports & charts |
| Reporting & Charts | KPI cards, charts, AI summary, exports | Check Chart.js renders, date range filters |
| Settings & Configuration | Lesson packages, pricing rules, auto reminders, backup/import/export, dark mode | Exercise validation and settings persistence |
| Integrations | Google Calendar auth flow, export ICS, CSV/Excel exports | Manual verification (sandbox keys) |
| Security & Validation | Input length/pattern enforcement, HTML sanitisation, blocked protocols | Attempt script injection across forms |
| Accessibility & Responsiveness | High-contrast, focus order, mobile nav/layout | Tab order, ARIA roles, touch interactions |

## 4. Detailed Test Cases

### 4.1 Navigation & Global UI
1. **Load Dashboard**: Verify header renders with retro title, digital clock updates each minute, and notifications area empty by default. Toggle light/dark mode and confirm gradients adjust (`body.dark-mode`).
2. **Global Search**: Type partial customer name; ensure real-time results populate `#search-results`, clicking navigates to entity view highlighting record. Test no-result messaging and ESC to dismiss.
3. **Keyboard Navigation**: Tab through nav buttons; focus ring should be visible. Use Enter to change view. Confirm nav keeps active gradient styling.
4. **Toast Notifications**: Trigger by saving settings or creating booking. Confirm `#toast-notification` animates in/out.

### 4.2 Calendar & Scheduling
1. **View Switching**: Toggle Month/Week/Day; ensure correct component loads (`renderCalendarContainer`). Confirm `is-today` badge moves with current date.
2. **Date Navigation**: Use prev/next arrows; confirm `currentDate` updates and state persists after refresh (auto backup).
3. **Create Booking (Calendar Quick Add)**: Click empty slot in Week view. Fill required fields; assign staff/resource. Verify conflict warnings (back-to-back toast) when overlapping.
4. **Drag & Drop Reschedule**: Drag booking to new day/time; check state updated and no orphaned transactions.
5. **Blocked Periods**: Attempt booking on blocked date; expect button disabled and warning tooltip.
6. **Reminder Check**: Enable auto reminders in settings, set booking for tomorrow with `Scheduled` status; run `checkAndScheduleSMSReminders()` via console and verify reminder flag toggled.
7. **Auto-Backup**: Wait for backup interval or trigger via console `manualBackup()`; ensure notification entry appears.

### 4.3 Booking Lifecycle
1. **Create Booking (Modal)**: Use main `New Booking` button. Validate required-field messages via `validateInput`.
2. **Status Changes**: Move booking through `Scheduled → Completed → Cancelled`, toggling payment method (credits vs cash). Observe state changes in billing and customer credit balance.
3. **Credit Controls**: Deduct credits using `Use Lesson Credits`; ensure negative balances prevented and toast displays if insufficient.
4. **Transaction Linkage**: Mark booking paid; inspect `state.transactions` entry via console and ensure `booking.transactionId` set.
5. **Bulk Payment**: In billing view, select multiple unpaid bookings and run bulk payment. Confirm toast, transactions count, and statuses switch to Paid.
6. **Deletion**: Delete booking; ensure associated transactions removed or flagged (check console warnings).

### 4.4 Entity CRUD (Customers, Staff, Services, Resources, Waiting List)
1. **Add Customer**: Create new customer; confirm validation (email/phone regex). Attempt HTML injection to verify sanitisation.
2. **Edit & Archive**: Update customer info, toggle active status. Confirm lists filter archived entries.
3. **Service Management**: Add service with tiered pricing; ensure dynamic fields (pricing tiers) show/hide. Delete service and verify bookings fallback gracefully.
4. **Staff Availability**: Update working hours and leave; ensure calendar respects changes and conflicts highlight.
5. **Resource Utilisation**: Add vehicle/resource, assign to booking, run report to check utilisation chart updates.
6. **Waiting List**: Add entry, convert to booking, ensure list updates and booking pre-populates data.

### 4.5 Billing & Financials
1. **Customer Summary**: Select customer; verify totals (outstanding, paid) match bookings. Switch pagination to observe other customers.
2. **Record Payment**: Use single booking payment button, confirm outstanding decreases and transaction added.
3. **Generate Invoice**: Click invoice action; ensure modal shows correct line items. Export to PDF/print.
4. **Payment Reminder**: Use `Copy Reminder` to clipboard; validate message content references correct amounts.
5. **Filtering & Sorting**: Verify search filters within billing tables; ensure results persist after navigation.

### 4.6 Expenses & Profitability
1. **Expense CRUD**: Add, edit, delete expenses with categories. Confirm totals update summary cards and net profit KPI.
2. **Recurring Expenses**: If supported, validate recurrence schedule (check `state.expenses` flags).

### 4.7 Reporting & Analytics
1. **KPI Cards**: Confirm values populate from state after importing seed data (compare with `testdata.json` expected totals).
2. **Charts Rendering**: Verify each Chart.js canvas loads without console errors. Toggle date range/department filters; expect data and trend badges to adjust.
3. **AI Analysis**: Click `Analyze Reports`; ensure asynchronous summary populated in `#reports-analysis-output` (mock data if API keys missing) and toggle collapse button works.
4. **Export**: Run `exportReportsToExcel()` and inspect downloaded file for correct headers and data.

### 4.8 Settings & Configuration
1. **Lesson Packages**: Add/update packages; ensure pricing propagates to booking form and summary calculators.
2. **Automation Toggles**: Enable/disable `autoRemindersEnabled`, `autoBackupEnabled`. Confirm indicators reflect state.
3. **Data Import/Export**: Export backup, clear storage, import file, and confirm data parity (counts, specific booking IDs).
4. **Theme & Personalisation**: Toggle dark mode, change branding fields if available, check persistence across reloads.

### 4.9 Integrations
1. **Google Calendar Sync**: Run through OAuth flow (requires valid credentials). Confirm events push/pull and conflict resolution messaging is clear.
2. **CSV/ICS Export**: Trigger export functions for bookings or schedules; verify file structure (dates, staff IDs).
3. **Email/SMS Hooks**: Use settings to configure placeholders; ensure no errors triggered even if API keys absent (graceful fallback).

### 4.10 Security & Validation
1. **XSS Guard**: Attempt injecting `<script>` and `javascript:` URLs in forms; confirm rendering uses `sanitizeHTML`/`sanitizeURL`.
2. **Input Bounds**: Test max lengths from `ValidationRules` (e.g., 254-char email, 20-digit phone). Ensure error messages display.
3. **Broken Session**: Manually corrupt `localStorage` entries and reload; ensure migration or default-state logic handles gracefully.
4. **CSP Compliance**: Inspect browser console for CSP violations after loading fonts/scripts.

### 4.11 Accessibility & Responsiveness
1. **Tab Order**: Navigate entire app via keyboard; ensure focus states visible on nav, buttons, modals.
2. **ARIA/Labels**: Inspect key forms using dev tools accessibility tree.
3. **Responsive Layout**: Test at 1440px, 1024px, 768px, 390px widths. Ensure nav collapses gracefully and modals adapt to full-height on mobile.
4. **Touch Interactions**: On mobile simulator, confirm large touch areas (min 44px) per stylesheet guidelines.

### 4.12 Regression Automation Hooks
- **Console Tests**: `automated-test.js` covers time utilities and state integrity; extend with additional suites as regressions appear.
- **Unit Test Ideas**: Extract pure helper functions (e.g., `toLocalDateString`, `getCustomerSummaries`, `calculateRevenueMetrics`) into a bundler-friendly spec for future Jest integration.
- **Visual Regression**: Capture baseline screenshots for key views (Calendar, Summary, Billing) to detect styling regressions introduced by 3D theme.

## 5. Exit Criteria
- All automated console checks pass.
- Manual cases above executed and signed off; any failures documented with reproduction steps and logs.
- Backup/import verified on latest dataset; no data loss observed.
- No uncategorised console errors or CSP violations remain.

## 6. Reporting
- Log findings in `documents/TEST_GUIDE.md` appendices or new QA report.
- For each failure, include: view, steps, expected vs actual, console output/screenshot, and suspected root cause.
- Summarise run in PR description (tests run section) referencing this plan.
