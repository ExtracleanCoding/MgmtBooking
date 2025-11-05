/**
 * @fileoverview Security utilities for the Ray Ryan Management System
 * This module provides XSS prevention, input validation, and data integrity checks.
 *
 * @version 1.0.0
 * @author Security Enhancement
 * @created 2025-10-30
 */

/******************************************************************************
 * XSS PREVENTION
 ******************************************************************************/

/**
 * Enhanced HTML sanitization to prevent XSS attacks
 * @param {*} value - The value to sanitize
 * @returns {string} - Sanitized string safe for innerHTML
 */
function sanitizeHTML(value) {
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

/**
 * Sanitize for use in HTML attributes
 * @param {*} value - The value to sanitize
 * @returns {string} - Sanitized string safe for attributes
 */
function sanitizeAttribute(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Remove any quotes, angle brackets, and potentially dangerous characters
    return str.replace(/[<>"'`=]/g, '');
}

/**
 * Sanitize URL to prevent javascript: protocol and other dangerous URLs
 * @param {string} url - URL to sanitize
 * @returns {string} - Safe URL or empty string if dangerous
 */
function sanitizeURL(url) {
    if (!url) return '';
    const str = String(url).trim().toLowerCase();

    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    if (dangerousProtocols.some(protocol => str.startsWith(protocol))) {
        console.warn('Blocked potentially dangerous URL:', url);
        return '';
    }

    return url;
}

/**
 * Create a text node safely (prevents XSS)
 * Use this instead of innerHTML when displaying user content
 * @param {string} text - Text to display
 * @returns {Text} - Text node
 */
function createSafeTextNode(text) {
    return document.createTextNode(text || '');
}

/******************************************************************************
 * INPUT VALIDATION
 ******************************************************************************/

/**
 * Validation rules for different input types
 */
const ValidationRules = {
    email: {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address',
        maxLength: 254
    },
    phone: {
        pattern: /^[0-9\s\-\+\(\)]+$/,
        message: 'Please enter a valid phone number',
        maxLength: 20
    },
    name: {
        pattern: /^[a-zA-Z\s\-'\.]+$/,
        message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
        minLength: 1,
        maxLength: 100
    },
    currency: {
        pattern: /^\d+(\.\d{1,2})?$/,
        message: 'Please enter a valid amount (e.g., 10.50)',
        min: 0
    },
    time: {
        pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        message: 'Please enter a valid time (HH:MM)'
    },
    date: {
        pattern: /^\d{4}-\d{2}-\d{2}$/,
        message: 'Please enter a valid date (YYYY-MM-DD)'
    },
    text: {
        maxLength: 5000,
        message: 'Text is too long'
    }
};

/**
 * Validate input based on type
 * @param {string} value - Value to validate
 * @param {string} type - Type of validation (email, phone, name, etc.)
 * @returns {{valid: boolean, message: string}} - Validation result
 */
function validateInput(value, type) {
    const rule = ValidationRules[type];
    if (!rule) {
        return { valid: true, message: '' };
    }

    const str = String(value || '').trim();

    // Check length constraints
    if (rule.minLength !== undefined && str.length < rule.minLength) {
        return { valid: false, message: `Minimum length is ${rule.minLength} characters` };
    }
    if (rule.maxLength !== undefined && str.length > rule.maxLength) {
        return { valid: false, message: `Maximum length is ${rule.maxLength} characters` };
    }

    // Check pattern
    if (rule.pattern && !rule.pattern.test(str)) {
        return { valid: false, message: rule.message };
    }

    // Check numeric constraints
    if (rule.min !== undefined) {
        const num = parseFloat(str);
        if (isNaN(num) || num < rule.min) {
            return { valid: false, message: `Value must be at least ${rule.min}` };
        }
    }
    if (rule.max !== undefined) {
        const num = parseFloat(str);
        if (isNaN(num) || num > rule.max) {
            return { valid: false, message: `Value must be at most ${rule.max}` };
        }
    }

    return { valid: true, message: '' };
}

/**
 * Validate required field
 * @param {*} value - Value to check
 * @returns {{valid: boolean, message: string}} - Validation result
 */
function validateRequired(value) {
    const str = String(value || '').trim();
    if (!str) {
        return { valid: false, message: 'This field is required' };
    }
    return { valid: true, message: '' };
}

/******************************************************************************
 * DATA INTEGRITY & VALIDATION
 ******************************************************************************/

/**
 * Schema definitions for data validation
 */
const DataSchemas = {
    customer: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true, validation: 'name' },
        email: { type: 'string', required: false, validation: 'email' },
        phone: { type: 'string', required: false, validation: 'phone' },
        driving_school_details: { type: 'object', required: false }
    },
    booking: {
        id: { type: 'string', required: true },
        date: { type: 'string', required: true, validation: 'date' },
        startTime: { type: 'string', required: true, validation: 'time' },
        endTime: { type: 'string', required: true, validation: 'time' },
        customerId: { type: 'string', required: true },
        staffId: { type: 'string', required: true },
        serviceId: { type: 'string', required: true },
        status: { type: 'string', required: true },
        paymentStatus: { type: 'string', required: true },
        fee: { type: 'number', required: true }
    },
    staff: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true, validation: 'name' },
        email: { type: 'string', required: false, validation: 'email' },
        phone: { type: 'string', required: false, validation: 'phone' },
        staff_type: { type: 'string', required: true }
    },
    service: {
        id: { type: 'string', required: true },
        service_name: { type: 'string', required: true },
        duration_minutes: { type: 'number', required: true },
        base_price: { type: 'number', required: true }
    },
    resource: {
        id: { type: 'string', required: true },
        resource_name: { type: 'string', required: true },
        resource_type: { type: 'string', required: true }
    }
};

