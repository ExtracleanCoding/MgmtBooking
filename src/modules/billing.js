/**
 * Billing Module for Ray Ryan Management System
 * Handles billing view, customer statements, payments, and invoice generation
 *
 * Extracted from script.js lines 1730-1774, 3764-4093, 7040-7131
 */

// NOTE: During migration, these imports will be properly wired up
// import { state, selectedBillingCustomerId, billingCurrentPage } from '../core/state.js';
// import { BILLING_ITEMS_PER_PAGE, btnPrimary, btnSecondary, btnGreen, btnPurple } from '../core/constants.js';
// import { sanitizeHTML, toLocalDateString, generateUUID, showToast, showDialog, copyToClipboard } from '../core/utils.js';
// import { memoize } from '../core/optimization.js';

// ============================================
// MAIN BILLING VIEW
// ============================================

/**
 * Render the main billing view container
 * Entry point for billing view with AI analysis and export options
 */
export function renderBillingView() {
    const container = document.getElementById('billing-view');
    container.innerHTML = `
        <div class="bg-white rounded-lg shadow p-4 sm:p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-900">Billing</h2>
                <div class="flex items-center gap-2">
                    <button id="analyze-billing-btn" onclick="handleAnalyzeBilling()" class="${btnPurple}">✨ Analyze Billing</button>
                    <button onclick="exportBillingToExcel()" class="${btnGreen}">Export to Excel</button>
                </div>
            </div>
            <!-- AI Analysis Container -->
            <div id="billing-analysis-container" class="hidden mb-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-2">AI Financial Summary</h3>
                <div id="billing-analysis-output" class="ai-summary-container whitespace-pre-wrap"></div>
            </div>
            <div id="billing-content"></div>
        </div>
    `;
    container.removeEventListener('click', handleBillingClick); // Clean up previous listener
    container.addEventListener('click', handleBillingClick);
    renderBillingContent();
}

// ============================================
// CUSTOMER SUMMARIES (MEMOIZED)
// ============================================

/**
 * Get billing summaries for all customers
 * OPTIMIZED: Memoized for faster billing calculations
 * Calculates total billed, total paid, and outstanding balance for each customer
 * @returns {Array} Customer summaries with billing info
 */
export const getCustomerSummaries = memoize(function() {
    const bookings = state.bookings.filter(b => b.status === 'Completed' || b.status === 'Scheduled');
    const sortedCustomers = [...state.customers].sort((a, b) => a.name.localeCompare(b.name));

    return sortedCustomers.map(customer => {
        const customerBookings = bookings.filter(b => b.customerId === customer.id);
        const customerPackagePurchases = state.transactions.filter(t => t.customerId === customer.id && t.type === 'package_sale');

        if (customerBookings.length === 0 && customerPackagePurchases.length === 0) return null;

        const billableBookings = customerBookings.filter(b => b.paymentStatus !== 'Paid (Credit)');

        const totalBilledFromBookings = billableBookings.reduce((sum, b) => sum + (b.fee || 0), 0);
        const totalBilledFromPackages = customerPackagePurchases.reduce((sum, t) => sum + t.amount, 0);
        const totalBilled = totalBilledFromBookings + totalBilledFromPackages;

        const paidTransactions = state.transactions.filter(t => t.customerId === customer.id && t.type === 'payment');
        const totalPaidFromTransactions = paidTransactions.reduce((sum, t) => sum + t.amount, 0);
        const totalPaid = totalPaidFromTransactions + totalBilledFromPackages; // Package sales are considered paid on purchase

        return {
            id: customer.id,
            name: customer.name,
            bookingCount: customerBookings.length,
            totalBilled,
            totalPaid,
            outstanding: totalBilled - totalPaid
        };
    }).filter(Boolean);
});

// ============================================
// BILLING CONTENT
// ============================================

/**
 * Render billing content with summary cards and customer table
 * Includes pagination for large customer lists
 */
