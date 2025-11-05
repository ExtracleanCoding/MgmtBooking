/**
 * Core Utility Functions for Ray Ryan Management System
 * Common helper functions used throughout the application
 */

// ============================================
// UUID GENERATION
// ============================================

/**
 * Generate a UUID (v4) for unique identifiers
 * Uses crypto.getRandomValues for better randomness
 * Falls back to Math.random() for older browsers
 * @returns {string} UUID string
 */
export function generateUUID() {
    // Use crypto API if available (better randomness, prevents collisions)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        // UUID v4 format using crypto.getRandomValues
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }

    // Fallback to Math.random() for older browsers
    console.warn('crypto.getRandomValues not available, using Math.random() fallback');
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ============================================
// DATE UTILITIES
// ============================================

/**
 * Parse YYYY-MM-DD string to Date object
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {Date|null} Parsed date or null if invalid
 */
export function parseYYYYMMDD(dateString) {
    if (!dateString) return null;
    const parts = dateString.split('-');
    if (parts.length !== 3) return null;
    // Note: months are 0-based in JavaScript Date object
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

/**
 * Safe date formatting helper to prevent null reference errors
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string or 'Invalid Date'
 */
export function safeDateFormat(dateString, options = { day: '2-digit', month: 'short', year: 'numeric' }) {
    const parsed = parseYYYYMMDD(dateString);
    if (!parsed || isNaN(parsed.getTime())) {
        console.warn('Invalid date format:', dateString);
        return 'Invalid Date';
    }
    return parsed.toLocaleDateString('en-GB', options);
}

/**
 * Convert Date object to YYYY-MM-DD string
 * @param {Date} date - Date object
 * @returns {string} Date string in YYYY-MM-DD format
 */
export function toLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ============================================
// TIME UTILITIES
// ============================================

/**
 * Convert time string (HH:MM) to minutes since midnight
 * @param {string} timeStr - Time in HH:MM format
 * @returns {number} Minutes since midnight
 */
export function timeToMinutes(timeStr) {
    // SAFETY: Validate input exists and is a string
    if (!timeStr || typeof timeStr !== 'string') {
        console.warn('timeToMinutes: Invalid time string:', timeStr);
        return 0;
    }

    // SAFETY: Validate format (should be HH:MM)
    const parts = timeStr.split(':');
    if (parts.length !== 2) {
        console.warn('timeToMinutes: Invalid time format (expected HH:MM):', timeStr);
        return 0;
    }

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    // SAFETY: Validate numbers
    if (isNaN(hours) || isNaN(minutes)) {
        console.warn('timeToMinutes: Time contains non-numeric values:', timeStr);
        return 0;
    }

    // SAFETY: Validate ranges (allow 0-23 for hours, 0-59 for minutes)
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.warn('timeToMinutes: Time out of valid range:', timeStr);
        // Still calculate but warn - allows for flexibility
        return Math.max(0, hours * 60 + minutes);
    }

    return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 * @param {number} totalMinutes - Minutes since midnight
 * @returns {string} Time in HH:MM format
 */
export function minutesToTime(totalMinutes) {
    // SAFETY: Validate input is a number
    if (typeof totalMinutes !== 'number' || isNaN(totalMinutes)) {
        console.warn('minutesToTime: Invalid minutes value:', totalMinutes);
        return '00:00';
    }

    // SAFETY: Clamp to valid range (0 to 24*60-1 = 1439 minutes)
    const clampedMinutes = Math.max(0, Math.min(totalMinutes, 24 * 60 - 1));

    if (clampedMinutes !== totalMinutes) {
        console.warn('minutesToTime: Minutes clamped to valid range. Original:', totalMinutes, 'Clamped:', clampedMinutes);
    }

    const hours = Math.floor(clampedMinutes / 60);
    const minutes = clampedMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Check if two time ranges overlap
 * @param {string} start1 - Start time of first range (HH:MM)
 * @param {string} end1 - End time of first range (HH:MM)
 * @param {string} start2 - Start time of second range (HH:MM)
 * @param {string} end2 - End time of second range (HH:MM)
 * @returns {boolean} True if ranges overlap
 */
export function isTimeOverlapping(start1, end1, start2, end2) {
    return timeToMinutes(start1) < timeToMinutes(end2) && timeToMinutes(end1) > timeToMinutes(start2);
}

// ============================================
// SANITIZATION
// ============================================

/**
 * Sanitize HTML to prevent XSS attacks
 * Fallback if security.js fails to load
 * @param {any} value - Value to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeHTML(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    return str.replace(/[&<>"'\/]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;'
    }[tag] || tag));
}

// ============================================
// COLLECTION UTILITIES
// ============================================

/**
 * Normalize collection to array
 * Handles arrays, objects, and null/undefined
 * @param {*} collection - Collection to normalize
 * @returns {Array} Normalized array
 */
export function normalizeCollection(collection) {
    if (Array.isArray(collection)) {
        return collection;
    }
    if (collection && typeof collection === 'object') {
        return Object.values(collection);
    }
    return [];
}

/**
 * Deep merge two objects
 * Recursively merges nested objects
 * @param {object} target - Target object
 * @param {object} source - Source object
 * @returns {object} Merged object
 */
export function deepMerge(target, source) {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key]) && isObject(target[key])) {
                output[key] = deepMerge(target[key], source[key]);
            } else {
                // Overwrite if source[key] is not an object or target[key] is not an object.
                // This handles primitives, arrays, and objects replacing non-objects.
                output[key] = source[key];
            }
        });
    }
    return output;
}

