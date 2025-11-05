/**
 * Core Constants for Ray Ryan Management System
 * All application-wide constants and configuration values
 */

// ============================================
// DATABASE KEYS
// ============================================

export const DB_KEYS = {
    CUSTOMERS: 'customers',
    STAFF: 'staff',
    RESOURCES: 'resources',
    SERVICES: 'services',
    BOOKINGS: 'bookings',
    BLOCKED_PERIODS: 'blockedPeriods',
    SETTINGS: 'settings',
    EXPENSES: 'expenses',
    TRANSACTIONS: 'transactions',
    WAITING_LIST: 'waitingList',
    MIGRATION_VERSION: 'migrationVersion'
};

// ============================================
// STYLE CONSTANTS (CSS Classes)
// ============================================

export const btnPrimary = "btn btn-primary";
export const btnSecondary = "btn btn-secondary";
export const btnDanger = "btn btn-danger";
export const btnGreen = "btn btn-green";
export const btnPurple = "btn btn-purple";

// ============================================
// SERVICE IDENTIFIERS
// ============================================

export const DEFAULT_SERVICE_ID = 'service_lesson_1';
export const MOCK_TEST_SERVICE_ID = 'service_mock_test';

// ============================================
// CALENDAR CONFIGURATION
// ============================================

export const CALENDAR_START_HOUR = 7;
export const CALENDAR_END_HOUR = 21;
export const TIMESLOT_INTERVAL_MINUTES = 30;

// ============================================
// BILLING CONFIGURATION
// ============================================

export const BILLING_ITEMS_PER_PAGE = 10;

// ============================================
// PAGINATION CONFIGURATION
// ============================================

export const PAGINATION_CONFIG = {
    itemsPerPage: 50,  // Show 50 items per page
    maxPageButtons: 5  // Show max 5 page number buttons
};

// ============================================
// SKILLS CONFIGURATION
// ============================================

export const skillLevels = {
    standard: {
        title: 'Standard Skills (Foundational)',
        skills: [
            "Cockpit Drill & Controls",
            "Moving Off & Stopping Safely",
            "Steering Control",
            "Clutch Control & Gear Changing",
            "Basic Junctions (Turning Left & Right)",
            "Emerging at T-Junctions",
            "Basic Mirror Checks",
            "Hill Starts",
            "Emergency Stop"
        ]
    },
    intermediate: {
        title: 'Intermediate Skills (Maneuvers)',
        skills: [
            "Roundabouts (Mini & Standard)",
            "Pedestrian Crossings",
            "Anticipation & Hazard Perception",
            "Meeting & Overtaking",
            "Turn in the Road",
            "Reversing in a Straight Line",
            "Parallel Parking",
            "Bay Parking (Forward & Reverse)",
            "Following Distance"
        ]
    },
    advanced: {
        title: 'Advanced Skills (Test Readiness)',
        skills: [
            "Dual Carriageways",
            "Complex/Spiral Roundabouts",
            "Adverse Weather Driving",
            "Night Driving",
            "Eco-Safe Driving",
            "Following Sat Nav",
            "'Show Me, Tell Me' Questions",
            "Independent Driving"
        ]
    },
    mock_test: {
        title: 'Mock Test Assessment',
        skills: [
            "Observation",
            "Anticipation & Awareness",
            "Vehicle Control",
            "Maneuvers (Turn, Reverse, Park)",
            "Serious/Grade 3 Faults",
            "Driving/Grade 2 Faults",
            "Overall Result: Pass",
            "Overall Result: Fail"
        ]
    }
};

// ============================================
// VIEW NAMES (Type Safe)
// ============================================

export const VIEW_NAMES = {
    CALENDAR: 'calendar',
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    SUMMARY: 'summary',
    BILLING: 'billing',
    SERVICES: 'services',
    CUSTOMERS: 'customers',
    STAFF: 'staff',
    RESOURCES: 'resources',
    EXPENSES: 'expenses',
    WAITING_LIST: 'waiting-list',
    SETTINGS: 'settings',
    REPORTS: 'reports'
};

// ============================================
// BOOKING STATUSES
// ============================================

export const BOOKING_STATUS = {
    SCHEDULED: 'Scheduled',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    PENDING: 'Pending'
};

// ============================================
// PAYMENT STATUSES
// ============================================

export const PAYMENT_STATUS = {
    PAID: 'Paid',
    UNPAID: 'Unpaid',
    PAID_CREDIT: 'Paid (Credit)'
};

// ============================================
// SERVICE TYPES
// ============================================

export const SERVICE_TYPE = {
    DRIVING_LESSON: 'DRIVING_LESSON',
    TOUR: 'TOUR'
};

// ============================================
// STAFF TYPES
// ============================================

export const STAFF_TYPE = {
    INSTRUCTOR: 'INSTRUCTOR',
    GUIDE: 'GUIDE',
    ADMIN: 'ADMIN'
};
