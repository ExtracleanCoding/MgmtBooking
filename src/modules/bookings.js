/**
 * Bookings Module for Ray Ryan Management System
 * Handles all booking-related operations including creation, editing, deletion,
 * conflict detection, pricing, recurring bookings, and tour management
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
    findById,
    setCurrentDate,
    getCurrentDate
} from '../core/state.js';

import {
    saveState,
    debouncedSaveState
} from '../core/storage.js';

import {
    generateUUID,
    parseYYYYMMDD,
    safeDateFormat,
    toLocalDateString,
    timeToMinutes,
    minutesToTime,
    isTimeOverlapping,
    showToast,
    showDialog,
    sanitizeHTML
} from '../core/utils.js';

import {
    memoize,
    clearMemoCache,
    clearSearchCache,
    btnPrimary,
    btnSecondary,
    btnDanger
} from '../core/optimization.js';

import {
    DB_KEYS,
    CALENDAR_START_HOUR,
    CALENDAR_END_HOUR,
    BOOKING_STATUS,
    PAYMENT_STATUS
} from '../core/constants.js';

// ============================================
// CONFLICT DETECTION
// ============================================

/**
 * Find booking conflicts for a given booking
 * Checks for staff conflicts, customer conflicts, resource conflicts, and staff leave
 * @param {Object} bookingDetails - Booking details to check
 * @returns {string|null} Conflict message or null if no conflicts
 */
export function findBookingConflict(bookingDetails) {
    const { id, date, startTime, endTime, customerId, staffId, resourceIds } = bookingDetails;

    // Skip conflict checks for cancelled bookings
    const activeBookings = state.bookings.filter(b => b.status !== 'Cancelled');

    // Check for staff conflicts
    const staffConflict = activeBookings.find(b =>
        b.id !== id &&
        b.date === date &&
        b.staffId === staffId &&
        isTimeOverlapping(startTime, endTime, b.startTime, b.endTime)
    );

    if (staffConflict) {
        const staff = findById('staff', staffId);
        const staffName = staff ? staff.name : 'Staff member';
        return `${staffName} is already booked from ${staffConflict.startTime} to ${staffConflict.endTime}.`;
    }

    // Check for customer conflicts
    const customerConflict = activeBookings.find(b =>
        b.id !== id &&
        b.date === date &&
        b.customerId === customerId &&
        isTimeOverlapping(startTime, endTime, b.startTime, b.endTime)
    );

    if (customerConflict) {
        const customer = findById('customers', customerId);
        const customerName = customer ? customer.name : 'This customer';
        return `${customerName} already has a booking from ${customerConflict.startTime} to ${customerConflict.endTime}.`;
    }

    // Check for resource conflicts
    if (resourceIds && resourceIds.length > 0) {
        for (const resourceId of resourceIds) {
            const resourceConflict = activeBookings.find(b =>
                b.id !== id &&
                b.date === date &&
                b.resourceIds &&
                b.resourceIds.includes(resourceId) &&
                isTimeOverlapping(startTime, endTime, b.startTime, b.endTime)
            );

            if (resourceConflict) {
                const resource = findById('resources', resourceId);
                const resourceName = resource ? resource.name : 'A resource';
                return `${resourceName} is already booked from ${resourceConflict.startTime} to ${resourceConflict.endTime}.`;
            }
        }
    }

    // Check for staff leave (blocked periods)
    const blockedPeriod = state.blockedPeriods.find(bp =>
        bp.date === date &&
        bp.staffId === staffId &&
        isTimeOverlapping(startTime, endTime, bp.startTime, bp.endTime)
    );

    if (blockedPeriod) {
        const staff = findById('staff', staffId);
        const staffName = staff ? staff.name : 'Staff member';
        return `${staffName} has blocked time from ${blockedPeriod.startTime} to ${blockedPeriod.endTime} (${blockedPeriod.reason || 'Time off'}).`;
    }

    return null; // No conflicts
}

/**
 * Check for adjacent bookings and warn if no buffer time
 * Recommends 15-minute buffer between lessons
 * @param {Object} bookingDetails - Booking details to check
 * @returns {string|null} Warning message or null
 */
