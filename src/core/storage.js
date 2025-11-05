/**
 * LocalStorage Operations for Ray Ryan Management System
 * Handles loading and saving application state with compression and encryption
 */

// NOTE: During migration, these imports will be properly wired up
// For now, these functions must be available in global scope or imported
// import { state, setState } from './state.js';
// import { DB_KEYS, btnPrimary } from './constants.js';
// import { compressData, decompressData } from './optimization.js';
// import { deepMerge, showDialog } from './utils.js';

// ============================================
// DEFAULT SETTINGS
// ============================================

/**
 * Default application settings
 * These are merged with saved settings on load
 */
const DEFAULT_SETTINGS = {
    mockTestRate: 60.00,
    mockTestDuration: 1.5,
    packages: [],
    instructorName: 'Ray Ryan',
    instructorAddress: '123 Driving School Ln, Town, T12 3AB',
    paymentDetails: 'Please make payment via Bank Transfer to:\nAccount Name: Ray Ryan\nSort Code: 00-00-00\nAccount No: 00000000',
    smsTemplate: 'Hi [CustomerFirstName], this is a friendly reminder for your driving lesson on [LessonDate] at [LessonTime]. See you then! From [InstructorName].',
    autoBackupEnabled: false,
    autoRemindersEnabled: false,
    autoEmailRemindersEnabled: false,
    googleCalendarEnabled: false,
    googleCalendarClientId: '',
    googleCalendarApiKey: '',
    googleCalendarAutoSync: false,
    autoPaymentRemindersEnabled: false,
    paymentReminderDays: [7, 14, 30],
    invoiceLogo: '',
    vatNumber: '',
    invoiceEmail: '',
    invoicePhone: '',
    invoiceTerms: 'Payment due within 14 days. Late payments may incur additional charges.',
    invoiceThankYou: 'Thank you for your business!',
    invoiceFooterNote: 'This invoice was generated electronically and is valid without a signature.',
    firstDayOfWeek: 'monday',
    aiProvider: 'gemini',
    apiKeys: { gemini: '', openai: '', perplexity: '', openrouter: '' },
    apiModels: {
        gemini: 'gemini-1.5-flash-latest',
        openai: 'gpt-4-turbo',
        perplexity: 'llama-3-sonar-large-32k-online',
        openrouter: 'google/gemini-flash-1.5'
    }
};

/**
 * Export default settings for use in other modules
 */
export { DEFAULT_SETTINGS };

// ============================================
// DEBOUNCE CONFIGURATION
// ============================================

/**
 * Debounce timeout for saveState
 */
let saveStateTimeout = null;

/**
 * Delay in milliseconds before saving state
 */
const SAVE_DEBOUNCE_DELAY = 200;

// ============================================
// LOAD STATE
// ============================================

/**
 * Load application state from localStorage
 * Handles decompression, decryption, and error recovery
 * DEPENDENCIES: Requires state, DB_KEYS, decompressData, deepMerge, showDialog, btnPrimary, decryptAPIKey (optional)
 */
