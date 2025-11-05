# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Ray Ryan Management System** - A comprehensive single-page web application (SPA) for managing:
- 🚗 **Driving School Operations** (lessons, student progress, skills tracking)
- 🚌 **Tour Guide Business** (group tours, guide qualifications, multi-day bookings)
- 📅 **Unified Booking System** (calendar scheduling, conflict detection, recurring bookings)
- 💰 **Billing & Revenue Management** (invoices, transactions, payment tracking)
- 📊 **Analytics & Reporting** (income analysis, staff performance, customer metrics)

**Tech Stack:**
- **Frontend:** HTML5, CSS3, Vanilla JavaScript (no frameworks)
- **Storage:** LocalStorage (browser-based, no database server)
- **External APIs:** Google Calendar, Chart.js, EmailJS (optional), Twilio (optional)
- **Build:** No build step required - run directly in browser

---

## Architecture Overview

### Core Structure

The application follows a **View-Controller** pattern organized by functional domains:

```
STATE (Global) → LOAD/SAVE (LocalStorage) → VIEWS (Render HTML) → INTERACTIONS (Event Handlers)
```

### File Organization

| File | Purpose | Size |
|------|---------|------|
| `index.html` | Main UI container with modals | 683 lines |
| `script.js` | All business logic (14 sections) | 7,518 lines |
| `style.css` | Global styling + responsive design | 1,258 lines |
| `security.js` | XSS protection & sanitization | 481 lines |
| `google-calendar.js` | Google Calendar API integration | 329 lines |
| `automated-test.js` | Test suite for validation | - |

### Data Model

**Global State Object (`state`):**
```javascript
state = {
    customers: [],          // Customer profiles with contact info
    staff: [],             // Instructors/guides with qualifications
    resources: [],         // Vehicles/equipment with capacity & maintenance
    services: [],          // Service types (DRIVING_LESSON, TOUR) with pricing
    bookings: [],          // All reservations with time/resource/staff
    blockedPeriods: [],    // Staff time-off and school holidays
    expenses: [],          // Business expenses by category
    transactions: [],      // Payment records linked to bookings
    waitingList: [],       // Customers waiting for booking availability
    settings: {}           // App config (email templates, preferences, etc)
}
```

**Key Data Structures:**

**Booking Object:**
```javascript
{
    id: "booking_uuid",
    date: "YYYY-MM-DD",              // ISO date format
    startTime: "HH:MM",              // 24-hour time
    endTime: "HH:MM",
    customerId: "customer_uuid",
    staffId: "staff_uuid",
    resourceIds: ["resource_uuid"],  // Can be multiple resources
    serviceId: "service_uuid",
    fee: 150.00,                     // Calculated from pricing rules
    status: "Scheduled|Completed|Cancelled|Pending",
    paymentStatus: "Paid|Unpaid|Paid (Credit)",
    transactionId: "txn_uuid",       // Links to transaction record

    // Tour-specific fields
    groupSize: 8,                    // Number of participants
    participants: ["Name1", "Name2"], // Attendee list
    specialRequirements: "text",     // Dietary, accessibility notes
    waiverSigned: false,             // Legal compliance
    waiverSignedDate: "ISO_TIMESTAMP",

    // Multi-day tour fields
    isMultidayTour: false,
    endDate: "YYYY-MM-DD",           // For tours spanning multiple days
    accommodation: "text",           // Hotel/lodging details
    multidayGroupId: "uuid"          // Links related daily bookings
}
```

**Service Object:**
```javascript
{
    id: "service_uuid",
    service_name: "Service Name",
    service_type: "DRIVING_LESSON|TOUR",
    duration_minutes: 60,
    base_price: 50.00,
    capacity: 4,                     // Max occupants

    // Pricing
    pricing_rules: {
        type: "fixed|tiered",
        tiers: [                     // Only for tiered pricing
            { minSize: 1, maxSize: 5, price: 150 },
            { minSize: 6, maxSize: 15, price: 120 }
        ]
    },

    // Tour-specific
    description: "text",             // Long description
    photos: ["url1", "url2"],        // Image gallery URLs

    // Lesson-specific
    lessonType: "STANDARD|INTENSIVE|CRASH"
}
```

