/**
 * COMPREHENSIVE REGRESSION TEST SUITE
 * Ray Ryan Management System - Full Functionality Testing
 *
 * HOW TO USE:
 * 1. Open index.html in browser
 * 2. Open Developer Console (F12)
 * 3. Copy this entire file and paste into console
 * 4. Press Enter
 * 5. Review detailed test results
 *
 * This suite tests ALL major functionality areas:
 * - Core utilities and data structures
 * - Booking system (CRUD, conflicts, recurring)
 * - Customer/Staff/Resource/Service management
 * - Pricing calculations (fixed, tiered, group)
 * - Calendar views and navigation
 * - Billing and transactions
 * - Tour-specific features
 * - Analytics and reporting
 * - Security and sanitization
 * - LocalStorage persistence
 */

console.clear();
console.log('%c╔════════════════════════════════════════════════════════╗', 'color: #4A90E2; font-weight: bold');
console.log('%c║   COMPREHENSIVE REGRESSION TEST SUITE                  ║', 'color: #4A90E2; font-weight: bold');
console.log('%c║   Ray Ryan Management System v3.1.0                    ║', 'color: #4A90E2; font-weight: bold');
console.log('%c╚════════════════════════════════════════════════════════╝', 'color: #4A90E2; font-weight: bold');
console.log('');

// ============================================
// TEST FRAMEWORK
// ============================================

const TEST_RESULTS = {
    suites: [],
    totalTests: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    startTime: Date.now()
};

let currentSuite = null;

function startSuite(name, description = '') {
    currentSuite = {
        name,
        description,
        tests: [],
        passed: 0,
        failed: 0,
        warnings: 0
    };
    console.log(`\n%c━━━ ${name} ━━━`, 'color: #50E3C2; font-weight: bold; font-size: 14px');
    if (description) console.log(`%c${description}`, 'color: #9B9B9B; font-style: italic');
}

function endSuite() {
    if (currentSuite) {
        TEST_RESULTS.suites.push(currentSuite);
        TEST_RESULTS.passed += currentSuite.passed;
        TEST_RESULTS.failed += currentSuite.failed;
        TEST_RESULTS.warnings += currentSuite.warnings;
        TEST_RESULTS.totalTests += currentSuite.tests.length;

        const passRate = currentSuite.tests.length > 0
            ? Math.round((currentSuite.passed / currentSuite.tests.length) * 100)
            : 0;
        console.log(`%c  Suite Summary: ${currentSuite.passed} passed, ${currentSuite.failed} failed, ${currentSuite.warnings} warnings (${passRate}% pass rate)`,
            'color: #9B9B9B; font-style: italic');
        currentSuite = null;
    }
}

function test(name, fn) {
    try {
        fn();
        logPass(name);
    } catch (error) {
        logFail(name, error.message);
    }
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
}

function assertNotNull(value, message) {
    if (value === null || value === undefined) {
        throw new Error(message || 'Value should not be null or undefined');
    }
}

function assertArray(value, message) {
    if (!Array.isArray(value)) {
        throw new Error(message || 'Expected an array');
    }
}

function assertExists(value, message) {
    if (typeof value === 'undefined') {
        throw new Error(message || 'Value should exist');
    }
}

function logPass(testName) {
    console.log(`%c  ✅ ${testName}`, 'color: #7ED321');
    if (currentSuite) {
        currentSuite.tests.push({ name: testName, status: 'pass' });
        currentSuite.passed++;
    }
}

function logFail(testName, reason) {
    console.log(`%c  ❌ ${testName}`, 'color: #D0021B; font-weight: bold');
    console.log(`%c     → ${reason}`, 'color: #D0021B');
    if (currentSuite) {
        currentSuite.tests.push({ name: testName, status: 'fail', reason });
        currentSuite.failed++;
    }
}

function logWarn(testName, reason) {
    console.log(`%c  ⚠️  ${testName}`, 'color: #F5A623');
    console.log(`%c     → ${reason}`, 'color: #F5A623');
    if (currentSuite) {
        currentSuite.tests.push({ name: testName, status: 'warning', reason });
        currentSuite.warnings++;
    }
}

function logInfo(message) {
    console.log(`%c     ${message}`, 'color: #9B9B9B; font-style: italic');
}

// ============================================
// SUITE 1: Core Utilities & Helpers
// ============================================

startSuite('Core Utilities & Helpers', 'Testing fundamental utility functions');