export function checkAdjacentBookings(bookingDetails) {
    const { id, date, startTime, endTime, staffId } = bookingDetails;
    const RECOMMENDED_BUFFER_MINUTES = 15;

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    // Find bookings immediately before or after
    const adjacentBooking = state.bookings.find(b =>
        b.id !== id &&
        b.status !== 'Cancelled' &&
        b.date === date &&
        b.staffId === staffId &&
        (
            timeToMinutes(b.endTime) === startMinutes || // Ends when this starts
            timeToMinutes(b.startTime) === endMinutes    // Starts when this ends
        )
    );

    if (adjacentBooking) {
        const staff = findById('staff', staffId);
        const staffName = staff ? staff.name : 'Staff member';
        return `Note: This booking is back-to-back with another booking for ${staffName}. Consider adding a ${RECOMMENDED_BUFFER_MINUTES}-minute buffer between lessons.`;
    }

    return null;
}

// ============================================
// RECURRING BOOKINGS
// ============================================

/**
 * Toggle recurring booking options visibility
 * Shows/hides recurring options in booking modal
 */
export function toggleRecurringOptions() {
    const isRecurring = document.getElementById('booking-recurring')?.checked;
    const recurringOptions = document.getElementById('recurring-options');
    if (recurringOptions) {
        recurringOptions.classList.toggle('hidden', !isRecurring);
    }
    if (isRecurring) {
        updateRecurringPreview();
    }
}

/**
 * Update preview of recurring bookings
 * Shows dates that will be created based on recurrence pattern
 */
export function updateRecurringPreview() {
    const pattern = document.getElementById('recurring-pattern')?.value;
    const endDate = document.getElementById('recurring-end-date')?.value;
    const startDate = document.getElementById('booking-date')?.value;
    const preview = document.getElementById('recurring-preview');

    if (!preview || !startDate || !endDate || !pattern) return;

    const dates = generateRecurringDates(startDate, endDate, pattern);
    preview.innerHTML = `<strong>Will create ${dates.length} bookings:</strong><br>${dates.slice(0, 5).join(', ')}${dates.length > 5 ? ` ... and ${dates.length - 5} more` : ''}`;
}

/**
 * Generate array of dates for recurring bookings
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {string} pattern - Recurrence pattern ('daily', 'weekly', 'biweekly')
 * @returns {string[]} Array of date strings
 */
export function generateRecurringDates(startDate, endDate, pattern) {
    const dates = [];
    let currentDate = parseYYYYMMDD(startDate);
    const finalDate = parseYYYYMMDD(endDate);

    if (!currentDate || !finalDate || currentDate > finalDate) return dates;

    let incrementDays;
    switch (pattern) {
        case 'daily':
            incrementDays = 1;
            break;
        case 'weekly':
            incrementDays = 7;
            break;
        case 'biweekly':
            incrementDays = 14;
            break;
        default:
            return dates;
    }

    while (currentDate <= finalDate) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        dates.push(`${year}-${month}-${day}`);

        currentDate.setDate(currentDate.getDate() + incrementDays);
    }

    return dates;
}

// ============================================
// PRICING CALCULATIONS
// ============================================

/**
 * Calculate booking fee based on service pricing and group size
 * Supports fixed pricing and tiered pricing
 * Memoized for performance
 * @param {string} serviceId - Service ID
 * @param {number} groupSize - Number of participants (default 1)
 * @returns {number} Calculated fee
 */
export const calculateBookingFee = memoize(function(serviceId, groupSize = 1) {
    const service = findById('services', serviceId);
    if (!service) return 0;

    // Default to base price for driving lessons (groupSize = 1)
    if (!service.pricing_rules || service.pricing_rules.type === 'fixed') {
        return service.base_price * groupSize;
    }

    // Tiered pricing for tours
    if (service.pricing_rules.type === 'tiered' && service.pricing_rules.tiers) {
        const tier = service.pricing_rules.tiers.find(t =>
            groupSize >= t.minSize && groupSize <= t.maxSize
        );

        if (tier) {
            return tier.price * groupSize;
        }

        // If no tier matches, use base price
        return service.base_price * groupSize;
    }

    return service.base_price * groupSize;
});

/**
 * Update group pricing display when group size changes
 * Updates fee field in booking modal
 */