**Staff Member (Guide Qualifications):**
```javascript
{
    id: "staff_uuid",
    name: "Full Name",
    email: "email@example.com",
    phone: "+1234567890",
    staff_type: "INSTRUCTOR|GUIDE|ADMIN",

    // For GUIDE staff type
    guide_qualifications: {
        languages: ["English", "French"],
        specializations: ["History", "Nature"],
        certifications: "First Aid, Guide License",
        certificationExpiry: "YYYY-MM-DD",
        rating: 4.8                  // 0-5 stars
    }
}
```

---

## Code Organization (14 Sections)

**script.js is organized into distinct sections:**

| Section | Lines | Purpose |
|---------|-------|---------|
| 0 | Pre-Section | Utility functions (UUID, date parsing, sanitization) |
| 1 | ~1106 | State management, configuration, constants, global state initialization |
| 2 | ~1205 | App initialization, setup, data migrations, dummy data |
| 3 | ~1690 | View switching, navigation, refresh logic |
| 4 | ~1755 | LocalStorage persistence (load/save state) |
| 5 | ~2085 | Generic list view renderers (customers, staff, resources, services) |
| 6 | ~2643 | Calendar rendering (month/week/day views) |
| 7 | ~2917 | Reports, billing, analytics, chart generation |
| 8 | ~3728 | CRUD operations (create/edit/delete entities) |
| 9 | ~4857 | Modal management (open/close/form handling) |
| 10 | ~5837 | Utility helper functions |
| 11 | ~6035 | Event handlers and UI interactions |
| 12 | ~6432 | External integrations (Google Calendar, iCal export) |
| 13 | ~6703 | Chart.js visualization and data analysis |
| 14 | ~7133 | Miscellaneous (clock, AI integration, error handling) |

---

## Key Concepts & Patterns

### 1. View Management
- Views are hidden/shown using CSS classes: `hidden` class toggles visibility
- View names: `calendar-view`, `customers-view`, `staff-view`, `reports-view`, etc.
- Navigation sidebar controls active view
- Each view has a dedicated render function (e.g., `renderCalendarContainer()`)

### 2. Modal Management
- All modals are pre-defined in HTML with `hidden` class
- Opening: Remove `hidden` class, add animation class (`scale-95 opacity-0`)
- Closing: Add animation classes, then add `hidden` after delay
- Pattern: `openXModal(id)` and `closeXModal()`

### 3. Form Handling
- Forms use `onsubmit` handlers that call save functions
- Save functions: Extract form values, validate, update state, call `saveState()`
- Edit mode: Pre-populate form from existing object, set hidden ID field
- Create mode: Clear form, reset ID field

### 4. Event Delegation
- Calendar and list views use event delegation (click handlers on container)
- Pattern: Check `event.target` classes to determine which element was clicked
- Handlers: `handleListClick()`, `handleBillingClick()`, etc.

### 5. State Persistence
- **Load:** `loadState()` at app init reads from `localStorage`
- **Save:** `saveState()` writes entire `state` object to `localStorage` as JSON
- **Debounce:** `debouncedSaveState()` prevents excessive writes
- **Migration:** `runDataMigration()` for backward compatibility with old data

### 6. Booking Conflicts
- `findBookingConflict()` checks for overlapping time slots
- Validates: Same staff + time overlap, OR same resource + time overlap
- Used when creating/editing bookings
- Also checks for adjacent bookings (warning only)

### 7. Pricing Calculation
- `calculateBookingFee(serviceId, groupSize)` - **Key function for pricing**
- Returns: Base price × group size (for tours)
- Handles fixed and tiered pricing based on group size
- Called when service changes or group size changes

### 8. Date Handling
- **Format:** YYYY-MM-DD (stored), displayed as human-readable format
- **Parsing:** `parseYYYYMMDD()` converts string to Date object
- **Formatting:** `safeDateFormat()` for display with locale options
- **LocalTime:** `toLocalDateString()` for current device timezone