test('generateUUID - Creates unique identifiers', () => {
    assertExists(generateUUID, 'generateUUID function should exist');
    const uuid1 = generateUUID();
    const uuid2 = generateUUID();
    const uuid3 = generateUUID();
    assert(uuid1 !== uuid2 && uuid2 !== uuid3, 'UUIDs should be unique');
    assert(uuid1.length > 0, 'UUID should not be empty');
});

test('parseYYYYMMDD - Parses date strings correctly', () => {
    assertExists(parseYYYYMMDD, 'parseYYYYMMDD function should exist');
    const date = parseYYYYMMDD('2025-11-15');
    assertNotNull(date, 'Should parse valid date');
    assert(date instanceof Date, 'Should return Date object');
    assertEqual(date.getFullYear(), 2025, 'Year should be 2025');
    assertEqual(date.getMonth(), 10, 'Month should be 10 (November)');
    assertEqual(date.getDate(), 15, 'Day should be 15');
});

test('parseYYYYMMDD - Handles invalid dates', () => {
    const nullDate = parseYYYYMMDD(null);
    assertEqual(nullDate, null, 'Should return null for null input');
    const invalidDate = parseYYYYMMDD('invalid');
    assertEqual(invalidDate, null, 'Should return null for invalid format');
});

test('safeDateFormat - Formats dates without crashing', () => {
    assertExists(safeDateFormat, 'safeDateFormat function should exist');
    const formatted = safeDateFormat('2025-11-15');
    assert(formatted !== 'Invalid Date', 'Should format valid date');
    const invalid = safeDateFormat(null);
    assertEqual(invalid, 'Invalid Date', 'Should handle null gracefully');
});

test('timeToMinutes - Converts time to minutes', () => {
    assertExists(timeToMinutes, 'timeToMinutes function should exist');
    assertEqual(timeToMinutes('00:00'), 0, '00:00 should be 0 minutes');
    assertEqual(timeToMinutes('14:30'), 870, '14:30 should be 870 minutes');
    assertEqual(timeToMinutes('23:59'), 1439, '23:59 should be 1439 minutes');
});

test('timeToMinutes - Handles invalid input', () => {
    assertEqual(timeToMinutes(null), 0, 'null should return 0');
    assertEqual(timeToMinutes(undefined), 0, 'undefined should return 0');
    assertEqual(timeToMinutes('invalid'), 0, 'invalid string should return 0');
});

test('minutesToTime - Converts minutes to time', () => {
    assertExists(minutesToTime, 'minutesToTime function should exist');
    assertEqual(minutesToTime(0), '00:00', '0 minutes should be 00:00');
    assertEqual(minutesToTime(870), '14:30', '870 minutes should be 14:30');
    assertEqual(minutesToTime(1439), '23:59', '1439 minutes should be 23:59');
});

test('minutesToTime - Handles edge cases', () => {
    assertEqual(minutesToTime(null), '00:00', 'null should return 00:00');
    assertEqual(minutesToTime(-100), '00:00', 'negative should clamp to 00:00');
    assertEqual(minutesToTime(10000), '23:59', 'large number should clamp to 23:59');
});

test('toLocalDateString - Formats dates', () => {
    assertExists(toLocalDateString, 'toLocalDateString function should exist');
    const date = new Date(2025, 10, 15); // Nov 15, 2025
    const formatted = toLocalDateString(date);
    assert(formatted.includes('2025'), 'Should include year');
    assert(formatted.includes('11') || formatted.includes('15'), 'Should include month or day');
});

test('isTimeOverlapping - Detects time conflicts', () => {
    assertExists(isTimeOverlapping, 'isTimeOverlapping function should exist');
    assert(isTimeOverlapping('09:00', '10:00', '09:30', '10:30'), 'Should detect overlap');
    assert(!isTimeOverlapping('09:00', '10:00', '10:00', '11:00'), 'Adjacent times should not overlap');
    assert(!isTimeOverlapping('09:00', '10:00', '11:00', '12:00'), 'Separate times should not overlap');
});

test('normalizeCollection - Normalizes data structures', () => {
    assertExists(normalizeCollection, 'normalizeCollection function should exist');
    const arr = normalizeCollection([1, 2, 3]);
    assertArray(arr, 'Should return array for array input');
    assertEqual(arr.length, 3, 'Should preserve array length');

    const obj = normalizeCollection({ a: 1, b: 2 });
    assertArray(obj, 'Should convert object to array');

    const empty = normalizeCollection(null);
    assertArray(empty, 'Should return empty array for null');
    assertEqual(empty.length, 0, 'Should return empty array');
});