export function updateGroupPricing() {
    const serviceId = document.getElementById('booking-service')?.value;
    const groupSize = parseInt(document.getElementById('booking-group-size')?.value || '1', 10);
    const feeInput = document.getElementById('booking-fee');

    if (serviceId && feeInput) {
        const calculatedFee = calculateBookingFee(serviceId, groupSize);
        feeInput.value = calculatedFee.toFixed(2);
    }
}

/**
 * Toggle multi-day tour options visibility
 * Shows/hides multi-day fields based on checkbox
 */
export function toggleMultidayOptions() {
    const isMultiday = document.getElementById('booking-multiday')?.checked;
    const multidayOptions = document.getElementById('multiday-options');
    if (multidayOptions) {
        multidayOptions.classList.toggle('hidden', !isMultiday);
    }
}

/**
 * Update staff availability in dropdown
 * Marks staff on leave as disabled
 * @param {string} date - Date to check (YYYY-MM-DD)
 */
export function updateStaffAvailability(date) {
    const staffSelect = document.getElementById('booking-staff');
    if (!staffSelect) return;

    // Get all staff on leave for this date
    const staffOnLeave = state.blockedPeriods
        .filter(bp => bp.date === date)
        .map(bp => bp.staffId);

    // Update dropdown options
    Array.from(staffSelect.options).forEach(option => {
        const staffId = option.value;
        if (staffOnLeave.includes(staffId)) {
            option.disabled = true;
            option.text = option.text.includes('(On Leave)') ? option.text : option.text + ' (On Leave)';
        } else {
            option.disabled = false;
            option.text = option.text.replace(' (On Leave)', '');
        }
    });
}

// ============================================
// MAIN BOOKING OPERATIONS
// ============================================

/**
 * Save booking (create new or edit existing)
 * Main booking creation/edit function with comprehensive validation
 * @param {Event} event - Form submit event
 * @returns {Promise<void>}
 */
