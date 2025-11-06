/**
 * Modals Module for Ray Ryan Management System
 * Handles all modal dialogs including open/close operations,
 * form population, and modal-specific logic
 */

// ============================================
// IMPORTS
// ============================================

import {
    state,
    getCollection,
    findById
} from '../core/state.js';

import {
    debouncedSaveState
} from '../core/storage.js';

import {
    parseYYYYMMDD,
    safeDateFormat,
    toLocalDateString,
    showToast,
    showDialog,
    sanitizeHTML,
    generateUUID
} from '../core/utils.js';

import {
    btnPrimary,
    btnSecondary,
    btnDanger,
    btnGreen
} from '../core/optimization.js';

// ============================================
// GENERIC MODAL FUNCTIONS
// ============================================

/**
 * Generic close modal function
 * Handles closing any modal with animation
 * @param {string} modalId - Modal element ID
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        const modalContent = modal.querySelector('.modal');
        if (modalContent) {
            modalContent.classList.add('scale-95', 'opacity-0');
            setTimeout(() => modal.classList.add('hidden'), 300);
        } else {
            modal.classList.add('hidden');
        }
    }
}

/**
 * Populate select dropdown with options
 * @param {string} selectId - Select element ID
 * @param {Array} items - Array of items to populate
 * @param {boolean} allowNone - Allow "None" option
 * @param {string} labelKey - Key for label (default: 'name')
 */
export function populateSelect(selectId, items, allowNone = false, labelKey = 'name') {
    const selectEl = document.getElementById(selectId);
    if (!selectEl) return;

    selectEl.innerHTML = '';
    if (allowNone) {
        selectEl.add(new Option('-- None --', ''));
    }

    items.forEach(item => {
        const label = item[labelKey] || item.name || 'Unknown';
        selectEl.add(new Option(label, item.id));
    });
}

// ============================================
// BOOKING MODAL
// ============================================

/**
 * Open booking modal for create/edit
 * @param {string} date - Date (YYYY-MM-DD)
 * @param {string|null} bookingId - Booking ID to edit, or null for new
 * @param {string|null} startTime - Pre-fill start time
 * @param {string|null} endTime - Pre-fill end time
 */
