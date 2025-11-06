/**
 * Staff Module for Ray Ryan Management System
 * Handles all staff-related operations including CRUD, guide qualifications,
 * and schedule management
 */

// ============================================
// IMPORTS
// ============================================

import {
    state,
    getCollection,
    addToCollection,
    updateInCollection,
    removeFromCollection,
    findById
} from '../core/state.js';

import {
    saveState,
    debouncedSaveState
} from '../core/storage.js';

import {
    generateUUID,
    showToast,
    showDialog,
    sanitizeHTML
} from '../core/utils.js';

import {
    clearSearchCache,
    btnPrimary,
    btnSecondary,
    btnDanger
} from '../core/optimization.js';

import {
    DB_KEYS
} from '../core/constants.js';

// ============================================
// STAFF LIST VIEW
// ============================================

/**
 * Render staff list view
 * Uses generic list view renderer with staff-specific columns
 */
export function renderStaffView() {
    const columns = [
        { header: 'Name', render: item => item.name },
        { header: 'Email', render: item => item.email || '-', class: 'hidden sm:table-cell' },
        { header: 'Phone', render: item => item.phone || '-', class: 'hidden md:table-cell' }
    ];

    // Call generic list view renderer
    if (typeof window.renderGenericListView === 'function') {
        window.renderGenericListView('staff', 'Staff', columns, state.staff, 'Staff Member');
    }
}

// ============================================
// STAFF CRUD OPERATIONS
// ============================================

/**
 * Save staff member (create new or edit existing)
 * Includes guide qualifications for tour guides
 * @param {Event} event - Form submit event
 */
export function saveStaff(event) {
    event.preventDefault();

    const staffId = document.getElementById('staff-id')?.value;
    const staffType = document.getElementById('staff-type')?.value || 'INSTRUCTOR';

    const staffData = {
        id: staffId || `staff_${generateUUID()}`,
        name: document.getElementById('staff-name')?.value || '',
        email: document.getElementById('staff-email')?.value || '',
        phone: document.getElementById('staff-phone')?.value || '',
        staff_type: staffType,
    };

    // Add guide qualifications if this is a tour guide
    if (staffType === 'GUIDE') {
        const languagesEl = document.getElementById('guide-languages');
        const specializationsEl = document.getElementById('guide-specializations');
        const certificationsEl = document.getElementById('guide-certifications');
        const certExpiryEl = document.getElementById('guide-certification-expiry');
        const ratingEl = document.getElementById('guide-rating');

        staffData.guide_qualifications = {
            languages: languagesEl ?
                languagesEl.value.split(',').map(l => l.trim()).filter(l => l) : [],
            specializations: specializationsEl ?
                specializationsEl.value.split(',').map(s => s.trim()).filter(s => s) : [],
            certifications: certificationsEl ?
                certificationsEl.value : '',
            certificationExpiry: certExpiryEl ?
                certExpiryEl.value : null,
            rating: ratingEl ?
                parseFloat(ratingEl.value) || 0 : 0,
        };
    }

    if (staffId) {
        const index = state.staff.findIndex(s => s.id === staffId);
        if (index !== -1) {
            state.staff[index] = { ...state.staff[index], ...staffData };
        }
    } else {
        state.staff.push(staffData);
    }

    // OPTIMIZATION: Clear search cache when staff data changes
    clearSearchCache();

    debouncedSaveState();
    closeStaffModal();
    renderStaffView();
}

/**
 * Delete staff member with confirmation
 * Sets staffId to null in affected bookings
 * @param {string} staffId - Staff ID to delete
 */
