# R&R Driving School Business Management Tool

## 1. Architecture

This application is a single-page application (SPA) built with HTML, CSS, and vanilla JavaScript. It is a serverless, client-side solution that uses `localStorage` for all data persistence. The application is also a Progressive Web App (PWA), featuring a `manifest.json` for installability and a `sw.js` service worker for offline caching of core assets.

- **Frontend**: The application is built with HTML, CSS, and vanilla JavaScript.
- **Styling**: TailwindCSS is used for styling.
- **Data Persistence**: All data is stored in the browser's `localStorage`, making it a serverless, client-side application.
- **Core Logic**: The application's core logic is contained within a single `script.js` file.

## 2. Business Logic & Functionality

The application is a business management tool for a driving school. Key features include:

- **Customer Management**: Create, edit, and delete customer records.
- **Service Management**: Define and manage services offered by the driving school.
- **Scheduling**: A calendar view for scheduling appointments and lessons.
- **Billing**: Generate billing summaries for customers.
- **Reporting**: Chart.js is used to generate reports.

### Key Functions & Logic:

- **`addDummyData`**: This function seeds the application with initial data. It should only check for the existence of `state.customers` to determine if the application needs to be seeded with data.
- **`saveCustomer`**: When creating a new customer record, the `creation_date` should be set only once and then preserved during subsequent edits.
- **`confirmSale`**: This function should verify that the `driving_school_details` object exists on a customer record before attempting to modify its properties, creating it if necessary.
- **`openServiceModal`**: When opening a service for editing, this function must read the service's `pricing_rules.type` to programmatically select the correct pricing model radio button ('fixed' or 'tiered').
- **`renderCalendarHeader` & `renderWeekView`**: The calendar header logic must account for the `firstDayOfWeek` setting (either 'monday' or 'sunday') when calculating the start of the week.
- **`fetchAiModels`**: When fetching AI models from OpenRouter, this function must include the `Authorization: Bearer <API_KEY>` header in the request.
- **Asynchronous UI Operations**: Asynchronous UI operations that modify the UI state (e.g., disabling a button) must be wrapped in a `try...catch...finally` block to ensure the UI is reset to a stable state.

## 3. Security

The application implements several security measures to prevent Cross-Site Scripting (XSS) vulnerabilities.

- **Sanitization**:
    - Customer names in the billing summary table must be sanitized using the `sanitizeHTML` helper function before being rendered in `renderBillingContent`.
- **Programmatic Element Creation**:
    - The `updateAiProviderFields` function should programmatically create `<option>` elements to prevent XSS from malicious model IDs stored in `localStorage`.
    - The `fetchAiModels` function should populate the model selection dropdown by programmatically creating `Option` elements rather than using `innerHTML`.
    - Dropdowns (`<select>` elements) should be populated programmatically using `new Option()` rather than with `innerHTML` concatenation.
- **Delegated Event Listeners**:
    - To prevent XSS from malicious record IDs, UI elements with actions (e.g., edit, delete buttons) should use a delegated event listener pattern with `data-*` attributes instead of inline `onclick` handlers.

## 4. Testing

The project does not contain an automated test suite. Frontend changes are verified using temporary Playwright scripts that perform visual validation via screenshots.

- **Debounced Saving**: The application's save operations to `localStorage` can be debounced (e.g., `debouncedSaveState`). Playwright verification scripts may need to include a `page.wait_for_timeout()` to account for this delay when asserting changes.
- **Mocking Failures**: When writing Playwright tests, mocking a function within `page.evaluate()` to reject a promise (e.g., `Promise.reject()`) will cause the Playwright script to fail. To test failure paths, mock the function to resolve with a value the application code treats as an error, such as `Promise.resolve(null)`.