export function openBookingModal(date, bookingId = null, startTime = null, endTime = null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!bookingId && parseYYYYMMDD(date) < today) {
        showDialog({
            title: 'Invalid Date',
            message: 'Cannot create a new booking in the past.',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }

    // Check for blocked dates
    const getBlockedPeriodsForDate = typeof window.getBlockedPeriodsForDate === 'function' ?
        window.getBlockedPeriodsForDate : () => [];
    const blockedPeriods = getBlockedPeriodsForDate(parseYYYYMMDD(date));
    if (blockedPeriods.some(p => p.staffId === 'all')) {
        showDialog({
            title: 'Date Blocked',
            message: 'This date is blocked for a school holiday.',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }

    const modal = document.getElementById('booking-modal');
    if (!modal) return;

    const form = modal.querySelector('form');
    if (form) form.reset();

    // Populate dropdowns
    populateSelect('booking-service', state.services, false, 'service_name');
    populateSelect('booking-customer', state.customers);
    populateSelect('booking-staff', state.staff);
    populateSelect('booking-resource', state.resources, false, 'resource_name');

    // Update staff availability
    if (typeof window.updateStaffAvailability === 'function') {
        window.updateStaffAvailability(date);
    }

    const leftActionsContainer = document.getElementById('booking-modal-actions-left');
    if (leftActionsContainer) leftActionsContainer.innerHTML = '';

    // FEATURE: Show/hide recurring section
    const recurringSection = document.getElementById('recurring-booking-section');
    const recurringCheckbox = document.getElementById('booking-recurring');

    if (bookingId) {
        const titleEl = document.getElementById('booking-modal-title');
        if (titleEl) titleEl.textContent = 'Edit Booking';

        const booking = state.bookings.find(b => b.id === bookingId);
        if (booking) {
            // Populate form fields
            const fields = {
                'booking-id': booking.id,
                'booking-date': booking.date,
                'booking-service': booking.serviceId,
                'booking-customer': booking.customerId,
                'booking-staff': booking.staffId,
                'booking-resource': booking.resourceIds ? booking.resourceIds[0] : '',
                'booking-start-time': booking.startTime,
                'booking-pickup': booking.pickup || '',
                'booking-status': booking.status,
                'booking-payment-status': booking.paymentStatus
            };

            Object.entries(fields).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) el.value = value;
            });

            // Populate tour-specific fields
            const groupSizeEl = document.getElementById('booking-group-size');
            if (groupSizeEl) groupSizeEl.value = booking.groupSize || 1;

            const participantsEl = document.getElementById('booking-participants');
            if (participantsEl) {
                participantsEl.value = booking.participants ? booking.participants.join('\n') : '';
            }

            const requirementsEl = document.getElementById('booking-special-requirements');
            if (requirementsEl) requirementsEl.value = booking.specialRequirements || '';

            const waiverEl = document.getElementById('booking-waiver-signed');
            if (waiverEl) {
                waiverEl.checked = booking.waiverSigned || false;
                const waiverDateEl = document.getElementById('booking-waiver-date');
                if (booking.waiverSignedDate && waiverDateEl) {
                    const waiverDate = new Date(booking.waiverSignedDate).toLocaleDateString('en-GB');
                    waiverDateEl.textContent = `Signed on: ${waiverDate}`;
                }
            }

            // Add action buttons for editing
            if (leftActionsContainer) {
                leftActionsContainer.innerHTML = `
                    <button type="button" onclick="copySmsReminder('${bookingId}')" class="${btnSecondary}">Copy SMS Reminder</button>
                    <button type="button" onclick="exportToGoogleCalendar('${bookingId}')" class="${btnGreen}">Add to Google Calendar</button>
                    <button type="button" onclick="deleteBooking('${bookingId}', 'booking')" class="${btnDanger}">Delete</button>
                `;
            }
        }

        // Hide recurring section for existing bookings
        if (recurringSection) recurringSection.classList.add('hidden');
    } else {
        const titleEl = document.getElementById('booking-modal-title');
        if (titleEl) titleEl.textContent = 'New Booking';

        const idField = document.getElementById('booking-id');
        if (idField) idField.value = '';

        const dateField = document.getElementById('booking-date');
        if (dateField) dateField.value = date;

        const startTimeField = document.getElementById('booking-start-time');
        if (startTimeField) startTimeField.value = startTime || '09:00';

        const statusField = document.getElementById('booking-status');
        if (statusField) statusField.value = 'Scheduled';

        const paymentStatusField = document.getElementById('booking-payment-status');
        if (paymentStatusField) paymentStatusField.value = 'Unpaid';

        // Show recurring section for new bookings and reset it
        if (recurringSection) recurringSection.classList.remove('hidden');
        if (recurringCheckbox) recurringCheckbox.checked = false;

        const recurringOptions = document.getElementById('recurring-options');
        const recurringPreview = document.getElementById('recurring-preview');
        if (recurringOptions) recurringOptions.classList.add('hidden');
        if (recurringPreview) recurringPreview.classList.add('hidden');
    }

    // Handle service selection change
    if (typeof window.handleServiceSelectionChange === 'function') {
        window.handleServiceSelectionChange();
    }

    if (endTime) {
        const endTimeField = document.getElementById('booking-end-time');
        if (endTimeField) endTimeField.value = endTime;
    }

    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal')?.classList.remove('scale-95', 'opacity-0'), 10);
}

/**
 * Close booking modal
 */
export function closeBookingModal() {
    closeModal('booking-modal');
}

// ============================================
// DAY SUMMARY MODAL
// ============================================

/**
 * Open day summary modal
 * Shows all bookings and blocked periods for a specific date
 * @param {string} dateString - Date (YYYY-MM-DD)
 */