export function renderBillingContent() {
    const container = document.getElementById('billing-content');
    const customerSummaries = getCustomerSummaries();

    const totalPages = Math.max(1, Math.ceil(customerSummaries.length / BILLING_ITEMS_PER_PAGE));
    billingCurrentPage = Math.min(Math.max(1, billingCurrentPage), totalPages);

    const grandTotalRevenue = customerSummaries.reduce((sum, s) => sum + s.totalBilled, 0);
    const grandTotalPaid = customerSummaries.reduce((sum, s) => sum + s.totalPaid, 0);
    const grandTotalOutstanding = grandTotalRevenue - grandTotalPaid;

    const summaryCardsHtml = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="dashboard-card bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg flex items-center">
                <div><h3 class="text-lg font-semibold">Total Billed</h3><p id="billing-total-revenue" class="text-4xl font-bold mt-1">€${grandTotalRevenue.toFixed(2)}</p></div>
            </div>
            <div class="dashboard-card bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg flex items-center">
                <div><h3 class="text-lg font-semibold">Total Paid</h3><p id="billing-total-paid" class="text-4xl font-bold mt-1">€${grandTotalPaid.toFixed(2)}</p></div>
            </div>
            <div class="dashboard-card bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg flex items-center">
                <div><h3 class="text-lg font-semibold">Total Outstanding</h3><p id="billing-total-outstanding" class="text-4xl font-bold mt-1">€${grandTotalOutstanding.toFixed(2)}</p></div>
            </div>
        </div>
    `;

    const paginatedSummaries = customerSummaries.slice((billingCurrentPage - 1) * BILLING_ITEMS_PER_PAGE, billingCurrentPage * BILLING_ITEMS_PER_PAGE);

    let paginationControls = '';
    if (customerSummaries.length > 0 && totalPages > 1) {
        paginationControls = `<div class="flex justify-center items-center gap-2 mt-4">
            <button data-action="prev-page" class="${btnSecondary}" ${billingCurrentPage === 1 ? 'disabled' : ''}>Previous</button>
            ${Array.from({length: totalPages}, (_, i) => `<button data-action="go-to-page" data-page="${i + 1}" class="${i+1 === billingCurrentPage ? btnPrimary : btnSecondary}">${i+1}</button>`).join('')}
            <button data-action="next-page" class="${btnSecondary}" ${billingCurrentPage === totalPages ? 'disabled' : ''}>Next</button>
        </div>`;
    }

    const summaryTableHtml = `
        <div class="bg-white rounded-lg shadow mb-8">
            <h3 class="text-lg font-semibold p-4 border-b">Summary by Customer</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full">
                    <thead><tr><th>Customer</th><th class="text-center">Bookings</th><th class="text-right">Total Billed</th><th class="text-right">Total Paid</th><th class="text-right">Outstanding</th></tr></thead>
                    <tbody class="divide-y divide-gray-200">
                        ${paginatedSummaries.map(s => `
                            <tr class="hover:bg-gray-50 cursor-pointer" data-action="select-customer" data-id="${sanitizeHTML(s.id)}">
                                <td class="font-medium">${sanitizeHTML(s.name)}</td>
                                <td class="text-center">${s.bookingCount}</td>
                                <td class="text-right">€${s.totalBilled.toFixed(2)}</td>
                                <td class="text-right text-green-600">€${s.totalPaid.toFixed(2)}</td>
                                <td class="text-right font-semibold ${s.outstanding > 0 ? 'text-red-600' : ''}">€${s.outstanding.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ${paginationControls}
        </div>
    `;

    let detailedBreakdownHtml = '';
    if (selectedBillingCustomerId) {
        detailedBreakdownHtml = renderDetailedBillingBreakdown(selectedBillingCustomerId);
    }

    container.innerHTML = `
        ${summaryCardsHtml}
        ${customerSummaries.length > 0 ? summaryTableHtml : ''}
        <div id="detailed-breakdown-container">${detailedBreakdownHtml}</div>
    `;
}

// ============================================
// DETAILED BILLING BREAKDOWN
// ============================================

/**
 * Render detailed billing statement for a specific customer
 * Shows all bookings, transactions, and payment history
 * @param {string} customerId - Customer ID
 * @returns {string} HTML for detailed breakdown
 */
export function renderDetailedBillingBreakdown(customerId) {
    const customer = state.customers.find(c => c.id === customerId);
    if (!customer) return '';

    const customerBookings = state.bookings.filter(b => b.customerId === customerId && b.status !== 'Cancelled').sort((a, b) => new Date(b.date) - new Date(a.date));
    const customerTransactions = state.transactions.filter(t => t.customerId === customerId).sort((a, b) => new Date(b.date) - new Date(a.date));

    const allItems = [
        ...customerBookings.map(b => ({ ...b, type: 'booking', date: b.date })),
        ...customerTransactions.map(t => ({ ...t, type: t.type, date: t.date }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const itemsHtml = allItems.map(item => {
        const date = new Date(item.date.replace(/-/g, '/')).toLocaleDateString('en-GB');
        let checkboxHtml = '<td></td>';
        let statusHtml = '<td></td>';
        let rowClass = '';
        let description = '';
        let debit = '';
        let credit = '';

        if (item.type === 'booking') {
            const service = state.services.find(s => s.id === item.serviceId);
            description = `Booking: ${service ? service.service_name : 'Unknown Service'}`;
            debit = `€${(item.fee || 0).toFixed(2)}`;

            let statusColor = 'text-gray-500';
            if (item.status === 'Completed') statusColor = 'text-green-600';
            if (item.status === 'Scheduled') statusColor = 'text-blue-600';
            if (item.status === 'Cancelled') statusColor = 'text-red-600';
            statusHtml = `<td><span class="font-semibold ${statusColor}">${item.status}</span></td>`;

            if (item.status === 'Completed' && item.paymentStatus !== 'Paid' && item.paymentStatus !== 'Paid (Credit)') {
                checkboxHtml = `<td><input type="checkbox" class="bulk-payment-checkbox" data-booking-id="${sanitizeHTML(item.id)}" data-fee="${item.fee || 0}"></td>`;
            }
        } else if (item.type === 'package_sale') {
            rowClass = 'bg-blue-50';
            description = `Package Purchase: ${item.description}`;
            debit = `€${item.amount.toFixed(2)}`;
            statusHtml = '<td><span class="font-semibold text-purple-600">Purchase</span></td>';
        } else if (item.type === 'payment') {
            rowClass = 'bg-green-50';
            description = `Payment Received: ${item.description}`;
            credit = `€${item.amount.toFixed(2)}`;
            statusHtml = '<td><span class="font-semibold text-green-700">Payment</span></td>';
        }

        return `<tr class="${rowClass}">${checkboxHtml}<td>${date}</td><td>${sanitizeHTML(description)}</td>${statusHtml}<td class="text-right">${debit}</td><td class="text-right text-green-700">${credit}</td></tr>`;
    }).join('');

    const summary = getCustomerSummaries().find(s => s.id === customerId) || { totalBilled: 0, totalPaid: 0, outstanding: 0 };

    return `
        <div class="bg-white rounded-lg shadow p-4 mt-8">
            <div class="flex justify-between items-center">
                <h3 class="text-xl font-bold">Detailed Statement for ${sanitizeHTML(customer.name)}</h3>
                <button data-action="clear-selection" class="text-sm text-gray-500 hover:text-gray-800">&times; Close</button>
            </div>
            <div class="overflow-x-auto mt-4">
                <table class="min-w-full">
                    <thead><tr><th></th><th>Date</th><th>Description</th><th>Status</th><th class="text-right">Debit</th><th class="text-right">Credit</th></tr></thead>
                    <tbody id="detailed-statement-body" class="divide-y divide-gray-200">${itemsHtml}</tbody>
                    <tfoot>
                        <tr class="font-bold border-t-2"><td colspan="4" class="text-right">Total Billed:</td><td class="text-right">€${summary.totalBilled.toFixed(2)}</td><td></td></tr>
                        <tr class="font-bold"><td colspan="5" class="text-right">Total Paid:</td><td class="text-right text-green-700">€${summary.totalPaid.toFixed(2)}</td></tr>
                        <tr class="font-bold text-lg border-t-2"><td colspan="5" class="text-right">Balance Outstanding:</td><td class="text-right ${summary.outstanding > 0 ? 'text-red-600' : ''}">€${summary.outstanding.toFixed(2)}</td></tr>
                    </tfoot>
                </table>
            </div>
            <div id="bulk-payment-bar" class="hidden mt-6 p-4 bg-gray-100 rounded-lg flex justify-between items-center">
                <span class="font-semibold">Total for selected: <span id="bulk-payment-total" class="text-xl">€0.00</span></span>
                <button id="bulk-payment-btn" data-action="record-bulk-payment" data-customer-id="${sanitizeHTML(customerId)}" class="${btnGreen}">Record Payment for Selected</button>
            </div>
            <div class="mt-6 flex gap-2">
                <button data-action="generate-invoice" data-customer-id="${sanitizeHTML(customerId)}" class="${btnPurple}">Generate Invoice</button>
                <button data-action="copy-reminder" data-customer-id="${sanitizeHTML(customerId)}" class="${btnSecondary}">Copy Payment Reminder</button>
            </div>
        </div>
    `;
}

// ============================================
// BULK PAYMENT
// ============================================

/**
 * Update bulk payment total when checkboxes change
 * Shows/hides the bulk payment bar based on selection
 */
export function updateBulkPaymentTotal() {
    const container = document.getElementById('bulk-payment-bar');
    const totalEl = document.getElementById('bulk-payment-total');
    const buttonEl = document.getElementById('bulk-payment-btn');
    const selectedCheckboxes = document.querySelectorAll('#detailed-statement-body input.bulk-payment-checkbox:checked');

    if (!container || !totalEl || !buttonEl) return;

    if (selectedCheckboxes.length === 0) {
        container.classList.add('hidden');
        return;
    }

    let totalAmount = 0;
    selectedCheckboxes.forEach(checkbox => {
        totalAmount += parseFloat(checkbox.dataset.fee);
    });

    totalEl.textContent = `€${totalAmount.toFixed(2)}`;
    container.classList.remove('hidden');
}

/**
 * Record payment for multiple selected bookings
 * @param {string} customerId - Customer ID
 */
export function recordBulkPayment(customerId) {
    const selectedCheckboxes = document.querySelectorAll('#detailed-statement-body input.bulk-payment-checkbox:checked');
    if (selectedCheckboxes.length === 0) {
        showToast("No lessons selected.");
        return;
    }

    const bookingsToUpdate = Array.from(selectedCheckboxes).map(checkbox => ({
        bookingId: checkbox.dataset.bookingId,
        fee: parseFloat(checkbox.dataset.fee) || 0
    }));

    const totalAmount = bookingsToUpdate.reduce((sum, item) => sum + item.fee, 0);

    showDialog({
        title: 'Confirm Bulk Payment',
        message: `Are you sure you want to record a payment of €${totalAmount.toFixed(2)} for ${bookingsToUpdate.length} selected lesson(s)?`,
        buttons: [
            { text: 'Cancel', class: btnSecondary },
            {
                text: 'Confirm Payment',
                class: btnGreen,
                onClick: () => {
                    const paymentDate = toLocalDateString(new Date());
                    let processedCount = 0;

                    bookingsToUpdate.forEach(({ bookingId, fee }) => {
                        const booking = state.bookings.find(b => b.id === bookingId);
                        if (!booking) return;

                        processedCount += 1;

                        if (booking.transactionId) {
                            const existingTransaction = state.transactions.find(t => t.id === booking.transactionId);
                            if (existingTransaction) {
                                existingTransaction.amount = fee;
                                existingTransaction.date = paymentDate;
                                existingTransaction.description = `Payment for booking on ${booking.date}`;
                                existingTransaction.bookingId = booking.id;
                            } else {
                                const transaction = {
                                    id: booking.transactionId,
                                    date: paymentDate,
                                    type: 'payment',
                                    description: `Payment for booking on ${booking.date}`,
                                    amount: fee,
                                    customerId: customerId,
                                    bookingId: booking.id
                                };
                                state.transactions.push(transaction);
                            }
                        } else {
                            const transaction = {
                                id: `txn_${generateUUID()}`,
                                date: paymentDate,
                                type: 'payment',
                                description: `Payment for booking on ${booking.date}`,
                                amount: fee,
                                customerId: customerId,
                                bookingId: booking.id
                            };
                            state.transactions.push(transaction);
                            booking.transactionId = transaction.id;
                        }

                        booking.paymentStatus = 'Paid';
                    });

                    if (processedCount === 0) {
                        showToast('No valid bookings were found for the selected lessons.');
                        return;
                    }

                    debouncedSaveState();
                    showToast('Bulk payment recorded successfully.');
                    renderBillingContent();
                }
            }
        ]
    });
}

// ============================================
// NAVIGATION & SELECTION
// ============================================

/**
 * Clear selected customer and return to summary view
 */
export function clearSelectedCustomer() {
    selectedBillingCustomerId = null;
    renderBillingContent();
}

/**
 * Handle customer selection to show detailed breakdown
 * @param {string} customerId - Customer ID to select
 */
export function handleBillingCustomerChange(customerId) {
    selectedBillingCustomerId = customerId;
    billingCurrentPage = 1; // Reset page when changing customer focus
    renderBillingContent();
}

/**
 * Handle billing pagination page change
 * @param {number} page - Page number to navigate to
 */
export function handleBillingPageChange(page) {
    const customerSummaries = getCustomerSummaries();
    const totalPages = Math.ceil(customerSummaries.length / BILLING_ITEMS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    billingCurrentPage = page;
    renderBillingContent();
}

// ============================================
// EVENT DELEGATION
// ============================================

/**
 * Handle all billing view clicks via event delegation
 * Centralized click handler for better performance
 * @param {Event} event - Click event
 */
export function handleBillingClick(event) {
    const target = event.target;

    // Handle row click to show detailed view
    const customerRow = target.closest('tr[data-action="select-customer"]');
    if (customerRow) {
        handleBillingCustomerChange(customerRow.dataset.id);
        return;
    }

    // Handle button clicks with data attributes
    const button = target.closest('button[data-action]');
    if (button) {
        const { action, customerId, page } = button.dataset;
        switch (action) {
            case 'clear-selection':
                clearSelectedCustomer();
                break;
            case 'record-bulk-payment':
                recordBulkPayment(customerId);
                break;
            case 'generate-invoice':
                openInvoiceModal(customerId);
                break;
            case 'copy-reminder':
                copyPaymentReminder(customerId);
                break;
            case 'prev-page':
                handleBillingPageChange(billingCurrentPage - 1);
                break;
            case 'next-page':
                handleBillingPageChange(billingCurrentPage + 1);
                break;
            case 'go-to-page':
                handleBillingPageChange(parseInt(page, 10));
                break;
        }
        return;
    }

    // Handle checkbox changes for bulk payment
    if (target.matches('input.bulk-payment-checkbox')) {
        updateBulkPaymentTotal();
    }
}

// ============================================
// PAYMENT REMINDERS
// ============================================

/**
 * Copy payment reminder text to clipboard
 * @param {string} customerId - Customer ID
 */
export function copyPaymentReminder(customerId) {
    const customer = state.customers.find(c => c.id === customerId);
    if (!customer) return;
    const summary = getCustomerSummaries().find(s => s.id === customerId);
    const totalDue = summary ? summary.outstanding : 0;
    if (totalDue <= 0) {
        showToast("No outstanding balance to remind.");
        return;
    }
    const message = `Hi ${customer.name.split(' ')[0]}, just a friendly reminder that you have an outstanding balance of €${totalDue.toFixed(2)}. Please let me know if you have any questions. Thanks, ${state.settings.instructorName}.`;
    copyToClipboard(message);
}

// ============================================
// EXPORT
// ============================================

/**
 * Export billing summary to CSV/Excel
 * Downloads a CSV file with customer billing summaries
 */
export function exportBillingToExcel() {
    const customerSummaries = getCustomerSummaries();
    if (customerSummaries.length === 0) {
        showToast("No billing data to export.");
        return;
    }
    const sanitizeCell = (cell) => {
        const str = String(cell ?? '');
        return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
    };

    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = ["Customer", "Total Bookings", "Total Billed (€)", "Total Paid (€)", "Outstanding (€)"];
    csvContent += headers.join(",") + "\r\n";

    customerSummaries.forEach(s => {
        const row = [s.name, s.bookingCount, s.totalBilled.toFixed(2), s.totalPaid.toFixed(2), s.outstanding.toFixed(2)];
        csvContent += row.map(sanitizeCell).join(",") + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "billing_summary.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Billing summary exported successfully.");
}
