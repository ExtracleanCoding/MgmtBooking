/**
 * Global State Management for Ray Ryan Management System
 * Central state store for all application data and UI state
 */

// ============================================
// MAIN APPLICATION STATE
// ============================================

/**
 * Main application state object
 * Contains all persistent data stored in localStorage
 */
export let state = {
    customers: [],
    staff: [],
    resources: [],
    services: [],
    bookings: [],
    blockedPeriods: [],
    expenses: [],
    transactions: [],
    waitingList: [],
    settings: {}
};

// ============================================
// DYNAMIC UI STATE
// ============================================

/**
 * Current calendar view ('month', 'week', 'day')
 */
export let currentView = 'month';

/**
 * The date the calendar is currently focused on
 * This will be updated on load and when navigating
 */
export let currentDate = new Date('2025-11-01');

/**
 * Selected customer ID for billing view filtering
 */
export let selectedBillingCustomerId = null;

/**
 * Current page number for billing pagination
 */
export let billingCurrentPage = 1;

/**
 * Auto backup interval timer ID
 */
export let autoBackupInterval = null;

/**
 * Calendar drag selection state
 */
export let isDragging = false;

/**
 * Y-coordinate where drag started
 */
export let dragStartY = 0;

/**
 * Reference to drag selection box element
 */
export let selectionBox = null;

// ============================================
// STATE ACCESSORS
// ============================================

/**
 * Get the entire application state
 * @returns {Object} Complete state object
 */
export function getState() {
    return state;
}

/**
 * Set the entire application state
 * USE WITH CAUTION: This replaces the entire state object
 * Prefer using individual setters for specific properties
 * @param {Object} newState - New state object
 */
export function setState(newState) {
    if (newState && typeof newState === 'object') {
        state = newState;
    } else {
        console.error('setState: Invalid state object provided');
    }
}

/**
 * Update a specific collection in the state
 * @param {string} collection - Collection name (e.g., 'customers', 'bookings')
 * @param {Array} data - New data array
 */
export function updateCollection(collection, data) {
    if (state.hasOwnProperty(collection)) {
        state[collection] = data;
    } else {
        console.error(`updateCollection: Unknown collection "${collection}"`);
    }
}

/**
 * Get a specific collection from state
 * @param {string} collection - Collection name
 * @returns {Array} Collection data or empty array if not found
 */
export function getCollection(collection) {
    return state[collection] || [];
}

// ============================================
// VIEW STATE SETTERS
// ============================================

/**
 * Set current calendar view
 * @param {string} view - View name ('month', 'week', 'day')
 */
export function setCurrentView(view) {
    currentView = view;
}

/**
 * Get current calendar view
 * @returns {string} Current view name
 */
export function getCurrentView() {
    return currentView;
}

/**
 * Set current date for calendar
 * @param {Date} date - Date object
 */
export function setCurrentDate(date) {
    if (date instanceof Date && !isNaN(date)) {
        currentDate = date;
    } else {
        console.error('setCurrentDate: Invalid date provided');
    }
}

/**
 * Get current calendar date
 * @returns {Date} Current date
 */
export function getCurrentDate() {
    return currentDate;
}

/**
 * Set selected customer ID for billing filter
 * @param {string|null} customerId - Customer ID or null to clear
 */
export function setSelectedBillingCustomerId(customerId) {
    selectedBillingCustomerId = customerId;
}

/**
 * Get selected billing customer ID
 * @returns {string|null} Customer ID or null
 */
export function getSelectedBillingCustomerId() {
    return selectedBillingCustomerId;
}

/**
 * Set billing current page
 * @param {number} page - Page number
 */
export function setBillingCurrentPage(page) {
    billingCurrentPage = page;
}

/**
 * Get billing current page
 * @returns {number} Current page number
 */
export function getBillingCurrentPage() {
    return billingCurrentPage;
}

// ============================================
// DRAG STATE SETTERS
// ============================================

/**
 * Set drag state
 * @param {boolean} dragging - Whether dragging is active
 */
export function setIsDragging(dragging) {
    isDragging = dragging;
}

/**
 * Get drag state
 * @returns {boolean} Whether dragging is active
 */
export function getIsDragging() {
    return isDragging;
}

/**
 * Set drag start Y coordinate
 * @param {number} y - Y coordinate
 */
export function setDragStartY(y) {
    dragStartY = y;
}

/**
 * Get drag start Y coordinate
 * @returns {number} Y coordinate
 */
export function getDragStartY() {
    return dragStartY;
}

/**
 * Set selection box element
 * @param {HTMLElement|null} box - Selection box element
 */
export function setSelectionBox(box) {
    selectionBox = box;
}

/**
 * Get selection box element
 * @returns {HTMLElement|null} Selection box element
 */
export function getSelectionBox() {
    return selectionBox;
}

/**
 * Set auto backup interval
 * @param {number|null} interval - Interval ID or null
 */
export function setAutoBackupInterval(interval) {
    autoBackupInterval = interval;
}

/**
 * Get auto backup interval
 * @returns {number|null} Interval ID or null
 */
export function getAutoBackupInterval() {
    return autoBackupInterval;
}

// ============================================
// CONVENIENCE METHODS
// ============================================

/**
 * Find an entity by ID in a collection
 * @param {string} collection - Collection name
 * @param {string} id - Entity ID
 * @returns {Object|undefined} Found entity or undefined
 */
export function findById(collection, id) {
    const data = getCollection(collection);
    return data.find(item => item.id === id);
}

/**
 * Add an entity to a collection
 * @param {string} collection - Collection name
 * @param {Object} entity - Entity to add
 */
export function addToCollection(collection, entity) {
    if (state.hasOwnProperty(collection)) {
        state[collection].push(entity);
    } else {
        console.error(`addToCollection: Unknown collection "${collection}"`);
    }
}

/**
 * Remove an entity from a collection by ID
 * @param {string} collection - Collection name
 * @param {string} id - Entity ID to remove
 * @returns {boolean} True if removed, false if not found
 */
export function removeFromCollection(collection, id) {
    if (state.hasOwnProperty(collection)) {
        const index = state[collection].findIndex(item => item.id === id);
        if (index !== -1) {
            state[collection].splice(index, 1);
            return true;
        }
        return false;
    } else {
        console.error(`removeFromCollection: Unknown collection "${collection}"`);
        return false;
    }
}

/**
 * Update an entity in a collection
 * @param {string} collection - Collection name
 * @param {string} id - Entity ID
 * @param {Object} updates - Properties to update
 * @returns {boolean} True if updated, false if not found
 */
export function updateInCollection(collection, id, updates) {
    if (state.hasOwnProperty(collection)) {
        const index = state[collection].findIndex(item => item.id === id);
        if (index !== -1) {
            state[collection][index] = { ...state[collection][index], ...updates };
            return true;
        }
        return false;
    } else {
        console.error(`updateInCollection: Unknown collection "${collection}"`);
        return false;
    }
}

/**
 * Reset state to initial empty state
 * USE WITH CAUTION: This clears all data
 */
export function resetState() {
    state = {
        customers: [],
        staff: [],
        resources: [],
        services: [],
        bookings: [],
        blockedPeriods: [],
        expenses: [],
        transactions: [],
        waitingList: [],
        settings: {}
    };

    // Reset UI state
    currentView = 'month';
    currentDate = new Date();
    selectedBillingCustomerId = null;
    billingCurrentPage = 1;
    isDragging = false;
    dragStartY = 0;
    selectionBox = null;
}