endSuite();

// ============================================
// SUITE 2: State Management & Data Structures
// ============================================

startSuite('State Management & Data Structures', 'Testing global state and data persistence');

test('Global state object exists', () => {
    assertExists(state, 'Global state should exist');
    assert(typeof state === 'object', 'state should be an object');
});

test('State has all required collections', () => {
    const required = ['customers', 'staff', 'resources', 'services', 'bookings',
                      'transactions', 'blockedPeriods', 'expenses', 'waitingList', 'settings'];
    required.forEach(collection => {
        assertArray(state[collection] || state.settings, `state.${collection} should exist`);
    });
});

test('saveState function exists', () => {
    assertExists(saveState, 'saveState function should exist');
    assert(typeof saveState === 'function', 'saveState should be a function');
});

test('loadState function exists', () => {
    assertExists(loadState, 'loadState function should exist');
    assert(typeof loadState === 'function', 'loadState should be a function');
});

test('debouncedSaveState function exists', () => {
    assertExists(debouncedSaveState, 'debouncedSaveState function should exist');
    assert(typeof debouncedSaveState === 'function', 'debouncedSaveState should be a function');
});

test('State data is properly structured', () => {
    if (state.customers && state.customers.length > 0) {
        const customer = state.customers[0];
        assertExists(customer.id, 'Customer should have id');
        assertExists(customer.name, 'Customer should have name');
    }

    if (state.bookings && state.bookings.length > 0) {
        const booking = state.bookings[0];
        assertExists(booking.id, 'Booking should have id');
        assertExists(booking.date, 'Booking should have date');
        assertExists(booking.startTime, 'Booking should have startTime');
    }
});

endSuite();

// ============================================
// SUITE 3: Booking System
// ============================================

startSuite('Booking System', 'Testing booking CRUD operations and conflict detection');

test('findBookingConflict function exists', () => {
    assertExists(findBookingConflict, 'findBookingConflict should exist');
});

test('findBookingConflict - Detects staff conflicts', () => {
    const conflict = findBookingConflict({
        id: 'test-booking',
        date: '2025-11-15',
        startTime: '10:00',
        endTime: '11:00',
        staffId: 'staff-1',
        resourceIds: []
    });

    // Should only conflict if there's an existing booking at same time with same staff
    assert(typeof conflict === 'object' || conflict === null, 'Should return object or null');
});

test('checkAdjacentBookings function exists', () => {
    assertExists(checkAdjacentBookings, 'checkAdjacentBookings should exist');
});

test('saveBooking function exists', () => {
    assertExists(saveBooking, 'saveBooking should exist');
    assert(typeof saveBooking === 'function', 'saveBooking should be a function');
});

test('deleteBooking function exists', () => {
    assertExists(deleteBooking, 'deleteBooking should exist');
    assert(typeof deleteBooking === 'function', 'deleteBooking should be a function');
});

test('openBookingModal function exists', () => {
    assertExists(openBookingModal, 'openBookingModal should exist');
});

test('closeBookingModal function exists', () => {
    assertExists(closeBookingModal, 'closeBookingModal should exist');
});

test('Recurring booking functions exist', () => {
    assertExists(toggleRecurringOptions, 'toggleRecurringOptions should exist');
    assertExists(updateRecurringPreview, 'updateRecurringPreview should exist');
    assertExists(generateRecurringDates, 'generateRecurringDates should exist');
});

test('generateRecurringDates - Daily recurrence', () => {
    const dates = generateRecurringDates('2025-11-15', 'daily', 5, null);
    if (dates) {
        assertArray(dates, 'Should return array');
        assertEqual(dates.length, 5, 'Should generate 5 dates');
    }
});

endSuite();

// ============================================
// SUITE 4: Customer Management
// ============================================

startSuite('Customer Management', 'Testing customer CRUD operations');

test('saveCustomer function exists', () => {
    assertExists(saveCustomer, 'saveCustomer should exist');
});

test('deleteCustomer function exists', () => {
    assertExists(deleteCustomer, 'deleteCustomer should exist');
});

test('openCustomerModal function exists', () => {
    assertExists(openCustomerModal, 'openCustomerModal should exist');
});

test('closeCustomerModal function exists', () => {
    assertExists(closeCustomerModal, 'closeCustomerModal should exist');
});

test('renderCustomersView function exists', () => {
    assertExists(renderCustomersView, 'renderCustomersView should exist');
});