### 9. Data Validation
- **Phone numbers:** Stored as-is, validated for length before sending
- **Emails:** Stored as-is, validated by email service before sending
- **Dates:** Must be future date for new bookings (with exception for admin)
- **Times:** Must be within calendar hours (7 AM - 9 PM default)

### 10. External Integrations
- **Google Calendar:** Async export of bookings (`exportToGoogleCalendar()`)
- **EmailJS:** (Optional) Sends emails without backend
- **Twilio:** (Optional) Sends SMS for reminders
- **Chart.js:** Creates data visualizations in reports

---

## Important Functions Reference

### State Management
- `loadState()` - Loads all data from localStorage
- `saveState()` - Saves entire state object to localStorage
- `debouncedSaveState()` - Debounced save (prevents excessive writes)

### Views
- `showView(viewName, date)` - Switch to a view
- `refreshCurrentView()` - Re-render current active view
- `changeDate(unit, direction)` - Navigate calendar dates

### Bookings (Critical)
- `saveBooking(event)` - Create/edit booking with validation
- `findBookingConflict(booking)` - Check for schedule conflicts
- `calculateBookingFee(serviceId, groupSize)` - **Price calculation**
- `deleteBooking(bookingId, context)` - Remove booking

### Customers
- `saveCustomer(event)` - Create/edit customer
- `getCustomerSummaries()` - Get payment status for all customers
- `deleteCustomer(customerId)` - Remove customer

### Reports & Analytics
- `getTourAnalytics()` - Get tour-specific metrics (participants, revenue, compliance)
- `getReportsData()` - Extract all report data (income, expenses, popularity)
- `generateCharts()` - Create Chart.js visualizations
- `calculateIncomeAnalytics()` - Income by month

### Reminders & Notifications
- `checkAndScheduleSMSReminders()` - Prepare SMS for tomorrow's bookings
- `checkAndSendEmailReminders()` - Send email reminders
- `sendBookingConfirmationEmail(bookingId)` - Confirmation after booking
- `sendPaymentReminder(bookingId, daysOverdue)` - Payment reminder

### Utilities
- `generateUUID()` - Create unique identifiers
- `parseYYYYMMDD(dateString)` - Parse YYYY-MM-DD to Date
- `safeDateFormat(dateString, options)` - Format date for display
- `sanitizeHTML(value)` - XSS protection (uses security.js)

---

## Common Development Tasks

### Adding a New Field to Bookings
1. Add field to booking object in `saveBooking()` (Section 8)
2. Add HTML input in booking-modal (index.html)
3. Populate field in `openBookingModal()` when editing (Section 9)
4. Handle field in `generateCharts()` if needed for reports

### Creating a New Report
1. Write data extraction function in Section 13 (`getReportsData()`)
2. Create chart rendering function using `createChart()` pattern
3. Add to `generateCharts()` function
4. Style using existing CSS classes or add new ones