export async function saveBooking(event) {
    event.preventDefault();

    const form = event.target;
    const bookingId = form.querySelector('#booking-id')?.value;
    const isEditMode = Boolean(bookingId);

    // Extract form values
    const date = form.querySelector('#booking-date')?.value;
    const startTime = form.querySelector('#booking-start-time')?.value;
    const endTime = form.querySelector('#booking-end-time')?.value;
    const customerId = form.querySelector('#booking-customer')?.value;
    const staffId = form.querySelector('#booking-staff')?.value;
    const serviceId = form.querySelector('#booking-service')?.value;
    const fee = parseFloat(form.querySelector('#booking-fee')?.value || '0');
    const status = form.querySelector('#booking-status')?.value || 'Scheduled';
    const paymentStatus = form.querySelector('#booking-payment-status')?.value || 'Unpaid';
    const notes = form.querySelector('#booking-notes')?.value || '';

    // Tour-specific fields
    const groupSize = parseInt(form.querySelector('#booking-group-size')?.value || '1', 10);
    const participants = form.querySelector('#booking-participants')?.value || '';
    const specialRequirements = form.querySelector('#booking-special-requirements')?.value || '';
    const waiverSigned = form.querySelector('#booking-waiver-signed')?.checked || false;

    // Multi-day tour fields
    const isMultidayTour = form.querySelector('#booking-multiday')?.checked || false;
    const endDate = form.querySelector('#booking-end-date')?.value || date;
    const accommodation = form.querySelector('#booking-accommodation')?.value || '';

    // Recurring booking fields
    const isRecurring = form.querySelector('#booking-recurring')?.checked || false;
    const recurringPattern = form.querySelector('#recurring-pattern')?.value;
    const recurringEndDate = form.querySelector('#recurring-end-date')?.value;

    // Resource selection
    const resourceCheckboxes = form.querySelectorAll('input[name="booking-resources"]:checked');
    const resourceIds = Array.from(resourceCheckboxes).map(cb => cb.value);

    // ============================================
    // VALIDATION
    // ============================================

    // Required fields
    if (!date || !startTime || !endTime || !customerId || !staffId || !serviceId) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }

    // Time validation
    if (!startTime.match(/^\d{2}:\d{2}$/) || !endTime.match(/^\d{2}:\d{2}$/)) {
        showToast('Invalid time format. Use HH:MM (e.g., 09:00).', 'error');
        return;
    }

    // End time must be after start time
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    if (endMinutes <= startMinutes) {
        showToast('End time must be after start time.', 'error');
        return;
    }

    // Check if time is within calendar hours
    const calendarStartMinutes = CALENDAR_START_HOUR * 60;
    const calendarEndMinutes = CALENDAR_END_HOUR * 60;
    if (startMinutes < calendarStartMinutes || endMinutes > calendarEndMinutes) {
        showDialog({
            title: 'Time Outside Calendar Hours',
            message: `Booking time is outside normal calendar hours (${CALENDAR_START_HOUR}:00 - ${CALENDAR_END_HOUR}:00). Do you want to continue?`,
            buttons: [
                { text: 'Cancel', class: btnSecondary, onClick: () => {} },
                { text: 'Continue', class: btnPrimary, onClick: () => continueBookingSave() }
            ]
        });
        return;
    }

    // Minimum duration check (15 minutes)
    const durationMinutes = endMinutes - startMinutes;
    if (durationMinutes < 15) {
        showToast('Booking duration must be at least 15 minutes.', 'error');
        return;
    }

    // Date validation
    const bookingDate = parseYYYYMMDD(date);
    if (!bookingDate || isNaN(bookingDate.getTime())) {
        showToast('Invalid date selected.', 'error');
        return;
    }

    // Don't allow past dates for new bookings (unless admin override)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!isEditMode && bookingDate < today) {
        showDialog({
            title: 'Past Date Selected',
            message: 'You are creating a booking for a past date. Do you want to continue?',
            buttons: [
                { text: 'Cancel', class: btnSecondary, onClick: () => {} },
                { text: 'Continue', class: btnPrimary, onClick: () => continueBookingSave() }
            ]
        });
        return;
    }

    // Fee validation
    if (fee < 0) {
        showToast('Fee cannot be negative.', 'error');
        return;
    }

    // ============================================
    // GOOGLE CALENDAR CONFLICT CHECK
    // ============================================

    // Check for Google Calendar conflicts if integration enabled
    if (state.settings.googleCalendarEnabled && typeof window.checkGoogleCalendarConflict === 'function') {
        try {
            const hasConflict = await window.checkGoogleCalendarConflict(date, startTime, endTime, staffId);
            if (hasConflict) {
                showDialog({
                    title: 'Google Calendar Conflict',
                    message: 'This time slot conflicts with an existing Google Calendar event. Do you want to continue anyway?',
                    buttons: [
                        { text: 'Cancel', class: btnSecondary, onClick: () => {} },
                        { text: 'Continue', class: btnPrimary, onClick: () => continueBookingSave() }
                    ]
                });
                return;
            }
        } catch (error) {
            console.error('Error checking Google Calendar conflicts:', error);
            // Continue anyway if check fails
        }
    }

    // ============================================
    // CONFLICT DETECTION
    // ============================================

    const bookingDetails = {
        id: bookingId,
        date,
        startTime,
        endTime,
        customerId,
        staffId,
        resourceIds
    };

    const conflict = findBookingConflict(bookingDetails);
    if (conflict) {
        showToast(conflict, 'error');
        return;
    }

    // Check for adjacent bookings (warning only)
    const adjacentWarning = checkAdjacentBookings(bookingDetails);
    if (adjacentWarning) {
        console.warn(adjacentWarning);
        // Don't block, just log the warning
    }

    // ============================================
    // RECURRING BOOKINGS
    // ============================================

    if (isRecurring && !isEditMode) {
        if (!recurringEndDate || !recurringPattern) {
            showToast('Please specify recurring pattern and end date.', 'error');
            return;
        }

        const recurringDates = generateRecurringDates(date, recurringEndDate, recurringPattern);

        if (recurringDates.length === 0) {
            showToast('No valid dates for recurring booking.', 'error');
            return;
        }

        // Create bookings for all dates
        let successCount = 0;
        let conflictCount = 0;

        for (const recurringDate of recurringDates) {
            const recurringBookingDetails = {
                ...bookingDetails,
                date: recurringDate,
                id: `booking_${generateUUID()}`
            };

            const recurringConflict = findBookingConflict(recurringBookingDetails);
            if (recurringConflict) {
                conflictCount++;
                console.warn(`Skipping ${recurringDate}: ${recurringConflict}`);
                continue;
            }

            const newBooking = {
                id: recurringBookingDetails.id,
                date: recurringDate,
                startTime,
                endTime,
                customerId,
                staffId,
                resourceIds,
                serviceId,
                fee,
                status,
                paymentStatus,
                notes,
                groupSize,
                participants,
                specialRequirements,
                waiverSigned,
                waiverSignedDate: waiverSigned ? new Date().toISOString() : null,
                isMultidayTour,
                endDate: isMultidayTour ? endDate : null,
                accommodation: isMultidayTour ? accommodation : null,
                multidayGroupId: isMultidayTour ? `multiday_${generateUUID()}` : null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            addToCollection('bookings', newBooking);
            successCount++;
        }

        showToast(`Created ${successCount} recurring bookings.${conflictCount > 0 ? ` (${conflictCount} skipped due to conflicts)` : ''}`, 'success');
        finalizeSaveBooking(null, form);
        return;
    }

    // ============================================
    // SINGLE BOOKING SAVE
    // ============================================

    continueBookingSave();

    function continueBookingSave() {
        const existingBooking = isEditMode ? findById('bookings', bookingId) : null;

        // Build booking object
        const bookingData = {
            id: bookingId || `booking_${generateUUID()}`,
            date,
            startTime,
            endTime,
            customerId,
            staffId,
            resourceIds,
            serviceId,
            fee,
            status,
            paymentStatus,
            notes,
            groupSize,
            participants,
            specialRequirements,
            waiverSigned,
            waiverSignedDate: waiverSigned && (!existingBooking || !existingBooking.waiverSigned) ? new Date().toISOString() : (existingBooking?.waiverSignedDate || null),
            isMultidayTour,
            endDate: isMultidayTour ? endDate : null,
            accommodation: isMultidayTour ? accommodation : null,
            multidayGroupId: existingBooking?.multidayGroupId || (isMultidayTour ? `multiday_${generateUUID()}` : null),
            createdAt: existingBooking?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Handle transaction changes based on payment status
        if (existingBooking) {
            const oldPaymentStatus = existingBooking.paymentStatus;
            const newPaymentStatus = paymentStatus;

            // Payment status changed to Paid
            if (oldPaymentStatus !== 'Paid' && newPaymentStatus === 'Paid') {
                const transaction = {
                    id: `txn_${generateUUID()}`,
                    date: date,
                    type: 'payment',
                    amount: fee,
                    description: `Payment for booking on ${safeDateFormat(date)}`,
                    customerId: customerId,
                    bookingId: bookingData.id,
                    createdAt: new Date().toISOString()
                };
                addToCollection('transactions', transaction);
                bookingData.transactionId = transaction.id;
            }

            // Payment status changed from Paid to something else
            if (oldPaymentStatus === 'Paid' && newPaymentStatus !== 'Paid') {
                // Remove associated transaction
                const transactionIndex = state.transactions.findIndex(t => t.bookingId === bookingId);
                if (transactionIndex !== -1) {
                    state.transactions.splice(transactionIndex, 1);
                }
                bookingData.transactionId = null;
            }

            // Update fee in transaction if payment status is Paid
            if (newPaymentStatus === 'Paid' && existingBooking.transactionId) {
                const transaction = findById('transactions', existingBooking.transactionId);
                if (transaction) {
                    transaction.amount = fee;
                    transaction.description = `Payment for booking on ${safeDateFormat(date)}`;
                }
                bookingData.transactionId = existingBooking.transactionId;
            }
        } else {
            // New booking - create transaction if paid
            if (paymentStatus === 'Paid') {
                const transaction = {
                    id: `txn_${generateUUID()}`,
                    date: date,
                    type: 'payment',
                    amount: fee,
                    description: `Payment for booking on ${safeDateFormat(date)}`,
                    customerId: customerId,
                    bookingId: bookingData.id,
                    createdAt: new Date().toISOString()
                };
                addToCollection('transactions', transaction);
                bookingData.transactionId = transaction.id;
            }
        }

        finalizeSaveBooking(bookingData, form);
    }
}

/**
 * Finalize booking save operation
 * Completes save with cache clearing and external syncs
 * @param {Object|null} bookingData - Booking data to save (null if already saved in recurring)
 * @param {HTMLFormElement} form - Form element
 */
export function finalizeSaveBooking(bookingData, form) {
    if (bookingData) {
        const existingIndex = state.bookings.findIndex(b => b.id === bookingData.id);
        if (existingIndex !== -1) {
            state.bookings[existingIndex] = bookingData;
            showToast('Booking updated successfully!', 'success');
        } else {
            addToCollection('bookings', bookingData);
            showToast('Booking created successfully!', 'success');
        }
    }

    // Clear memoization caches
    if (calculateBookingFee.clearCache) {
        calculateBookingFee.clearCache();
    }
    if (typeof window.getCustomerSummaries?.clearCache === 'function') {
        window.getCustomerSummaries.clearCache();
    }

    // Clear search cache
    clearSearchCache();

    // Save to localStorage
    saveState();

    // Sync with Google Calendar if enabled
    if (bookingData && state.settings.googleCalendarEnabled && typeof window.syncWithGoogleCalendar === 'function') {
        window.syncWithGoogleCalendar([bookingData.id]).catch(error => {
            console.error('Failed to sync with Google Calendar:', error);
            showToast('Booking saved but Google Calendar sync failed.', 'warning');
        });
    }

    // Check waiting list if booking was cancelled
    if (bookingData && bookingData.status === 'Cancelled' && typeof window.checkWaitingListForAvailability === 'function') {
        window.checkWaitingListForAvailability(bookingData.date, bookingData.startTime, bookingData.staffId);
    }

    // Close modal and refresh view
    if (typeof window.closeBookingModal === 'function') {
        window.closeBookingModal();
    }
    if (typeof window.refreshCurrentView === 'function') {
        window.refreshCurrentView();
    }
}

/**
 * Delete booking with confirmation
 * Removes booking and associated transactions
 * @param {string} bookingId - Booking ID to delete
 * @param {string} context - Context for deletion ('calendar', 'list', etc.)
 */
export function deleteBooking(bookingId, context = 'calendar') {
    const booking = findById('bookings', bookingId);
    if (!booking) {
        showToast('Booking not found.', 'error');
        return;
    }

    const customer = findById('customers', booking.customerId);
    const customerName = customer ? customer.name : 'Unknown';

    showDialog({
        title: 'Delete Booking',
        message: `Are you sure you want to delete the booking for ${customerName} on ${safeDateFormat(booking.date)} at ${booking.startTime}?`,
        buttons: [
            {
                text: 'Cancel',
                class: btnSecondary,
                onClick: () => {}
            },
            {
                text: 'Delete',
                class: btnDanger,
                onClick: () => {
                    // Delete from Google Calendar if enabled
                    if (state.settings.googleCalendarEnabled && typeof window.deleteFromGoogleCalendar === 'function') {
                        window.deleteFromGoogleCalendar(bookingId).catch(error => {
                            console.error('Failed to delete from Google Calendar:', error);
                        });
                    }

                    // Remove associated transaction
                    if (booking.transactionId) {
                        const transactionIndex = state.transactions.findIndex(t => t.id === booking.transactionId);
                        if (transactionIndex !== -1) {
                            state.transactions.splice(transactionIndex, 1);
                        }
                    }

                    // Remove booking
                    removeFromCollection('bookings', bookingId);

                    // Clear search cache
                    clearSearchCache();

                    // Save state
                    saveState();

                    showToast('Booking deleted successfully!', 'success');

                    // Check waiting list for this time slot
                    if (typeof window.checkWaitingListForAvailability === 'function') {
                        window.checkWaitingListForAvailability(booking.date, booking.startTime, booking.staffId);
                    }

                    // Refresh view
                    if (typeof window.refreshCurrentView === 'function') {
                        window.refreshCurrentView();
                    }
                }
            }
        ]
    });
}

// ============================================
// EXPORTS FOR GLOBAL ACCESS (BACKWARDS COMPATIBILITY)
// ============================================

if (typeof window !== 'undefined') {
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