/**
 * Check if value is a plain object
 * @param {*} item - Item to check
 * @returns {boolean} True if plain object
 */
export function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

// ============================================
// UI UTILITIES
// ============================================

/**
 * Show toast notification
 * @param {string} message - Message to display
 */
export function showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) {
        console.warn('Toast element not found');
        return;
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Show modal dialog
 * @param {Object} options - Dialog options
 * @param {string} options.title - Dialog title
 * @param {string} options.message - Dialog message
 * @param {Array} options.buttons - Array of button configurations
 */
export function showDialog({ title, message, buttons }) {
    const modal = document.getElementById('dialog-modal');
    if (!modal) {
        console.error('Dialog modal element not found');
        return;
    }

    document.getElementById('dialog-title').textContent = title;
    document.getElementById('dialog-message').textContent = message;
    const buttonsContainer = document.getElementById('dialog-buttons');
    buttonsContainer.innerHTML = '';

    buttons.forEach(btnInfo => {
        const button = document.createElement('button');
        button.textContent = btnInfo.text;
        button.className = btnInfo.class || 'btn btn-secondary';
        button.onclick = () => {
            closeDialog();
            if (btnInfo.onClick) btnInfo.onClick();
        };
        buttonsContainer.appendChild(button);
    });

    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal').classList.remove('scale-95', 'opacity-0'), 10);
}

/**
 * Close dialog modal
 */
export function closeDialog() {
    const modal = document.getElementById('dialog-modal');
    if (!modal) return;

    modal.querySelector('.modal').classList.add('scale-95', 'opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 */
export function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => {
                showToast('Copied to clipboard!');
            })
            .catch(err => {
                console.error('Failed to copy text using Clipboard API: ', err);
                showToast('Failed to copy!');
            });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('Copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy text (execCommand): ', err);
            showToast('Failed to copy!');
        } finally {
            document.body.removeChild(textArea);
        }
    }
}

// ============================================
// PACKAGE UTILITIES
// ============================================

/**
 * Get lesson packages from settings
 * @param {object} settings - Settings object with packages
 * @returns {Array} Array of lesson packages
 */
export function getLessonPackages(settings) {
    if (!settings) return [];
    const packages = normalizeCollection(settings.packages);
    return Array.isArray(packages) ? packages : [];
}

/**
 * Get package price as number
 * @param {object} pkg - Package object
 * @returns {number|null} Package price or null if invalid
 */
export function getPackagePriceValue(pkg) {
    if (!pkg) return null;
    const priceNumber = Number(pkg.price);
    return Number.isFinite(priceNumber) ? priceNumber : null;
}