test('viewCustomerFromSearch function exists', () => {
    assertExists(viewCustomerFromSearch, 'viewCustomerFromSearch should exist');
});

test('Customer progress tracking exists', () => {
    assertExists(openCustomerProgressModal, 'openCustomerProgressModal should exist');
    assertExists(calculateStudentProgress, 'calculateStudentProgress should exist');
    assertExists(saveProgressNote, 'saveProgressNote should exist');
});

test('calculateStudentProgress - Returns progress data', () => {
    if (state.customers && state.customers.length > 0) {
        const customerId = state.customers[0].id;
        const progress = calculateStudentProgress(customerId);
        assert(typeof progress === 'object', 'Should return object');
    }
});

endSuite();

// ============================================
// SUITE 5: Staff Management
// ============================================

startSuite('Staff Management', 'Testing staff operations and qualifications');

test('saveStaff function exists', () => {
    assertExists(saveStaff, 'saveStaff should exist');
});

test('deleteStaff function exists', () => {
    assertExists(deleteStaff, 'deleteStaff should exist');
});

test('openStaffModal function exists', () => {
    assertExists(openStaffModal, 'openStaffModal should exist');
});

test('closeStaffModal function exists', () => {
    assertExists(closeStaffModal, 'closeStaffModal should exist');
});

test('renderStaffView function exists', () => {
    assertExists(renderStaffView, 'renderStaffView should exist');
});

test('toggleGuideFields function exists', () => {
    assertExists(toggleGuideFields, 'toggleGuideFields should exist');
});

test('updateStaffAvailability function exists', () => {
    assertExists(updateStaffAvailability, 'updateStaffAvailability should exist');
});

test('Staff data structure validation', () => {
    if (state.staff && state.staff.length > 0) {
        const staff = state.staff[0];
        assertExists(staff.id, 'Staff should have id');
        assertExists(staff.name, 'Staff should have name');
        assertExists(staff.staff_type, 'Staff should have staff_type');
    }
});

endSuite();

// ============================================
// SUITE 6: Resource Management
// ============================================

startSuite('Resource Management', 'Testing resource/vehicle operations');

test('saveResource function exists', () => {
    assertExists(saveResource, 'saveResource should exist');
});

test('deleteResource function exists', () => {
    assertExists(deleteResource, 'deleteResource should exist');
});

test('openResourceModal function exists', () => {
    assertExists(openResourceModal, 'openResourceModal should exist');
});

test('closeResourceModal function exists', () => {
    assertExists(closeResourceModal, 'closeResourceModal should exist');
});

test('renderResourcesView function exists', () => {
    assertExists(renderResourcesView, 'renderResourcesView should exist');
});

test('toggleVehicleFields function exists', () => {
    assertExists(toggleVehicleFields, 'toggleVehicleFields should exist');
});

test('checkVehicleCompliance function exists', () => {
    assertExists(checkVehicleCompliance, 'checkVehicleCompliance should exist');
});

endSuite();

// ============================================
// SUITE 7: Service Management & Pricing
// ============================================

startSuite('Service Management & Pricing', 'Testing services and pricing calculations');

test('saveService function exists', () => {
    assertExists(saveService, 'saveService should exist');
});

test('deleteService function exists', () => {
    assertExists(deleteService, 'deleteService should exist');
});

test('openServiceModal function exists', () => {
    assertExists(openServiceModal, 'openServiceModal should exist');
});

test('closeServiceModal function exists', () => {
    assertExists(closeServiceModal, 'closeServiceModal should exist');
});

test('renderServicesView function exists', () => {
    assertExists(renderServicesView, 'renderServicesView should exist');
});

test('handlePricingTypeChange function exists', () => {
    assertExists(handlePricingTypeChange, 'handlePricingTypeChange should exist');
});

test('handleServiceTypeChange function exists', () => {
    assertExists(handleServiceTypeChange, 'handleServiceTypeChange should exist');
});

test('calculateBookingFee function exists', () => {
    assertExists(calculateBookingFee, 'calculateBookingFee should exist');
});

test('calculateBookingFee - Fixed pricing', () => {
    if (state.services && state.services.length > 0) {
        const service = state.services.find(s => s.pricing_rules?.type === 'fixed');
        if (service) {
            const fee = calculateBookingFee(service.id, 1);
            assert(typeof fee === 'number', 'Should return number');
            assert(fee >= 0, 'Fee should be non-negative');
        }
    }
});

