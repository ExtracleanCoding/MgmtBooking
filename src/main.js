/**
 * Main Entry Point for Ray Ryan Management System
 * This file imports all modules and initializes the application
 *
 * MIGRATION STATUS: Phase 2.2 - Entry Point Creation
 * This file represents the modular architecture target state
 * Once all modules are extracted, this will replace script.js
 */

// ============================================
// CORE MODULE IMPORTS
// ============================================

// Import core utilities and constants
import {
    DB_KEYS,
    btnPrimary,
    btnSecondary,
    btnDanger,
    btnGreen,
    btnPurple,
    DEFAULT_SERVICE_ID,
    MOCK_TEST_SERVICE_ID,
    CALENDAR_START_HOUR,
    CALENDAR_END_HOUR,
    TIMESLOT_INTERVAL_MINUTES,
    BILLING_ITEMS_PER_PAGE,
    PAGINATION_CONFIG,
    skillLevels,
    VIEW_NAMES,
    BOOKING_STATUS,
    PAYMENT_STATUS,
    SERVICE_TYPE,
    STAFF_TYPE
} from './core/constants.js';

import {
    generateUUID,
    parseYYYYMMDD,
    safeDateFormat,
    toLocalDateString,
    timeToMinutes,
    minutesToTime,
    isTimeOverlapping,
    sanitizeHTML,
    normalizeCollection,
    deepMerge,
    isObject,
    showToast,
    showDialog,
    closeDialog,
    copyToClipboard,
    getLessonPackages,
    getPackagePriceValue
} from './core/utils.js';

import {
    memoize,
    clearMemoCache,
    debounce,
    searchCache,
    clearSearchCache,
    compressData,
    decompressData,
    paginationState,
    paginateData,
    generatePaginationHTML,
    changePage,
    activeCharts,
    destroyAllCharts,
    trapFocus,
    announceToScreenReader,
    saveFocusBeforeModal,
    restoreFocusAfterModal,
    setupGlobalKeyboardShortcuts,
    enhancePaginationAccessibility
} from './core/optimization.js';

import {
    state,
    currentView,
    currentDate,
    selectedBillingCustomerId,
    billingCurrentPage,
    autoBackupInterval,
    isDragging,
    dragStartY,
    selectionBox,
    getState,
    setState,
    updateCollection,
    getCollection,
    setCurrentView,
    getCurrentView,
    setCurrentDate,
    getCurrentDate,
    setSelectedBillingCustomerId,
    getSelectedBillingCustomerId,
    setBillingCurrentPage,
    getBillingCurrentPage,
    setIsDragging,
    getIsDragging,
    setDragStartY,
    getDragStartY,
    setSelectionBox,
    getSelectionBox,
    setAutoBackupInterval,
    getAutoBackupInterval,
    findById,
    addToCollection,
    removeFromCollection,
    updateInCollection,
    resetState
} from './core/state.js';

import {
    DEFAULT_SETTINGS,
    loadState,
    saveState,
    debouncedSaveState,
    clearAllData,
    exportStateAsJSON,
    importStateFromJSON,
    getStorageUsage
} from './core/storage.js';

// ============================================
// FEATURE MODULE IMPORTS
// ============================================

// Phase 3.1: Calendar Module
import {
    renderCalendarContainer,
    renderCalendarHeader,
    renderDayView,
    renderWeekView,
    renderMonthView,
    assignColumns,
    getBlockedPeriodsForDate,
    startDrag,
    drag,
    endDrag,
    handleDragStart,
    allowDrop,
    handleDragEnter,
    handleDragLeave,
    drop,
    pixelsToTime
} from './modules/calendar.js';

// Phase 3.2: Billing Module
import {
    renderBillingView,
    renderBillingContent,
    renderDetailedBillingBreakdown,
    getCustomerSummaries,
    updateBulkPaymentTotal,
    recordBulkPayment,
    handleBillingClick,
    copyPaymentReminder,
    exportBillingToExcel
} from './modules/billing.js';

// Phase 3.3: Reports Module
import {
    renderReportsView,
    getReportsData,
    getTourAnalytics,
    generateCharts,
    updateKPICards,
    generateOverdueReport,
    handleDateRangeChange,
    handleDepartmentChange,
    toggleAnalysis
} from './modules/reports.js';

// Phase 3.4: Bookings Module
import {
    findBookingConflict,
    checkAdjacentBookings,
    toggleRecurringOptions,
    updateRecurringPreview,
    generateRecurringDates,
    calculateBookingFee,
    updateGroupPricing,
    toggleMultidayOptions,
    updateStaffAvailability,
    saveBooking,
    finalizeSaveBooking,
    deleteBooking
} from './modules/bookings.js';