export function openDaySummaryModal(dateString) {
    const modal = document.getElementById('day-summary-modal');
    if (!modal) return;

    const titleEl = document.getElementById('day-summary-modal-title');
    const listEl = document.getElementById('day-summary-bookings-list');
    const addNewBtn = document.getElementById('day-summary-add-new');

    const date = parseYYYYMMDD(dateString);
    if (titleEl) {
        titleEl.textContent = `Summary for ${date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}`;
    }

    const dayBookings = state.bookings
        .filter(b => b.date === dateString && b.status !== 'Cancelled')
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const getBlockedPeriodsForDate = typeof window.getBlockedPeriodsForDate === 'function' ?
        window.getBlockedPeriodsForDate : () => [];
    const blockedPeriods = getBlockedPeriodsForDate(date);

    let summaryHtml = '';

    // Show blocked periods
    if (blockedPeriods.length > 0) {
        summaryHtml += blockedPeriods.map(period => {
            let text = '';
            if (period.staffId === 'all') {
                text = `School Holiday: ${sanitizeHTML(period.reason)}`;
            } else {
                const staff = state.staff.find(i => i.id === period.staffId);
                text = `${sanitizeHTML(staff ? staff.name : 'Staff')} on leave: ${sanitizeHTML(period.reason)}`;
            }
            return `<div class="p-3 bg-gray-100 rounded-lg text-center font-semibold text-gray-700">${text}</div>`;
        }).join('');
    }

    // Show bookings
    if (dayBookings.length > 0) {
        summaryHtml += dayBookings.map(booking => {
            const customer = state.customers.find(s => s.id === booking.customerId);
            const staff = state.staff.find(i => i.id === booking.staffId);
            return `
                <div class="p-3 bg-blue-50 rounded-lg flex items-center justify-between hover:bg-blue-100">
                    <div>
                        <p class="font-semibold text-gray-800">${booking.startTime} - ${booking.endTime}</p>
                        <p class="text-sm text-gray-600">${sanitizeHTML(customer ? customer.name : 'Unknown Customer')}</p>
                        <p class="text-xs text-gray-500">Staff: ${sanitizeHTML(staff ? staff.name : 'N/A')}</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="openBookingModal('${dateString}', '${booking.id}'); closeDaySummaryModal();" title="Edit Booking" class="p-2 rounded-full hover:bg-blue-100 text-blue-600"><svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg></button>
                        <button onclick="deleteBooking('${booking.id}', 'summary')" title="Delete Booking" class="p-2 rounded-full hover:bg-red-100 text-red-600"><svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                </div>
            `;
        }).join('');
    }

    if (listEl) {
        listEl.innerHTML = summaryHtml || '<p class="text-center text-gray-500 py-4">No bookings or leave scheduled for this day.</p>';
    }

    if (addNewBtn) {
        addNewBtn.onclick = () => {
            closeDaySummaryModal();
            openBookingModal(dateString);
        };
    }

    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal')?.classList.remove('scale-95', 'opacity-0'), 10);
}

/**
 * Close day summary modal
 */
export function closeDaySummaryModal() {
    const modal = document.getElementById('day-summary-modal');
    if (!modal) return;

    const modalContent = modal.querySelector('.modal');
    if (modalContent) {
        modalContent.classList.add('scale-95', 'opacity-0');
    }
    setTimeout(() => modal.classList.add('hidden'), 300);
}

// ============================================
// SERVICE MODAL
// ============================================

/**
 * Open service modal for create/edit
 * @param {string|null} id - Service ID to edit, or null for new
 */
