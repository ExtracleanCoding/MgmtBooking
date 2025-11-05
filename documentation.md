
# Ray Ryan Management System - Documentation

## 1. Introduction

The Ray Ryan Management System is a comprehensive, client-side Single Page Application (SPA) designed for managing a service-based business, such as a driving school or tour operation. It provides a unified dashboard for handling scheduling, customer and staff management, billing, and reporting. The application is built to run entirely in the browser, using `localStorage` for data persistence, which makes it a serverless solution.

## 2. Architecture

### 2.1. Client-Side SPA

The application is a Single Page Application, meaning it loads a single HTML page (`index.html`) and dynamically updates the content as the user interacts with it. The UI is divided into "views" (e.g., Calendar, Customers, Billing), and JavaScript is used to show, hide, and update these views without requiring a full page reload.

### 2.2. Data Persistence

All application data is stored in the browser's `localStorage`. This includes:

- Customers
- Staff
- Services
- Bookings
- Expenses
- Application Settings

Data is loaded into a global `state` object on application start and is saved to `localStorage` whenever changes are made.

### 2.3. Technologies Used

- **HTML:** The core structure of the application.
- **CSS (with Tailwind CSS):** For styling and layout. The application also includes a custom stylesheet (`style.css`) for theming (including a dark mode) and specific component styles.
- **JavaScript (ES6+):** The core logic of the application, handling everything from UI rendering to data management.
- **Chart.js:** Used for creating charts in the Reporting view.

## 3. Business Logic

### 3.1. Core Data Models

The application revolves around several key data models:

- **Customers:** Clients of the business. Can have contact information and driving school-specific details like lesson credits.
- **Staff:** Employees, such as instructors or tour guides.
- **Services:** The services offered by the business (e.g., "Driving Lesson", "City Tour"). Services have a duration, price, and type.
- **Resources:** Assets used for providing services, such as vehicles or rooms.
- **Bookings:** The central entity, linking a customer, staff member, service, and resource for a specific date and time.
- **Expenses:** For tracking business costs.
- **Transactions:** Records of payments and package sales.

### 3.2. Booking Management

- The system allows for creating, viewing, updating, and deleting bookings.
- A calendar interface (with month, week, and day views) is the primary way to manage bookings.
- The system checks for conflicts when creating bookings.
- Bookings can be dragged and dropped to reschedule them.

### 3.3. Billing and Invoicing

- The application automatically calculates outstanding balances for each customer based on completed bookings and recorded payments.
- It can generate invoices for customers.
- It supports recording bulk payments for multiple lessons.

### 3.4. Reporting and Analytics

- The reporting view provides insights into the business's performance.
- It includes charts for:
    - Income vs. Expenses
    - Popularity of different services
    - Top customers by booking count
    - Staff performance (number of bookings)
- A summary view allows for filtering bookings by date, customer, staff, and resource.

### 3.5. AI-Powered Analysis

The application integrates with external AI providers (like Google Gemini) to offer intelligent summaries of:
- Customer progress notes.
- Booking summaries.
- Billing data.
- Business reports.

## 4. Functionality

### 4.1. Main Views

The application is organized into the following views, accessible from the main navigation:

- **Calendar:** The main scheduling interface.
- **Summary:** A filterable list of all bookings.
- **Services:** CRUD interface for managing services.
- **Customers:** CRUD interface for managing customers.
- **Staff:** CRUD interface for managing staff members.
- **Resources:** CRUD interface for managing resources.
- **Expenses:** CRUD interface for managing business expenses.
- **Waiting List:** A list of customers waiting for available slots.
- **Billing:** A detailed view of customer balances, payments, and invoices.
- **Reports:** A dashboard with charts and analytics.
- **Settings:** A page for configuring the application, managing data backups, and setting up AI integrations.

### 4.2. Modals

Most actions that involve creating or editing data are performed in modals. The application includes modals for:

- Services
- Bookings
- Customers
- Staff
- Resources
- Expenses
- Blocking out dates
- Selling packages
- Viewing customer progress

### 4.3. Settings and Data Management

The Settings view allows the user to:
- Configure application settings like mock test rates and invoice details.
- Create and manage lesson packages.
- Set up AI provider API keys.
- **Backup and Restore:** Export all application data to a JSON file for backup, and import a backup file to restore the application's state.
- **Clear All Data:** A function to wipe all data from `localStorage` and start fresh.