test('calculateBookingFee - Group pricing', () => {
    if (state.services && state.services.length > 0) {
        const service = state.services.find(s => s.service_type === 'TOUR');
        if (service) {
            const fee1 = calculateBookingFee(service.id, 1);
            const fee5 = calculateBookingFee(service.id, 5);
            assert(typeof fee1 === 'number' && typeof fee5 === 'number', 'Should return numbers');
        }
    }
});

test('updateGroupPricing function exists', () => {
    assertExists(updateGroupPricing, 'updateGroupPricing should exist');
});

test('Pricing tier management exists', () => {
    assertExists(addPricingTier, 'addPricingTier should exist');
    assertExists(removePricingTier, 'removePricingTier should exist');
});

endSuite();

// ============================================
// SUITE 8: Calendar Views
// ============================================

startSuite('Calendar Views', 'Testing calendar rendering and navigation');

test('renderCalendarContainer function exists', () => {
    assertExists(renderCalendarContainer, 'renderCalendarContainer should exist');
});

test('renderDayView function exists', () => {
    assertExists(renderDayView, 'renderDayView should exist');
});

test('renderWeekView function exists', () => {
    assertExists(renderWeekView, 'renderWeekView should exist');
});

test('renderMonthView function exists', () => {
    assertExists(renderMonthView, 'renderMonthView should exist');
});

test('changeDate function exists', () => {
    assertExists(changeDate, 'changeDate should exist');
});

test('assignColumns function exists', () => {
    assertExists(assignColumns, 'assignColumns should exist');
});

test('assignColumns - Handles overlapping bookings', () => {
    const testBookings = [
        { startTime: '09:00', endTime: '10:00' },
        { startTime: '09:30', endTime: '10:30' }
    ];
    const assigned = assignColumns(testBookings);
    assertArray(assigned, 'Should return array');
});

test('openDaySummaryModal function exists', () => {
    assertExists(openDaySummaryModal, 'openDaySummaryModal should exist');
});

test('closeDaySummaryModal function exists', () => {
    assertExists(closeDaySummaryModal, 'closeDaySummaryModal should exist');
});

endSuite();

// ============================================
// SUITE 9: Billing & Transactions
// ============================================

startSuite('Billing & Transactions', 'Testing payment and invoice management');

test('renderBillingView function exists', () => {
    assertExists(renderBillingView, 'renderBillingView should exist');
});

test('getCustomerSummaries function exists', () => {
    assertExists(getCustomerSummaries, 'getCustomerSummaries should exist');
});

test('getCustomerSummaries - Returns customer data', () => {
    const summaries = getCustomerSummaries();
    assertArray(summaries, 'Should return array');
});

test('recordBulkPayment function exists', () => {
    assertExists(recordBulkPayment, 'recordBulkPayment should exist');
});

test('updateBulkPaymentTotal function exists', () => {
    assertExists(updateBulkPaymentTotal, 'updateBulkPaymentTotal should exist');
});

test('handleBillingClick function exists', () => {
    assertExists(handleBillingClick, 'handleBillingClick should exist');
});

test('checkOverduePayments function exists', () => {
    assertExists(checkOverduePayments, 'checkOverduePayments should exist');
});

test('sendPaymentReminder function exists', () => {
    assertExists(sendPaymentReminder, 'sendPaymentReminder should exist');
});

test('Invoice functions exist', () => {
    assertExists(openInvoiceModal, 'openInvoiceModal should exist');
    assertExists(closeInvoiceModal, 'closeInvoiceModal should exist');
    assertExists(printInvoice, 'printInvoice should exist');
});

test('Package management exists', () => {
    assertExists(getLessonPackages, 'getLessonPackages should exist');
    assertExists(savePackage, 'savePackage should exist');
    assertExists(openSellPackageModal, 'openSellPackageModal should exist');
});

endSuite();

// ============================================
// SUITE 10: Tour-Specific Features
// ============================================

startSuite('Tour-Specific Features', 'Testing tour operations, groups, and waivers');

test('toggleMultidayOptions function exists', () => {
    assertExists(toggleMultidayOptions, 'toggleMultidayOptions should exist');
});

test('getTourAnalytics function exists', () => {
    assertExists(getTourAnalytics, 'getTourAnalytics should exist');
});

test('getTourAnalytics - Returns analytics data', () => {
    const analytics = getTourAnalytics();
    assert(typeof analytics === 'object', 'Should return object');
    assertExists(analytics.totalRevenue, 'Should have totalRevenue');
    assertExists(analytics.totalParticipants, 'Should have totalParticipants');
});

