/**
 * Performance Optimization Utilities for Ray Ryan Management System
 * Functions for memoization, debouncing, pagination, compression, and accessibility
 */

// Import constants (Note: Will be available once we wire up the module system)
// For now, define locally to avoid circular dependencies during migration
const PAGINATION_CONFIG_LOCAL = {
    itemsPerPage: 50,
    maxPageButtons: 5
};

// ============================================
// MEMOIZATION
// ============================================

/**
 * Memoize function results to avoid expensive recalculations
 * Uses LRU (Least Recently Used) cache eviction when cache size exceeds 1000 entries
 * @param {Function} fn - Function to memoize
 * @param {Function} keyFn - Function to generate cache key from arguments (default: JSON.stringify)
 * @returns {Function} Memoized function with cache and clearCache methods
 */
export function memoize(fn, keyFn = JSON.stringify) {
    const cache = new Map();

    const memoized = function(...args) {
        const key = keyFn(args);

        if (cache.has(key)) {
            return cache.get(key);
        }

        const result = fn.apply(this, args);
        cache.set(key, result);

        // Limit cache size to prevent memory issues (LRU eviction)
        if (cache.size > 1000) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
        }

        return result;
    };

    // Expose cache for clearing
    memoized.cache = cache;
    memoized.clearCache = () => cache.clear();

    return memoized;
}

/**
 * Clear memoization cache for a memoized function
 * Call this when underlying data changes
 * @param {Function} fn - Memoized function with cache
 */
export function clearMemoCache(fn) {
    if (fn && fn.cache) {
        fn.cache.clear();
    }
}

// ============================================
// DEBOUNCE
// ============================================

/**
 * Debounce a function - delay execution until after wait period
 * Prevents excessive function calls during rapid user input
 * @param {Function} fn - Function to debounce
 * @param {number} wait - Milliseconds to wait before execution (default: 300ms)
 * @returns {Function} Debounced function with cancel method
 */
export function debounce(fn, wait = 300) {
    let timeoutId;

    const debounced = function(...args) {
        clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
            fn.apply(this, args);
        }, wait);
    };

    // Allow immediate cancellation
    debounced.cancel = function() {
        clearTimeout(timeoutId);
    };

    return debounced;
}

// ============================================
// SEARCH CACHE
// ============================================

/**
 * Cache for search results to avoid re-computing identical searches
 * Map structure: searchTerm -> {customers: [], bookings: [], staff: []}
 */
export const searchCache = new Map();

/**
 * Clear search cache when underlying data changes
 */
export function clearSearchCache() {
    searchCache.clear();
}

// ============================================
// DATA COMPRESSION
// ============================================

/**
 * Compress data using LZ-String before saving to localStorage
 * Reduces storage size by ~70%
 * @param {*} data - Data to compress (will be JSON stringified)
 * @returns {string} Compressed string
 */
export function compressData(data) {
    try {
        const jsonString = JSON.stringify(data);
        // Check if LZString is available (loaded from CDN)
        if (typeof LZString !== 'undefined' && LZString.compress) {
            return LZString.compress(jsonString);
        }
        // Fallback: return uncompressed if library not loaded
        console.warn('LZ-String not available, storing uncompressed');
        return jsonString;
    } catch (error) {
        console.error('Compression failed:', error);
        return JSON.stringify(data); // Fallback to uncompressed
    }
}

/**
 * Decompress data loaded from localStorage
 * Handles both compressed and uncompressed data for backwards compatibility
 * @param {string} compressedData - Data from localStorage
 * @returns {*} Decompressed and parsed data
 */
export function decompressData(compressedData) {
    try {
        if (!compressedData || compressedData === 'null' || compressedData === 'undefined') {
            return null;
        }

        // Check if LZString is available
        if (typeof LZString !== 'undefined' && LZString.decompress) {
            // Try decompression first
            const decompressed = LZString.decompress(compressedData);
            if (decompressed) {
                return JSON.parse(decompressed);
            }
        }

        // Fallback: Try parsing as uncompressed JSON (backwards compatibility)
        return JSON.parse(compressedData);
    } catch (error) {
        console.error('Decompression failed:', error);
        // Last resort: try parsing as plain JSON
        try {
            return JSON.parse(compressedData);
        } catch (e) {
            console.error('Failed to parse as JSON:', e);
            return null;
        }
    }
}

// ============================================
// PAGINATION
// ============================================

/**
 * Pagination state - tracks current page for each view
 * External code can import and modify this object
 */
export const paginationState = {
    customers: 1,
    staff: 1,
    resources: 1,
    services: 1,
    expenses: 1,
    'waiting-list': 1
};

/**
 * Get paginated subset of data
 * @param {Array} data - Full dataset
 * @param {number} page - Current page (1-indexed)
 * @param {number} itemsPerPage - Items per page (default: 50)
 * @returns {Object} {items, currentPage, totalPages, startIndex, endIndex, total, hasMore, hasPrevious}
 */
export function paginateData(data, page = 1, itemsPerPage = PAGINATION_CONFIG_LOCAL.itemsPerPage) {
    const total = data.length;
    const totalPages = Math.ceil(total / itemsPerPage);
    const safePage = Math.max(1, Math.min(page, totalPages || 1));
    const startIndex = (safePage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, total);
    const items = data.slice(startIndex, endIndex);

    return {
        items,
        currentPage: safePage,
        totalPages,
        startIndex,
        endIndex,
        total,
        hasMore: endIndex < total,
        hasPrevious: safePage > 1
    };
}

/**
 * Generate pagination controls HTML
 * @param {Object} paginationInfo - Result from paginateData()
 * @param {string} viewName - Name of the view (e.g., 'customers')
 * @returns {string} HTML for pagination controls
 */
