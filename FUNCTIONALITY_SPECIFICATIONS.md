# Functionality Specifications
## Ray Ryan Management System

**Version:** 3.1.0
**Last Updated:** 2025-11-05
**Document Type:** Technical Specifications
**Target Audience:** Developers, Technical Users

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Data Structures](#data-structures)
3. [Core Functions](#core-functions)
4. [Booking System](#booking-system)
5. [Customer Management](#customer-management)
6. [Staff Management](#staff-management)
7. [Resource Management](#resource-management)
8. [Service Management](#service-management)
9. [Calendar System](#calendar-system)
10. [Billing & Payments](#billing--payments)
11. [Tour Features](#tour-features)
12. [Reports & Analytics](#reports--analytics)
13. [Communication System](#communication-system)
14. [Data Persistence](#data-persistence)
15. [Security](#security)
16. [API & Integrations](#api--integrations)

---

## Architecture Overview

### Application Pattern
**Model-View-Controller (MVC) Variant:**
```
┌────────────────────────────────────────┐
│           Browser (index.html)          │
│                                        │
│  ┌──────────┐    ┌──────────────┐    │
│  │  View    │◄───┤  Controller  │    │
│  │ (HTML    │    │  (Event      │    │
│  │  Render) │    │   Handlers)  │    │
│  └────┬─────┘    └───────┬──────┘    │
│       │                   │            │
│       └───────┬───────────┘            │
│               ▼                        │
│        ┌─────────────┐                │
│        │   Model     │                │
│        │  (Global    │                │
│        │   State)    │                │
│        └──────┬──────┘                │
│               │                        │
│               ▼                        │
│    ┌──────────────────┐               │
│    │   LocalStorage   │               │
│    └──────────────────┘               │
└────────────────────────────────────────┘
```

### Execution Flow
```
1. Page Load
   ├─ loadState() → Reads from LocalStorage
   ├─ runDataMigration() → Updates old data structures
   ├─ initializeApp() → Sets up UI
   └─ renderApp() → Shows initial view

2. User Interaction
   ├─ Event triggered (click, submit, etc.)
   ├─ Event handler executes
   ├─ State modified
   ├─ debouncedSaveState() → Saves to LocalStorage
   └─ refreshCurrentView() → Re-renders UI

3. View Navigation
   ├─ showView(viewName) → Hides all views
   ├─ Renders selected view
   └─ updateActiveNav() → Highlights nav item
```

### File Organization
- **index.html** (683 lines): UI structure, modals, forms
- **script.js** (7,518 lines): All business logic
- **style.css** (1,258 lines): Styling and layout
- **security.js** (481 lines): XSS protection
- **google-calendar.js** (329 lines): Calendar integration

---

## Data Structures

### Global State Object
**Location:** `script.js:1106`

```javascript
const state = {
    customers: [],          // Array of Customer objects
    staff: [],             // Array of Staff objects
    resources: [],         // Array of Resource objects
    services: [],          // Array of Service objects
    bookings: [],          // Array of Booking objects
    transactions: [],      // Array of Transaction objects
    blockedPeriods: [],    // Array of BlockedPeriod objects
    expenses: [],          // Array of Expense objects
    waitingList: [],       // Array of WaitingListEntry objects
    settings: {}           // Settings object
};
```

### Customer Object
```javascript
{
    id: "uuid",                    // Unique identifier
    name: "John Doe",              // Full name
    email: "john@example.com",     // Email address
    phone: "+1234567890",          // Phone number
    address: "123 Main St",        // Physical address
    dateJoined: "2025-11-05",      // ISO date
    notes: "Prefers morning",      // Freeform notes
    packageCredits: 10,            // Remaining lesson credits
    progressNotes: [               // Student progress
        {
            id: "uuid",
            date: "2025-11-05",
            bookingId: "uuid",
            skillsPracticed: ["Parallel parking", "Highway"],
            performanceRating: 4,
            notes: "Good progress",
            instructorId: "uuid",
            createdAt: "ISO timestamp"
        }
    ],
    emergencyContact: {
        name: "Jane Doe",
        phone: "+1234567890",
        relationship: "Spouse"
    }
}
```

### Booking Object
```javascript
{
    id: "uuid",
    date: "2025-11-15",           // YYYY-MM-DD format
    startTime: "10:00",           // HH:MM 24-hour format
    endTime: "11:00",             // HH:MM 24-hour format
    customerId: "uuid",           // Foreign key to customer
    staffId: "uuid",              // Foreign key to staff
    resourceIds: ["uuid"],        // Array of resource IDs
    serviceId: "uuid",            // Foreign key to service
    fee: 50.00,                   // Calculated fee
    status: "Scheduled",          // Enum: Scheduled|Completed|Cancelled|Pending
    paymentStatus: "Unpaid",      // Enum: Paid|Unpaid|Paid (Credit)|Partially Paid
    transactionId: "uuid",        // Foreign key to transaction (if paid)
    notes: "Pick up from home",   // Freeform notes

    // Tour-specific fields
    groupSize: 8,                 // Number of participants
    participants: [               // Array of names
        "John Doe",
        "Jane Smith"
    ],
    specialRequirements: "Wheelchair accessible",
    waiverSigned: true,
    waiverSignedDate: "2025-11-05T10:30:00Z",

    // Multi-day tour fields
    isMultidayTour: false,
    endDate: "2025-11-18",        // For multi-day tours
    accommodation: "Grand Hotel",
    multidayGroupId: "uuid",      // Links related bookings

    // Recurring booking fields
    recurringGroupId: "uuid",     // Links recurring instances
    isRecurring: false,

    // Metadata
    createdAt: "ISO timestamp",
    updatedAt: "ISO timestamp",
    reminderSent: false,
    reminderSentAt: "ISO timestamp"
}
```

### Service Object
```javascript
{
    id: "uuid",
    service_name: "1-Hour Standard Lesson",
    service_type: "DRIVING_LESSON",  // Enum: DRIVING_LESSON|TOUR
    duration_minutes: 60,
    base_price: 50.00,
    capacity: 4,                    // Maximum occupancy

    // Pricing configuration
    pricing_rules: {
        type: "fixed",              // Enum: fixed|tiered
        tiers: [                    // Only for tiered pricing
            {
                minSize: 1,
                maxSize: 5,
                price: 100
            },
            {
                minSize: 6,
                maxSize: 15,
                price: 80
            }
        ]
    },

    // Tour-specific fields
    description: "Long description...",
    photos: ["https://example.com/photo1.jpg"],

    // Lesson-specific fields
    lessonType: "STANDARD",         // Enum: STANDARD|INTENSIVE|CRASH

    // Metadata
    isActive: true,
    createdAt: "ISO timestamp"
}
```

### Staff Object
```javascript
{
    id: "uuid",
    name: "Ray Ryan",
    email: "ray@driving.com",
    phone: "+1234567890",
    staff_type: "INSTRUCTOR",       // Enum: INSTRUCTOR|GUIDE|ADMIN
    hireDate: "2020-01-01",

    // Instructor-specific fields
    licenseNumber: "DL12345",
    licenseExpiry: "2026-12-31",

    // Guide-specific fields
    guide_qualifications: {
        languages: ["English", "Spanish"],
        specializations: ["History", "Nature"],
        certifications: "Tour Guide License, First Aid",
        certificationExpiry: "2026-06-30",
        rating: 4.8                 // 0-5 stars
    },

    // Metadata
    isActive: true,
    notes: "Prefers morning shifts"
}
```

### Resource Object
```javascript
{
    id: "uuid",
    name: "Vehicle 1",
    type: "VEHICLE",                // Enum: VEHICLE|EQUIPMENT
    capacity: 4,

    // Vehicle-specific fields
    registration: "ABC-123",
    make: "Toyota",
    model: "Corolla",
    year: 2020,
    color: "Blue",
    insuranceExpiry: "2026-03-31",
    serviceDue: "2025-12-01",
    lastServiceDate: "2025-06-01",

    // Equipment-specific fields (for tours)
    equipmentType: "Tour Bus",

    // Metadata
    isActive: true,
    notes: "Air conditioning faulty"
}
```

### Transaction Object
```javascript
{
    id: "uuid",
    customerId: "uuid",
    bookingIds: ["uuid"],           // Can link to multiple bookings (bulk payment)
    amount: 50.00,
    paymentMethod: "Cash",          // Enum: Cash|Card|Bank Transfer|Credit
    paymentDate: "2025-11-05",
    notes: "Paid in full",
    createdAt: "ISO timestamp"
}
```

### Expense Object
```javascript
{
    id: "uuid",
    date: "2025-11-05",
    amount: 80.00,
    category: "Fuel",               // Enum: Fuel|Maintenance|Insurance|Marketing|Other
    description: "Fuel for Vehicle 1",
    receiptUrl: "https://...",
    createdAt: "ISO timestamp"
}
```

### BlockedPeriod Object
```javascript
{
    id: "uuid",
    staffId: "uuid",
    startDate: "2025-12-20",
    endDate: "2025-12-31",
    reason: "Christmas vacation",
    type: "VACATION"                // Enum: VACATION|SICK|TRAINING|OTHER
}
```

### WaitingListEntry Object
```javascript
{
    id: "uuid",
    customerId: "uuid",
    serviceId: "uuid",
    preferredDate: "2025-11-20",
    preferredTime: "10:00",
    flexibleDate: true,
    notes: "Any morning slot",
    addedDate: "2025-11-05",
    notified: false
}
```

---

## Core Functions

### State Management
**Location:** `script.js:1758-1902`

#### loadState()
**Purpose:** Load entire state from LocalStorage on app init
**Location:** `script.js:1758`

```javascript
function loadState() {
    const saved = localStorage.getItem('rayRyanState');
    if (saved) {
        const parsed = JSON.parse(saved);
        // Deep merge with default state
        Object.assign(state, parsed);
    }
    // Run migrations for backward compatibility
    runDataMigration();
}
```

**Error Handling:**
- Catches JSON parse errors
- Falls back to empty state if corrupted
- Logs warnings to console

---

#### saveState()
**Purpose:** Save entire state to LocalStorage
**Location:** `script.js:1856`

```javascript
function saveState() {
    try {
        const serialized = JSON.stringify(state);
        localStorage.setItem('rayRyanState', serialized);
        console.log('State saved successfully');
    } catch (error) {
        console.error('Failed to save state:', error);
        // Show user notification if quota exceeded
        if (error.name === 'QuotaExceededError') {
            showToast('Storage quota exceeded. Please download backup and clear old data.');
        }
    }
}
```

**Storage Size:** Typically 50-200 KB depending on data volume

---

#### debouncedSaveState()
**Purpose:** Prevent excessive LocalStorage writes
**Location:** `script.js:1846`

```javascript
let saveTimeout = null;

function debouncedSaveState() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveState();
    }, 500); // Wait 500ms after last change
}
```

**Usage:** Called after every state modification instead of `saveState()`

---

### Utility Functions
**Location:** `script.js:0-152, 5841-5936`

#### generateUUID()
**Purpose:** Create unique identifiers
**Location:** `script.js:71`

```javascript
function generateUUID() {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        // Cryptographically secure UUID v4
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }
    // Fallback for old browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
```

**Format:** `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx` (UUID v4)
**Collision Probability:** ~1 in 10^36

---

#### parseYYYYMMDD(dateString)
**Purpose:** Parse date strings to Date objects
**Location:** `script.js:53`

```javascript
function parseYYYYMMDD(dateString) {
    if (!dateString) return null;
    const parts = dateString.split('-');
    if (parts.length !== 3) return null;
    // Month is 0-indexed in JavaScript
    return new Date(parts[0], parts[1] - 1, parts[2]);
}
```

**Input:** `"2025-11-15"` (YYYY-MM-DD)
**Output:** `Date` object or `null`

---

#### safeDateFormat(dateString, options)
**Purpose:** Format dates with null safety
**Location:** `script.js:62`

```javascript
function safeDateFormat(dateString, options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
}) {
    const parsed = parseYYYYMMDD(dateString);
    if (!parsed || isNaN(parsed.getTime())) {
        console.warn('Invalid date format:', dateString);
        return 'Invalid Date';
    }
    return parsed.toLocaleDateString('en-GB', options);
}
```

**Example:**
- Input: `"2025-11-15"`
- Output: `"15 Nov 2025"`

---

#### timeToMinutes(timeStr)
**Purpose:** Convert HH:MM to minutes since midnight
**Location:** `script.js:5881`

```javascript
function timeToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const parts = timeStr.split(':');
    if (parts.length !== 2) return 0;
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) return 0;
    return hours * 60 + minutes;
}
```

**Example:**
- Input: `"14:30"`
- Output: `870` (14*60 + 30)

---

#### minutesToTime(totalMinutes)
**Purpose:** Convert minutes to HH:MM format
**Location:** `script.js:5914`

```javascript
function minutesToTime(totalMinutes) {
    if (!totalMinutes || isNaN(totalMinutes)) return '00:00';

    // Clamp to valid range
    totalMinutes = Math.max(0, Math.min(1439, totalMinutes));

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
```

**Example:**
- Input: `870`
- Output: `"14:30"`

---

#### isTimeOverlapping(start1, end1, start2, end2)
**Purpose:** Check if two time ranges overlap
**Location:** `script.js:5933`

```javascript
function isTimeOverlapping(start1, end1, start2, end2) {
    const s1 = timeToMinutes(start1);
    const e1 = timeToMinutes(end1);
    const s2 = timeToMinutes(start2);
    const e2 = timeToMinutes(end2);

    // Overlap if: start2 is before end1 AND end2 is after start1
    return s2 < e1 && e2 > s1;
}
```

**Logic:** Two ranges overlap if they have any common time

---

## Booking System

### Core Functions
**Location:** `script.js:3728-4226, 4930-5040`

#### saveBooking(event)
**Purpose:** Create or update a booking
**Location:** `script.js:4198` (calls finalizeSaveBooking)

**Flow:**
```
1. Prevent form submission
2. Extract form data
3. Validate required fields
4. Check for conflicts (findBookingConflict)
5. Calculate fee (calculateBookingFee)
6. If recurring:
   ├─ Generate dates (generateRecurringDates)
   └─ Create multiple bookings
7. Else:
   └─ Create single booking
8. Save to state
9. Call debouncedSaveState()
10. Refresh calendar view
11. Close modal
12. Show success toast
```

**Validation:**
- Customer must be selected
- Service must be selected
- Staff must be selected
- Date must be valid future date
- Start time < End time
- No double-booking (unless overridden)

**Example:**
```javascript
const bookingData = {
    id: existingId || generateUUID(),
    date: document.getElementById('booking-date').value,
    startTime: document.getElementById('start-time').value,
    endTime: document.getElementById('end-time').value,
    customerId: document.getElementById('customer-select').value,
    staffId: document.getElementById('staff-select').value,
    resourceIds: [document.getElementById('resource-select').value],
    serviceId: document.getElementById('service-select').value,
    fee: parseFloat(document.getElementById('booking-fee').value),
    status: document.getElementById('booking-status').value,
    paymentStatus: document.getElementById('payment-status').value,
    notes: document.getElementById('booking-notes').value,
    createdAt: existingBooking?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
};
```

---

#### findBookingConflict(bookingDetails)
**Purpose:** Detect scheduling conflicts
**Location:** `script.js:3731`

**Algorithm:**
```javascript
function findBookingConflict(bookingDetails) {
    const { id, date, startTime, endTime, staffId, resourceIds } = bookingDetails;

    for (const existing of state.bookings) {
        // Skip self when editing
        if (existing.id === id) continue;

        // Must be same date
        if (existing.date !== date) continue;

        // Skip cancelled bookings
        if (existing.status === 'Cancelled') continue;

        // Check time overlap
        if (!isTimeOverlapping(startTime, endTime, existing.startTime, existing.endTime)) {
            continue;
        }

        // CONFLICT: Same staff, overlapping time
        if (existing.staffId === staffId) {
            return {
                type: 'STAFF_CONFLICT',
                conflictingBooking: existing,
                message: `${staff.name} is already booked at this time`
            };
        }

        // CONFLICT: Same resource, overlapping time
        if (resourceIds.some(rid => existing.resourceIds.includes(rid))) {
            return {
                type: 'RESOURCE_CONFLICT',
                conflictingBooking: existing,
                message: `Resource is already booked at this time`
            };
        }
    }

    return null; // No conflict
}
```

**Conflict Types:**
1. **STAFF_CONFLICT:** Same instructor/guide at same time
2. **RESOURCE_CONFLICT:** Same vehicle/equipment at same time

**User Experience:**
- Modal shows conflict warning
- Lists conflicting booking details
- Option to override (creates anyway with warning)
- Option to cancel and reschedule

---

#### checkAdjacentBookings(bookingDetails)
**Purpose:** Warn about back-to-back bookings with no break
**Location:** `script.js:3783`

**Logic:**
```javascript
// Find bookings ending when this one starts
const before = state.bookings.find(b =>
    b.date === date &&
    b.staffId === staffId &&
    b.endTime === startTime
);

// Find bookings starting when this one ends
const after = state.bookings.find(b =>
    b.date === date &&
    b.staffId === staffId &&
    b.startTime === endTime
);

if (before || after) {
    return {
        type: 'ADJACENT_WARNING',
        message: 'No break time between bookings',
        severity: 'warning'  // Not blocking
    };
}
```

**Purpose:** Warn staff about no buffer time for travel, preparation, etc.

---

#### generateRecurringDates(startDate, type, count, untilDate)
**Purpose:** Generate array of dates for recurring bookings
**Location:** `script.js:3853`

**Parameters:**
- `startDate`: "2025-11-15"
- `type`: "daily", "weekly", "monthly", "custom"
- `count`: Number of occurrences
- `untilDate`: End date (alternative to count)

**Algorithm:**
```javascript
function generateRecurringDates(startDate, type, count, untilDate) {
    const dates = [];
    let current = parseYYYYMMDD(startDate);

    if (type === 'daily') {
        for (let i = 0; i < count; i++) {
            dates.push(toLocalDateString(current));
            current.setDate(current.getDate() + 1);
        }
    } else if (type === 'weekly') {
        for (let i = 0; i < count; i++) {
            dates.push(toLocalDateString(current));
            current.setDate(current.getDate() + 7);
        }
    } else if (type === 'monthly') {
        for (let i = 0; i < count; i++) {
            dates.push(toLocalDateString(current));
            current.setMonth(current.getMonth() + 1);
        }
    }

    // Filter by untilDate if provided
    if (untilDate) {
        const until = parseYYYYMMDD(untilDate);
        return dates.filter(d => parseYYYYMMDD(d) <= until);
    }

    return dates;
}
```

**Output:** Array of date strings in YYYY-MM-DD format

---

#### deleteBooking(bookingId, context)
**Purpose:** Remove a booking from state
**Location:** `script.js:4227`

**Flow:**
```
1. Find booking by ID
2. Confirm deletion (if has payment)
3. Remove from state.bookings
4. Save state
5. Check waiting list (checkWaitingListFor)
6. Notify waiting list customers
7. Refresh view
8. Show toast
```

**Waiting List Integration:**
- When booking cancelled, check if anyone on waiting list wants that slot
- If match found, show notification to call customer

---

### Booking Modals
**Location:** `script.js:4930-5040`

#### openBookingModal(date, bookingId, startTime, endTime)
**Purpose:** Open modal for creating/editing booking
**Location:** `script.js:4930`

**Create Mode (bookingId = null):**
```javascript
// Pre-fill date and times if provided
document.getElementById('booking-date').value = date || toLocalDateString(new Date());
document.getElementById('start-time').value = startTime || '10:00';
document.getElementById('end-time').value = endTime || '11:00';

// Clear other fields
document.getElementById('booking-id').value = '';
document.getElementById('customer-select').value = '';
// ... etc
```

**Edit Mode (bookingId provided):**
```javascript
const booking = state.bookings.find(b => b.id === bookingId);

// Populate all fields from existing booking
document.getElementById('booking-id').value = booking.id;
document.getElementById('booking-date').value = booking.date;
document.getElementById('start-time').value = booking.startTime;
document.getElementById('end-time').value = booking.endTime;
document.getElementById('customer-select').value = booking.customerId;
// ... etc

// Show delete button
document.getElementById('delete-booking-btn').style.display = 'block';
```

---

#### closeBookingModal()
**Purpose:** Close and reset booking modal
**Location:** `script.js:5040`

```javascript
function closeBookingModal() {
    // Hide modal
    document.getElementById('booking-modal').classList.add('hidden');

    // Reset form
    document.getElementById('booking-form').reset();

    // Clear validation errors
    clearValidationErrors();
}
```

---

## Customer Management

### Core Functions
**Location:** `script.js:4269-4380`

#### saveCustomer(event)
**Purpose:** Create or update customer
**Location:** `script.js:4269`

**Flow:**
```
1. Prevent form submission
2. Extract and sanitize form data
3. Validate email format
4. Validate phone number
5. If new customer:
   ├─ Generate UUID
   ├─ Set dateJoined
   └─ Add to state.customers
6. If editing:
   ├─ Find existing customer
   └─ Update fields
7. Save state
8. Refresh customer view
9. Close modal
10. Show toast
```

**Data Extraction:**
```javascript
const customerData = {
    id: existingId || generateUUID(),
    name: sanitizeHTML(document.getElementById('customer-name').value),
    email: sanitizeHTML(document.getElementById('customer-email').value),
    phone: sanitizeHTML(document.getElementById('customer-phone').value),
    address: sanitizeHTML(document.getElementById('customer-address').value),
    notes: sanitizeHTML(document.getElementById('customer-notes').value),
    dateJoined: existing?.dateJoined || toLocalDateString(new Date()),
    packageCredits: existing?.packageCredits || 0,
    progressNotes: existing?.progressNotes || []
};
```

---

#### deleteCustomer(customerId)
**Purpose:** Remove customer and associated data
**Location:** `script.js:4381`

**Cascade Delete:**
```javascript
function deleteCustomer(customerId) {
    // Find customer
    const customer = state.customers.find(c => c.id === customerId);

    // Find related bookings
    const relatedBookings = state.bookings.filter(b => b.customerId === customerId);

    // Warn if bookings exist
    if (relatedBookings.length > 0) {
        const confirmed = confirm(
            `This customer has ${relatedBookings.length} booking(s). ` +
            `Delete customer and all bookings?`
        );
        if (!confirmed) return;
    }

    // Delete customer
    state.customers = state.customers.filter(c => c.id !== customerId);

    // Delete related bookings
    state.bookings = state.bookings.filter(b => b.customerId !== customerId);

    // Delete related transactions
    state.transactions = state.transactions.filter(t => t.customerId !== customerId);

    // Save and refresh
    saveState();
    refreshCurrentView();
    showToast('Customer deleted');
}
```

---

### Progress Tracking
**Location:** `script.js:4552-4859`

#### saveProgressNote(customerId)
**Purpose:** Add progress note to customer
**Location:** `script.js:4552`

**Data Structure:**
```javascript
const progressNote = {
    id: generateUUID(),
    date: document.getElementById('progress-date').value,
    bookingId: document.getElementById('progress-booking').value,
    skillsPracticed: getSelectedSkills(),  // Array of skill names
    performanceRating: parseInt(document.getElementById('performance-rating').value),
    notes: sanitizeHTML(document.getElementById('progress-notes').value),
    instructorId: getCurrentInstructorId(),
    createdAt: new Date().toISOString()
};

customer.progressNotes.push(progressNote);
```

**Skills List:**
- Parallel parking
- Highway driving
- Night driving
- Defensive driving
- Reverse parking
- Three-point turn
- Emergency stop
- Lane changes
- Roundabouts
- Traffic signs

---

#### calculateStudentProgress(customerId)
**Purpose:** Calculate overall progress percentage
**Location:** `script.js:4590`

**Algorithm:**
```javascript
function calculateStudentProgress(customerId) {
    const customer = state.customers.find(c => c.id === customerId);
    const bookings = state.bookings.filter(b =>
        b.customerId === customerId &&
        b.status === 'Completed'
    );
    const notes = customer.progressNotes || [];

    // Calculate metrics
    const totalLessons = bookings.length;
    const totalSkills = getAllSkills().length;
    const masteredSkills = getMasteredSkills(notes).length;
    const avgRating = getAverageRating(notes);

    // Progress formula
    const skillProgress = (masteredSkills / totalSkills) * 100;
    const lessonProgress = Math.min((totalLessons / 20) * 100, 100);  // 20 lessons = 100%
    const ratingProgress = (avgRating / 5) * 100;

    // Weighted average
    const overallProgress = (
        skillProgress * 0.4 +    // 40% weight on skills
        lessonProgress * 0.3 +   // 30% weight on lessons
        ratingProgress * 0.3     // 30% weight on ratings
    );

    return {
        overallProgress: Math.round(overallProgress),
        totalLessons,
        masteredSkills,
        totalSkills,
        avgRating,
        estimatedTestReady: overallProgress >= 80
    };
}
```

---

#### renderStudentProgressDashboard(customerId)
**Purpose:** Render visual progress dashboard
**Location:** `script.js:4664`

**Components:**
- **Progress Ring:** Circular progress indicator
- **Skills Chart:** Bar chart of mastered vs remaining skills
- **Lesson Timeline:** List of completed lessons
- **Performance Trend:** Line chart of ratings over time
- **Next Steps:** Recommendations based on progress

---

## Service Management

### Pricing Calculations
**Location:** `script.js:6083-6130`

#### calculateBookingFee(serviceId, groupSize)
**Purpose:** Calculate booking fee based on service and group size
**Location:** `script.js:6083`

**Algorithm:**
```javascript
function calculateBookingFee(serviceId, groupSize = null) {
    const service = state.services.find(s => s.id === serviceId);
    if (!service) return 0;

    const pricingRules = service.pricing_rules;

    // FIXED PRICING
    if (pricingRules.type === 'fixed') {
        return service.base_price;
    }

    // TIERED PRICING (for tours)
    if (pricingRules.type === 'tiered' && groupSize) {
        // Find matching tier
        const tier = pricingRules.tiers.find(t =>
            groupSize >= t.minSize && groupSize <= t.maxSize
        );

        if (tier) {
            // Price per person × group size
            return tier.price * groupSize;
        }

        // Fallback to highest tier if exceeds
        const highestTier = pricingRules.tiers[pricingRules.tiers.length - 1];
        return highestTier.price * groupSize;
    }

    // Default to base price
    return service.base_price;
}
```

**Examples:**

**Fixed Pricing:**
```javascript
// Service: 1-hour lesson at £50
calculateBookingFee('lesson-1hr', null)  // Returns: 50
```

**Tiered Pricing:**
```javascript
// Service: Tour with tiers:
// 1-5 people: £100/person
// 6-15 people: £80/person
// 16+ people: £60/person

calculateBookingFee('city-tour', 3)   // Returns: 300  (3 × £100)
calculateBookingFee('city-tour', 8)   // Returns: 640  (8 × £80)
calculateBookingFee('city-tour', 20)  // Returns: 1200 (20 × £60)
```

---

#### updateGroupPricing()
**Purpose:** Real-time price update when group size changes
**Location:** `script.js:6125`

```javascript
function updateGroupPricing() {
    const serviceId = document.getElementById('service-select').value;
    const groupSize = parseInt(document.getElementById('group-size').value) || 1;

    const fee = calculateBookingFee(serviceId, groupSize);

    // Update fee input
    document.getElementById('booking-fee').value = fee.toFixed(2);

    // Show pricing breakdown
    const pricePerPerson = fee / groupSize;
    document.getElementById('price-breakdown').innerHTML = `
        ${groupSize} × £${pricePerPerson.toFixed(2)} = £${fee.toFixed(2)}
    `;
}
```

**Triggered By:**
- Service selection change
- Group size input change

---

## Calendar System

### Rendering Functions
**Location:** `script.js:2646-2916`

#### renderCalendarContainer()
**Purpose:** Main calendar rendering dispatcher
**Location:** `script.js:2646`

**Flow:**
```javascript
function renderCalendarContainer() {
    const view = state.currentView || 'day';  // day|week|month
    const date = state.currentDate || new Date();

    // Render header (navigation, date display)
    renderCalendarHeader(date, view);

    // Render appropriate view
    if (view === 'day') {
        renderDayView(date);
    } else if (view === 'week') {
        renderWeekView(date);
    } else if (view === 'month') {
        renderMonthView(date);
    }
}
```

---

#### renderDayView(date)
**Purpose:** Render single day timeline with bookings
**Location:** `script.js:2742`

**Algorithm:**
```
1. Get all bookings for selected date
2. Sort bookings by start time
3. Assign columns to avoid overlaps (assignColumns)
4. Create time slot grid (7:00 AM - 9:00 PM)
5. For each booking:
   ├─ Calculate top position (based on start time)
   ├─ Calculate height (based on duration)
   ├─ Calculate width and left position (based on column)
   └─ Render booking block with details
6. Add click handlers
```

**HTML Structure:**
```html
<div class="calendar-day">
    <div class="time-slots">
        <div class="time-slot" data-time="07:00">7:00 AM</div>
        <div class="time-slot" data-time="08:00">8:00 AM</div>
        <!-- ... -->
    </div>
    <div class="bookings-container">
        <div class="booking-block"
             style="top: 180px; height: 60px; left: 0%; width: 100%;"
             data-booking-id="uuid">
            <div class="booking-customer">John Doe</div>
            <div class="booking-time">10:00 - 11:00</div>
            <div class="booking-service">1-Hour Lesson</div>
        </div>
        <!-- More bookings... -->
    </div>
</div>
```

**Positioning Logic:**
```javascript
// Time 10:00 AM = 10 * 60 = 600 minutes since midnight
// Calendar starts at 7:00 AM = 7 * 60 = 420 minutes
// Pixel height per minute = 60px per hour / 60 = 1px per minute

const startMinutes = timeToMinutes(booking.startTime);
const endMinutes = timeToMinutes(booking.endTime);
const calendarStartMinutes = 7 * 60;  // 7:00 AM

const top = (startMinutes - calendarStartMinutes);  // Pixels from top
const height = (endMinutes - startMinutes);          // Duration in pixels
```

---

#### assignColumns(bookings)
**Purpose:** Assign column positions to overlapping bookings
**Location:** `script.js:2702`

**Algorithm:**
```javascript
function assignColumns(bookings) {
    // Sort by start time
    bookings.sort((a, b) =>
        timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    const columns = [];

    for (const booking of bookings) {
        // Find first available column (no overlap)
        let columnIndex = 0;
        while (columnIndex < columns.length) {
            const column = columns[columnIndex];
            const overlaps = column.some(b =>
                isTimeOverlapping(
                    booking.startTime, booking.endTime,
                    b.startTime, b.endTime
                )
            );
            if (!overlaps) break;
            columnIndex++;
        }

        // Create new column if needed
        if (columnIndex === columns.length) {
            columns.push([]);
        }

        // Add booking to column
        columns[columnIndex].push(booking);
        booking.column = columnIndex;
        booking.totalColumns = columns.length;
    }

    // Update total columns for all bookings
    for (const booking of bookings) {
        booking.totalColumns = columns.length;
    }

    return bookings;
}
```

**Visual Result:**
```
Time   Column 0      Column 1      Column 2
09:00  [Booking A]
09:30  [Booking A]   [Booking B]
10:00                [Booking B]   [Booking C]
10:30                              [Booking C]
```

Each booking gets:
- `column`: Which column (0, 1, 2, ...)
- `totalColumns`: How many columns needed
- Width = `100% / totalColumns`
- Left = `(column / totalColumns) * 100%`

---

#### renderWeekView(date)
**Purpose:** Render 7-day week grid
**Location:** `script.js:2781`

**Structure:**
```
Mon   Tue   Wed   Thu   Fri   Sat   Sun
07:00
08:00 [B1]                     [B3]
09:00       [B2]
10:00
```

Each day column renders like a mini day view.

---

#### renderMonthView(date)
**Purpose:** Render month calendar grid
**Location:** `script.js:2855`

**Grid Generation:**
```javascript
// Get first day of month
const firstDay = new Date(year, month, 1);
const startDay = firstDay.getDay();  // 0 = Sunday

// Get last day of month
const lastDate = new Date(year, month + 1, 0).getDate();

// Build grid (6 rows × 7 columns = 42 cells)
const cells = [];

// Fill previous month's days
for (let i = 0; i < startDay; i++) {
    cells.push({ date: null, isCurrentMonth: false });
}

// Fill current month's days
for (let day = 1; day <= lastDate; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const bookingsCount = state.bookings.filter(b => b.date === dateStr).length;

    cells.push({
        date: day,
        dateStr,
        bookingsCount,
        isCurrentMonth: true,
        isToday: dateStr === toLocalDateString(new Date())
    });
}

// Fill next month's days
while (cells.length < 42) {
    cells.push({ date: null, isCurrentMonth: false });
}
```

**Cell Rendering:**
```html
<div class="calendar-cell" data-date="2025-11-15">
    <div class="cell-date">15</div>
    <div class="cell-bookings">5 bookings</div>
    <div class="booking-dots">
        <span class="dot green"></span>  <!-- Completed -->
        <span class="dot blue"></span>   <!-- Scheduled -->
        <span class="dot red"></span>    <!-- Cancelled -->
    </div>
</div>
```

---

## Billing & Payments

### Functions
**Location:** `script.js:3214-3540`

#### getCustomerSummaries()
**Purpose:** Calculate billing summary for all customers
**Location:** `script.js:3238`

**Output:**
```javascript
[
    {
        customerId: "uuid",
        customerName: "John Doe",
        totalBookings: 10,
        totalFees: 500.00,
        totalPaid: 450.00,
        balance: 50.00,             // Positive = owed, Negative = credit
        overdueBookings: 1,
        daysOverdue: 5,
        packageCredits: 3,
        lastBookingDate: "2025-11-05"
    },
    // ... more customers
]
```

**Calculation:**
```javascript
function getCustomerSummaries() {
    const summaries = [];

    for (const customer of state.customers) {
        const bookings = state.bookings.filter(b => b.customerId === customer.id);
        const transactions = state.transactions.filter(t => t.customerId === customer.id);

        const totalFees = bookings.reduce((sum, b) => sum + b.fee, 0);
        const totalPaid = transactions.reduce((sum, t) => sum + t.amount, 0);
        const balance = totalFees - totalPaid;

        const overdueBookings = bookings.filter(b =>
            b.paymentStatus === 'Unpaid' &&
            parseYYYYMMDD(b.date) < new Date()
        );

        summaries.push({
            customerId: customer.id,
            customerName: customer.name,
            totalBookings: bookings.length,
            totalFees,
            totalPaid,
            balance,
            overdueBookings: overdueBookings.length,
            packageCredits: customer.packageCredits || 0,
            lastBookingDate: bookings[bookings.length - 1]?.date
        });
    }

    // Sort by balance descending (highest owed first)
    return summaries.sort((a, b) => b.balance - a.balance);
}
```

---

#### recordBulkPayment(customerId)
**Purpose:** Record payment for multiple bookings at once
**Location:** `script.js:3443`

**Flow:**
```
1. Get selected booking IDs (checkboxes)
2. Calculate total amount owed
3. Get payment amount from form
4. Validate: amount > 0
5. Create single transaction
6. Distribute payment across bookings
7. Update booking payment statuses
8. Handle overpayment (credit to customer)
9. Save state
10. Refresh billing view
```

**Payment Distribution:**
```javascript
let remainingPayment = paymentAmount;
const selectedBookings = getSelectedBookings();

for (const booking of selectedBookings) {
    const amountOwed = booking.fee - (booking.amountPaid || 0);

    if (remainingPayment >= amountOwed) {
        // Full payment for this booking
        booking.paymentStatus = 'Paid';
        booking.amountPaid = booking.fee;
        remainingPayment -= amountOwed;
    } else {
        // Partial payment
        booking.paymentStatus = 'Partially Paid';
        booking.amountPaid = (booking.amountPaid || 0) + remainingPayment;
        remainingPayment = 0;
        break;
    }
}

// If payment exceeds owed amount
if (remainingPayment > 0) {
    customer.creditBalance = (customer.creditBalance || 0) + remainingPayment;
    showToast(`£${remainingPayment.toFixed(2)} added as credit`);
}
```

---

### Package Management
**Location:** `script.js:5437-5540`

#### confirmSale(event)
**Purpose:** Sell lesson package to customer
**Location:** `script.js:5495`

**Flow:**
```
1. Get selected package
2. Calculate price
3. Get payment amount
4. Validate payment
5. Add credits to customer
6. Create transaction record
7. Update customer.packageCredits
8. Save state
9. Show confirmation
```

**Data:**
```javascript
const packageData = {
    id: 'pkg-10',
    name: '10-Lesson Package',
    credits: 10,
    price: 400.00,        // Normally £50 × 10 = £500
    discount: 100.00      // £100 off
};

// When sold:
customer.packageCredits += packageData.credits;

const transaction = {
    id: generateUUID(),
    customerId: customer.id,
    amount: paymentAmount,
    paymentMethod: 'Card',
    paymentDate: toLocalDateString(new Date()),
    notes: `Package: ${packageData.name}`,
    packageId: packageData.id,
    createdAt: new Date().toISOString()
};
```

---

## Tour Features

### Functions
**Location:** `script.js:6927-6992, 6131-6140`

#### getTourAnalytics()
**Purpose:** Calculate tour-specific metrics
**Location:** `script.js:6927`

**Output:**
```javascript
{
    totalTours: 45,
    totalParticipants: 380,
    totalRevenue: 28500.00,
    averageGroupSize: 8.4,
    occupancyRate: 68,              // % of capacity used
    waiverComplianceRate: 94,       // % with signed waivers
    popularTours: [
        { serviceName: "City Tour", count: 25 },
        { serviceName: "Nature Hike", count: 12 },
        // ...
    ],
    revenueByTour: [
        { serviceName: "City Tour", revenue: 15000 },
        // ...
    ],
    monthlyParticipants: [
        { month: "January", participants: 45 },
        { month: "February", participants: 52 },
        // ...
    ]
}
```

**Calculation:**
```javascript
function getTourAnalytics() {
    // Filter tour bookings only
    const tourBookings = state.bookings.filter(b => {
        const service = state.services.find(s => s.id === b.serviceId);
        return service && service.service_type === 'TOUR';
    });

    const totalParticipants = tourBookings.reduce((sum, b) =>
        sum + (b.groupSize || 0), 0
    );

    const totalCapacity = tourBookings.reduce((sum, b) => {
        const service = state.services.find(s => s.id === b.serviceId);
        return sum + (service?.capacity || 0);
    }, 0);

    const waiverSigned = tourBookings.filter(b => b.waiverSigned).length;

    return {
        totalTours: tourBookings.length,
        totalParticipants,
        totalRevenue: tourBookings.reduce((sum, b) => sum + b.fee, 0),
        averageGroupSize: totalParticipants / tourBookings.length,
        occupancyRate: Math.round((totalParticipants / totalCapacity) * 100),
        waiverComplianceRate: Math.round((waiverSigned / tourBookings.length) * 100),
        // ... more metrics
    };
}
```

---

#### toggleMultidayOptions()
**Purpose:** Show/hide multi-day tour fields
**Location:** `script.js:6131`

```javascript
function toggleMultidayOptions() {
    const isMultiday = document.getElementById('is-multiday-tour').checked;
    const multidayFields = document.getElementById('multiday-fields');

    if (isMultiday) {
        multidayFields.classList.remove('hidden');
        // End date required
        document.getElementById('tour-end-date').required = true;
    } else {
        multidayFields.classList.add('hidden');
        document.getElementById('tour-end-date').required = false;
    }
}
```

---

## Reports & Analytics

### Functions
**Location:** `script.js:6706-7135`

#### getReportsData()
**Purpose:** Extract all report data for current date range
**Location:** `script.js:6706`

**Returns:**
```javascript
{
    // Income data
    totalRevenue: 15000.00,
    totalExpenses: 3000.00,
    netProfit: 12000.00,
    revenueByMonth: [
        { month: "Jan", revenue: 5000 },
        { month: "Feb", revenue: 6000 },
        // ...
    ],

    // Booking data
    totalBookings: 150,
    completedBookings: 140,
    cancelledBookings: 5,
    pendingBookings: 5,

    // Service popularity
    servicePopularity: [
        { serviceName: "1-Hour Lesson", count: 80, revenue: 4000 },
        { serviceName: "City Tour", count: 45, revenue: 6750 },
        // ...
    ],

    // Staff performance
    staffPerformance: [
        {
            staffName: "Ray Ryan",
            bookings: 75,
            revenue: 3750,
            hoursWorked: 75,
            avgRating: 4.8
        },
        // ...
    ],

    // Payment status
    totalPaid: 13500.00,
    totalUnpaid: 1500.00,
    overdueAmount: 300.00,

    // Tour analytics (if applicable)
    tourAnalytics: getTourAnalytics()
}
```

---

#### generateCharts()
**Purpose:** Create all Chart.js visualizations
**Location:** `script.js:6993`

**Charts Created:**
1. **Revenue by Month** (Line Chart)
2. **Revenue by Service** (Doughnut Chart)
3. **Service Popularity** (Bar Chart)
4. **Staff Performance** (Horizontal Bar Chart)
5. **Expense Breakdown** (Pie Chart)
6. **Booking Status** (Doughnut Chart)

**Example - Revenue by Month:**
```javascript
const ctx = document.getElementById('revenue-chart').getContext('2d');

// Destroy old chart if exists (prevent memory leak)
if (window.revenueChart) {
    window.revenueChart.destroy();
}

window.revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
            label: 'Revenue',
            data: revenueByMonth,  // Array of numbers
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            tension: 0.4  // Smooth curves
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                display: true,
                position: 'top'
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return '£' + context.parsed.y.toFixed(2);
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return '£' + value;
                    }
                }
            }
        }
    }
});
```

---

## Communication System

### Functions
**Location:** `script.js:89-350`

#### sendBookingConfirmationEmail(bookingId)
**Purpose:** Send email confirmation after booking
**Location:** `script.js:169`

**Flow:**
```
1. Get booking details
2. Get customer, staff, service info
3. Format email template
4. Call prepareEmail()
5. Send via EmailJS (if configured)
6. Log to console
7. Mark confirmation sent
```

**Email Template:**
```javascript
function formatBookingConfirmationEmail(booking, customer, staff, service) {
    return `
Dear ${customer.name},

Your booking has been confirmed!

Booking Details:
- Service: ${service.service_name}
- Date: ${safeDateFormat(booking.date)}
- Time: ${booking.startTime} - ${booking.endTime}
- Instructor/Guide: ${staff.name}
- Location: ${state.settings.businessAddress}
- Fee: £${booking.fee.toFixed(2)}

${booking.paymentStatus === 'Paid' ? 'Payment received. Thank you!' : 'Payment due: £' + booking.fee.toFixed(2)}

If you need to reschedule or cancel, please contact us at least 24 hours in advance.

Best regards,
${state.settings.businessName}
${state.settings.businessPhone}
    `.trim();
}
```

---

#### prepareSMSReminder(booking)
**Purpose:** Prepare SMS reminder for booking
**Location:** `script.js:112`

**Template Processing:**
```javascript
function formatSMSMessage(booking, customer, staff) {
    const template = state.settings.smsTemplate ||
        'Hi [CustomerFirstName], reminder for your [ServiceName] on [LessonDate] at [LessonTime]. See you then! - [InstructorName]';

    const service = state.services.find(s => s.id === booking.serviceId);
    const firstName = customer.name.split(' ')[0];

    return template
        .replace('[CustomerFirstName]', firstName)
        .replace('[ServiceName]', service?.service_name || 'booking')
        .replace('[LessonDate]', safeDateFormat(booking.date, { day: 'numeric', month: 'short' }))
        .replace('[LessonTime]', booking.startTime)
        .replace('[InstructorName]', staff?.name || state.settings.instructorName);
}
```

**Example Output:**
```
Hi John, reminder for your 1-Hour Standard Lesson on 15 Nov at 10:00. See you then! - Ray Ryan
```

---

#### checkAndScheduleSMSReminders()
**Purpose:** Find bookings needing reminders
**Location:** `script.js:89`

**Logic:**
```javascript
function checkAndScheduleSMSReminders() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = toLocalDateString(tomorrow);

    // Find bookings for tomorrow that haven't been reminded
    const upcomingBookings = state.bookings.filter(b =>
        b.date === tomorrowStr &&
        b.status === 'Scheduled' &&
        !b.reminderSent
    );

    if (upcomingBookings.length > 0 && state.settings.autoRemindersEnabled) {
        console.log(`Found ${upcomingBookings.length} bookings needing reminders`);

        for (const booking of upcomingBookings) {
            prepareSMSReminder(booking);
        }
    }

    return upcomingBookings.length;
}
```

**Trigger:**
- Manual: "Send Reminders" button
- Automatic: Daily at midnight (if enabled)

---

## Data Persistence

### LocalStorage Functions
**Location:** `script.js:1758-1902`

#### Storage Key
```javascript
const STORAGE_KEY = 'rayRyanState';
```

#### Storage Format
```json
{
  "customers": [...],
  "staff": [...],
  "resources": [...],
  "services": [...],
  "bookings": [...],
  "transactions": [...],
  "expenses": [...],
  "blockedPeriods": [...],
  "waitingList": [...],
  "settings": {...}
}
```

#### Backup/Restore
**Location:** `script.js:6614-6705`

**Download Backup:**
```javascript
function triggerBackupDownload() {
    const dataStr = JSON.stringify(state, null, 2);  // Pretty print
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `rayRyan-backup-${timestamp}.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
    showToast('Backup downloaded');
}
```

**Restore from Backup:**
```javascript
function handleRestore(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const restoredState = JSON.parse(e.target.result);

            // Validate structure
            if (!restoredState.customers || !restoredState.bookings) {
                throw new Error('Invalid backup file');
            }

            // Confirm restore
            if (confirm('This will replace all current data. Continue?')) {
                // Replace state
                Object.assign(state, restoredState);

                // Save to LocalStorage
                saveState();

                // Refresh view
                location.reload();
            }
        } catch (error) {
            alert('Failed to restore backup: ' + error.message);
        }
    };
    reader.readAsText(file);
}
```

---

## Security

### XSS Protection
**Location:** `security.js:1-481, script.js:11-26`

#### sanitizeHTML(value)
**Purpose:** Escape HTML to prevent XSS attacks
**Location:** `security.js` (primary), `script.js:13` (fallback)

**Algorithm:**
```javascript
function sanitizeHTML(value) {
    if (value === null || value === undefined) return '';

    const str = String(value);

    // Character replacements
    return str.replace(/[&<>"'\/]/g, function(tag) {
        const replacements = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
            '/': '&#x2F;'
        };
        return replacements[tag] || tag;
    });
}
```

**Examples:**
```javascript
sanitizeHTML('<script>alert("xss")</script>')
// Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'

sanitizeHTML('John & Jane')
// Returns: 'John &amp; Jane'

sanitizeHTML('<img src=x onerror=alert(1)>')
// Returns: '&lt;img src=x onerror=alert(1)&gt;'
```

**Usage:**
```javascript
// Always sanitize user input before displaying
const name = sanitizeHTML(document.getElementById('customer-name').value);
document.getElementById('display-name').innerHTML = name;
```

---

### Input Validation
**Location:** Throughout `script.js`

**Email Validation:**
```javascript
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}
```

**Phone Validation:**
```javascript
function isValidPhone(phone) {
    // Remove spaces and dashes
    const cleaned = phone.replace(/[\s-]/g, '');
    // Must be 10-15 digits
    return /^\d{10,15}$/.test(cleaned);
}
```

**Date Validation:**
```javascript
function isValidFutureDate(dateStr) {
    const date = parseYYYYMMDD(dateStr);
    if (!date) return false;

    // Must be today or future
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return date >= today;
}
```

---

## API & Integrations

### Google Calendar Export
**Location:** `google-calendar.js:1-329`

#### exportToGoogleCalendar(bookingId)
**Purpose:** Export booking to Google Calendar
**Location:** `google-calendar.js:50`

**OAuth Flow:**
```
1. Check if user authorized
2. If not, trigger OAuth popup
3. User grants calendar access
4. Receive access token
5. Make API request to create event
6. Handle response
```

**Event Format:**
```javascript
const event = {
    summary: `${service.service_name} - ${customer.name}`,
    description: `
        Booking Details:
        - Customer: ${customer.name}
        - Phone: ${customer.phone}
        - Service: ${service.service_name}
        - Fee: £${booking.fee.toFixed(2)}
        - Status: ${booking.status}
        ${booking.notes ? '\\nNotes: ' + booking.notes : ''}
    `.trim(),
    start: {
        dateTime: formatGoogleCalendarDateUTC(booking.date, booking.startTime),
        timeZone: 'Europe/London'
    },
    end: {
        dateTime: formatGoogleCalendarDateUTC(booking.date, booking.endTime),
        timeZone: 'Europe/London'
    },
    location: state.settings.businessAddress,
    attendees: [
        { email: customer.email }
    ],
    reminders: {
        useDefault: false,
        overrides: [
            { method: 'email', minutes: 24 * 60 },  // 24 hours
            { method: 'popup', minutes: 30 }         // 30 minutes
        ]
    }
};
```

---

### EmailJS Integration
**Location:** `script.js:227-249`

#### Configuration
```javascript
// Set in Settings view
state.settings.emailJS = {
    publicKey: 'your_public_key',
    serviceId: 'service_id',
    templateId: 'template_id'
};
```

#### Send Email
```javascript
function prepareEmail(emailData, type, referenceId) {
    if (!state.settings.emailJS?.publicKey) {
        console.warn('EmailJS not configured');
        return;
    }

    // EmailJS SDK call
    emailjs.send(
        state.settings.emailJS.serviceId,
        state.settings.emailJS.templateId,
        {
            to_email: emailData.to,
            subject: emailData.subject,
            message: emailData.body,
            from_name: state.settings.businessName
        },
        state.settings.emailJS.publicKey
    ).then(
        response => {
            console.log('Email sent:', response);
            showToast('Email sent successfully');
        },
        error => {
            console.error('Email failed:', error);
            showToast('Failed to send email');
        }
    );
}
```

---

### Twilio SMS Integration
**Location:** `script.js:89-161`

#### Configuration
```javascript
state.settings.twilio = {
    accountSid: 'AC...',
    authToken: '...',
    fromNumber: '+1234567890'
};
```

#### Send SMS (Requires Backend)
```javascript
// NOTE: Twilio requires server-side call (Auth Token secret)
// Current implementation logs to console only

function sendSMS(toNumber, message) {
    console.log('📱 SMS would be sent:');
    console.log(`To: ${toNumber}`);
    console.log(`Message: ${message}`);

    // In production, call backend API:
    // fetch('/api/send-sms', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ to: toNumber, message })
    // });
}
```

---

## Performance Optimizations

### Debounced Save
Prevents excessive LocalStorage writes:
```javascript
let saveTimeout;
function debouncedSaveState() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveState, 500);
}
```

### Pagination
Billing view uses pagination for large datasets:
```javascript
const BILLING_ITEMS_PER_PAGE = 10;
let currentPage = 1;

function renderBillingPage(page) {
    const start = (page - 1) * BILLING_ITEMS_PER_PAGE;
    const end = start + BILLING_ITEMS_PER_PAGE;
    const pageItems = allItems.slice(start, end);
    // Render only pageItems
}
```

### Chart Cleanup
Prevents memory leaks:
```javascript
if (window.myChart) {
    window.myChart.destroy();
}
window.myChart = new Chart(ctx, config);
```

---

## Error Handling

### Try-Catch Blocks
```javascript
function saveState() {
    try {
        localStorage.setItem('rayRyanState', JSON.stringify(state));
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            showToast('Storage full. Please download backup and clear old data.');
        } else {
            console.error('Save failed:', error);
            showToast('Failed to save data');
        }
    }
}
```

### Null Safety
```javascript
function getCustomerName(customerId) {
    const customer = state.customers.find(c => c.id === customerId);
    return customer?.name || 'Unknown Customer';  // Optional chaining + fallback
}
```

### Validation
```javascript
function validateBookingForm() {
    const errors = [];

    if (!document.getElementById('customer-select').value) {
        errors.push('Customer is required');
    }

    if (!document.getElementById('service-select').value) {
        errors.push('Service is required');
    }

    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;

    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
        errors.push('End time must be after start time');
    }

    if (errors.length > 0) {
        showDialog({
            title: 'Validation Error',
            message: errors.join('<br>'),
            buttons: [{ text: 'OK', onClick: () => closeDialog() }]
        });
        return false;
    }

    return true;
}
```

---

## Appendix: Function Index

### Alphabetical Function Reference

| Function | Location | Purpose |
|----------|----------|---------|
| `addDashboardNotification` | 6325 | Add notification to dashboard |
| `assignColumns` | 2702 | Assign columns to overlapping bookings |
| `calculateBookingFee` | 6083 | Calculate booking price |
| `calculateIncomeAnalytics` | 597 | Calculate income metrics |
| `calculateStudentProgress` | 4590 | Calculate student progress % |
| `changeDate` | 1746 | Navigate calendar dates |
| `checkAdjacentBookings` | 3783 | Warn about back-to-back bookings |
| `checkAndScheduleSMSReminders` | 89 | Find bookings needing reminders |
| `checkOverduePayments` | 1100 | Find overdue payments |
| `checkWaitingListFor` | 6352 | Check waiting list after cancellation |
| `closeBookingModal` | 5040 | Close booking modal |
| `closeCustomerModal` | 5129 | Close customer modal |
| `deleteBooking` | 4227 | Delete a booking |
| `deleteCustomer` | 4381 | Delete a customer |
| `debouncedSaveState` | 1846 | Debounced state save |
| `exportToGoogleCalendar` | 980 | Export booking to Google Calendar |
| `findBookingConflict` | 3731 | Detect scheduling conflicts |
| `finalizeSaveBooking` | 4198 | Save booking to state |
| `formatSMSMessage` | 140 | Format SMS reminder message |
| `generateCharts` | 6993 | Create Chart.js visualizations |
| `generateRecurringDates` | 3853 | Generate recurring booking dates |
| `generateUUID` | 71 | Create unique identifier |
| `getCustomerSummaries` | 3238 | Get billing summaries |
| `getReportsData` | 6706 | Extract all report data |
| `getTourAnalytics` | 6927 | Calculate tour metrics |
| `handleGlobalSearch` | 815 | Handle global search input |
| `isTimeOverlapping` | 5933 | Check if times overlap |
| `loadState` | 1758 | Load state from LocalStorage |
| `minutesToTime` | 5914 | Convert minutes to HH:MM |
| `openBookingModal` | 4930 | Open booking modal |
| `parseYYYYMMDD` | 54 | Parse YYYY-MM-DD date string |
| `prepareSMSReminder` | 113 | Prepare SMS reminder |
| `recordBulkPayment` | 3443 | Record payment for multiple bookings |
| `refreshCurrentView` | 1723 | Re-render current view |
| `renderApp` | 1665 | Initial app render |
| `renderBillingView` | 3214 | Render billing view |
| `renderCalendarContainer` | 2646 | Render calendar |
| `renderDayView` | 2742 | Render day calendar view |
| `renderMonthView` | 2855 | Render month calendar view |
| `renderReportsView` | 3544 | Render reports view |
| `renderStudentProgressDashboard` | 4664 | Render progress dashboard |
| `renderWeekView` | 2781 | Render week calendar view |
| `runDataMigration` | 1487 | Migrate old data structures |
| `safeDateFormat` | 62 | Format date with null safety |
| `sanitizeHTML` | 13 | Escape HTML for XSS protection |
| `saveBooking` | 4198 | Validate and save booking |
| `saveCustomer` | 4269 | Save customer to state |
| `saveState` | 1856 | Save state to LocalStorage |
| `sendBookingConfirmationEmail` | 169 | Send booking confirmation |
| `showToast` | 5937 | Show toast notification |
| `showView` | 1693 | Switch to different view |
| `timeToMinutes` | 5881 | Convert HH:MM to minutes |
| `toggleMultidayOptions` | 6131 | Show/hide multi-day fields |
| `triggerBackupDownload` | 6614 | Download data backup |
| `updateGroupPricing` | 6125 | Update price when group size changes |

---

**Document Version:** 1.0
**Last Updated:** 2025-11-05
**Status:** Complete ✅

For user instructions, see `USER_GUIDE.md`
For product overview, see `PRODUCT_SPECIFICATIONS.md`
