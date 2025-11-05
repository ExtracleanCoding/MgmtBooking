# Gemini Developer Notes: Ray Ryan Management System

## 1. Project Overview

- **Type:** Serverless, client-side Single Page Application (SPA).
- **Purpose:** Management dashboard for a service-based business (e.g., driving school).
- **Core Logic:** Contained entirely within `script.js`.

## 2. Tech Stack

- **Frontend:** HTML, JavaScript (ES6+)
- **Styling:** Tailwind CSS, custom `style.css`
- **Data Persistence:** Browser `localStorage`.
- **Libraries:** Chart.js

## 3. Architecture

- **Entry Point:** `index.html`
- **State Management:** A global `state` object in `script.js` holds all application data. This object is loaded from `localStorage` on startup and saved back on any data modification.
- **UI:** The UI is composed of different "views" (div elements) that are shown/hidden dynamically. Modals are used for create/edit operations.

## 4. Data Models (localStorage Keys)

All data is stored under specific keys in `localStorage`. The main data structures are:

- `DB_KEYS.CUSTOMERS`: `Array<Customer>`
  ```json
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "phone": "string",
    "driving_school_details": {
      "license_number": "string",
      "progress_notes": "Array<Object>",
      "lesson_credits": "number"
    }
  }
  ```
- `DB_KEYS.STAFF`: `Array<Staff>`
- `DB_KEYS.RESOURCES`: `Array<Resource>`
- `DB_KEYS.SERVICES`: `Array<Service>`
- `DB_KEYS.BOOKINGS`: `Array<Booking>`
  ```json
  {
    "id": "string",
    "date": "YYYY-MM-DD",
    "startTime": "HH:MM",
    "endTime": "HH:MM",
    "customerId": "string",
    "staffId": "string",
    "resourceIds": "Array<string>",
    "serviceId": "string",
    "status": "string (Pending, Scheduled, Completed, Cancelled)",
    "paymentStatus": "string (Unpaid, Paid, Paid (Credit))",
    "fee": "number"
  }
  ```
- `DB_KEYS.EXPENSES`: `Array<Expense>`
- `DB_KEYS.TRANSACTIONS`: `Array<Transaction>`
- `DB_KEYS.SETTINGS`: `Object` with various configuration options.

## 5. Core Functions in `script.js`

### State & Initialization
- `loadState()`: Loads all data from `localStorage` into the `state` object.
- `saveState()` / `debouncedSaveState()`: Persists the `state` object to `localStorage`.
- `runDataMigration()`: Handles migrating data from older versions of the application.
- `renderApp()`: Initial setup of the main navigation and default view.

### View Management
- `showView(viewName)`: The main function for switching between different application sections.
- `render...View()`: A series of functions (`renderCustomersView`, `renderCalendarView`, etc.) that generate the HTML for each specific view.

### CRUD Operations
- **Generic List Renderer:** `renderGenericListView()` is used for the Services, Customers, Staff, and Resources views.
- **Modal Handlers:** `open...Modal()` and `close...Modal()` functions for each data type (e.g., `openCustomerModal`).
- **Save Handlers:** `save...()` functions for each data type (e.g., `saveCustomer(event)`), which handle form submission from the modals.
- **Delete Handlers:** `delete...()` functions (e.g., `deleteCustomer(id)`).

### Calendar Logic
- `renderMonthView()`, `renderWeekView()`, `renderDayView()`: Render the respective calendar displays.
- `handleDragStart()`, `drop()`: Manage drag-and-drop rescheduling of bookings.
- `openDaySummaryModal()`: Shows a summary of bookings for a specific day.

### Billing & Reporting
- `renderBillingView()`: Renders the main billing dashboard.
- `getCustomerSummaries()`: Calculates total billed, paid, and outstanding amounts for each customer.
- `renderDetailedBillingBreakdown()`: Shows a statement for a selected customer.
- `renderReportsView()`: Renders the reports dashboard and initializes the charts.

### AI Integration
- `handleAnalyze...()`: Functions like `handleAnalyzeSummary()` and `handleAnalyzeReports()` that prepare prompts and call the AI service.
- `runAiAnalysis()`: A generic function to handle the asynchronous call to the AI API and display the results.

## 6. File Structure

- `index.html`: Main application shell, contains all the HTML structure including modals.
- `script.js`: All application logic.
- `style.css`: Custom styles, theming, and dark mode.
- `README.md`: Basic project title.
- `documentation.md`: High-level documentation for human developers.
- `gemini_dev_notes.md`: This file, for my technical reference.