// TODO: Phase 3.5-3.8 - Extract remaining modules from script.js
// import { saveCustomer, deleteCustomer } from './modules/customers.js';
// import { saveStaff, deleteStaff, getStaffSchedule } from './modules/staff.js';
// import { openBookingModal, closeBookingModal, openCustomerModal, closeCustomerModal } from './modules/modals.js';
// import { showView, refreshCurrentView, changeDate } from './modules/navigation.js';

// ============================================
// EXPOSE TO GLOBAL SCOPE (For backwards compatibility during migration)
// ============================================

/**
 * During migration, expose modules to window object
 * This allows existing code in script.js to access modular functions
 * Once migration is complete, remove this section
 */
if (typeof window !== 'undefined') {
    // Core constants
    window.DB_KEYS = DB_KEYS;
    window.btnPrimary = btnPrimary;
    window.btnSecondary = btnSecondary;
    window.btnDanger = btnDanger;
    window.btnGreen = btnGreen;
    window.btnPurple = btnPurple;
    window.DEFAULT_SERVICE_ID = DEFAULT_SERVICE_ID;
    window.MOCK_TEST_SERVICE_ID = MOCK_TEST_SERVICE_ID;
    window.CALENDAR_START_HOUR = CALENDAR_START_HOUR;
    window.CALENDAR_END_HOUR = CALENDAR_END_HOUR;
    window.TIMESLOT_INTERVAL_MINUTES = TIMESLOT_INTERVAL_MINUTES;
    window.PAGINATION_CONFIG = PAGINATION_CONFIG;
    window.VIEW_NAMES = VIEW_NAMES;
    window.BOOKING_STATUS = BOOKING_STATUS;
    window.PAYMENT_STATUS = PAYMENT_STATUS;
    window.SERVICE_TYPE = SERVICE_TYPE;
    window.STAFF_TYPE = STAFF_TYPE;

    // Utilities
    window.generateUUID = generateUUID;
    window.parseYYYYMMDD = parseYYYYMMDD;
    window.safeDateFormat = safeDateFormat;
    window.toLocalDateString = toLocalDateString;
    window.timeToMinutes = timeToMinutes;
    window.minutesToTime = minutesToTime;
    window.isTimeOverlapping = isTimeOverlapping;
    window.sanitizeHTML = sanitizeHTML;
    window.normalizeCollection = normalizeCollection;
    window.deepMerge = deepMerge;
    window.isObject = isObject;
    window.showToast = showToast;
    window.showDialog = showDialog;
    window.closeDialog = closeDialog;
    window.copyToClipboard = copyToClipboard;
    window.getLessonPackages = getLessonPackages;
    window.getPackagePriceValue = getPackagePriceValue;

    // Optimization
    window.memoize = memoize;
    window.clearMemoCache = clearMemoCache;
    window.debounce = debounce;
    window.searchCache = searchCache;
    window.clearSearchCache = clearSearchCache;
    window.compressData = compressData;
    window.decompressData = decompressData;
    window.paginationState = paginationState;
    window.paginateData = paginateData;
    window.generatePaginationHTML = generatePaginationHTML;
    window.changePage = changePage;
    window.activeCharts = activeCharts;
    window.destroyAllCharts = destroyAllCharts;
    window.trapFocus = trapFocus;
    window.announceToScreenReader = announceToScreenReader;
    window.saveFocusBeforeModal = saveFocusBeforeModal;
    window.restoreFocusAfterModal = restoreFocusAfterModal;
    window.setupGlobalKeyboardShortcuts = setupGlobalKeyboardShortcuts;
    window.enhancePaginationAccessibility = enhancePaginationAccessibility;

    // State
    window.state = state;
    window.currentView = currentView;
    window.currentDate = currentDate;
    window.getState = getState;
    window.setState = setState;
    window.updateCollection = updateCollection;
    window.getCollection = getCollection;
    window.setCurrentView = setCurrentView;
    window.getCurrentView = getCurrentView;
    window.setCurrentDate = setCurrentDate;
    window.getCurrentDate = getCurrentDate;
    window.findById = findById;
    window.addToCollection = addToCollection;
    window.removeFromCollection = removeFromCollection;
    window.updateInCollection = updateInCollection;

    // Storage
    window.loadState = loadState;
    window.saveState = saveState;
    window.debouncedSaveState = debouncedSaveState;
    window.exportStateAsJSON = exportStateAsJSON;
    window.importStateFromJSON = importStateFromJSON;
    window.getStorageUsage = getStorageUsage;

    // Calendar Module
    window.renderCalendarContainer = renderCalendarContainer;
    window.renderCalendarHeader = renderCalendarHeader;
    window.renderDayView = renderDayView;
    window.renderWeekView = renderWeekView;
    window.renderMonthView = renderMonthView;
    window.assignColumns = assignColumns;
    window.getBlockedPeriodsForDate = getBlockedPeriodsForDate;
    window.startDrag = startDrag;
    window.drag = drag;
    window.endDrag = endDrag;
    window.handleDragStart = handleDragStart;
    window.allowDrop = allowDrop;
    window.handleDragEnter = handleDragEnter;
    window.handleDragLeave = handleDragLeave;
    window.drop = drop;
    window.pixelsToTime = pixelsToTime;

    // Billing Module
    window.renderBillingView = renderBillingView;
    window.renderBillingContent = renderBillingContent;
    window.renderDetailedBillingBreakdown = renderDetailedBillingBreakdown;
    window.getCustomerSummaries = getCustomerSummaries;
    window.updateBulkPaymentTotal = updateBulkPaymentTotal;
    window.recordBulkPayment = recordBulkPayment;
    window.handleBillingClick = handleBillingClick;
    window.copyPaymentReminder = copyPaymentReminder;
    window.exportBillingToExcel = exportBillingToExcel;

    // Reports Module
    window.renderReportsView = renderReportsView;
    window.getReportsData = getReportsData;
    window.getTourAnalytics = getTourAnalytics;
    window.generateCharts = generateCharts;
    window.updateKPICards = updateKPICards;
    window.generateOverdueReport = generateOverdueReport;
    window.handleDateRangeChange = handleDateRangeChange;
    window.handleDepartmentChange = handleDepartmentChange;
    window.toggleAnalysis = toggleAnalysis;

    // Bookings Module
    window.findBookingConflict = findBookingConflict;
    window.checkAdjacentBookings = checkAdjacentBookings;
    window.toggleRecurringOptions = toggleRecurringOptions;
    window.updateRecurringPreview = updateRecurringPreview;
    window.generateRecurringDates = generateRecurringDates;
    window.calculateBookingFee = calculateBookingFee;
    window.updateGroupPricing = updateGroupPricing;
    window.toggleMultidayOptions = toggleMultidayOptions;
    window.updateStaffAvailability = updateStaffAvailability;
    window.saveBooking = saveBooking;
    window.finalizeSaveBooking = finalizeSaveBooking;
    window.deleteBooking = deleteBooking;
}