export function openServiceModal(id = null) {
    const modal = document.getElementById('service-modal');
    if (!modal) return;

    const form = modal.querySelector('form');
    if (form) form.reset();

    const tiersContainer = document.getElementById('pricing-tiers-container');
    if (tiersContainer) tiersContainer.innerHTML = '';

    if (id) {
        const titleEl = document.getElementById('service-modal-title');
        if (titleEl) titleEl.textContent = 'Edit Service';

        const service = state.services.find(s => s.id === id);
        if (service) {
            const fields = {
                'service-id': service.id,
                'service-type': service.service_type,
                'service-name': service.service_name,
                'service-duration': service.duration_minutes,
                'service-base-price': service.base_price
            };

            Object.entries(fields).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) el.value = value;
            });

            // Restore pricing model radio button
            if (service.pricing_rules?.type === 'tiered') {
                const tieredRadio = document.querySelector('input[name="pricing-type"][value="tiered"]');
                if (tieredRadio) tieredRadio.checked = true;
            } else {
                const fixedRadio = document.querySelector('input[name="pricing-type"][value="fixed"]');
                if (fixedRadio) fixedRadio.checked = true;
            }

            // Populate tiers if they exist
            if (service.pricing_rules?.type === 'tiered' && service.pricing_rules.tiers) {
                const addPricingTier = typeof window.addPricingTier === 'function' ?
                    window.addPricingTier : () => {};
                service.pricing_rules.tiers.forEach(tier => addPricingTier(tier));
            }

            // Populate TOUR specific fields
            if (service.service_type === 'TOUR') {
                const descField = document.getElementById('service-description');
                if (descField) descField.value = service.description || '';

                const photosField = document.getElementById('service-photos');
                if (photosField) photosField.value = (service.photo_gallery || []).join('\n');

                const capMinField = document.getElementById('service-capacity-min');
                if (capMinField) capMinField.value = service.capacity?.min || 1;

                const capMaxField = document.getElementById('service-capacity-max');
                if (capMaxField) capMaxField.value = service.capacity?.max || 10;
            }
        }
    } else {
        const titleEl = document.getElementById('service-modal-title');
        if (titleEl) titleEl.textContent = 'New Service';

        const idField = document.getElementById('service-id');
        if (idField) idField.value = '';
    }

    handleServiceTypeChange();

    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal')?.classList.remove('scale-95', 'opacity-0'), 10);
}

/**
 * Close service modal
 */
export function closeServiceModal() {
    closeModal('service-modal');
}

/**
 * Handle pricing type change (fixed vs tiered)
 * @param {string} pricingType - Pricing type ('fixed' or 'tiered')
 */
export function handlePricingTypeChange(pricingType) {
    const fixedFields = document.getElementById('pricing-fields-fixed');
    const tieredFields = document.getElementById('pricing-fields-tour');

    if (pricingType === 'fixed') {
        if (fixedFields) fixedFields.classList.remove('hidden');
        if (tieredFields) tieredFields.classList.add('hidden');
    } else {
        if (fixedFields) fixedFields.classList.add('hidden');
        if (tieredFields) tieredFields.classList.remove('hidden');
    }
}

/**
 * Handle service type change (DRIVING_LESSON vs TOUR)
 * Shows/hides tour-specific fields and pricing options
 */
export function handleServiceTypeChange() {
    const serviceType = document.getElementById('service-type')?.value;
    const tourFields = document.getElementById('tour-fields');
    const tieredRadio = document.querySelector('input[name="pricing-type"][value="tiered"]');
    const fixedRadio = document.querySelector('input[name="pricing-type"][value="fixed"]');
    const tiersContainer = document.getElementById('pricing-tiers-container');
    const isTour = serviceType === 'TOUR';

    if (tourFields) {
        tourFields.classList.toggle('hidden', !isTour);
    }

    if (!isTour) {
        if (tieredRadio && tieredRadio.checked && fixedRadio) {
            fixedRadio.checked = true;
        }
        if (tieredRadio) tieredRadio.disabled = true;
        if (tiersContainer) tiersContainer.innerHTML = '';
    } else {
        if (tieredRadio) tieredRadio.disabled = false;
    }

    handlePricingTypeChange(tieredRadio?.checked ? 'tiered' : 'fixed');
}

// ============================================
// RESOURCE MODAL
// ============================================

