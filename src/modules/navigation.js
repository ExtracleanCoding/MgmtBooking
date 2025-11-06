/**
 * Navigation Module for Ray Ryan Management System
 * Handles view switching, date navigation, and view rendering coordination
 */

// ============================================
// IMPORTS
// ============================================

import {
    currentView,
    currentDate,
    setCurrentView,
    setCurrentDate,
    getCurrentView,
    getCurrentDate
} from '../core/state.js';

import {
    destroyAllCharts
} from '../core/optimization.js';

// ============================================
// VIEW MANAGEMENT
// ============================================

/**
 * Show a specific view and hide all others
 * @param {string} viewName - View name ('day', 'week', 'month', 'customers', etc.)
 * @param {Date|string|null} date - Optional date to set
 */
export function showView(viewName, date = null) {
    if (date) {
        const newDate = typeof date === 'string' ? new Date(date) : date;
        setCurrentDate(newDate);
    }

    // OPTIMIZATION: Destroy any existing charts to prevent memory leaks
    destroyAllCharts();

    const calendarViews = ['day', 'week', 'month'];
    const isCalendarView = calendarViews.includes(viewName);
    setCurrentView(viewName);

    // Hide all views except the active one
    const allViewIds = [
        'calendar', 'summary', 'billing', 'services', 'customers',
        'staff', 'resources', 'expenses', 'waiting-list', 'settings', 'reports'
    ];

    allViewIds.forEach(v => {
        const el = document.getElementById(`${v}-view`);
        const shouldShow = v === (isCalendarView ? 'calendar' : viewName);
        if (el) el.classList.toggle('hidden', !shouldShow);
    });

    updateActiveNav();
    refreshCurrentView();
}

/**
 * Update active navigation button styling
 * Adds 'active' class to current view's nav button
 */
export function updateActiveNav() {
    document.querySelectorAll('#main-nav button').forEach(btn => btn.classList.remove('active'));

    const calendarViews = ['day', 'week', 'month'];
    const view = getCurrentView();
    let activeNavId = calendarViews.includes(view) ? 'nav-calendar' : `nav-${view}`;
    const activeBtn = document.getElementById(activeNavId);
    if (activeBtn) activeBtn.classList.add('active');
}

/**
 * Refresh the current view
 * Re-renders the active view based on currentView
 */
export function refreshCurrentView() {
    const view = getCurrentView();

    // Map of view names to render functions
    const viewRenderers = {
        // Calendar views
        day: typeof window.renderDayView === 'function' ? window.renderDayView : null,
        week: typeof window.renderWeekView === 'function' ? window.renderWeekView : null,
        month: typeof window.renderMonthView === 'function' ? window.renderMonthView : null,

        // Other views
        summary: typeof window.renderSummaryView === 'function' ? window.renderSummaryView : null,
        billing: typeof window.renderBillingView === 'function' ? window.renderBillingView : null,
        services: typeof window.renderServicesView === 'function' ? window.renderServicesView : null,
        customers: typeof window.renderCustomersView === 'function' ? window.renderCustomersView : null,
        staff: typeof window.renderStaffView === 'function' ? window.renderStaffView : null,
        resources: typeof window.renderResourcesView === 'function' ? window.renderResourcesView : null,
        expenses: typeof window.renderExpensesView === 'function' ? window.renderExpensesView : null,
        'waiting-list': typeof window.renderWaitingListView === 'function' ? window.renderWaitingListView : null,
        settings: typeof window.renderSettingsView === 'function' ? window.renderSettingsView : null,
        reports: typeof window.renderReportsView === 'function' ? window.renderReportsView : null
    };

    const calendarViews = ['day', 'week', 'month'];

    // Render calendar container for calendar views
    if (calendarViews.includes(view)) {
        if (typeof window.renderCalendarContainer === 'function') {
            window.renderCalendarContainer();
        }
    }

    // Call the specific renderer for the current view
    if (viewRenderers[view]) {
        viewRenderers[view]();
    }
}

// ============================================
// DATE NAVIGATION
// ============================================

/**
 * Change the current date by a specified unit
 * @param {string} unit - Time unit ('day', 'week', 'month')
 * @param {number} direction - Direction to move (1 for forward, -1 for backward)
 */
export function changeDate(unit, direction) {
    const date = getCurrentDate();

    if (unit === 'day') {
        date.setDate(date.getDate() + direction);
    } else if (unit === 'week') {
        date.setDate(date.getDate() + (7 * direction));
    } else if (unit === 'month') {
        date.setMonth(date.getMonth() + direction);
    }

    setCurrentDate(date);
    refreshCurrentView();
}

/**
 * Navigate to today's date
 * Sets current date to today and refreshes the view
 */
export function goToToday() {
    setCurrentDate(new Date());
    refreshCurrentView();
}

/**
 * Navigate to a specific date
 * @param {Date|string} date - Date to navigate to
 */
export function goToDate(date) {
    const newDate = typeof date === 'string' ? new Date(date) : date;
    setCurrentDate(newDate);
    refreshCurrentView();
}

/**
 * Switch to a different calendar view (day/week/month)
 * @param {string} view - View type ('day', 'week', 'month')
 */
export function switchCalendarView(view) {
    const validViews = ['day', 'week', 'month'];
    if (validViews.includes(view)) {
        showView(view);
    }
}

// ============================================
// NAVIGATION HELPERS
// ============================================

/**
 * Get the display title for the current view and date
 * @returns {string} Formatted title
 */
export function getViewTitle() {
    const view = getCurrentView();
    const date = getCurrentDate();

    if (view === 'day') {
        return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } else if (view === 'week') {
        const weekStart = new Date(date);
        const firstDayOfWeek = typeof window.getFirstDayOfWeek === 'function' ? window.getFirstDayOfWeek() : 1;
        const day = weekStart.getDay();
        const diff = (day === 0 ? 7 : day) - firstDayOfWeek;
        weekStart.setDate(weekStart.getDate() - diff);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        return `${weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else if (view === 'month') {
        return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }

    return '';
}

/**
 * Check if a view is a calendar view
 * @param {string} view - View name
 * @returns {boolean} True if calendar view
 */
export function isCalendarView(view) {
    return ['day', 'week', 'month'].includes(view);
}

// ============================================
// EXPORTS FOR GLOBAL ACCESS (BACKWARDS COMPATIBILITY)
// ============================================

if (typeof window !== 'undefined') {
    window.showView = showView;
    window.updateActiveNav = updateActiveNav;
    window.refreshCurrentView = refreshCurrentView;
    window.changeDate = changeDate;
    window.goToToday = goToToday;
    window.goToDate = goToDate;
    window.switchCalendarView = switchCalendarView;
    window.getViewTitle = getViewTitle;
    window.isCalendarView = isCalendarView;
}