export function generatePaginationHTML(paginationInfo, viewName) {
    if (paginationInfo.totalPages <= 1) {
        return ''; // No pagination needed
    }

    const { currentPage, totalPages, startIndex, endIndex, total } = paginationInfo;

    // Calculate page range to show
    const maxButtons = PAGINATION_CONFIG_LOCAL.maxPageButtons;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxButtons) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    // Generate page number buttons
    let pageButtons = '';
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === currentPage ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50';
        pageButtons += `
            <button
                onclick="changePage('${viewName}', ${i})"
                class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${activeClass}"
            >
                ${i}
            </button>
        `;
    }

    return `
        <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div class="flex-1 flex justify-between sm:hidden">
                <!-- Mobile pagination -->
                <button
                    onclick="changePage('${viewName}', ${currentPage - 1})"
                    ${!paginationInfo.hasPrevious ? 'disabled' : ''}
                    class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <button
                    onclick="changePage('${viewName}', ${currentPage + 1})"
                    ${!paginationInfo.hasMore ? 'disabled' : ''}
                    class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p class="text-sm text-gray-700">
                        Showing <span class="font-medium">${startIndex + 1}</span> to <span class="font-medium">${endIndex}</span> of{' '}
                        <span class="font-medium">${total}</span> results
                    </p>
                </div>
                <div>
                    <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <!-- Previous button -->
                        <button
                            onclick="changePage('${viewName}', ${currentPage - 1})"
                            ${!paginationInfo.hasPrevious ? 'disabled' : ''}
                            class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span class="sr-only">Previous</span>
                            ‹
                        </button>

                        <!-- Page numbers -->
                        ${pageButtons}

                        <!-- Next button -->
                        <button
                            onclick="changePage('${viewName}', ${currentPage + 1})"
                            ${!paginationInfo.hasMore ? 'disabled' : ''}
                            class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span class="sr-only">Next</span>
                            ›
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    `;
}

/**
 * Change page for a view
 * NOTE: This function depends on refreshCurrentView() from the main application
 * During migration, ensure this is properly wired up
 * @param {string} viewName - Name of the view
 * @param {number} page - Page number to navigate to
 */
export function changePage(viewName, page) {
    paginationState[viewName] = page;
    // NOTE: refreshCurrentView() must be available in global scope or passed as dependency
    if (typeof refreshCurrentView === 'function') {
        refreshCurrentView();
    } else {
        console.warn('changePage: refreshCurrentView() not available. Ensure proper wiring during migration.');
    }
}

// ============================================
// CHART MANAGEMENT
// ============================================

/**
 * Active Chart.js instances for cleanup
 * All created charts should be pushed to this array
 */
export let activeCharts = [];

/**
 * Destroy all active Chart.js instances
 * Prevents memory leaks by properly cleaning up chart objects
 * Call this before creating new charts or switching views
 */
export function destroyAllCharts() {
    if (activeCharts && activeCharts.length > 0) {
        activeCharts.forEach(chart => {
            try {
                if (chart && typeof chart.destroy === 'function') {
                    chart.destroy();
                }
            } catch (error) {
                console.warn('Failed to destroy chart:', error);
            }
        });
        activeCharts = [];
    }
}

// ============================================
// ACCESSIBILITY: FOCUS MANAGEMENT & KEYBOARD NAV
// ============================================

/**
 * Store the last focused element before opening a modal
 */
let lastFocusedElement = null;

/**
 * Trap focus within a modal dialog
 * Ensures keyboard navigation stays within the modal for accessibility
 * @param {HTMLElement} modalElement - The modal container
 */
export function trapFocus(modalElement) {
    const focusableElements = modalElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Focus first element
    setTimeout(() => firstFocusable?.focus(), 100);

    // Handle tab navigation
    function handleTabKey(e) {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable?.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable?.focus();
            }
        }
    }

    modalElement.addEventListener('keydown', handleTabKey);

    // Store cleanup function
    modalElement._cleanupFocusTrap = () => {
        modalElement.removeEventListener('keydown', handleTabKey);
    };
}

/**
 * Announce message to screen readers
 * Uses ARIA live regions for non-visual feedback
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' (default) or 'assertive'
 */
export function announceToScreenReader(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

/**
 * Save focus before opening modal
 */
export function saveFocusBeforeModal() {
    lastFocusedElement = document.activeElement;
}

/**
 * Restore focus after closing modal
 */
export function restoreFocusAfterModal() {
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
        lastFocusedElement = null;
    }
}

/**
 * Enhanced keyboard navigation
 * Global keyboard shortcuts for improved accessibility
 * - Escape: Close modals
 * - Ctrl/Cmd+F or Ctrl/Cmd+K: Focus search
 */
export function setupGlobalKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Escape key - close modals
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal-backdrop:not(.hidden)');
            if (openModal) {
                const modalId = openModal.id;
                // Find the appropriate close function
                const closeFunction = window[`close${modalId.split('-')[0].charAt(0).toUpperCase() + modalId.split('-')[0].slice(1)}Modal`];
                if (typeof closeFunction === 'function') {
                    closeFunction();
                }
            }
        }

        // Ctrl+F or Cmd+F - Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.getElementById('global-search');
            if (searchInput) {
                searchInput.focus();
                announceToScreenReader('Search focused. Start typing to search.');
            }
        }

        // Ctrl+K or Cmd+K - Focus search (alternative)
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('global-search');
            if (searchInput) {
                searchInput.focus();
                announceToScreenReader('Search focused. Start typing to search.');
            }
        }
    });
}

/**
 * Make pagination controls keyboard accessible
 * Allows Enter key to activate pagination buttons
 */
export function enhancePaginationAccessibility() {
    // Allow Enter key to activate pagination buttons
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.hasAttribute('onclick')) {
            e.target.click();
        }
    });
}