/**
 * Open resource modal for create/edit
 * @param {string|null} resourceId - Resource ID to edit, or null for new
 */
export function openResourceModal(resourceId = null) {
    const modal = document.getElementById('resource-modal');
    if (!modal) return;

    const form = modal.querySelector('form');
    if (form) form.reset();

    if (resourceId) {
        const titleEl = document.getElementById('resource-modal-title');
        if (titleEl) titleEl.textContent = 'Edit Resource';

        const resource = state.resources.find(r => r.id === resourceId);
        if (resource) {
            const fields = {
                'resource-id': resource.id,
                'resource-name': resource.resource_name,
                'resource-type': resource.resource_type,
                'resource-capacity': resource.capacity || 1,
                'resource-make': resource.make || '',
                'resource-model': resource.model || '',
                'resource-reg': resource.reg || ''
            };

            Object.entries(fields).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) el.value = value;
            });

            // Maintenance schedule
            const schedule = resource.maintenance_schedule || {};
            const motField = document.getElementById('resource-mot');
            if (motField) motField.value = schedule.mot || '';

            const taxField = document.getElementById('resource-tax');
            if (taxField) taxField.value = schedule.tax || '';

            const serviceField = document.getElementById('resource-service');
            if (serviceField) serviceField.value = schedule.service || '';
        }
    } else {
        const titleEl = document.getElementById('resource-modal-title');
        if (titleEl) titleEl.textContent = 'New Resource';

        const idField = document.getElementById('resource-id');
        if (idField) idField.value = '';
    }

    toggleVehicleFields();

    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal')?.classList.remove('scale-95', 'opacity-0'), 10);
}

/**
 * Close resource modal
 */
export function closeResourceModal() {
    const modal = document.getElementById('resource-modal');
    if (!modal) return;

    const modalContent = modal.querySelector('.modal');
    if (modalContent) {
        modalContent.classList.add('scale-95', 'opacity-0');
    }
    setTimeout(() => modal.classList.add('hidden'), 300);
}

/**
 * Toggle vehicle-specific fields based on resource type
 */
export function toggleVehicleFields() {
    const resourceType = document.getElementById('resource-type')?.value;
    const vehicleFields = document.getElementById('vehicle-specific-fields');

    if (vehicleFields) {
        if (resourceType === 'VEHICLE') {
            vehicleFields.style.display = 'block';
        } else {
            vehicleFields.style.display = 'none';
        }
    }
}

// ============================================
// BLOCK DATES MODAL
// ============================================

/**
 * Open block dates modal
 * For blocking staff availability or school holidays
 */
export function openBlockDatesModal() {
    const modal = document.getElementById('block-dates-modal');
    if (!modal) return;

    const staffSelect = document.getElementById('block-staff');
    if (staffSelect) {
        staffSelect.innerHTML = '';
        staffSelect.add(new Option('All Staff (School Holiday)', 'all'));
        state.staff.forEach(i => {
            staffSelect.add(new Option(i.name, i.id));
        });
    }

    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal')?.classList.remove('scale-95', 'opacity-0'), 10);
}

/**
 * Close block dates modal
 */
export function closeBlockDatesModal() {
    closeModal('block-dates-modal');
}

// ============================================
// INVOICE MODAL
// ============================================

/**
 * Open invoice modal
 * Generates invoice for customer's unpaid bookings
 * @param {string} customerId - Customer ID
 */