export function deleteStaff(staffId) {
    showDialog({
        title: 'Delete Staff Member',
        message: 'Are you sure? This may affect existing bookings.',
        buttons: [
            { text: 'Cancel', class: btnSecondary },
            {
                text: 'Delete',
                class: btnDanger,
                onClick: () => {
                    state.staff = state.staff.filter(s => s.id !== staffId);

                    // Set staffId to null in affected bookings
                    state.bookings.forEach(b => {
                        if (b.staffId === staffId) {
                            b.staffId = null;
                        }
                    });

                    // OPTIMIZATION: Clear search cache when staff deleted
                    clearSearchCache();

                    debouncedSaveState();

                    if (typeof window.refreshCurrentView === 'function') {
                        window.refreshCurrentView();
                    }
                }
            }
        ]
    });
}

// ============================================
// MODAL MANAGEMENT
// ============================================

/**
 * Toggle guide qualification fields visibility
 * Shows/hides guide-specific fields based on staff type
 */
export function toggleGuideFields() {
    const staffType = document.getElementById('staff-type')?.value;
    const guideSection = document.getElementById('guide-qualifications-section');

    if (!guideSection) return;

    if (staffType === 'GUIDE') {
        guideSection.classList.remove('hidden');
    } else {
        guideSection.classList.add('hidden');
    }
}

/**
 * Open staff modal for create/edit
 * @param {string|null} staffId - Staff ID to edit, or null for new staff
 */
export function openStaffModal(staffId = null) {
    const modal = document.getElementById('staff-modal');
    if (!modal) return;

    const form = modal.querySelector('form');
    if (form) form.reset();

    if (staffId) {
        const titleEl = document.getElementById('staff-modal-title');
        if (titleEl) titleEl.textContent = 'Edit Staff Member';

        const staff = state.staff.find(s => s.id === staffId);
        if (staff) {
            const idField = document.getElementById('staff-id');
            const nameField = document.getElementById('staff-name');
            const emailField = document.getElementById('staff-email');
            const phoneField = document.getElementById('staff-phone');
            const typeField = document.getElementById('staff-type');

            if (idField) idField.value = staff.id;
            if (nameField) nameField.value = staff.name;
            if (emailField) emailField.value = staff.email || '';
            if (phoneField) phoneField.value = staff.phone || '';
            if (typeField) typeField.value = staff.staff_type || 'INSTRUCTOR';

            // Populate guide qualifications if available
            if (staff.staff_type === 'GUIDE' && staff.guide_qualifications) {
                const quals = staff.guide_qualifications;

                const languagesField = document.getElementById('guide-languages');
                if (languagesField) {
                    languagesField.value = (quals.languages || []).join(', ');
                }

                const specializationsField = document.getElementById('guide-specializations');
                if (specializationsField) {
                    specializationsField.value = (quals.specializations || []).join(', ');
                }

                const certificationsField = document.getElementById('guide-certifications');
                if (certificationsField) {
                    certificationsField.value = quals.certifications || '';
                }

                const certExpiryField = document.getElementById('guide-certification-expiry');
                if (certExpiryField) {
                    certExpiryField.value = quals.certificationExpiry || '';
                }

                const ratingField = document.getElementById('guide-rating');
                if (ratingField) {
                    ratingField.value = quals.rating || 0;
                }
            }
        }
    } else {
        const titleEl = document.getElementById('staff-modal-title');
        if (titleEl) titleEl.textContent = 'New Staff Member';

        const idField = document.getElementById('staff-id');
        if (idField) idField.value = '';
    }

    toggleGuideFields();

    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal')?.classList.remove('scale-95', 'opacity-0'), 10);
}

/**
 * Close staff modal
 */
export function closeStaffModal() {
    const modal = document.getElementById('staff-modal');
    if (!modal) return;

    const modalContent = modal.querySelector('.modal');
    if (modalContent) {
        modalContent.classList.add('scale-95', 'opacity-0');
    }
    setTimeout(() => modal.classList.add('hidden'), 300);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get staff schedule for a given date range
 * Returns all bookings for staff members within the date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Object} Staff schedules grouped by staff ID
 */