/**
 * Validate data object against schema
 * @param {Object} data - Data object to validate
 * @param {string} schemaName - Name of schema to validate against
 * @returns {{valid: boolean, errors: Array}} - Validation result with errors
 */
function validateData(data, schemaName) {
    const schema = DataSchemas[schemaName];
    if (!schema) {
        console.warn(`No schema found for: ${schemaName}`);
        return { valid: true, errors: [] };
    }

    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
        const value = data[field];

        // Check required
        if (rules.required) {
            const reqCheck = validateRequired(value);
            if (!reqCheck.valid) {
                errors.push(`${field}: ${reqCheck.message}`);
                continue;
            }
        }

        // Check type
        if (value !== undefined && value !== null) {
            const actualType = typeof value;
            if (rules.type === 'number' && actualType !== 'number') {
                errors.push(`${field}: Must be a number`);
            } else if (rules.type === 'string' && actualType !== 'string') {
                errors.push(`${field}: Must be a string`);
            } else if (rules.type === 'object' && actualType !== 'object') {
                errors.push(`${field}: Must be an object`);
            }
        }

        // Check validation rule
        if (value && rules.validation) {
            const validation = validateInput(value, rules.validation);
            if (!validation.valid) {
                errors.push(`${field}: ${validation.message}`);
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate state data before saving to localStorage
 * @param {Object} state - State object to validate
 * @returns {{valid: boolean, errors: Array}} - Validation result
 */
function validateState(state) {
    const errors = [];

    // Validate collections exist and are arrays
    const requiredCollections = ['customers', 'staff', 'resources', 'services', 'bookings'];
    for (const collection of requiredCollections) {
        if (!Array.isArray(state[collection])) {
            errors.push(`${collection} must be an array`);
        }
    }

    // Validate each item in collections
    if (Array.isArray(state.customers)) {
        state.customers.forEach((customer, idx) => {
            const validation = validateData(customer, 'customer');
            if (!validation.valid) {
                errors.push(`Customer ${idx}: ${validation.errors.join(', ')}`);
            }
        });
    }

    if (Array.isArray(state.bookings)) {
        state.bookings.forEach((booking, idx) => {
            const validation = validateData(booking, 'booking');
            if (!validation.valid) {
                errors.push(`Booking ${idx}: ${validation.errors.join(', ')}`);
            }
        });
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/******************************************************************************
 * ENCRYPTION FOR SENSITIVE DATA
 ******************************************************************************/

/**
 * Simple XOR-based encryption for API keys (better than plain text)
 * NOTE: This is NOT secure encryption! For production, use Web Crypto API
 * This is just obfuscation to prevent casual viewing in localStorage
 * @param {string} text - Text to encrypt/decrypt
 * @param {string} key - Encryption key
 * @returns {string} - Encrypted/decrypted text
 */
function simpleEncrypt(text, key) {
    if (!text) return '';
    const keyCode = key.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return btoa(text.split('').map((char, i) =>
        String.fromCharCode(char.charCodeAt(0) ^ (keyCode + i) % 256)
    ).join(''));
}

/**
 * Decrypt simple encrypted text
 * @param {string} encrypted - Encrypted text
 * @param {string} key - Decryption key
 * @returns {string} - Decrypted text
 */
function simpleDecrypt(encrypted, key) {
    if (!encrypted) return '';
    try {
        const keyCode = key.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        return atob(encrypted).split('').map((char, i) =>
            String.fromCharCode(char.charCodeAt(0) ^ (keyCode + i) % 256)
        ).join('');
    } catch (e) {
        console.error('Decryption failed:', e);
        return '';
    }
}

/**
 * Generate a device-specific encryption key
 * @returns {string} - Device key
 */
function getDeviceKey() {
    // Use a combination of browser properties to create a semi-stable key
    const navigatorInfo = navigator.userAgent + navigator.language;
    let key = localStorage.getItem('_deviceKey');
    if (!key) {
        key = btoa(navigatorInfo + Date.now());
        localStorage.setItem('_deviceKey', key);
    }
    return key;
}

/**
 * Encrypt API key for storage
 * @param {string} apiKey - API key to encrypt
 * @returns {string} - Encrypted key
 */
function encryptAPIKey(apiKey) {
    return simpleEncrypt(apiKey, getDeviceKey());
}

/**
 * Decrypt API key from storage
 * @param {string} encryptedKey - Encrypted key
 * @returns {string} - Decrypted API key
 */
function decryptAPIKey(encryptedKey) {
    return simpleDecrypt(encryptedKey, getDeviceKey());
}

/******************************************************************************
 * CONTENT SECURITY POLICY HELPERS
 ******************************************************************************/

/**
 * Check if CSP is supported
 * @returns {boolean} - Whether CSP is supported
 */
function isCSPSupported() {
    return 'securityPolicy' in document || 'SecurityPolicyViolationEvent' in window;
}

/**
 * Log CSP violations
 */
function setupCSPViolationReporting() {
    document.addEventListener('securitypolicyviolation', (e) => {
        console.error('CSP Violation:', {
            violatedDirective: e.violatedDirective,
            blockedURI: e.blockedURI,
            originalPolicy: e.originalPolicy
        });
    });
}

/******************************************************************************
 * RATE LIMITING & ABUSE PREVENTION
 ******************************************************************************/

/**
 * Simple rate limiter to prevent abuse
 */
class RateLimiter {
    constructor(maxRequests = 100, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = new Map();
    }

    /**
     * Check if action is allowed
     * @param {string} key - Unique key for the action
     * @returns {boolean} - Whether action is allowed
     */
    isAllowed(key) {
        const now = Date.now();
        const requestTimes = this.requests.get(key) || [];

        // Remove old requests outside the window
        const validRequests = requestTimes.filter(time => now - time < this.windowMs);

        if (validRequests.length >= this.maxRequests) {
            return false;
        }

        validRequests.push(now);
        this.requests.set(key, validRequests);
        return true;
    }

    /**
     * Clear rate limit for a key
     * @param {string} key - Key to clear
     */
    clear(key) {
        this.requests.delete(key);
    }
}

// Global rate limiter instance
const globalRateLimiter = new RateLimiter(1000, 60000); // 1000 actions per minute

/******************************************************************************
 * EXPORTS (for non-module environments, attach to window)
 ******************************************************************************/

// If this were a module system, we'd export these
// For now, they'll be available globally when script is loaded
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sanitizeHTML,
        sanitizeAttribute,
        sanitizeURL,
        createSafeTextNode,
        validateInput,
        validateRequired,
        validateData,
        validateState,
        encryptAPIKey,
        decryptAPIKey,
        setupCSPViolationReporting,
        RateLimiter,
        globalRateLimiter
    };
}