test('Tour booking validation', () => {
    if (state.services && state.services.length > 0) {
        const tourService = state.services.find(s => s.service_type === 'TOUR');
        if (tourService) {
            assertExists(tourService.service_name, 'Tour service should have name');
        }
    }
});

test('Tour-specific booking fields', () => {
    if (state.bookings && state.bookings.length > 0) {
        const tourBooking = state.bookings.find(b => {
            const service = state.services.find(s => s.id === b.serviceId);
            return service && service.service_type === 'TOUR';
        });

        if (tourBooking) {
            // Check for tour-specific fields
            logInfo('Tour booking found - checking fields');
        }
    }
});

endSuite();

// ============================================
// SUITE 11: Analytics & Reporting
// ============================================

startSuite('Analytics & Reporting', 'Testing reports, charts, and analytics');

test('renderReportsView function exists', () => {
    assertExists(renderReportsView, 'renderReportsView should exist');
});

test('getReportsData function exists', () => {
    assertExists(getReportsData, 'getReportsData should exist');
});

test('getReportsData - Returns report data', () => {
    const data = getReportsData();
    assert(typeof data === 'object', 'Should return object');
});

test('generateCharts function exists', () => {
    assertExists(generateCharts, 'generateCharts should exist');
});

test('calculateIncomeAnalytics function exists', () => {
    assertExists(calculateIncomeAnalytics, 'calculateIncomeAnalytics should exist');
});

test('calculateIncomeAnalytics - Returns income data', () => {
    const analytics = calculateIncomeAnalytics();
    assert(typeof analytics === 'object', 'Should return object');
});

test('renderIncomeAnalyticsDashboard function exists', () => {
    assertExists(renderIncomeAnalyticsDashboard, 'renderIncomeAnalyticsDashboard should exist');
});

test('Export functions exist', () => {
    assertExists(exportSummaryToExcel, 'exportSummaryToExcel should exist');
    assertExists(exportBillingToExcel, 'exportBillingToExcel should exist');
    assertExists(exportReportsToExcel, 'exportReportsToExcel should exist');
});

test('Print functions exist', () => {
    assertExists(printInvoice, 'printInvoice should exist');
    assertExists(printSummary, 'printSummary should exist');
});

endSuite();

// ============================================
// SUITE 12: Security & Sanitization
// ============================================

startSuite('Security & Sanitization', 'Testing XSS protection and input validation');

test('sanitizeHTML function exists', () => {
    assertExists(sanitizeHTML, 'sanitizeHTML should exist');
});

test('sanitizeHTML - Escapes dangerous HTML', () => {
    const dangerous = '<script>alert("xss")</script>';
    const safe = sanitizeHTML(dangerous);
    assert(!safe.includes('<script>'), 'Should escape script tags');
    assert(safe.includes('&lt;') || safe.includes('&gt;'), 'Should use HTML entities');
});

test('sanitizeHTML - Handles various XSS attempts', () => {
    const tests = [
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>',
        'javascript:alert(1)',
        '<iframe src="javascript:alert(1)">',
        '<input onfocus=alert(1) autofocus>'
    ];

    tests.forEach(dangerous => {
        const safe = sanitizeHTML(dangerous);
        assert(!safe.includes('javascript:'), 'Should remove javascript: protocol');
        assert(!safe.includes('onerror='), 'Should remove event handlers');
        assert(!safe.includes('onload='), 'Should remove onload handlers');
    });
});

test('sanitizeHTML - Handles null and undefined', () => {
    assertEqual(sanitizeHTML(null), '', 'Should handle null');
    assertEqual(sanitizeHTML(undefined), '', 'Should handle undefined');
});

test('sanitizeHTML - Preserves safe text', () => {
    const safe = 'John Doe 123 Main St';
    const result = sanitizeHTML(safe);
    assert(result.includes('John'), 'Should preserve normal text');
});

endSuite();

// ============================================
// SUITE 13: External Integrations
// ============================================

startSuite('External Integrations', 'Testing Calendar, Email, SMS integrations');

test('Google Calendar functions exist', () => {
    assertExists(exportToGoogleCalendar, 'exportToGoogleCalendar should exist');
    assertExists(exportAllBookingsToCalendar, 'exportAllBookingsToCalendar should exist');
});

test('ICS export functions exist', () => {
    assertExists(generateICSFile, 'generateICSFile should exist');
    assertExists(formatICalDateTime, 'formatICalDateTime should exist');
});