export function loadState() {
    try {
        /**
         * Safe JSON parsing with decompression support
         * Handles both compressed and uncompressed data for backwards compatibility
         * @param {string} key - localStorage key
         * @param {*} fallback - Fallback value if parsing fails
         * @param {boolean} isCritical - Whether to show error dialog
         * @returns {*} Parsed data or fallback
         */
        const safeJSONParse = (key, fallback, isCritical = false) => {
            try {
                const item = localStorage.getItem(key);
                if (item === null || item === 'null' || item === 'undefined') return fallback;

                // Use decompressData which handles both compressed and uncompressed data
                const parsed = decompressData(item);
                return parsed !== null ? parsed : fallback;
            } catch (e) {
                console.error(`Error parsing localStorage key "${key}":`, e);
                if (isCritical) {
                    showDialog({
                        title: 'Data Corruption Error',
                        message: `Failed to load critical data ("${key}"). The application may not function correctly. It's recommended to restore from a backup or clear all data in settings.`,
                        buttons: [{ text: 'OK', class: btnPrimary }]
                    });
                }
                return fallback;
            }
        };

        // Load all collections from localStorage
        state.customers = safeJSONParse(DB_KEYS.CUSTOMERS, [], true);
        state.staff = safeJSONParse(DB_KEYS.STAFF, [], true);
        state.resources = safeJSONParse(DB_KEYS.RESOURCES, [], true);
        state.services = safeJSONParse(DB_KEYS.SERVICES, [], true);
        state.bookings = safeJSONParse(DB_KEYS.BOOKINGS, [], true);
        state.blockedPeriods = safeJSONParse(DB_KEYS.BLOCKED_PERIODS, []);
        state.expenses = safeJSONParse(DB_KEYS.EXPENSES, []);
        state.transactions = safeJSONParse(DB_KEYS.TRANSACTIONS, []);
        state.waitingList = safeJSONParse(DB_KEYS.WAITING_LIST, []);

        // Load and merge settings with defaults
        const savedSettings = safeJSONParse(DB_KEYS.SETTINGS, {});
        state.settings = deepMerge(DEFAULT_SETTINGS, savedSettings);

        // SECURITY: Decrypt API keys after loading (if encryption is available)
        if (typeof decryptAPIKey === 'function' && state.settings._encryptedApiKeys) {
            const decryptedKeys = {};
            for (const [provider, encryptedKey] of Object.entries(state.settings._encryptedApiKeys)) {
                decryptedKeys[provider] = encryptedKey ? decryptAPIKey(encryptedKey) : '';
            }
            state.settings.apiKeys = decryptedKeys;
            delete state.settings._encryptedApiKeys; // Clean up
        }

    } catch (error) {
        console.error("Failed to load state from localStorage:", error);
        showDialog({
            title: 'Loading Error',
            message: 'Could not load application data. Your browser might be in private mode or localStorage is disabled. Some features may not work correctly.',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
    }
}

// ============================================
// SAVE STATE
// ============================================

/**
 * Save application state to localStorage
 * Handles compression, encryption, and validation
 * DEPENDENCIES: Requires state, DB_KEYS, compressData, showDialog, btnPrimary, encryptAPIKey (optional), validateState (optional)
 */
export function saveState() {
    try {
        // SECURITY: Validate state data before saving (if validation is available)
        if (typeof validateState === 'function') {
            const validation = validateState(state);
            if (!validation.valid) {
                console.error('State validation failed:', validation.errors);
                // Still save but log the errors
                showDialog({
                    title: 'Data Validation Warning',
                    message: 'Some data failed validation checks. Please review your recent changes. Errors: ' + validation.errors.slice(0, 3).join('; '),
                    buttons: [{ text: 'OK', class: btnPrimary }]
                });
            }
        }

        // SECURITY: Encrypt API keys before saving (if encryption is available)
        const settingsToSave = { ...state.settings };
        if (typeof encryptAPIKey === 'function' && settingsToSave.apiKeys) {
            const encryptedKeys = {};
            for (const [provider, key] of Object.entries(settingsToSave.apiKeys)) {
                encryptedKeys[provider] = key ? encryptAPIKey(key) : '';
            }
            settingsToSave._encryptedApiKeys = encryptedKeys;
            delete settingsToSave.apiKeys; // Don't save plain text keys
        }

        // OPTIMIZATION: Compress data before saving (reduces storage by ~70%)
        localStorage.setItem(DB_KEYS.CUSTOMERS, compressData(state.customers));
        localStorage.setItem(DB_KEYS.STAFF, compressData(state.staff));
        localStorage.setItem(DB_KEYS.RESOURCES, compressData(state.resources));
        localStorage.setItem(DB_KEYS.SERVICES, compressData(state.services));
        localStorage.setItem(DB_KEYS.BOOKINGS, compressData(state.bookings));
        localStorage.setItem(DB_KEYS.BLOCKED_PERIODS, compressData(state.blockedPeriods));
        localStorage.setItem(DB_KEYS.EXPENSES, compressData(state.expenses));
        localStorage.setItem(DB_KEYS.TRANSACTIONS, compressData(state.transactions));
        localStorage.setItem(DB_KEYS.WAITING_LIST, compressData(state.waitingList));
        localStorage.setItem(DB_KEYS.SETTINGS, compressData(settingsToSave));
    } catch (error) {
        console.error("Failed to save state to localStorage:", error);
        showDialog({
            title: 'Save Error',
            message: 'Could not save application data. Your browser storage might be full. Please clear some space or export a backup.',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
    }
}

// ============================================
// DEBOUNCED SAVE
// ============================================

/**
 * Debounced version of saveState
 * Delays saving until user stops making changes
 * Prevents excessive writes to localStorage during rapid updates
 */
export function debouncedSaveState() {
    if (saveStateTimeout) {
        clearTimeout(saveStateTimeout);
    }
    saveStateTimeout = setTimeout(() => {
        saveState();
        saveStateTimeout = null;
    }, SAVE_DEBOUNCE_DELAY);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Clear all data from localStorage
 * USE WITH CAUTION: This permanently deletes all application data
 */
export function clearAllData() {
    try {
        localStorage.clear();
        console.log('All data cleared from localStorage');
    } catch (error) {
        console.error('Failed to clear localStorage:', error);
    }
}

/**
 * Export state as JSON for backup
 * @returns {string} JSON string of current state
 */
export function exportStateAsJSON() {
    try {
        return JSON.stringify(state, null, 2);
    } catch (error) {
        console.error('Failed to export state:', error);
        return null;
    }
}

/**
 * Import state from JSON backup
 * @param {string} jsonString - JSON string to import
 * @returns {boolean} True if successful, false otherwise
 */
export function importStateFromJSON(jsonString) {
    try {
        const importedState = JSON.parse(jsonString);

        // Validate basic structure
        if (!importedState || typeof importedState !== 'object') {
            console.error('Invalid state format');
            return false;
        }

        // Update state with imported data
        Object.assign(state, importedState);

        // Save to localStorage
        saveState();

        return true;
    } catch (error) {
        console.error('Failed to import state:', error);
        return false;
    }
}

/**
 * Get localStorage usage statistics
 * @returns {Object} {used, total, percentage}
 */
export function getStorageUsage() {
    try {
        let totalSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length + key.length;
            }
        }

        // Most browsers allow ~5-10MB, we'll use 5MB as conservative estimate
        const totalAvailable = 5 * 1024 * 1024; // 5MB in bytes
        const percentage = ((totalSize / totalAvailable) * 100).toFixed(2);

        return {
            used: totalSize,
            usedFormatted: (totalSize / 1024).toFixed(2) + ' KB',
            total: totalAvailable,
            totalFormatted: (totalAvailable / 1024 / 1024).toFixed(2) + ' MB',
            percentage: parseFloat(percentage)
        };
    } catch (error) {
        console.error('Failed to calculate storage usage:', error);
        return null;
    }
}