### Adding Email Notification
1. Determine trigger event (e.g., booking created, payment received)
2. Call `sendBookingConfirmationEmail(bookingId)` or similar
3. Update email template in `prepareEmail()` function
4. Integrate EmailJS API credentials (free service: https://emailjs.com/)

### Fixing Date/Time Issues
1. Check `parseYYYYMMDD()` for date parsing
2. Verify all dates use YYYY-MM-DD format in state
3. Check `toLocalDateString()` usage for timezone conversion
4. Use `safeDateFormat()` for display formatting

### Working with Tour Features
1. Check `service.service_type === 'TOUR'` to identify tour bookings
2. Access group data: `booking.groupSize`, `booking.participants`
3. Calculate tour pricing: `calculateBookingFee(serviceId, groupSize)`
4. Get tour metrics: `getTourAnalytics()` returns occupancy, revenue, compliance

---

## Testing & Debugging

### Browser Console (F12)
```javascript
// Check current state
console.log(state);

// Find bookings for a date
state.bookings.filter(b => b.date === "2025-11-15");

// Get all tours
state.bookings.filter(b =>
    state.services.find(s => s.id === b.serviceId && s.service_type === 'TOUR')
);

// Check for conflicts
findBookingConflict({date: "2025-11-15", startTime: "09:00", endTime: "10:00", staffId: "staff_1", resourceIds: []});

// Calculate pricing
calculateBookingFee("service_uuid", 8);  // 8-person group

// Get analytics
getTourAnalytics();
```

### Adding Debug Logging
- Use `console.log()` in functions
- Look for existing logs in console section (Section 14)
- Check for errors in browser DevTools Console tab
- Set breakpoints in DevTools for step-through debugging

### Testing Tour Features
1. Create TOUR service with pricing tiers
2. Create GUIDE staff with languages/qualifications
3. Make booking with 5+ participants
4. Verify group pricing calculates correctly
5. Check participant names are saved
6. Verify waiver checkbox works

---

## Performance Considerations

### LocalStorage Limits
- Most browsers: 5-10 MB per domain
- Current app: ~50 KB with test data
- Warning: Don't store images in state (use URLs only)
- Backup: Download JSON regularly for data safety

### Chart Rendering
- Chart.js instances stored in `activeCharts` array
- Call `chart.destroy()` before creating new chart (prevents memory leaks)
- Reports page destroys all charts when switching views

### Large Datasets
- Pagination: Billing view uses `BILLING_ITEMS_PER_PAGE = 10`
- Filtering: Global search filters by customer name, booking date, etc.
- Calendar: Only renders visible month/week/day

---

## Security Notes

### XSS Protection
- All user input sanitized by `sanitizeHTML()` (security.js)
- Used in: Customer names, staff names, expense descriptions
- Pattern: Always sanitize before inserting into HTML

### Data Privacy
- No user authentication (not multi-user safe for production)
- All data stored in browser localStorage (not encrypted)
- Recommendation: Use authentication layer before production

### API Credentials
- Google Calendar: OAuth token (stored in browser)
- EmailJS: Public key in code (acceptable, private key on their servers)
- Twilio: Would need backend to hide Auth Token

---

## Integration Points

### Google Calendar
- File: `google-calendar.js`
- Function: `syncWithGoogleCalendar(bookingIds)`
- Exports: Single booking or all bookings
- Format: Google Calendar format via API

### Chart.js
- CDN: `https://cdn.jsdelivr.net/npm/chart.js`
- Usage: `new Chart(ctx, {type, data, options})`
- Types: `bar`, `line`, `doughnut`, `horizontalBar`
- Cleanup: Destroy chart before re-rendering

### EmailJS (Optional)
- Sign up: https://emailjs.com/ (free tier: 200 emails/month)
- Setup: Copy public key, service ID, template ID
- Function: `prepareEmail()` in script.js
- Implementation guide: `EMAILJS_QUICK_SETUP.md`

---

## Known Limitations & TODOs

### Current Limitations
- No user authentication (single user only)
- No backend/server (data only in browser)
- No encryption for sensitive data
- SMS reminders only log to console (requires Twilio integration)
- Multi-day tours framework in place but not auto-created

### Recommended Enhancements
- [ ] Add Firebase/Supabase backend for multi-user
- [ ] Implement user authentication
- [ ] Add Twilio SMS integration
- [ ] Create admin dashboard for multi-business support
- [ ] Add customer self-service booking portal
- [ ] Implement automatic invoice generation (PDF)
- [ ] Add business expense tracking dashboard

---

## Recent Implementations (Tour Features)

Version 3.2.0 added complete tour guide functionality:
- Group size tracking and participant management
- Group-based dynamic pricing (tiered by group size)
- Waiver/insurance compliance tracking with timestamps
- Tour itineraries and photo gallery display
- Multi-day tour booking framework
- Guide qualifications system (languages, specializations, ratings)
- Tour-specific analytics (occupancy, revenue, compliance)

See `TOUR_BUSINESS_IMPLEMENTATION_SUMMARY.md` for detailed documentation.

---

## Communication & Support

For specific implementations, see:
- `SMS_EMAIL_REMINDERS_DIAGNOSTIC.md` - Email/SMS integration issues
- `EMAILJS_QUICK_SETUP.md` - Email setup in 5 minutes
- `TOUR_QUICK_START_GUIDE.md` - Tour booking operations
- `IMPLEMENTATION_COMPLETE.txt` - Feature completion summary