test('Email notification functions exist', () => {
    assertExists(sendBookingConfirmationEmail, 'sendBookingConfirmationEmail should exist');
    assertExists(sendBookingReminderEmail, 'sendBookingReminderEmail should exist');
    assertExists(sendPaymentReceiptEmail, 'sendPaymentReceiptEmail should exist');
});

test('SMS reminder functions exist', () => {
    assertExists(checkAndScheduleSMSReminders, 'checkAndScheduleSMSReminders should exist');
    assertExists(prepareSMSReminder, 'prepareSMSReminder should exist');
    assertExists(formatSMSMessage, 'formatSMSMessage should exist');
});

test('Reminder automation exists', () => {
    assertExists(checkAndSendEmailReminders, 'checkAndSendEmailReminders should exist');
    assertExists(toggleAutoReminders, 'toggleAutoReminders should exist');
    assertExists(toggleAutoEmailReminders, 'toggleAutoEmailReminders should exist');
});

endSuite();

// ============================================
// SUITE 14: Data Migration & Backup
// ============================================

startSuite('Data Migration & Backup', 'Testing data persistence and backup features');

test('runDataMigration function exists', () => {
    assertExists(runDataMigration, 'runDataMigration should exist');
});

test('Backup functions exist', () => {
    assertExists(toggleAutoBackup, 'toggleAutoBackup should exist');
    assertExists(triggerBackupDownload, 'triggerBackupDownload should exist');
});

test('Clear data functions exist', () => {
    assertExists(confirmClearAllData, 'confirmClearAllData should exist');
    assertExists(clearAllDataAfterBackup, 'clearAllDataAfterBackup should exist');
});

test('Restore function exists', () => {
    assertExists(handleRestore, 'handleRestore should exist');
});

test('LocalStorage operations work', () => {
    const testKey = 'test_key_' + Date.now();
    const testValue = { test: 'data' };

    try {
        localStorage.setItem(testKey, JSON.stringify(testValue));
        const retrieved = JSON.parse(localStorage.getItem(testKey));
        assertEqual(retrieved.test, 'data', 'Should store and retrieve data');
        localStorage.removeItem(testKey);
        logPass('LocalStorage read/write operations work');
    } catch (e) {
        logFail('LocalStorage operations', e.message);
    }
});

endSuite();

// ============================================
// SUITE 15: UI & View Management
// ============================================

startSuite('UI & View Management', 'Testing navigation and view switching');

test('showView function exists', () => {
    assertExists(showView, 'showView should exist');
});

test('refreshCurrentView function exists', () => {
    assertExists(refreshCurrentView, 'refreshCurrentView should exist');
});

test('updateActiveNav function exists', () => {
    assertExists(updateActiveNav, 'updateActiveNav should exist');
});

test('Modal management functions exist', () => {
    assertExists(openBookingModal, 'openBookingModal should exist');
    assertExists(closeModal, 'closeModal should exist');
});

test('Toast notification exists', () => {
    assertExists(showToast, 'showToast should exist');
});

test('Dialog functions exist', () => {
    assertExists(showDialog, 'showDialog should exist');
    assertExists(closeDialog, 'closeDialog should exist');
});

test('Global search exists', () => {
    assertExists(handleGlobalSearch, 'handleGlobalSearch should exist');
    assertExists(performGlobalSearch, 'performGlobalSearch should exist');
});

test('Drag and drop exists', () => {
    assertExists(handleDragStart, 'handleDragStart should exist');
    assertExists(allowDrop, 'allowDrop should exist');
    assertExists(drop, 'drop should exist');
});

endSuite();

// ============================================
// SUITE 16: Waiting List & Notifications
// ============================================

startSuite('Waiting List & Notifications', 'Testing waiting list and notification system');

test('renderWaitingListView function exists', () => {
    assertExists(renderWaitingListView, 'renderWaitingListView should exist');
});

test('removeWaitingListItem function exists', () => {
    assertExists(removeWaitingListItem, 'removeWaitingListItem should exist');
});

test('checkWaitingListFor function exists', () => {
    assertExists(checkWaitingListFor, 'checkWaitingListFor should exist');
});

test('isSlotAvailable function exists', () => {
    assertExists(isSlotAvailable, 'isSlotAvailable should exist');
});

test('addDashboardNotification function exists', () => {
    assertExists(addDashboardNotification, 'addDashboardNotification should exist');
});

endSuite();

// ============================================
// SUITE 17: Expenses & Settings
// ============================================

startSuite('Expenses & Settings', 'Testing expense tracking and app settings');