// ============================================
// APPLICATION INITIALIZATION
// ============================================

/**
 * Initialize the application
 * This function is called on page load
 */
function initializeApp() {
    console.log('🚀 Ray Ryan Management System - Starting...');
    console.log('📦 Using Modular Architecture (Phase 2)');

    try {
        // Step 1: Load state from localStorage
        console.log('📂 Loading state from localStorage...');
        loadState();

        // Step 2: Run data migrations (if needed)
        // TODO: Import and call runDataMigration() once extracted
        console.log('🔄 Running data migrations...');
        // runDataMigration();

        // Step 3: Initialize dummy data if empty (development only)
        // TODO: Import and call initializeDummyData() if needed
        if (state.customers.length === 0 && state.staff.length === 0) {
            console.log('🧪 No data found. Run initializeDummyData() from console if needed.');
        }

        // Step 4: Set up global keyboard shortcuts
        console.log('⌨️  Setting up keyboard shortcuts...');
        setupGlobalKeyboardShortcuts();
        enhancePaginationAccessibility();

        // Step 5: Initialize current date to today
        setCurrentDate(new Date());

        // Step 6: Show initial view
        // TODO: Import and call showView() once extracted
        console.log('🎨 Rendering initial view...');
        // showView('month');

        // Step 7: Set up auto-save
        window.addEventListener('beforeunload', () => {
            saveState();
            destroyAllCharts();
        });

        console.log('✅ Application initialized successfully!');
        console.log('📊 State loaded:', {
            customers: state.customers.length,
            staff: state.staff.length,
            bookings: state.bookings.length,
            resources: state.resources.length,
            services: state.services.length
        });

    } catch (error) {
        console.error('❌ Failed to initialize application:', error);
        showDialog({
            title: 'Initialization Error',
            message: 'Failed to start the application. Please check the console for details and try refreshing the page.',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
    }
}

// ============================================
// START APPLICATION
// ============================================

/**
 * Start the application when DOM is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM already loaded, initialize immediately
    initializeApp();
}

// ============================================
// EXPORTS (For testing and module access)
// ============================================

export {
    // Re-export core modules for use in other modules
    DB_KEYS,
    btnPrimary,
    btnSecondary,
    btnDanger,
    generateUUID,
    sanitizeHTML,
    state,
    loadState,
    saveState,
    showToast,
    showDialog
};