export function getStaffSchedule(startDate, endDate) {
    const schedules = {};

    // Initialize schedules for all staff
    state.staff.forEach(staff => {
        schedules[staff.id] = {
            staff: staff,
            bookings: [],
            blockedPeriods: []
        };
    });

    // Add bookings to schedules
    state.bookings
        .filter(b => b.date >= startDate && b.date <= endDate && b.status !== 'Cancelled')
        .forEach(booking => {
            if (booking.staffId && schedules[booking.staffId]) {
                schedules[booking.staffId].bookings.push(booking);
            }
        });

    // Add blocked periods to schedules
    state.blockedPeriods
        .filter(bp => bp.date >= startDate && bp.date <= endDate)
        .forEach(blockedPeriod => {
            if (blockedPeriod.staffId && schedules[blockedPeriod.staffId]) {
                schedules[blockedPeriod.staffId].blockedPeriods.push(blockedPeriod);
            }
        });

    return schedules;
}

/**
 * Get available staff for a given date and time
 * Returns staff members who are not booked or on leave
 * @param {string} date - Date (YYYY-MM-DD)
 * @param {string} startTime - Start time (HH:MM)
 * @param {string} endTime - End time (HH:MM)
 * @param {string} excludeBookingId - Booking ID to exclude from conflict check
 * @returns {Array} Available staff members
 */
export function getAvailableStaff(date, startTime, endTime, excludeBookingId = null) {
    return state.staff.filter(staff => {
        // Check if staff is booked during this time
        const hasBooking = state.bookings.some(b =>
            b.id !== excludeBookingId &&
            b.staffId === staff.id &&
            b.date === date &&
            b.status !== 'Cancelled' &&
            typeof window.isTimeOverlapping === 'function' &&
            window.isTimeOverlapping(startTime, endTime, b.startTime, b.endTime)
        );

        if (hasBooking) return false;

        // Check if staff has blocked period during this time
        const hasBlockedPeriod = state.blockedPeriods.some(bp =>
            bp.staffId === staff.id &&
            bp.date === date &&
            typeof window.isTimeOverlapping === 'function' &&
            window.isTimeOverlapping(startTime, endTime, bp.startTime, bp.endTime)
        );

        return !hasBlockedPeriod;
    });
}

/**
 * Get staff member by ID
 * @param {string} staffId - Staff ID
 * @returns {Object|null} Staff member or null
 */
export function getStaffById(staffId) {
    return state.staff.find(s => s.id === staffId) || null;
}

/**
 * Get guide qualifications summary
 * Returns formatted guide qualifications for display
 * @param {string} staffId - Staff ID
 * @returns {string} Formatted qualifications or empty string
 */
export function getGuideQualificationsSummary(staffId) {
    const staff = getStaffById(staffId);
    if (!staff || staff.staff_type !== 'GUIDE' || !staff.guide_qualifications) {
        return '';
    }

    const quals = staff.guide_qualifications;
    const parts = [];

    if (quals.languages && quals.languages.length > 0) {
        parts.push(`Languages: ${quals.languages.join(', ')}`);
    }

    if (quals.specializations && quals.specializations.length > 0) {
        parts.push(`Specializations: ${quals.specializations.join(', ')}`);
    }

    if (quals.rating) {
        parts.push(`Rating: ${quals.rating}/5`);
    }

    return parts.join(' | ');
}

// ============================================
// EXPORTS FOR GLOBAL ACCESS (BACKWARDS COMPATIBILITY)
// ============================================

if (typeof window !== 'undefined') {
    window.renderStaffView = renderStaffView;
    window.saveStaff = saveStaff;
    window.deleteStaff = deleteStaff;
    window.toggleGuideFields = toggleGuideFields;
    window.openStaffModal = openStaffModal;
    window.closeStaffModal = closeStaffModal;
    window.getStaffSchedule = getStaffSchedule;
    window.getAvailableStaff = getAvailableStaff;
    window.getStaffById = getStaffById;
    window.getGuideQualificationsSummary = getGuideQualificationsSummary;
}