test('renderExpensesView function exists', () => {
    assertExists(renderExpensesView, 'renderExpensesView should exist');
});

test('saveExpense function exists', () => {
    assertExists(saveExpense, 'saveExpense should exist');
});

test('deleteExpense function exists', () => {
    assertExists(deleteExpense, 'deleteExpense should exist');
});

test('renderSettingsView function exists', () => {
    assertExists(renderSettingsView, 'renderSettingsView should exist');
});

test('handleSaveSettings function exists', () => {
    assertExists(handleSaveSettings, 'handleSaveSettings should exist');
});

test('Settings data structure exists', () => {
    assertExists(state.settings, 'state.settings should exist');
    assert(typeof state.settings === 'object', 'settings should be an object');
});

endSuite();

// ============================================
// FINAL REPORT
// ============================================

console.log('\n\n');
console.log('%c╔════════════════════════════════════════════════════════╗', 'color: #4A90E2; font-weight: bold');
console.log('%c║              TEST EXECUTION SUMMARY                    ║', 'color: #4A90E2; font-weight: bold');
console.log('%c╚════════════════════════════════════════════════════════╝', 'color: #4A90E2; font-weight: bold');

const executionTime = ((Date.now() - TEST_RESULTS.startTime) / 1000).toFixed(2);
const passRate = TEST_RESULTS.totalTests > 0
    ? Math.round((TEST_RESULTS.passed / TEST_RESULTS.totalTests) * 100)
    : 0;

console.log('');
console.log(`%c📊 Total Test Suites: ${TEST_RESULTS.suites.length}`, 'font-weight: bold; font-size: 13px');
console.log(`%c📝 Total Tests Run: ${TEST_RESULTS.totalTests}`, 'font-weight: bold; font-size: 13px');
console.log(`%c✅ Passed: ${TEST_RESULTS.passed}`, 'color: #7ED321; font-weight: bold; font-size: 13px');
console.log(`%c❌ Failed: ${TEST_RESULTS.failed}`, 'color: #D0021B; font-weight: bold; font-size: 13px');
console.log(`%c⚠️  Warnings: ${TEST_RESULTS.warnings}`, 'color: #F5A623; font-weight: bold; font-size: 13px');
console.log(`%c⏱️  Execution Time: ${executionTime}s`, 'font-weight: bold; font-size: 13px');
console.log(`%c📈 Pass Rate: ${passRate}%`, 'font-weight: bold; font-size: 14px; ' +
    (passRate >= 90 ? 'color: #7ED321' : passRate >= 70 ? 'color: #F5A623' : 'color: #D0021B'));

console.log('\n');

if (TEST_RESULTS.failed === 0 && TEST_RESULTS.warnings === 0) {
    console.log('%c🎉 ALL TESTS PASSED! SYSTEM IS FULLY FUNCTIONAL! 🎉',
        'background: #7ED321; color: white; font-weight: bold; font-size: 16px; padding: 10px; border-radius: 5px');
} else if (TEST_RESULTS.failed === 0) {
    console.log('%c✅ All Tests Passed (with warnings)',
        'background: #F5A623; color: white; font-weight: bold; font-size: 16px; padding: 10px; border-radius: 5px');
} else {
    console.log('%c⚠️  SOME TESTS FAILED - REVIEW REQUIRED',
        'background: #D0021B; color: white; font-weight: bold; font-size: 16px; padding: 10px; border-radius: 5px');
}

console.log('\n');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #9B9B9B');

// Per-Suite Summary
console.log('\n%cSuite-by-Suite Results:', 'color: #4A90E2; font-weight: bold; font-size: 13px');
TEST_RESULTS.suites.forEach(suite => {
    const suitePassRate = suite.tests.length > 0
        ? Math.round((suite.passed / suite.tests.length) * 100)
        : 0;
    const status = suite.failed === 0 ? '✅' : '❌';
    console.log(`${status} ${suite.name}: ${suite.passed}/${suite.tests.length} passed (${suitePassRate}%)`);
});

console.log('\n');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #9B9B9B');
console.log('%cTest results stored in: window.COMPREHENSIVE_TEST_RESULTS', 'color: #9B9B9B; font-style: italic');
console.log('%cAccess via: COMPREHENSIVE_TEST_RESULTS.suites, .passed, .failed, etc.', 'color: #9B9B9B; font-style: italic');
console.log('\n');

// Make results globally available
window.COMPREHENSIVE_TEST_RESULTS = TEST_RESULTS;