export function openInvoiceModal(customerId) {
    const customer = state.customers.find(s => s.id === customerId);
    if (!customer) return;

    const unpaidBookings = state.bookings.filter(b =>
        b.customerId === customerId &&
        b.paymentStatus === 'Unpaid' &&
        (b.status === 'Completed' || b.status === 'Scheduled')
    );

    if (unpaidBookings.length === 0) {
        showDialog({
            title: 'No Unpaid Lessons',
            message: `${customer.name} has no outstanding payments to invoice.`,
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }

    const modal = document.getElementById('invoice-modal');
    if (!modal) return;

    const contentEl = document.getElementById('invoice-content');
    if (!contentEl) return;

    const totalDue = unpaidBookings.reduce((sum, b) => sum + (b.fee || 0), 0);
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 14);

    const lineItemsHtml = unpaidBookings.map(b => {
        const service = state.services.find(s => s.id === b.serviceId);
        const description = service ? service.service_name : 'Lesson';
        return `
            <tr>
                <td class="py-2 px-4 print:py-1 print:px-2 border-b">${safeDateFormat(b.date)}</td>
                <td class="py-2 px-4 print:py-1 print:px-2 border-b">${sanitizeHTML(description)}</td>
                <td class="py-2 px-4 print:py-1 print:px-2 border-b text-right">€${(b.fee || 0).toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    const settings = state.settings || {};

    contentEl.innerHTML = `
        <div class="flex justify-between items-start pb-4 print:pb-2 border-b-2 border-gray-800">
            <div class="flex items-start gap-4">
                ${settings.invoiceLogo ? `
                    <img src="${sanitizeHTML(settings.invoiceLogo)}" alt="Company Logo" class="h-16 w-16 object-contain print:h-12 print:w-12">
                ` : ''}
                <div>
                    <h1 class="text-3xl print:text-2xl font-bold text-gray-900">${sanitizeHTML(settings.instructorName || 'Ray Ryan')}</h1>
                    <p class="text-gray-600 whitespace-pre-line text-sm">${sanitizeHTML(settings.instructorAddress || '')}</p>
                    ${settings.vatNumber ? `<p class="text-gray-500 text-sm mt-1">VAT: ${sanitizeHTML(settings.vatNumber)}</p>` : ''}
                    ${settings.invoiceEmail ? `<p class="text-gray-500 text-sm">Email: ${sanitizeHTML(settings.invoiceEmail)}</p>` : ''}
                </div>
            </div>
            <div class="text-right">
                <h2 class="text-2xl print:text-xl font-bold text-gray-900">INVOICE</h2>
                <p class="text-gray-600 text-sm">Date: ${safeDateFormat(toLocalDateString(today))}</p>
                <p class="text-gray-600 text-sm">Due: ${safeDateFormat(toLocalDateString(dueDate))}</p>
            </div>
        </div>
        <div class="py-4 print:py-2">
            <h3 class="text-sm font-semibold text-gray-700 mb-2">Bill To:</h3>
            <p class="font-semibold text-gray-900">${sanitizeHTML(customer.name)}</p>
            ${customer.email ? `<p class="text-gray-600 text-sm">${sanitizeHTML(customer.email)}</p>` : ''}
            ${customer.phone ? `<p class="text-gray-600 text-sm">${sanitizeHTML(customer.phone)}</p>` : ''}
        </div>
        <table class="w-full mb-4">
            <thead>
                <tr class="border-b-2 border-gray-800">
                    <th class="py-2 px-4 print:py-1 print:px-2 text-left">Date</th>
                    <th class="py-2 px-4 print:py-1 print:px-2 text-left">Description</th>
                    <th class="py-2 px-4 print:py-1 print:px-2 text-right">Amount</th>
                </tr>
            </thead>
            <tbody>${lineItemsHtml}</tbody>
        </table>
        <div class="flex justify-end">
            <div class="w-64">
                <div class="flex justify-between py-2 border-t-2 border-gray-800 font-bold text-lg">
                    <span>Total Due:</span>
                    <span>€${totalDue.toFixed(2)}</span>
                </div>
            </div>
        </div>
        ${settings.invoiceFooter ? `
            <div class="mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-600 whitespace-pre-line print:text-xs">
                ${sanitizeHTML(settings.invoiceFooter)}
            </div>
        ` : ''}
    `;

    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal')?.classList.remove('scale-95', 'opacity-0'), 10);
}

/**
 * Close invoice modal
 */
export function closeInvoiceModal() {
    closeModal('invoice-modal');
}

// ============================================
// EXPENSE MODAL
// ============================================

/**
 * Open expense modal for create/edit
 * @param {string|null} id - Expense ID to edit, or null for new
 */
export function openExpenseModal(id = null) {
    const modal = document.getElementById('expense-modal');
    if (!modal) return;

    const form = modal.querySelector('form');
    if (form) form.reset();

    if (id) {
        const titleEl = document.getElementById('expense-modal-title');
        if (titleEl) titleEl.textContent = 'Edit Expense';

        const expense = state.expenses.find(e => e.id === id);
        if (expense) {
            const fields = {
                'expense-id': expense.id,
                'expense-date': expense.date,
                'expense-category': expense.category,
                'expense-description': expense.description,
                'expense-amount': expense.amount
            };

            Object.entries(fields).forEach(([id, value]) => {
                const el = document.getElementById(id);
                if (el) el.value = value;
            });
        }
    } else {
        const titleEl = document.getElementById('expense-modal-title');
        if (titleEl) titleEl.textContent = 'New Expense';

        const idField = document.getElementById('expense-id');
        if (idField) idField.value = '';

        const dateField = document.getElementById('expense-date');
        if (dateField) dateField.value = toLocalDateString(new Date());
    }

    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal')?.classList.remove('scale-95', 'opacity-0'), 10);
}

/**
 * Close expense modal
 */
export function closeExpenseModal() {
    const modal = document.getElementById('expense-modal');
    if (!modal) return;

    const modalContent = modal.querySelector('.modal');
    if (modalContent) {
        modalContent.classList.add('scale-95', 'opacity-0');
    }
    setTimeout(() => modal.classList.add('hidden'), 300);
}

// ============================================
// COMPLETION MODAL
// ============================================

/**
 * Open lesson completion modal
 * Quick marking lesson as complete with optional notes
 * @param {Object} bookingData - Booking object
 */
export function openCompletionModal(bookingData) {
    const modal = document.getElementById('completion-modal');
    if (!modal) return;

    const customer = state.customers.find(c => c.id === bookingData.customerId);
    const titleEl = document.getElementById('completion-modal-title');
    if (titleEl && customer) {
        titleEl.textContent = `Mark Lesson Complete: ${customer.name}`;
    }

    const bookingIdField = document.getElementById('completion-booking-id');
    if (bookingIdField) bookingIdField.value = bookingData.id;

    const notesField = document.getElementById('completion-notes');
    if (notesField) notesField.value = '';

    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal')?.classList.remove('scale-95', 'opacity-0'), 10);
}

/**
 * Close completion modal
 */
export function closeCompletionModal() {
    closeModal('completion-modal');
}

// ============================================
// EXPORTS FOR GLOBAL ACCESS (BACKWARDS COMPATIBILITY)
// ============================================

if (typeof window !== 'undefined') {
    window.closeModal = closeModal;
    window.populateSelect = populateSelect;
    window.openBookingModal = openBookingModal;
    window.closeBookingModal = closeBookingModal;
    window.openDaySummaryModal = openDaySummaryModal;
    window.closeDaySummaryModal = closeDaySummaryModal;
    window.openServiceModal = openServiceModal;
    window.closeServiceModal = closeServiceModal;
    window.handlePricingTypeChange = handlePricingTypeChange;
    window.handleServiceTypeChange = handleServiceTypeChange;
    window.openResourceModal = openResourceModal;
    window.closeResourceModal = closeResourceModal;
    window.toggleVehicleFields = toggleVehicleFields;
    window.openBlockDatesModal = openBlockDatesModal;
    window.closeBlockDatesModal = closeBlockDatesModal;
    window.openInvoiceModal = openInvoiceModal;
    window.closeInvoiceModal = closeInvoiceModal;
    window.openExpenseModal = openExpenseModal;
    window.closeExpenseModal = closeExpenseModal;
    window.openCompletionModal = openCompletionModal;
    window.closeCompletionModal = closeCompletionModal;
}
