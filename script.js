/**
 * @fileoverview This script is a comprehensive management dashboard for a driving school.
 * It handles scheduling, customer and staff management, billing, reporting, and more.
 * It operates as a single-page application and uses localStorage for all data persistence,
 * making it a serverless, client-side solution.
 *
 * @version 3.1.0
 * @author Pitt Cheang
 * @created 2025-09-11
 */

// NOTE: sanitizeHTML is now provided by security.js
// Keeping this as a fallback in case security.js fails to load
if (typeof sanitizeHTML === 'undefined') {
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
}

function normalizeCollection(collection) {
    if (Array.isArray(collection)) {
        return collection;
    }
    if (collection && typeof collection === 'object') {
        return Object.values(collection);
    }
    return [];
}

function getLessonPackages() {
    if (!state.settings) state.settings = {};
    const packages = normalizeCollection(state.settings.packages);
    if (!Array.isArray(state.settings.packages)) {
        state.settings.packages = packages;
    }
    return packages;
}

function getPackagePriceValue(pkg) {
    if (!pkg) return null;
    const priceNumber = Number(pkg.price);
    return Number.isFinite(priceNumber) ? priceNumber : null;
}

function parseYYYYMMDD(dateString) {
    if (!dateString) return null;
    const parts = dateString.split('-');
    if (parts.length !== 3) return null;
    // Note: months are 0-based in JavaScript Date object
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

// BUGFIX: Safe date formatting helper to prevent null reference errors
function safeDateFormat(dateString, options = { day: '2-digit', month: 'short', year: 'numeric' }) {
    const parsed = parseYYYYMMDD(dateString);
    if (!parsed || isNaN(parsed.getTime())) {
        console.warn('Invalid date format:', dateString);
        return 'Invalid Date';
    }
    return parsed.toLocaleDateString('en-GB', options);
}

function generateUUID() {
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

// ==============================================
// OPTIMIZATION: MEMOIZATION UTILITY
// ==============================================

/**
 * Memoize a function - cache results based on arguments
 * Dramatically improves performance for expensive calculations called repeatedly
 * @param {Function} fn - Function to memoize
 * @param {Function} keyFn - Optional custom key generator
 * @returns {Function} Memoized function with cache
 */
function memoize(fn, keyFn = JSON.stringify) {
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
 */
function clearMemoCache(fn) {
    if (fn && fn.cache) {
        fn.cache.clear();
    }
}

// FEATURE: SMS Reminder Automation (Phase 1 Improvement)
function checkAndScheduleSMSReminders() {
    // Check for bookings in the next 24-48 hours that need reminders
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = toLocalDateString(tomorrow);

    const upcomingBookings = state.bookings.filter(b =>
        b.date === tomorrowStr &&
        b.status === 'Scheduled' &&
        !b.reminderSent
    );

    if (upcomingBookings.length > 0 && state.settings.autoRemindersEnabled) {
        console.log(`Found ${upcomingBookings.length} bookings needing reminders for tomorrow`);
        upcomingBookings.forEach(booking => {
            prepareSMSReminder(booking);
        });
    }

    return upcomingBookings.length;
}

function prepareSMSReminder(booking) {
    const customer = state.customers.find(c => c.id === booking.customerId);
    const staff = state.staff.find(s => s.id === booking.staffId);

    if (!customer || !customer.phone) {
        console.warn(`Cannot send reminder for booking ${booking.id}: customer has no phone number`);
        return;
    }

    const message = formatSMSMessage(booking, customer, staff);

    // In a real implementation, this would call an SMS API (Twilio, etc.)
    // For now, we log it and show a notification
    console.log(`📱 SMS Reminder Ready:`, {
        to: customer.phone,
        message: message,
        bookingId: booking.id
    });

    // Mark reminder as "sent" (in real implementation, only mark after successful send)
    booking.reminderSent = true;
    booking.reminderSentAt = new Date().toISOString();
    saveState();

    return { customer, message };
}

function formatSMSMessage(booking, customer, staff) {
    const template = state.settings.smsTemplate || 'Hi [CustomerFirstName], this is a friendly reminder for your driving lesson on [LessonDate] at [LessonTime]. See you then! From [InstructorName].';

    const firstName = customer.name.split(' ')[0];
    const bookingDate = safeDateFormat(booking.date, { day: '2-digit', month: 'short', year: 'numeric' });
    const instructorName = staff ? staff.name : (state.settings.instructorName || 'Ray Ryan');

    return template
        .replace('[CustomerFirstName]', firstName)
        .replace('[LessonDate]', bookingDate)
        .replace('[LessonTime]', booking.startTime)
        .replace('[InstructorName]', instructorName);
}

function manualSendReminders() {
    const count = checkAndScheduleSMSReminders();
    if (count > 0) {
        showToast(`Prepared ${count} SMS reminder(s) for tomorrow's bookings`);
    } else {
        showToast('No bookings need reminders at this time');
    }
}

function toggleAutoReminders(enabled) {
    state.settings.autoRemindersEnabled = enabled;
    saveState();
    showToast(enabled ? 'Auto-reminders enabled' : 'Auto-reminders disabled');
}

// FEATURE: Phase 2 - Email Notifications
function sendBookingConfirmationEmail(bookingId) {
    const booking = state.bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const customer = state.customers.find(c => c.id === booking.customerId);
    const staff = state.staff.find(s => s.id === booking.staffId);
    const service = state.services.find(s => s.id === booking.serviceId);

    if (!customer || !customer.email) {
        console.warn(`Cannot send email to customer ${booking.customerId}: no email address`);
        return;
    }

    const emailData = {
        to: customer.email,
        subject: `Booking Confirmation - ${service?.service_name || 'Lesson'}`,
        body: formatBookingConfirmationEmail(booking, customer, staff, service)
    };

    prepareEmail(emailData, 'confirmation', bookingId);
}

function sendBookingReminderEmail(bookingId) {
    const booking = state.bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const customer = state.customers.find(c => c.id === booking.customerId);
    const staff = state.staff.find(s => s.id === booking.staffId);
    const service = state.services.find(s => s.id === booking.serviceId);

    if (!customer || !customer.email) return;

    const emailData = {
        to: customer.email,
        subject: `Reminder: Lesson Tomorrow at ${booking.startTime}`,
        body: formatReminderEmail(booking, customer, staff, service)
    };

    prepareEmail(emailData, 'reminder', bookingId);
}

function sendPaymentReceiptEmail(transactionId) {
    const transaction = state.transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    const customer = state.customers.find(c => c.id === transaction.customerId);
    if (!customer || !customer.email) return;

    const emailData = {
        to: customer.email,
        subject: `Payment Receipt - €${transaction.amount.toFixed(2)}`,
        body: formatPaymentReceiptEmail(transaction, customer)
    };

    prepareEmail(emailData, 'receipt', transactionId);
}

function prepareEmail(emailData, type, referenceId) {
    // In production, this would call an email service API (EmailJS, SendGrid, etc.)
    // For now, log to console
    console.log(`📧 Email Ready [${type}]:`, emailData);

    // Store in a pending emails queue (could be used for batch sending)
    if (!state.settings.pendingEmails) {
        state.settings.pendingEmails = [];
    }

    state.settings.pendingEmails.push({
        id: `email_${generateUUID()}`,
        type,
        referenceId,
        emailData,
        createdAt: new Date().toISOString(),
        status: 'pending'
    });

    saveState();
    return emailData;
}

function formatBookingConfirmationEmail(booking, customer, staff, service) {
    const bookingDate = safeDateFormat(booking.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const instructorName = staff?.name || state.settings.instructorName || 'Ray Ryan';

    return `
Hi ${customer.name},

Your booking has been confirmed!

**Booking Details:**
- Service: ${service?.service_name || 'Driving Lesson'}
- Date: ${bookingDate}
- Time: ${booking.startTime} - ${booking.endTime}
- Instructor: ${instructorName}
${booking.pickup ? `- Pickup Location: ${booking.pickup}` : ''}

**Payment Status:** ${booking.paymentStatus}
${booking.paymentStatus === 'Unpaid' ? `\nAmount Due: €${booking.fee.toFixed(2)}` : ''}

If you need to reschedule or have any questions, please contact us.

Thank you!
${instructorName}
${state.settings.instructorAddress || ''}
`.trim();
}

function formatReminderEmail(booking, customer, staff, service) {
    const bookingDate = safeDateFormat(booking.date, { weekday: 'long', day: 'numeric', month: 'long' });
    const instructorName = staff?.name || state.settings.instructorName || 'Ray Ryan';

    return `
Hi ${customer.name},

This is a friendly reminder about your lesson tomorrow:

**Tomorrow's Lesson:**
- ${bookingDate} at ${booking.startTime}
- ${service?.service_name || 'Driving Lesson'}
- Instructor: ${instructorName}
${booking.pickup ? `- Pickup Location: ${booking.pickup}` : ''}

See you tomorrow!
${instructorName}
`.trim();
}

function formatPaymentReceiptEmail(transaction, customer) {
    const transactionDate = safeDateFormat(transaction.date, { day: 'numeric', month: 'long', year: 'numeric' });

    return `
Hi ${customer.name},

Thank you for your payment!

**Payment Receipt:**
- Date: ${transactionDate}
- Amount: €${transaction.amount.toFixed(2)}
- Description: ${transaction.description}
- Transaction ID: ${transaction.id}

${state.settings.paymentDetails || ''}

Thank you for your business!
${state.settings.instructorName || 'Ray Ryan'}
`.trim();
}

function checkAndSendEmailReminders() {
    // Check for bookings needing email reminders (similar to SMS reminders)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = toLocalDateString(tomorrow);

    const upcomingBookings = state.bookings.filter(b =>
        b.date === tomorrowStr &&
        b.status === 'Scheduled' &&
        !b.emailReminderSent
    );

    if (upcomingBookings.length > 0 && state.settings.autoEmailRemindersEnabled) {
        upcomingBookings.forEach(booking => {
            sendBookingReminderEmail(booking.id);
            booking.emailReminderSent = true;
        });
        saveState();
        console.log(`Sent ${upcomingBookings.length} email reminder(s)`);
    }

    return upcomingBookings.length;
}

function manualSendEmailReminders() {
    const count = checkAndSendEmailReminders();
    if (count > 0) {
        showToast(`Prepared ${count} email reminder(s) for tomorrow's bookings`);
    } else {
        showToast('No bookings need email reminders at this time');
    }
}

function toggleAutoEmailReminders(enabled) {
    state.settings.autoEmailRemindersEnabled = enabled;
    saveState();
    showToast(enabled ? 'Auto-email reminders enabled' : 'Auto-email reminders disabled');
}

function testBookingConfirmationEmail() {
    // Find a test booking (prefer a future booking)
    const today = toLocalDateString(new Date());
    const testBooking = state.bookings.find(b => b.date >= today && b.status !== 'Cancelled') || state.bookings[0];

    if (!testBooking) {
        showToast('No bookings available to test. Create a booking first.');
        return;
    }

    sendBookingConfirmationEmail(testBooking.id);
    showToast('Test email prepared! Check browser console (F12) to see the email content.');
}

// FEATURE: Phase 3 - Mobile Optimization
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
}

function initMobileOptimizations() {
    // Add mobile class to body
    if (isMobileDevice()) {
        document.body.classList.add('mobile-device');
    }

    // Add touch event listeners for swipe gestures on calendar
    const calendarContainer = document.getElementById('main-content');
    if (calendarContainer) {
        calendarContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
        calendarContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    // Update mobile navigation visibility
    updateMobileNav();
    window.addEventListener('resize', updateMobileNav);
}

function handleTouchStart(event) {
    touchStartX = event.changedTouches[0].screenX;
    touchStartY = event.changedTouches[0].screenY;
}

function handleTouchEnd(event) {
    touchEndX = event.changedTouches[0].screenX;
    touchEndY = event.changedTouches[0].screenY;
    handleSwipeGesture();
}

function handleSwipeGesture() {
    const swipeThreshold = 50;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Only process horizontal swipes (ignore vertical scrolling)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
        // Only allow swipes in calendar views
        if (['day', 'week', 'month'].includes(currentView)) {
            if (deltaX > 0) {
                // Swipe right - go to previous period
                navigatePrevious();
            } else {
                // Swipe left - go to next period
                navigateNext();
            }
        }
    }
}

function updateMobileNav() {
    const mobileNav = document.getElementById('mobile-bottom-nav');
    if (mobileNav) {
        mobileNav.style.display = isMobileDevice() ? 'flex' : 'none';
    }
}

function openMobileMenu() {
    const menu = document.getElementById('mobile-menu-modal');
    if (menu) {
        menu.classList.remove('hidden');
    }
}

function closeMobileMenu() {
    const menu = document.getElementById('mobile-menu-modal');
    if (menu) {
        menu.classList.add('hidden');
    }
}

// FEATURE: Phase 3 - Payment Reminders
function checkOverduePaymentReminders() {
    if (!state.settings.autoPaymentRemindersEnabled) {
        return 0;
    }

    const today = new Date();
    const reminders = [];

    // Find all unpaid bookings
    const unpaidBookings = state.bookings.filter(b =>
        b.paymentStatus === 'Unpaid' &&
        b.status === 'Completed' &&
        !b.paymentReminderSent
    );

    unpaidBookings.forEach(booking => {
        const bookingDate = parseYYYYMMDD(booking.date);
        const daysSinceBooking = Math.floor((today - bookingDate) / (1000 * 60 * 60 * 24));

        // Check reminder thresholds (7, 14, 30 days)
        const reminderDays = state.settings.paymentReminderDays || [7, 14, 30];

        if (reminderDays.includes(daysSinceBooking)) {
            sendPaymentReminder(booking.id, daysSinceBooking);
            reminders.push(booking);
        }
    });

    if (reminders.length > 0) {
        console.log(`💰 Sent ${reminders.length} payment reminder(s)`);
    }

    return reminders.length;
}

function sendPaymentReminder(bookingId, daysOverdue) {
    const booking = state.bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const customer = state.customers.find(c => c.id === booking.customerId);
    if (!customer) return;

    const reminderMessage = formatPaymentReminderMessage(booking, customer, daysOverdue);

    // Prepare email reminder
    if (customer.email) {
        prepareEmail({
            to: customer.email,
            subject: `Payment Reminder - ${daysOverdue} days overdue`,
            body: reminderMessage
        }, 'payment_reminder', booking.id);
    }

    // Log for now (can integrate with SMS later)
    console.log(`💰 Payment Reminder [${daysOverdue} days]:`, {
        customer: customer.name,
        amount: `€${booking.fee.toFixed(2)}`,
        bookingDate: booking.date,
        message: reminderMessage
    });

    // Mark as reminded
    booking.paymentReminderSent = true;
    booking.paymentReminderSentAt = new Date().toISOString();
    booking.paymentReminderCount = (booking.paymentReminderCount || 0) + 1;
    saveState();
}

function formatPaymentReminderMessage(booking, customer, daysOverdue) {
    const instructorName = state.settings.instructorName || 'Ray Ryan';
    const bookingDate = safeDateFormat(booking.date, {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const service = state.services.find(s => s.id === booking.serviceId);

    let urgencyMessage = '';
    if (daysOverdue >= 30) {
        urgencyMessage = 'This payment is now significantly overdue. Please contact us urgently to arrange payment.';
    } else if (daysOverdue >= 14) {
        urgencyMessage = 'This payment is overdue. Please arrange payment at your earliest convenience.';
    } else {
        urgencyMessage = 'This is a friendly reminder that payment is due.';
    }

    return `
Hi ${customer.name},

${urgencyMessage}

**Payment Details:**
- Service: ${service?.service_name || 'Driving Lesson'}
- Date: ${bookingDate}
- Amount Due: €${booking.fee.toFixed(2)}
- Days Overdue: ${daysOverdue}

${state.settings.paymentDetails || 'Please contact us to arrange payment.'}

If you have already made this payment, please disregard this message.

Thank you,
${instructorName}
${state.settings.instructorAddress || ''}
`.trim();
}

function manualSendPaymentReminders() {
    const count = checkOverduePaymentReminders();
    if (count > 0) {
        showToast(`Sent ${count} payment reminder(s)`);
    } else {
        showToast('No overdue payments need reminders');
    }
}

function toggleAutoPaymentReminders(enabled) {
    state.settings.autoPaymentRemindersEnabled = enabled;
    saveState();
    showToast(enabled ? 'Auto-payment reminders enabled' : 'Auto-payment reminders disabled');
}

function updatePaymentReminderDays() {
    const days7 = document.getElementById('reminder-7-days')?.checked;
    const days14 = document.getElementById('reminder-14-days')?.checked;
    const days30 = document.getElementById('reminder-30-days')?.checked;

    const reminderDays = [];
    if (days7) reminderDays.push(7);
    if (days14) reminderDays.push(14);
    if (days30) reminderDays.push(30);

    state.settings.paymentReminderDays = reminderDays.length > 0 ? reminderDays : [7, 14, 30];
    saveState();
    showToast('Payment reminder settings updated');
}

// FEATURE: Phase 3 - Invoice Customization
function updateInvoiceSetting(field, value) {
    state.settings[field] = value;
    saveState();
    showToast('Invoice settings updated');
}

// FEATURE: Phase 3 - Income Analytics
function calculateIncomeAnalytics() {
    const completedBookings = state.bookings.filter(b => b.status === 'Completed');
    const paidBookings = completedBookings.filter(b => b.paymentStatus === 'Paid');

    // Total revenue
    const totalRevenue = paidBookings.reduce((sum, b) => sum + (b.fee || 0), 0);

    // Calculate hours worked
    const totalMinutesWorked = completedBookings.reduce((sum, b) => {
        const startMinutes = timeToMinutes(b.startTime);
        const endMinutes = timeToMinutes(b.endTime);
        return sum + (endMinutes - startMinutes);
    }, 0);
    const totalHoursWorked = totalMinutesWorked / 60;

    // Income per hour
    const incomePerHour = totalHoursWorked > 0 ? totalRevenue / totalHoursWorked : 0;

    // Busiest days analysis
    const dayCount = {};
    completedBookings.forEach(b => {
        const day = new Date(b.date).toLocaleDateString('en-US', { weekday: 'long' });
        dayCount[day] = (dayCount[day] || 0) + 1;
    });
    const busiestDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];

    // Busiest hours analysis
    const hourCount = {};
    completedBookings.forEach(b => {
        const hour = parseInt(b.startTime.split(':')[0]);
        hourCount[hour] = (hourCount[hour] || 0) + 1;
    });
    const busiestHour = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0];
    const busiestTime = busiestHour ? `${String(busiestHour[0]).padStart(2, '0')}:00` : 'N/A';

    // Most profitable service
    const serviceRevenue = {};
    paidBookings.forEach(b => {
        const serviceName = state.services.find(s => s.id === b.serviceId)?.service_name || 'Unknown';
        serviceRevenue[serviceName] = (serviceRevenue[serviceName] || 0) + (b.fee || 0);
    });
    const mostProfitableService = Object.entries(serviceRevenue).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];

    // Revenue per student
    const customerRevenue = {};
    paidBookings.forEach(b => {
        customerRevenue[b.customerId] = (customerRevenue[b.customerId] || 0) + (b.fee || 0);
    });
    const averageRevenuePerStudent = Object.keys(customerRevenue).length > 0
        ? totalRevenue / Object.keys(customerRevenue).length
        : 0;
    const topCustomer = Object.entries(customerRevenue).sort((a, b) => b[1] - a[1])[0];
    const topCustomerName = topCustomer ? state.customers.find(c => c.id === topCustomer[0])?.name : 'N/A';

    // Utilization rate (based on typical 8-hour workday, 5 days/week)
    // BUGFIX: Find earliest booking date instead of using first array element
    let daysSinceStart = 1;
    if (state.bookings.length > 0) {
        const earliestBookingDate = state.bookings.reduce((earliest, booking) => {
            const bookingDate = new Date(booking.date);
            return bookingDate < earliest ? bookingDate : earliest;
        }, new Date());
        daysSinceStart = Math.max((new Date() - earliestBookingDate) / (1000 * 60 * 60 * 24), 1);
    }
    const workdaysCount = Math.ceil(daysSinceStart / 7) * 5; // Approximate workdays
    const availableHours = workdaysCount * 8;
    const utilizationRate = availableHours > 0 ? (totalHoursWorked / availableHours) * 100 : 0;

    return {
        totalRevenue,
        totalHoursWorked: totalHoursWorked.toFixed(1),
        incomePerHour,
        busiestDay: busiestDay[0],
        busiestDayCount: busiestDay[1],
        busiestTime,
        mostProfitableService: mostProfitableService[0],
        mostProfitableServiceRevenue: mostProfitableService[1],
        averageRevenuePerStudent,
        topCustomerName,
        topCustomerRevenue: topCustomer ? topCustomer[1] : 0,
        utilizationRate: utilizationRate.toFixed(1),
        totalBookings: completedBookings.length,
        paidBookings: paidBookings.length
    };
}

function renderIncomeAnalyticsDashboard() {
    const analytics = calculateIncomeAnalytics();

    return `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <!-- Income per Hour -->
            <div class="bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg p-4 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600 font-medium">Income per Hour</p>
                        <p class="text-2xl font-bold text-green-700 mt-1">€${analytics.incomePerHour.toFixed(2)}</p>
                        <p class="text-xs text-gray-500 mt-1">${analytics.totalHoursWorked} hours worked</p>
                    </div>
                    <div class="text-green-600 opacity-50">
                        <svg class="h-12 w-12" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Busiest Day -->
            <div class="bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-4 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600 font-medium">Busiest Day</p>
                        <p class="text-2xl font-bold text-blue-700 mt-1">${sanitizeHTML(analytics.busiestDay)}</p>
                        <p class="text-xs text-gray-500 mt-1">${analytics.busiestDayCount} bookings</p>
                    </div>
                    <div class="text-blue-600 opacity-50">
                        <svg class="h-12 w-12" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Busiest Time -->
            <div class="bg-gradient-to-br from-purple-50 to-pink-50 border-l-4 border-purple-500 rounded-lg p-4 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600 font-medium">Busiest Time</p>
                        <p class="text-2xl font-bold text-purple-700 mt-1">${sanitizeHTML(analytics.busiestTime)}</p>
                        <p class="text-xs text-gray-500 mt-1">Most popular hour</p>
                    </div>
                    <div class="text-purple-600 opacity-50">
                        <svg class="h-12 w-12" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Most Profitable Service -->
            <div class="bg-gradient-to-br from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-lg p-4 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600 font-medium">Top Service</p>
                        <p class="text-lg font-bold text-yellow-700 mt-1">${sanitizeHTML(analytics.mostProfitableService)}</p>
                        <p class="text-xs text-gray-500 mt-1">€${analytics.mostProfitableServiceRevenue.toFixed(2)} total</p>
                    </div>
                    <div class="text-yellow-600 opacity-50">
                        <svg class="h-12 w-12" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Average Revenue per Student -->
            <div class="bg-gradient-to-br from-cyan-50 to-teal-50 border-l-4 border-cyan-500 rounded-lg p-4 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600 font-medium">Avg per Student</p>
                        <p class="text-2xl font-bold text-cyan-700 mt-1">€${analytics.averageRevenuePerStudent.toFixed(2)}</p>
                        <p class="text-xs text-gray-500 mt-1">Per active customer</p>
                    </div>
                    <div class="text-cyan-600 opacity-50">
                        <svg class="h-12 w-12" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Utilization Rate -->
            <div class="bg-gradient-to-br from-rose-50 to-red-50 border-l-4 border-rose-500 rounded-lg p-4 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-600 font-medium">Utilization Rate</p>
                        <p class="text-2xl font-bold text-rose-700 mt-1">${analytics.utilizationRate}%</p>
                        <p class="text-xs text-gray-500 mt-1">Of available hours</p>
                    </div>
                    <div class="text-rose-600 opacity-50">
                        <svg class="h-12 w-12" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                </div>
            </div>
        </div>

        <!-- Top Customer Insight -->
        <div class="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
            <h4 class="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <svg class="h-5 w-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path>
                </svg>
                Business Insights
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div class="p-3 bg-gray-50 rounded">
                    <p class="text-gray-600">Top Customer</p>
                    <p class="font-semibold text-gray-900">${sanitizeHTML(analytics.topCustomerName)}</p>
                    <p class="text-xs text-gray-500">€${analytics.topCustomerRevenue.toFixed(2)} lifetime value</p>
                </div>
                <div class="p-3 bg-gray-50 rounded">
                    <p class="text-gray-600">Total Completed</p>
                    <p class="font-semibold text-gray-900">${analytics.totalBookings} bookings</p>
                    <p class="text-xs text-gray-500">${analytics.paidBookings} paid</p>
                </div>
                <div class="p-3 bg-gray-50 rounded">
                    <p class="text-gray-600">Total Revenue</p>
                    <p class="font-semibold text-gray-900">€${analytics.totalRevenue.toFixed(2)}</p>
                    <p class="text-xs text-gray-500">All-time earnings</p>
                </div>
            </div>
        </div>
    `;
}

// FEATURE: Phase 2 - Global Search/Filter
function handleGlobalSearch(event) {
    const searchTerm = event.target.value.trim().toLowerCase();
    const resultsContainer = document.getElementById('search-results');

    // Close on Escape
    if (event.key === 'Escape') {
        resultsContainer.classList.add('hidden');
        event.target.blur();
        return;
    }

    // Hide results if search is empty
    if (searchTerm.length < 2) {
        resultsContainer.classList.add('hidden');
        return;
    }

    // Search across customers, bookings, and staff
    const results = performGlobalSearch(searchTerm);

    // Display results
    if (results.customers.length === 0 && results.bookings.length === 0 && results.staff.length === 0) {
        resultsContainer.innerHTML = `
            <div class="p-4 text-center text-gray-500">
                No results found for "${sanitizeHTML(searchTerm)}"
            </div>
        `;
        resultsContainer.classList.remove('hidden');
        return;
    }

    let html = '';

    // Customers section
    if (results.customers.length > 0) {
        html += `
            <div class="p-3 bg-gray-50 border-b">
                <h3 class="text-xs font-semibold text-gray-600 uppercase">Customers (${results.customers.length})</h3>
            </div>
        `;
        results.customers.slice(0, 5).forEach(customer => {
            const credits = customer.driving_school_details?.lesson_credits || 0;
            html += `
                <div class="p-3 hover:bg-gray-50 cursor-pointer border-b" onclick="viewCustomerFromSearch('${customer.id}')">
                    <div class="font-medium text-gray-900">${sanitizeHTML(customer.name)}</div>
                    <div class="text-sm text-gray-500">${sanitizeHTML(customer.phone)} • ${credits.toFixed(1)} hrs credit</div>
                </div>
            `;
        });
        if (results.customers.length > 5) {
            html += `<div class="p-2 text-xs text-center text-gray-500">+${results.customers.length - 5} more</div>`;
        }
    }

    // Bookings section
    if (results.bookings.length > 0) {
        html += `
            <div class="p-3 bg-gray-50 border-b">
                <h3 class="text-xs font-semibold text-gray-600 uppercase">Bookings (${results.bookings.length})</h3>
            </div>
        `;
        results.bookings.slice(0, 5).forEach(booking => {
            const customer = state.customers.find(c => c.id === booking.customerId);
            const staff = state.staff.find(s => s.id === booking.staffId);
            const bookingDate = safeDateFormat(booking.date, { day: '2-digit', month: 'short' });
            html += `
                <div class="p-3 hover:bg-gray-50 cursor-pointer border-b" onclick="viewBookingFromSearch('${booking.date}', '${booking.id}')">
                    <div class="font-medium text-gray-900">${bookingDate} at ${booking.startTime} - ${sanitizeHTML(customer?.name || 'Unknown')}</div>
                    <div class="text-sm text-gray-500">${sanitizeHTML(staff?.name || 'Unknown')} • ${booking.status} • ${booking.paymentStatus}</div>
                </div>
            `;
        });
        if (results.bookings.length > 5) {
            html += `<div class="p-2 text-xs text-center text-gray-500">+${results.bookings.length - 5} more</div>`;
        }
    }

    // Staff section
    if (results.staff.length > 0) {
        html += `
            <div class="p-3 bg-gray-50 border-b">
                <h3 class="text-xs font-semibold text-gray-600 uppercase">Staff (${results.staff.length})</h3>
            </div>
        `;
        results.staff.forEach(staff => {
            html += `
                <div class="p-3 hover:bg-gray-50 cursor-pointer border-b" onclick="showView('staff')">
                    <div class="font-medium text-gray-900">${sanitizeHTML(staff.name)}</div>
                    <div class="text-sm text-gray-500">${sanitizeHTML(staff.phone || 'No phone')}</div>
                </div>
            `;
        });
    }

    resultsContainer.innerHTML = html;
    resultsContainer.classList.remove('hidden');
}

function performGlobalSearch(searchTerm) {
    const results = {
        customers: [],
        bookings: [],
        staff: []
    };

    // Search customers by name, phone, email
    results.customers = state.customers.filter(customer => {
        return (customer.name && customer.name.toLowerCase().includes(searchTerm)) ||
               (customer.phone && customer.phone.includes(searchTerm)) ||
               (customer.email && customer.email.toLowerCase().includes(searchTerm));
    });

    // Search bookings by customer name, date, status
    results.bookings = state.bookings.filter(booking => {
        const customer = state.customers.find(c => c.id === booking.customerId);
        const staff = state.staff.find(s => s.id === booking.staffId);
        return (customer && customer.name.toLowerCase().includes(searchTerm)) ||
               booking.date.includes(searchTerm) ||
               booking.status.toLowerCase().includes(searchTerm) ||
               (staff && staff.name.toLowerCase().includes(searchTerm));
    });

    // Search staff by name, phone
    results.staff = state.staff.filter(staff => {
        return staff.name.toLowerCase().includes(searchTerm) ||
               (staff.phone && staff.phone.includes(searchTerm));
    });

    return results;
}

function viewCustomerFromSearch(customerId) {
    // Hide search results
    document.getElementById('search-results').classList.add('hidden');
    document.getElementById('global-search').value = '';

    // Navigate to customers view and open customer modal
    showView('customers');
    setTimeout(() => openCustomerModal(customerId), 300);
}

function viewBookingFromSearch(date, bookingId) {
    // Hide search results
    document.getElementById('search-results').classList.add('hidden');
    document.getElementById('global-search').value = '';

    // Navigate to that date in calendar
    currentDate = parseYYYYMMDD(date);
    showView('day');
    setTimeout(() => openBookingModal(date, bookingId), 300);
}

// Close search results when clicking outside
document.addEventListener('click', function(event) {
    const searchContainer = document.getElementById('global-search');
    const resultsContainer = document.getElementById('search-results');

    if (searchContainer && resultsContainer &&
        !searchContainer.contains(event.target) &&
        !resultsContainer.contains(event.target)) {
        resultsContainer.classList.add('hidden');
    }
});

// FEATURE: Phase 2 - Google Calendar Sync / iCal Export
function exportToGoogleCalendar(bookingId) {
    const booking = state.bookings.find(b => b.id === bookingId);
    if (!booking) {
        showToast('Booking not found');
        return;
    }

    const icsContent = generateICSFile([booking]);
    downloadICSFile(icsContent, `booking-${booking.date}.ics`);
    showToast('Calendar event exported! Import to Google Calendar');
}

function exportAllBookingsToCalendar() {
    // Get all future and scheduled bookings
    const today = toLocalDateString(new Date());
    const futureBookings = state.bookings.filter(b =>
        b.date >= today && b.status !== 'Cancelled'
    );

    if (futureBookings.length === 0) {
        showToast('No upcoming bookings to export');
        return;
    }

    const icsContent = generateICSFile(futureBookings);
    downloadICSFile(icsContent, `all-bookings-${today}.ics`);
    showToast(`Exported ${futureBookings.length} booking(s) to calendar file`);
}

function generateICSFile(bookings) {
    // iCalendar format specification (RFC 5545)
    let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Ray Ryan Management System//Booking Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Ray Ryan Bookings
X-WR-TIMEZONE:Europe/Dublin
X-WR-CALDESC:Driving School Bookings
`;

    bookings.forEach(booking => {
        const customer = state.customers.find(c => c.id === booking.customerId);
        const staff = state.staff.find(s => s.id === booking.staffId);
        const service = state.services.find(s => s.id === booking.serviceId);

        // Parse date and times
        const bookingDate = parseYYYYMMDD(booking.date);
        const startDateTime = parseBookingDateTime(booking.date, booking.startTime);
        const endDateTime = parseBookingDateTime(booking.date, booking.endTime);

        // Format for iCal (YYYYMMDDTHHMMSS)
        const startIcal = formatICalDateTime(startDateTime);
        const endIcal = formatICalDateTime(endDateTime);
        const createdIcal = formatICalDateTime(new Date());

        // Build event details
        const summary = `${service?.service_name || 'Lesson'} - ${customer?.name || 'Unknown'}`;
        const description = `Status: ${booking.status}\\nPayment: ${booking.paymentStatus}\\nInstructor: ${staff?.name || 'Unknown'}\\nService: ${service?.service_name || 'Unknown'}\\nPickup: ${booking.pickup || 'Not specified'}`;
        const location = booking.pickup || '';

        ics += `BEGIN:VEVENT
UID:${booking.id}@rayryanmanagement.com
DTSTAMP:${createdIcal}
DTSTART:${startIcal}
DTEND:${endIcal}
SUMMARY:${escapeICalText(summary)}
DESCRIPTION:${escapeICalText(description)}
LOCATION:${escapeICalText(location)}
STATUS:${booking.status === 'Completed' ? 'CONFIRMED' : booking.status === 'Cancelled' ? 'CANCELLED' : 'TENTATIVE'}
SEQUENCE:0
END:VEVENT
`;
    });

    ics += `END:VCALENDAR`;
    return ics;
}

function parseBookingDateTime(dateStr, timeStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes);
}

function formatICalDateTime(date) {
    // Format: YYYYMMDDTHHMMSS
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

function escapeICalText(text) {
    if (!text) return '';
    return text.replace(/\\/g, '\\\\')
               .replace(/;/g, '\\;')
               .replace(/,/g, '\\,')
               .replace(/\n/g, '\\n');
}

function downloadICSFile(content, filename) {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

function checkVehicleCompliance() {
    // TODO: Implement actual vehicle compliance check
    console.log("Checking vehicle compliance...");
}

function checkOverduePayments() {
    // TODO: Implement actual overdue payments check
    console.log("Checking for overdue payments...");
}

/******************************************************************************
 * SECTION 1: STATE MANAGEMENT & CONFIGURATION
 ******************************************************************************/

// --- DATABASE KEYS ---
const DB_KEYS = {
    CUSTOMERS: 'customers',
    STAFF: 'staff',
    RESOURCES: 'resources',
    SERVICES: 'services',
    BOOKINGS: 'bookings',
    BLOCKED_PERIODS: 'blockedPeriods',
    SETTINGS: 'settings',
    EXPENSES: 'expenses',
    TRANSACTIONS: 'transactions',
    WAITING_LIST: 'waitingList',
    MIGRATION_VERSION: 'migrationVersion'
};

// --- STYLE CONSTANTS ---
const btnPrimary = "btn btn-primary";
const btnSecondary = "btn btn-secondary";
const btnDanger = "btn btn-danger";
const btnGreen = "btn btn-green";
const btnPurple = "btn btn-purple";

const DEFAULT_SERVICE_ID = 'service_lesson_1';
const MOCK_TEST_SERVICE_ID = 'service_mock_test';

// --- GLOBAL STATE ---
let state = {
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

// --- DYNAMIC STATE ---
let currentView = 'month'; // The current calendar view ('month', 'week', 'day')
let currentDate = new Date('2025-11-01'); // The date the calendar is currently focused on. This will be updated on load.

// --- CALENDAR CONFIGURATION ---
const CALENDAR_START_HOUR = 7;
const CALENDAR_END_HOUR = 21;
const TIMESLOT_INTERVAL_MINUTES = 30;

// --- BILLING STATE ---
let selectedBillingCustomerId = null;
let billingCurrentPage = 1;
const BILLING_ITEMS_PER_PAGE = 10;
let autoBackupInterval = null;
let isDragging = false;
let dragStartY = 0;
let selectionBox = null;
let activeCharts = [];

// --- SKILLS CONFIGURATION ---
const skillLevels = {
    standard: {
        title: 'Standard Skills (Foundational)',
        skills: [
            "Cockpit Drill & Controls", "Moving Off & Stopping Safely", "Steering Control",
            "Clutch Control & Gear Changing", "Basic Junctions (Turning Left & Right)",
            "Emerging at T-Junctions", "Basic Mirror Checks", "Hill Starts", "Emergency Stop"
        ]
    },
    intermediate: {
        title: 'Intermediate Skills (Maneuvers)',
        skills: [
            "Roundabouts (Mini & Standard)", "Pedestrian Crossings", "Anticipation & Hazard Perception",
            "Meeting & Overtaking", "Turn in the Road", "Reversing in a Straight Line",
            "Parallel Parking", "Bay Parking (Forward & Reverse)", "Following Distance"
        ]
    },
    advanced: {
        title: 'Advanced Skills (Test Readiness)',
        skills: [
            "Dual Carriageways", "Complex/Spiral Roundabouts", "Adverse Weather Driving",
            "Night Driving", "Eco-Safe Driving", "Following Sat Nav",
            "'Show Me, Tell Me' Questions", "Independent Driving"
        ]
    },
    mock_test: {
        title: 'Mock Test Assessment',
        skills: [
            "Observation", "Anticipation & Awareness", "Vehicle Control",
            "Maneuvers (Turn, Reverse, Park)", "Serious/Grade 3 Faults", "Driving/Grade 2 Faults",
            "Overall Result: Pass", "Overall Result: Fail"
        ]
    }
};


/******************************************************************************
 * SECTION 2: INITIALIZATION & CORE APP LOGIC
 ******************************************************************************/

function handleBillingClick(event) {
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

function handleListClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const { action, id, view } = button.dataset;
    if (!view) return; // Not a button we care about

    const viewActions = {
        services: {
            add: () => openServiceModal(),
            edit: (id) => openServiceModal(id),
            delete: (id) => deleteService(id)
        },
        customers: {
            add: () => openCustomerModal(),
            edit: (id) => openCustomerModal(id),
            delete: (id) => deleteCustomer(id),
            'view-progress': (id) => openCustomerProgressModal(id),
            'sell-package': (id) => openSellPackageModal(id)
        },
        staff: {
            add: () => openStaffModal(),
            edit: (id) => openStaffModal(id),
            delete: (id) => deleteStaff(id)
        },
        resources: {
            add: () => openResourceModal(),
            edit: (id) => openResourceModal(id),
            delete: (id) => deleteResource(id)
        },
        expenses: {
            add: () => openExpenseModal(),
            edit: (id) => openExpenseModal(id),
            delete: (id) => deleteExpense(id)
        }
    };

    if (viewActions[view] && viewActions[view][action]) {
        event.preventDefault();
        viewActions[view][action](id);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // SECURITY: Setup CSP violation reporting
    if (typeof setupCSPViolationReporting === 'function') {
        setupCSPViolationReporting();
    }

    runDataMigration();
    loadState();
    addDummyData();

    // --- Smart Date Initialization ---
    // BUGFIX: Added safety checks for first booking date parsing
    if (state.bookings && state.bookings.length > 0 && state.bookings[0].date) {
        try {
            const firstBookingDate = new Date(state.bookings[0].date.replace(/-/g, '/'));
            if (firstBookingDate > new Date() && !isNaN(firstBookingDate.getTime())) {
                currentDate = firstBookingDate;
            }
        } catch (e) {
            console.warn('Failed to parse first booking date:', e);
        }
    }
    updateClock();
    setInterval(updateClock, 1000);
    populateTimeSelects();
    renderApp();
    checkVehicleCompliance();
    checkOverduePayments();
    // FEATURE: Phase 1 - Check for SMS reminders on app load
    checkAndScheduleSMSReminders();
    // FEATURE: Phase 2 - Check for email reminders on app load
    checkAndSendEmailReminders();
    // FEATURE: Phase 3 - Initialize mobile optimizations
    initMobileOptimizations();
    // FEATURE: Phase 3 - Check for payment reminders on app load
    checkOverduePaymentReminders();

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            const target = event.target;
            if ((target.tagName === 'DIV' || target.tagName === 'SPAN') && target.getAttribute('role') === 'button') {
                event.preventDefault();
                target.click();
            }
        }
    });

    // FEATURE: Keyboard Shortcuts for Quick Actions (Phase 1 Improvement)
    document.addEventListener('keydown', function(event) {
        // Check if user is typing in an input field
        const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);

        // ESC key - Close any open modal
        if (event.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal-backdrop:not(.hidden)');
            if (openModals.length > 0) {
                openModals.forEach(modal => {
                    modal.classList.add('hidden');
                });
                return;
            }
        }

        // Don't process shortcuts if user is typing (except Esc and Ctrl+S)
        if (isTyping && event.key !== 'Escape' && !(event.ctrlKey && event.key === 's')) {
            return;
        }

        // Ctrl+S - Quick save (force save state)
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            saveState();
            showToast('Data saved successfully!');
            return;
        }

        // Ctrl+F or F3 - Focus search box (Phase 2 improvement)
        if ((event.ctrlKey && event.key === 'f') || event.key === 'F3') {
            event.preventDefault();
            const searchBox = document.getElementById('global-search');
            if (searchBox) {
                searchBox.focus();
                searchBox.select();
            }
            return;
        }

        // Single key shortcuts (only when not typing)
        if (!isTyping) {
            switch(event.key.toLowerCase()) {
                case 'n':
                    // N - New booking
                    event.preventDefault();
                    openBookingModal();
                    break;

                case 'c':
                    // C - New customer
                    event.preventDefault();
                    openCustomerModal();
                    break;

                case 'b':
                    // B - Go to Billing view
                    event.preventDefault();
                    showView('billing');
                    break;

                case 's':
                    // S - Go to Summary/Dashboard view
                    event.preventDefault();
                    showView('summary');
                    break;

                case 'd':
                    // D - Go to Day calendar view
                    event.preventDefault();
                    showView('day');
                    break;

                case 'w':
                    // W - Go to Week calendar view
                    event.preventDefault();
                    showView('week');
                    break;

                case 'm':
                    // M - Go to Month calendar view
                    event.preventDefault();
                    showView('month');
                    break;

                // Arrow keys - Navigate calendar
                case 'arrowleft':
                    if (['day', 'week', 'month'].includes(currentView)) {
                        event.preventDefault();
                        changeDate(currentView === 'day' ? 'day' : currentView === 'week' ? 'week' : 'month', -1);
                    }
                    break;

                case 'arrowright':
                    if (['day', 'week', 'month'].includes(currentView)) {
                        event.preventDefault();
                        changeDate(currentView === 'day' ? 'day' : currentView === 'week' ? 'week' : 'month', 1);
                    }
                    break;

                case 't':
                    // T - Go to Today in calendar
                    if (['day', 'week', 'month'].includes(currentView)) {
                        event.preventDefault();
                        currentDate = new Date();
                        refreshCurrentView();
                        showToast('Jumped to today');
                    }
                    break;

                case '?':
                    // ? - Show keyboard shortcuts help
                    event.preventDefault();
                    showKeyboardShortcutsHelp();
                    break;
            }
        }
    });

    document.getElementById('progress-log-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const customerId = document.getElementById('progress-customer-id').value;
        if (customerId && saveProgressNote(customerId)) {
            renderProgressLog(customerId);
            resetProgressForm(customerId);
        }
    });

    document.body.addEventListener('click', handleListClick);
});

// SAFETY: Force save before page unload to prevent data loss
window.addEventListener('beforeunload', function(e) {
    // If there's a pending debounced save, execute it immediately
    if (saveStateTimeout) {
        clearTimeout(saveStateTimeout);
        saveStateTimeout = null;
        saveState(); // Force immediate save
        console.log('Forced save on page unload to prevent data loss');
    }
    // No need to show confirmation dialog - save is automatic
});

function runDataMigration() {
    const MIGRATION_KEY = 'migration_v3.0.0_complete';
    if (localStorage.getItem(MIGRATION_KEY)) {
        return;
    }

    // Read any potential legacy data
    const oldStudents = JSON.parse(localStorage.getItem('students') || '[]');
    const oldInstructors = JSON.parse(localStorage.getItem('instructors') || '[]');
    const oldVehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');

    // Detect whether the existing bookings are legacy-shaped (use studentId/instructorId/vehicleId)
    let legacyBookingsArray = [];
    try {
        const parsed = JSON.parse(localStorage.getItem('bookings') || '[]');
        if (Array.isArray(parsed) && parsed.some(b => b && (b.studentId || b.instructorId || b.vehicleId))) {
            legacyBookingsArray = parsed;
        }
    } catch (e) {
        // If parsing fails, assume no legacy bookings
        legacyBookingsArray = [];
    }

    const hasLegacyStudents = Array.isArray(oldStudents) && oldStudents.length > 0;
    const hasLegacyInstructors = Array.isArray(oldInstructors) && oldInstructors.length > 0;
    const hasLegacyVehicles = Array.isArray(oldVehicles) && oldVehicles.length > 0;
    const hasLegacyBookings = legacyBookingsArray.length > 0;

    // If there is no legacy data at all, mark migration complete and exit without touching current data.
    if (!hasLegacyStudents && !hasLegacyInstructors && !hasLegacyVehicles && !hasLegacyBookings) {
        localStorage.setItem(MIGRATION_KEY, 'true');
        return;
    }

    let didMigrate = false;

    // Migrate legacy students → customers (only if present)
    if (hasLegacyStudents) {
        const newCustomers = oldStudents.map(student => ({
            id: student.id,
            name: student.name,
            email: student.email,
            phone: student.phone,
            creation_date: new Date().toISOString(),
            driving_school_details: {
                license_number: student.license,
                progress_notes: student.progressLog || [],
                lesson_credits: student.lessonCredits || 0
            }
        }));
        localStorage.setItem(DB_KEYS.CUSTOMERS, JSON.stringify(newCustomers));
        didMigrate = true;
    }

    // Migrate legacy instructors → staff (only if present)
    if (hasLegacyInstructors) {
        const newStaff = oldInstructors.map(instructor => ({
            id: instructor.id,
            name: instructor.name,
            email: instructor.email,
            phone: instructor.phone,
            staff_type: 'INSTRUCTOR',
            qualifications: {}
        }));
        localStorage.setItem(DB_KEYS.STAFF, JSON.stringify(newStaff));
        didMigrate = true;
    }

    // Migrate legacy vehicles → resources (only if present)
    if (hasLegacyVehicles) {
        const newResources = oldVehicles.map(vehicle => ({
            id: vehicle.id,
            resource_name: `${vehicle.make} ${vehicle.model}`,
            make: vehicle.make,
            model: vehicle.model,
            reg: vehicle.reg,
            resource_type: 'VEHICLE',
            capacity: 4,
            maintenance_schedule: {
                mot: vehicle.motDueDate,
                tax: vehicle.taxDueDate,
                service: vehicle.serviceDueDate
            }
        }));
        localStorage.setItem(DB_KEYS.RESOURCES, JSON.stringify(newResources));
        didMigrate = true;
    }

    // Ensure at least one service exists only if none currently saved
    const services = JSON.parse(localStorage.getItem(DB_KEYS.SERVICES) || '[]');
    if (services.length === 0) {
        services.push({
            id: DEFAULT_SERVICE_ID,
            service_name: 'Standard Driving Lesson',
            service_type: 'DRIVING_LESSON',
            duration_minutes: 60,
            base_price: 30.00,
            pricing_rules: { type: 'fixed', price: 30.00 }
        });
        localStorage.setItem(DB_KEYS.SERVICES, JSON.stringify(services));
        // Not strictly a migration of legacy data, but safe to do.
    }

    // Migrate legacy bookings only if they use legacy fields
    if (hasLegacyBookings) {
        const newBookings = legacyBookingsArray.map(b => {
            const newBooking = { ...b };
            newBooking.customerId = newBooking.studentId;
            newBooking.staffId = newBooking.instructorId;
            newBooking.resourceIds = newBooking.vehicleId ? [newBooking.vehicleId] : [];
            // Preserve existing serviceId if present; otherwise default
            if (!newBooking.serviceId) newBooking.serviceId = DEFAULT_SERVICE_ID;
            delete newBooking.studentId;
            delete newBooking.instructorId;
            delete newBooking.vehicleId;
            return newBooking;
        });
        localStorage.setItem(DB_KEYS.BOOKINGS, JSON.stringify(newBookings));
        didMigrate = true;
    }

    // Clean up legacy keys only if we migrated
    if (didMigrate) {
        localStorage.removeItem('students');
        localStorage.removeItem('instructors');
        localStorage.removeItem('vehicles');
        // Leave the 'bookings' key since it is now the canonical key in the new model.
        localStorage.setItem(MIGRATION_KEY, 'true');
        showToast("Data model updated to v3.0.0!");
    } else {
        // Nothing to migrate; avoid future checks
        localStorage.setItem(MIGRATION_KEY, 'true');
    }
}

function addDummyData() {
    // Only add dummy data if there are no customers. This is a good heuristic for a fresh install.
    // The previous check for any data would fail if the migration added a default service.
    if (state.customers && state.customers.length > 0) {
        return;
    }

    const customers = Array.from({length: 15}, (_, i) => ({id: `customer_${i+1}`, name: `Customer ${i+1}`, email: `customer${i+1}@a.com`, phone: `${i+1}${i+1}${i+1}`, driving_school_details: {}}));
    const staff = [{id: 'staff_1', name: 'Ray Ryan', email: 'ray@a.com', phone: '789', staff_type: 'INSTRUCTOR'}];
    const resources = [{id: 'resource_1', resource_name: 'Ford Focus', make: 'Ford', model: 'Focus', reg: '123-D-456', resource_type: 'VEHICLE', capacity: 4}];
    const services = [{
        id: 'service_lesson_1',
        service_name: 'Standard Driving Lesson',
        service_type: 'DRIVING_LESSON',
        duration_minutes: 60,
        base_price: 30.00,
        pricing_rules: { type: 'fixed', price: 30.00 }
    }];
    const today = new Date();
    const date = toLocalDateString(today);
    const bookings = [{
        id: 'booking_1',
        date: date,
        startTime: '10:00',
        endTime: '11:00',
        customerId: 'customer_1',
        staffId: 'staff_1',
        resourceIds: ['resource_1'],
        serviceId: 'service_lesson_1',
        status: 'Completed',
        paymentStatus: 'Unpaid',
        fee: 30
    }];

    state.customers = customers;
    state.staff = staff;
    state.resources = resources;
    state.services = services;
    state.bookings = bookings;

    debouncedSaveState();
}

function renderApp() {
    const nav = document.getElementById('main-nav');
    const navItems = [
        { id: 'calendar', name: 'Calendar', view: 'month' },
        { id: 'summary', name: 'Summary', view: 'summary' },
        { id: 'services', name: 'Services', view: 'services' },
        { id: 'customers', name: 'Customers', view: 'customers' },
        { id: 'staff', name: 'Staff', view: 'staff' },
        { id: 'resources', name: 'Resources', view: 'resources' },
        { id: 'expenses', name: 'Expenses', view: 'expenses' },
        { id: 'waiting-list', name: 'Waiting List', view: 'waiting-list' },
        { id: 'billing', name: 'Billing', view: 'billing' },
        { id: 'reports', name: 'Reports', view: 'reports' },
        { id: 'settings', name: 'Settings', view: 'settings' }
    ];
    nav.innerHTML = navItems.map(item =>
        `<button onclick="showView('${item.view}')" id="nav-${item.id}" class="nav-btn">${item.name}</button>`
    ).join('');

    showView('month'); // Default view
    setupAutoBackup();
}


/******************************************************************************
 * SECTION 3: VIEW MANAGEMENT
 ******************************************************************************/

function showView(viewName, date = null) {
    if (date) currentDate = new Date(date);

    // Destroy any existing charts to prevent memory leaks
    activeCharts.forEach(chart => chart.destroy());
    activeCharts = [];

    const calendarViews = ['day', 'week', 'month'];
    const isCalendarView = calendarViews.includes(viewName);
    currentView = viewName;

    const allViewIds = ['calendar', 'summary', 'billing', 'services', 'customers', 'staff', 'resources', 'expenses', 'waiting-list', 'settings', 'reports'];
    allViewIds.forEach(v => {
        const el = document.getElementById(`${v}-view`);
        const shouldShow = v === (isCalendarView ? 'calendar' : viewName);
        if (el) el.classList.toggle('hidden', !shouldShow);
    });

    updateActiveNav();
    refreshCurrentView();
}

function updateActiveNav() {
    document.querySelectorAll('#main-nav button').forEach(btn => btn.classList.remove('active'));
    const calendarViews = ['day', 'week', 'month'];
    let activeNavId = calendarViews.includes(currentView) ? 'nav-calendar' : `nav-${currentView}`;
    const activeBtn = document.getElementById(activeNavId);
    if (activeBtn) activeBtn.classList.add('active');
}

function refreshCurrentView() {
    const viewRenderers = {
        day: renderDayView, week: renderWeekView, month: renderMonthView,
        summary: renderSummaryView, billing: renderBillingView,
        services: renderServicesView,
        customers: renderCustomersView,
        staff: renderStaffView,
        resources: renderResourcesView,
        expenses: renderExpensesView,
        'waiting-list': renderWaitingListView, settings: renderSettingsView, reports: renderReportsView
    };

    const calendarViews = ['day', 'week', 'month'];
    if (calendarViews.includes(currentView)) {
        renderCalendarContainer(); // Render the shared calendar header/container
    }

    // Call the specific renderer for the current view
    if (viewRenderers[currentView]) {
        viewRenderers[currentView]();
    }
}

function changeDate(unit, direction) {
    if (unit === 'day') currentDate.setDate(currentDate.getDate() + direction);
    else if (unit === 'week') currentDate.setDate(currentDate.getDate() + (7 * direction));
    else if (unit === 'month') currentDate.setMonth(currentDate.getMonth() + direction);
    refreshCurrentView();
}


/******************************************************************************
 * SECTION 4: DATA PERSISTENCE (LOCALSTORAGE)
 ******************************************************************************/

function loadState() {
    try {
        const defaultSettings = {
            mockTestRate: 60.00,
            mockTestDuration: 1.5,
            packages: [],
            instructorName: 'Ray Ryan',
            instructorAddress: '123 Driving School Ln, Town, T12 3AB',
            paymentDetails: 'Please make payment via Bank Transfer to:\nAccount Name: Ray Ryan\nSort Code: 00-00-00\nAccount No: 00000000',
            smsTemplate: 'Hi [CustomerFirstName], this is a friendly reminder for your driving lesson on [LessonDate] at [LessonTime]. See you then! From [InstructorName].',
            autoBackupEnabled: false,
            autoRemindersEnabled: false, // FEATURE: Phase 1 - SMS Reminders
            autoEmailRemindersEnabled: false, // FEATURE: Phase 2 - Email Notifications
            googleCalendarEnabled: false, // FEATURE: Phase 2 - Google Calendar Integration
            googleCalendarClientId: '', // Google Calendar API client ID
            googleCalendarApiKey: '', // Google Calendar API key
            googleCalendarAutoSync: false, // Auto-sync bookings to Google Calendar
            autoPaymentRemindersEnabled: false, // FEATURE: Phase 3 - Payment Reminders
            paymentReminderDays: [7, 14, 30], // Days after booking to send payment reminders
            // FEATURE: Phase 3 - Invoice Customization
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
            apiModels: { gemini: 'gemini-1.5-flash-latest', openai: 'gpt-4-turbo', perplexity: 'llama-3-sonar-large-32k-online', openrouter: 'google/gemini-flash-1.5' }
        };

        const safeJSONParse = (key, fallback, isCritical = false) => {
            try {
                const item = localStorage.getItem(key);
                if (item === null || item === 'null' || item === 'undefined') return fallback;
                return item ? JSON.parse(item) : fallback;
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

        state.customers = safeJSONParse(DB_KEYS.CUSTOMERS, [], true);
        state.staff = safeJSONParse(DB_KEYS.STAFF, [], true);
        state.resources = safeJSONParse(DB_KEYS.RESOURCES, [], true);
        state.services = safeJSONParse(DB_KEYS.SERVICES, [], true);
        state.bookings = safeJSONParse(DB_KEYS.BOOKINGS, [], true);
        state.blockedPeriods = safeJSONParse(DB_KEYS.BLOCKED_PERIODS, []);
        state.expenses = safeJSONParse(DB_KEYS.EXPENSES, []);
        state.transactions = safeJSONParse(DB_KEYS.TRANSACTIONS, []);
        state.waitingList = safeJSONParse(DB_KEYS.WAITING_LIST, []);

        const savedSettings = safeJSONParse(DB_KEYS.SETTINGS, {});
        state.settings = deepMerge(defaultSettings, savedSettings);

        // SECURITY: Decrypt API keys after loading
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

// In a utility file or near saveState
let saveStateTimeout = null;
const SAVE_DEBOUNCE_DELAY = 200; // milliseconds

function debouncedSaveState() {
    if (saveStateTimeout) {
        clearTimeout(saveStateTimeout);
    }
    saveStateTimeout = setTimeout(() => {
        saveState();
        saveStateTimeout = null;
    }, SAVE_DEBOUNCE_DELAY);
}

function saveState() {
    try {
        // SECURITY: Validate state data before saving
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

        // SECURITY: Encrypt API keys before saving
        const settingsToSave = { ...state.settings };
        if (typeof encryptAPIKey === 'function' && settingsToSave.apiKeys) {
            const encryptedKeys = {};
            for (const [provider, key] of Object.entries(settingsToSave.apiKeys)) {
                encryptedKeys[provider] = key ? encryptAPIKey(key) : '';
            }
            settingsToSave._encryptedApiKeys = encryptedKeys;
            delete settingsToSave.apiKeys; // Don't save plain text keys
        }

        localStorage.setItem(DB_KEYS.CUSTOMERS, JSON.stringify(state.customers));
        localStorage.setItem(DB_KEYS.STAFF, JSON.stringify(state.staff));
        localStorage.setItem(DB_KEYS.RESOURCES, JSON.stringify(state.resources));
        localStorage.setItem(DB_KEYS.SERVICES, JSON.stringify(state.services));
        localStorage.setItem(DB_KEYS.BOOKINGS, JSON.stringify(state.bookings));
        localStorage.setItem(DB_KEYS.BLOCKED_PERIODS, JSON.stringify(state.blockedPeriods));
        localStorage.setItem(DB_KEYS.EXPENSES, JSON.stringify(state.expenses));
        localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
        localStorage.setItem(DB_KEYS.WAITING_LIST, JSON.stringify(state.waitingList));
        localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(settingsToSave));
    } catch (error) {
        console.error("Failed to save state to localStorage:", error);
        showDialog({
            title: 'Save Error',
            message: 'Could not save application data. Your browser storage might be full. Please clear some space or export a backup.',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
    }
}

function handleSaveSettings(event) {
    event.preventDefault();
    const mockTestRate = parseFloat(document.getElementById('mock-test-rate').value);
    const mockTestDuration = parseFloat(document.getElementById('mock-test-duration').value);

    if (isNaN(mockTestRate) || mockTestRate < 0 || isNaN(mockTestDuration) || mockTestDuration <= 0) {
        showDialog({
            title: 'Invalid Input',
            message: 'Please enter valid, non-negative numbers for all rates and a positive duration for mock tests.',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }

    state.settings.mockTestRate = mockTestRate;
    state.settings.mockTestDuration = mockTestDuration;
    state.settings.instructorName = document.getElementById('instructor-name').value;
    state.settings.instructorAddress = document.getElementById('instructor-address').value;
    state.settings.paymentDetails = document.getElementById('payment-details').value;
    state.settings.smsTemplate = document.getElementById('sms-template').value;
    state.settings.firstDayOfWeek = document.getElementById('first-day-of-week').value;

    // Save Google Calendar settings
    state.settings.googleCalendarEnabled = document.getElementById('google-calendar-enabled').checked;
    state.settings.googleCalendarClientId = document.getElementById('google-calendar-client-id').value;
    state.settings.googleCalendarApiKey = document.getElementById('google-calendar-api-key').value;
    state.settings.googleCalendarAutoSync = document.getElementById('google-calendar-auto-sync').checked;

    // New AI settings save logic
    const provider = document.getElementById('ai-provider').value;
    state.settings.aiProvider = provider;
    state.settings.apiKeys[provider] = document.getElementById('api-key').value;
    state.settings.apiModels[provider] = document.getElementById('api-model').value;

    // Automatically create or update the Mock Test service
    const mockTestService = state.services.find(s => s.id === MOCK_TEST_SERVICE_ID);
    const durationInMinutes = Math.round(mockTestDuration * 60);

    if (mockTestService) {
        // Update existing mock test service
        mockTestService.duration_minutes = durationInMinutes;
        mockTestService.base_price = mockTestRate;
        mockTestService.pricing_rules = { type: 'fixed', price: mockTestRate };
    } else {
        // Create new mock test service
        state.services.push({
            id: MOCK_TEST_SERVICE_ID,
            service_name: 'Mock Test',
            service_type: 'DRIVING_LESSON',
            duration_minutes: durationInMinutes,
            base_price: mockTestRate,
            pricing_rules: { type: 'fixed', price: mockTestRate }
        });
    }

    saveState();
    showDialog({ title: 'Success', message: 'Settings saved.', buttons: [{ text: 'OK', class: btnPrimary }] });
}

function renderPackageList() {
    const container = document.getElementById('package-list-container');
    if (!container) return; // Happens if settings view is not rendered
    const packages = getLessonPackages();
    const validPackages = packages
        .map(pkg => ({ pkg, price: getPackagePriceValue(pkg) }))
        .filter(entry => entry.price !== null);

    if (validPackages.length === 0) {
        const message = packages.length === 0
            ? 'No lesson packages created yet.'
            : 'Lesson packages could not be displayed because their prices are invalid. Please update them in Settings.';
        container.innerHTML = `<p class="text-center text-gray-500 py-3">${sanitizeHTML(message)}</p>`;
        return;
    }

    container.innerHTML = validPackages.map(({ pkg, price }) => `
        <div class="flex justify-between items-center p-3 bg-white border rounded-lg shadow-sm">
            <div>
                <p class="font-semibold">${sanitizeHTML(pkg.name)}</p>
                <p class="text-sm text-gray-600">${pkg.hours != null ? sanitizeHTML(pkg.hours) : 'N/A'} hours for €${price.toFixed(2)}</p>
            </div>
            <div class="flex gap-2">
                <button type="button" onclick="editPackage('${pkg.id}')" class="font-medium text-indigo-600 hover:text-indigo-900">Edit</button>
                <button type="button" onclick="deletePackage('${pkg.id}')" class="font-medium text-red-600 hover:text-red-900">Delete</button>
            </div>
        </div>
    `).join('');
}

function savePackage(event) {
    event.preventDefault();
    const packageId = document.getElementById('package-id').value;
    const packageName = document.getElementById('package-name').value.trim();
    const packageHours = document.getElementById('package-hours').value;
    const packagePrice = document.getElementById('package-price').value;

    // Manual validation
    if (!packageName || !packageHours || !packagePrice) {
        showDialog({
            title: 'Missing Information',
            message: 'Please fill out all fields (Package Name, Hours, and Price) to add or update a package.',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }

    const hours = parseFloat(packageHours);
    const price = parseFloat(packagePrice);

    if (isNaN(hours) || isNaN(price) || hours <= 0 || price <= 0) {
        showDialog({
            title: 'Invalid Input',
            message: 'Please enter valid, positive numbers for Hours and Price.',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }

    const packages = getLessonPackages();

    if (packageId) { // Editing existing package
        const index = packages.findIndex(p => p.id === packageId);
        if (index !== -1) {
            packages[index] = { id: packageId, name: packageName, hours: hours, price: price };
        }
    } else { // Adding new package
        packages.push({ id: `pkg_${generateUUID()}`, name: packageName, hours: hours, price: price });
    }

    state.settings.packages = packages;

    debouncedSaveState();
    renderPackageList();
    resetPackageForm();
}

function editPackage(id) {
    const pkg = getLessonPackages().find(p => p.id === id);
    if (pkg) {
        document.getElementById('package-id').value = pkg.id;
        document.getElementById('package-name').value = pkg.name;
        document.getElementById('package-hours').value = pkg.hours;
        document.getElementById('package-price').value = pkg.price;
        document.getElementById('package-submit-btn').textContent = 'Update';
        document.getElementById('package-cancel-btn').classList.remove('hidden');
    }
}

function deletePackage(id) {
    showDialog({
        title: 'Delete Package',
        message: 'Are you sure you want to delete this lesson package?',
        buttons: [
            { text: 'Cancel', class: btnSecondary },
            { text: 'Delete', class: btnDanger, onClick: () => {
                state.settings.packages = getLessonPackages().filter(p => p.id !== id);
                debouncedSaveState();
                renderPackageList();
                showToast('Package deleted.');
            }}
        ]
    });
}

function resetPackageForm() {
    const idInput = document.getElementById('package-id');
    const nameInput = document.getElementById('package-name');
    const hoursInput = document.getElementById('package-hours');
    const priceInput = document.getElementById('package-price');
    const submitButton = document.getElementById('package-submit-btn');
    const cancelButton = document.getElementById('package-cancel-btn');

    if (idInput) idInput.value = '';
    if (nameInput) nameInput.value = '';
    if (hoursInput) hoursInput.value = '';
    if (priceInput) priceInput.value = '';
    if (submitButton) submitButton.textContent = 'Add';
    if (cancelButton) cancelButton.classList.add('hidden');
}


/******************************************************************************
 * SECTION 5: GENERIC LIST VIEW RENDERERS
 ******************************************************************************/

function renderServicesView() {
    const columns = [
        { header: 'Name', render: item => item.service_name },
        { header: 'Type', render: item => (item.service_type || '').replace('_', ' '), class: 'hidden sm:table-cell' },
        { header: 'Duration', render: item => `${item.duration_minutes} min`, class: 'hidden md:table-cell' },
        { header: 'Price', render: item => `€${(item.base_price || 0).toFixed(2)}`, class: 'hidden md:table-cell' }
    ];
    renderGenericListView('services', 'Services', columns, state.services, 'Service');
}

function renderCustomersView() {
    const columns = [
        { header: 'Name', render: item => item.name },
        { header: 'Email', render: item => item.email || '-', class: 'hidden sm:table-cell' },
        { header: 'Phone', render: item => item.phone || '-', class: 'hidden md:table-cell' }
    ];
    renderGenericListView('customers', 'Customers', columns, state.customers, 'Customer');
}

function renderStaffView() {
    const columns = [
        { header: 'Name', render: item => item.name },
        { header: 'Email', render: item => item.email || '-', class: 'hidden sm:table-cell' },
        { header: 'Phone', render: item => item.phone || '-', class: 'hidden md:table-cell' }
    ];
    renderGenericListView('staff', 'Staff', columns, state.staff, 'Staff Member');
}

function renderResourcesView() {
    const columns = [
        { header: 'Name', render: item => item.resource_name },
        { header: 'Type', render: item => item.resource_type, class: 'hidden sm:table-cell' },
        { header: 'Capacity', render: item => item.capacity || 'N/A', class: 'hidden md:table-cell' }
    ];
    renderGenericListView('resources', 'Resources', columns, state.resources, 'Resource');
}

function renderGenericListView(viewName, title, columns, data, singularTitle) {
    const container = document.getElementById(`${viewName}-view`);
    const addButtonText = `Add ${singularTitle ? sanitizeHTML(singularTitle) : sanitizeHTML(title.slice(0, -1))}`;
    container.innerHTML = `<div class="bg-white rounded-lg shadow"><div class="flex justify-between items-center p-4 border-b"><h2 class="text-xl">${sanitizeHTML(title)}</h2><button data-view="${sanitizeHTML(viewName)}" data-action="add" class="${btnPrimary}">${addButtonText}</button></div><div id="${viewName}-list-table" class="overflow-x-auto"></div></div>`;
    const listContainer = document.getElementById(`${viewName}-list-table`);
    const dataArray = normalizeCollection(data);
    if (dataArray.length === 0) { listContainer.innerHTML = `<p class="text-center py-8 text-gray-500">No ${viewName} found.</p>`; return; }

    const tableHeaders = columns.map(c => `<th class="${c.class || ''}">${c.header}</th>`).join('');
    const tableRows = dataArray.map(item => {
        let actionsHtml;

        if (viewName === 'services' && item.id === MOCK_TEST_SERVICE_ID) {
            actionsHtml = `
                <span class="text-sm text-gray-500 italic mr-4">Managed in Settings</span>
                <button class="font-medium text-indigo-400 cursor-not-allowed" disabled>Edit</button>
                <button class="ml-4 font-medium text-red-400 cursor-not-allowed" disabled>Delete</button>
            `;
        } else {
            actionsHtml = `<button data-view="${sanitizeHTML(viewName)}" data-action="edit" data-id="${sanitizeHTML(item.id)}" class="font-medium text-indigo-600 hover:text-indigo-900">Edit</button>`;
            if (viewName === 'customers') {
                actionsHtml += ` <button data-view="${sanitizeHTML(viewName)}" data-action="view-progress" data-id="${sanitizeHTML(item.id)}" class="ml-4 font-medium text-green-600 hover:text-green-900">View Progress</button>`;
                actionsHtml += ` <button data-view="${sanitizeHTML(viewName)}" data-action="sell-package" data-id="${sanitizeHTML(item.id)}" class="ml-4 font-medium text-blue-600 hover:text-blue-900">Sell Package</button>`;
            }
            actionsHtml += ` <button data-view="${sanitizeHTML(viewName)}" data-action="delete" data-id="${sanitizeHTML(item.id)}" class="ml-4 font-medium text-red-600 hover:text-red-900">Delete</button>`;
        }

        return `<tr>${columns.map(c => `<td class="${c.class || ''}">${sanitizeHTML(c.render(item))}</td>`).join('')}<td class="text-right">${actionsHtml}</td></tr>`;
    }).join('');
    listContainer.innerHTML = `<table class="min-w-full divide-y divide-gray-200"><thead><tr>${tableHeaders}<th></th></tr></thead><tbody class="bg-white divide-y divide-gray-200">${tableRows}</tbody></table>`;
}

function renderExpensesView() {
    const columns = [
        { header: 'Date', render: item => safeDateFormat(item.date), class: 'w-1/6' },
        { header: 'Category', render: item => item.category, class: 'w-1/6' },
        { header: 'Description', render: item => item.description, class: 'w-3/6' },
        { header: 'Amount', render: item => `€${item.amount.toFixed(2)}`, class: 'text-right w-1/6' }
    ];
    renderGenericListView('expenses', 'Expenses', columns, state.expenses, 'Expense');
}

function openExpenseModal(id = null) {
    const modal = document.getElementById('expense-modal');
    const form = modal.querySelector('form');
    form.reset();
    if (id) {
        document.getElementById('expense-modal-title').textContent = 'Edit Expense';
        const expense = state.expenses.find(e => e.id === id);
        if (expense) {
            document.getElementById('expense-id').value = expense.id;
            document.getElementById('expense-date').value = expense.date;
            document.getElementById('expense-category').value = expense.category;
            document.getElementById('expense-description').value = expense.description;
            document.getElementById('expense-amount').value = expense.amount;
        }
    } else {
        document.getElementById('expense-modal-title').textContent = 'New Expense';
        document.getElementById('expense-id').value = '';
        document.getElementById('expense-date').value = toLocalDateString(new Date());
    }
    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal').classList.remove('scale-95', 'opacity-0'), 10);
}

function closeExpenseModal() {
    const modal = document.getElementById('expense-modal');
    modal.querySelector('.modal').classList.add('scale-95', 'opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

function saveExpense(event) {
    event.preventDefault();
    const expenseId = document.getElementById('expense-id').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);

    if (isNaN(amount) || amount <= 0) {
        showDialog({
            title: 'Invalid Input',
            message: 'Please enter a valid, positive number for the expense amount.',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }

    const expenseData = {
        id: expenseId || `expense_${generateUUID()}`,
        date: document.getElementById('expense-date').value,
        category: document.getElementById('expense-category').value,
        description: document.getElementById('expense-description').value,
        amount: amount
    };

    if (expenseId) {
        const index = state.expenses.findIndex(e => e.id === expenseId);
        state.expenses[index] = expenseData;
    } else {
        state.expenses.push(expenseData);
    }
    debouncedSaveState();
    closeExpenseModal();
    renderExpensesView();
}

function deleteExpense(id) {
    showDialog({
        title: 'Delete Expense',
        message: 'Are you sure you want to delete this expense entry?',
        buttons: [
            { text: 'Cancel', class: btnSecondary },
            {
                text: 'Delete',
                class: btnDanger,
                onClick: () => {
                    state.expenses = state.expenses.filter(e => e.id !== id);
                    debouncedSaveState();
                    renderExpensesView();
                    showToast('Expense deleted.');
                }
            }
        ]
    });
}

function isSlotAvailable(item) { // item is a waitingList entry
    const { date, startTime, endTime, customerId, staffId, resourceIds } = item;

    // Check for customer conflicts
    const customerConflict = state.bookings.some(b =>
        b.status !== 'Cancelled' && b.customerId === customerId && b.date === date &&
        isTimeOverlapping(startTime, endTime, b.startTime, b.endTime)
    );
    if (customerConflict) return false;

    // Check for staff conflicts ONLY if a specific staffId is provided in the waiting list item
    if (staffId) {
        const staffBookingConflict = state.bookings.some(b =>
            b.status !== 'Cancelled' && b.staffId === staffId && b.date === date &&
            isTimeOverlapping(startTime, endTime, b.startTime, b.endTime)
        );
        if (staffBookingConflict) return false;

        const staffIsOnLeave = getBlockedPeriodsForDate(parseYYYYMMDD(date))
            .some(p => p.staffId === staffId || p.staffId === 'all');
        if (staffIsOnLeave) return false;
    }

    // Check for resource conflicts ONLY if specific resourceIds are provided
    if (resourceIds && resourceIds.length > 0) {
        const resourceBookingConflict = state.bookings.some(b =>
            b.status !== 'Cancelled' && b.date === date &&
            isTimeOverlapping(startTime, endTime, b.startTime, b.endTime) &&
            b.resourceIds && b.resourceIds.some(r => resourceIds.includes(r))
        );
        if (resourceBookingConflict) return false;
    }

    return true;
}

function renderWaitingListView() {
    const container = document.getElementById('waiting-list-view');
    const waitingList = state.waitingList.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt));

    if (waitingList.length === 0) {
        container.innerHTML = `<div class="bg-white rounded-lg shadow p-8 text-center text-gray-500">The waiting list is currently empty.</div>`;
        return;
    }

    const tableRows = waitingList.map(item => {
        const customer = state.customers.find(s => s.id === item.customerId);
        const staff = state.staff.find(i => i.id === item.staffId);
        const slotAvailable = isSlotAvailable(item);

        const statusHtml = slotAvailable
            ? `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Available</span>`
            : `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Booked</span>`;

        const bookButtonHtml = slotAvailable
            ? `<button onclick="openBookingModal('${item.date}', null, '${item.startTime}', '${item.endTime}')" class="${btnGreen} text-xs">Book Now</button>`
            : `<button class="${btnSecondary} text-xs" disabled>Book Now</button>`;

        return `
            <tr>
                <td>${sanitizeHTML(customer ? customer.name : 'Unknown')}</td>
                <td>${safeDateFormat(item.date)}</td>
                <td>${item.startTime} - ${item.endTime}</td>
                <td>${sanitizeHTML(staff ? staff.name : 'Any')}</td>
                <td>${statusHtml}</td>
                <td class="text-right">
                    ${bookButtonHtml}
                    <button onclick="removeWaitingListItem('${item.id}')" class="${btnDanger} text-xs ml-2">Remove</button>
                </td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <div class="bg-white rounded-lg shadow">
            <div class="p-4 border-b"><h2 class="text-xl font-bold">Waiting List</h2></div>
            <div class="overflow-x-auto">
                <table class="min-w-full">
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Staff</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">${tableRows}</tbody>
                </table>
            </div>
        </div>
    `;
}

function removeWaitingListItem(id) {
    showDialog({
        title: 'Remove from Waiting List',
        message: 'Are you sure you want to remove this waiting list entry?',
        buttons: [
            { text: 'Cancel', class: btnSecondary },
            { text: 'Remove', class: btnDanger, onClick: () => {
                state.waitingList = state.waitingList.filter(item => item.id !== id);
                debouncedSaveState();
                renderWaitingListView();
                showToast('Removed from waiting list.');
            }}
        ]
    });
}

function renderSettingsView() {
    const container = document.getElementById('settings-view');
    container.innerHTML = `
        <div class="bg-white rounded-lg shadow p-4 sm:p-6 max-w-4xl mx-auto space-y-8">
            <div>
                <h2 class="text-xl font-bold mb-4 text-gray-900">Settings</h2>
                <form onsubmit="handleSaveSettings(event)" class="space-y-6">
                     <div class="border-t border-gray-200 pt-6">
                        <h3 class="text-lg font-medium mb-2">Mock Test Settings</h3>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><label for="mock-test-rate" class="block mb-1 text-sm font-medium text-gray-700">Mock Test Rate (€)</label><input type="number" id="mock-test-rate" value="${(state.settings.mockTestRate || 60).toFixed(2)}" step="0.01" required class="w-full"></div>
                            <div><label for="mock-test-duration" class="block mb-1 text-sm font-medium text-gray-700">Mock Test Duration (hours)</label><input type="number" id="mock-test-duration" value="${state.settings.mockTestDuration || 1.5}" step="0.5" required class="w-full"></div>
                        </div>
                    </div>
                    <div class="border-t border-gray-200 pt-6">
                        <h3 class="text-lg font-medium mb-2">Lesson Packages</h3>
                        <div id="package-list-container" class="space-y-2 mb-4">
                            <!-- Package list will be rendered here by JS -->
                        </div>
                        <div id="package-form" class="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end p-4 border rounded-lg bg-gray-50">
                            <input type="hidden" id="package-id">
                            <div>
                                <label for="package-name" class="block text-sm font-medium text-gray-700">Package Name</label>
                                <input type="text" id="package-name" class="w-full mt-1" placeholder="e.g., 10 Hour Block">
                            </div>
                            <div>
                                <label for="package-hours" class="block text-sm font-medium text-gray-700">Hours</label>
                                <input type="number" id="package-hours" class="w-full mt-1" step="0.5">
                            </div>
                            <div>
                                <label for="package-price" class="block text-sm font-medium text-gray-700">Price (€)</label>
                                <input type="number" id="package-price" class="w-full mt-1" step="0.01">
                            </div>
                            <div class="flex gap-2">
                                <button type="button" onclick="savePackage(event)" id="package-submit-btn" class="${btnPrimary} w-full">Add</button>
                                <button type="button" id="package-cancel-btn" onclick="resetPackageForm()" class="${btnSecondary} w-full hidden">Cancel</button>
                            </div>
                        </div>
                    </div>
                    <div class="border-t border-gray-200 pt-6">
                        <h3 class="text-lg font-medium mb-2">Booking Settings</h3>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label for="first-day-of-week" class="block mb-1 text-sm font-medium text-gray-700">First Day of the Week</label>
                                <select id="first-day-of-week" class="w-full">
                                    <option value="monday" ${state.settings.firstDayOfWeek === 'monday' ? 'selected' : ''}>Monday</option>
                                    <option value="sunday" ${state.settings.firstDayOfWeek === 'sunday' ? 'selected' : ''}>Sunday</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="border-t border-gray-200 pt-6">
                        <h3 class="text-lg font-medium mb-2">Google Calendar Integration</h3>
                        <div class="grid grid-cols-1 gap-4">
                            <div>
                                <label for="google-calendar-client-id" class="block mb-1 text-sm font-medium text-gray-700">Google Calendar Client ID</label>
                                <input type="text" id="google-calendar-client-id" value="${state.settings.googleCalendarClientId || ''}" class="w-full">
                            </div>
                            <div>
                                <label for="google-calendar-api-key" class="block mb-1 text-sm font-medium text-gray-700">Google Calendar API Key</label>
                                <input type="text" id="google-calendar-api-key" value="${state.settings.googleCalendarApiKey || ''}" class="w-full">
                            </div>
                            <div class="flex items-center gap-2">
                                <input type="checkbox" id="google-calendar-auto-sync" ${state.settings.googleCalendarAutoSync ? 'checked' : ''}>
                                <label for="google-calendar-auto-sync" class="text-sm font-medium text-gray-700">Enable automatic sync with Google Calendar</label>
                            </div>
                            <p class="text-sm text-gray-500 mt-2">
                                To use Google Calendar integration:
                                1. Go to Google Cloud Console
                                2. Create a new project or select an existing one
                                3. Enable the Google Calendar API
                                4. Create OAuth 2.0 credentials (Client ID)
                                5. Create an API key
                                6. Add them here and save
                            </p>
                        </div>
                    </div>
                    <div class="border-t border-gray-200 pt-6">
                        <h3 class="text-lg font-medium mb-2">Invoice Details</h3>
                        <div><label for="instructor-name" class="block mb-1 text-sm font-medium text-gray-700">Your Name / Company Name</label><input type="text" id="instructor-name" value="${sanitizeHTML(state.settings.instructorName)}" required class="w-full"></div>
                        <div class="mt-4"><label for="instructor-address" class="block mb-1 text-sm font-medium text-gray-700">Your Address</label><textarea id="instructor-address" rows="3" required class="w-full">${sanitizeHTML(state.settings.instructorAddress)}</textarea></div>
                        <div class="mt-4"><label for="payment-details" class="block mb-1 text-sm font-medium text-gray-700">Payment Details (for Invoices)</label><textarea id="payment-details" rows="4" class="w-full">${sanitizeHTML(state.settings.paymentDetails)}</textarea></div>
                    </div>
                    <div class="border-t border-gray-200 pt-6">
                        <h3 class="text-lg font-medium mb-2">SMS Reminder Template</h3>
                        <div>
                            <label for="sms-template" class="block mb-1 text-sm font-medium text-gray-700">Template</label>
                            <textarea id="sms-template" rows="4" class="w-full font-mono text-sm">${sanitizeHTML(state.settings.smsTemplate)}</textarea>
                        </div>
                        <div class="mt-2 text-sm text-gray-500">
                            <p>Available placeholders:</p>
                            <ul class="list-disc list-inside">
                                <li><code>[CustomerFirstName]</code> - The customer's first name.</li>
                                <li><code>[CustomerFullName]</code> - The customer's full name.</li>
                                <li><code>[LessonDate]</code> - The date of the lesson (e.g., Friday, 15 August).</li>
                                <li><code>[LessonTime]</code> - The start time of the lesson (e.g., 09:00).</li>
                                <li><code>[InstructorName]</code> - Your name from the Invoice Details.</li>
                            </ul>
                        </div>
                        <!-- FEATURE: Phase 1 - SMS Automation Controls -->
                        <div class="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                            <div class="flex items-center justify-between mb-3">
                                <label for="auto-reminders" class="font-medium text-gray-700">📱 Auto-Send SMS Reminders (24hrs before)</label>
                                <input type="checkbox" id="auto-reminders" onchange="toggleAutoReminders(this.checked)" ${state.settings.autoRemindersEnabled ? 'checked' : ''} class="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300">
                            </div>
                            <p class="text-xs text-gray-600 mb-3">When enabled, the system will prepare SMS reminders for bookings happening tomorrow.</p>
                            <button type="button" onclick="manualSendReminders()" class="${btnSecondary} w-full text-sm">Send SMS Reminders Now</button>
                            <p class="text-xs text-gray-500 mt-2 italic">Note: Currently in simulation mode. To enable real SMS sending, integrate with Twilio or similar service.</p>
                        </div>
                    </div>
                    <!-- FEATURE: Phase 2 - Email Notifications -->
                    <div class="border-t border-gray-200 pt-6">
                        <h3 class="text-lg font-medium mb-2">📧 Email Notifications</h3>
                        <div class="p-4 bg-green-50 border-l-4 border-green-500 rounded">
                            <div class="flex items-center justify-between mb-3">
                                <label for="auto-email-reminders" class="font-medium text-gray-700">📧 Auto-Send Email Reminders (24hrs before)</label>
                                <input type="checkbox" id="auto-email-reminders" onchange="toggleAutoEmailReminders(this.checked)" ${state.settings.autoEmailRemindersEnabled ? 'checked' : ''} class="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300">
                            </div>
                            <p class="text-xs text-gray-600 mb-3">When enabled, the system will prepare email reminders for bookings happening tomorrow.</p>
                            <button type="button" onclick="manualSendEmailReminders()" class="${btnSecondary} w-full text-sm mb-2">Send Email Reminders Now</button>
                            <button type="button" onclick="testBookingConfirmationEmail()" class="${btnSecondary} w-full text-sm">Test Booking Confirmation Email</button>
                            <p class="text-xs text-gray-500 mt-3 italic">Note: Currently in simulation mode. Check browser console (F12) to see prepared emails. To enable real email sending, integrate with EmailJS or SendGrid.</p>
                            <div class="mt-3 p-2 bg-white rounded text-xs">
                                <strong>Email Types:</strong>
                                <ul class="list-disc list-inside mt-1 text-gray-600">
                                    <li>Booking Confirmation (sent when booking created)</li>
                                    <li>24-hour Reminder (sent day before lesson)</li>
                                    <li>Payment Receipt (sent when payment recorded)</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <!-- FEATURE: Phase 3 - Payment Reminders -->
                    <div class="border-t border-gray-200 pt-6">
                        <h3 class="text-lg font-medium mb-2">💰 Payment Reminders</h3>
                        <div class="p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
                            <div class="flex items-center justify-between mb-3">
                                <label for="auto-payment-reminders" class="font-medium text-gray-700">💰 Auto-Send Payment Reminders</label>
                                <input type="checkbox" id="auto-payment-reminders" onchange="toggleAutoPaymentReminders(this.checked)" ${state.settings.autoPaymentRemindersEnabled ? 'checked' : ''} class="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300">
                            </div>
                            <p class="text-xs text-gray-600 mb-3">Automatically send payment reminders for overdue completed bookings.</p>

                            <div class="mb-3 p-3 bg-white rounded">
                                <p class="text-sm font-medium text-gray-700 mb-2">Send reminders after:</p>
                                <div class="space-y-2">
                                    <label class="flex items-center gap-2">
                                        <input type="checkbox" id="reminder-7-days" ${state.settings.paymentReminderDays?.includes(7) ? 'checked' : ''} onchange="updatePaymentReminderDays()" class="rounded text-indigo-600 focus:ring-indigo-500 border-gray-300">
                                        <span class="text-sm text-gray-700">7 days (first reminder)</span>
                                    </label>
                                    <label class="flex items-center gap-2">
                                        <input type="checkbox" id="reminder-14-days" ${state.settings.paymentReminderDays?.includes(14) ? 'checked' : ''} onchange="updatePaymentReminderDays()" class="rounded text-indigo-600 focus:ring-indigo-500 border-gray-300">
                                        <span class="text-sm text-gray-700">14 days (second reminder)</span>
                                    </label>
                                    <label class="flex items-center gap-2">
                                        <input type="checkbox" id="reminder-30-days" ${state.settings.paymentReminderDays?.includes(30) ? 'checked' : ''} onchange="updatePaymentReminderDays()" class="rounded text-indigo-600 focus:ring-indigo-500 border-gray-300">
                                        <span class="text-sm text-gray-700">30 days (final reminder)</span>
                                    </label>
                                </div>
                            </div>

                            <button type="button" onclick="manualSendPaymentReminders()" class="${btnSecondary} w-full text-sm">Send Payment Reminders Now</button>
                            <p class="text-xs text-gray-500 mt-3 italic">Note: Reminders are logged to console (F12). Integrate with email/SMS for automatic sending.</p>
                        </div>
                    </div>
                    <!-- FEATURE: Phase 3 - Invoice Customization -->
                    <div class="border-t border-gray-200 pt-6">
                        <h3 class="text-lg font-medium mb-2">🧾 Invoice Customization</h3>
                        <div class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label for="invoice-vat" class="block text-sm font-medium text-gray-700 mb-1">VAT Number (optional)</label>
                                    <input type="text" id="invoice-vat" value="${sanitizeHTML(state.settings.vatNumber || '')}" placeholder="IE1234567T" onchange="updateInvoiceSetting('vatNumber', this.value)" class="w-full">
                                </div>
                                <div>
                                    <label for="invoice-email" class="block text-sm font-medium text-gray-700 mb-1">Invoice Email</label>
                                    <input type="email" id="invoice-email" value="${sanitizeHTML(state.settings.invoiceEmail || '')}" placeholder="invoices@yourcompany.com" onchange="updateInvoiceSetting('invoiceEmail', this.value)" class="w-full">
                                </div>
                                <div>
                                    <label for="invoice-phone" class="block text-sm font-medium text-gray-700 mb-1">Invoice Phone</label>
                                    <input type="tel" id="invoice-phone" value="${sanitizeHTML(state.settings.invoicePhone || '')}" placeholder="+353 87 123 4567" onchange="updateInvoiceSetting('invoicePhone', this.value)" class="w-full">
                                </div>
                                <div>
                                    <label for="invoice-logo" class="block text-sm font-medium text-gray-700 mb-1">Company Logo URL</label>
                                    <input type="url" id="invoice-logo" value="${sanitizeHTML(state.settings.invoiceLogo || '')}" placeholder="https://yoursite.com/logo.png" onchange="updateInvoiceSetting('invoiceLogo', this.value)" class="w-full">
                                    <p class="text-xs text-gray-500 mt-1">Enter a URL to your logo image (appears on invoices)</p>
                                </div>
                            </div>
                            <div>
                                <label for="invoice-terms" class="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                                <textarea id="invoice-terms" rows="3" onchange="updateInvoiceSetting('invoiceTerms', this.value)" class="w-full" placeholder="Payment terms, late fees, etc.">${sanitizeHTML(state.settings.invoiceTerms || '')}</textarea>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label for="invoice-thank-you" class="block text-sm font-medium text-gray-700 mb-1">Thank You Message</label>
                                    <input type="text" id="invoice-thank-you" value="${sanitizeHTML(state.settings.invoiceThankYou || '')}" onchange="updateInvoiceSetting('invoiceThankYou', this.value)" class="w-full">
                                </div>
                                <div>
                                    <label for="invoice-footer" class="block text-sm font-medium text-gray-700 mb-1">Footer Note</label>
                                    <input type="text" id="invoice-footer" value="${sanitizeHTML(state.settings.invoiceFooterNote || '')}" onchange="updateInvoiceSetting('invoiceFooterNote', this.value)" class="w-full">
                                </div>
                            </div>
                        </div>
                    </div>
                     <div class="border-t border-gray-200 pt-6">
                        <h3 class="text-lg font-medium mb-2">AI Integrations</h3>
                        <div>
                            <label for="ai-provider" class="block mb-1 text-sm font-medium text-gray-700">AI Provider</label>
                            <select id="ai-provider" class="w-full" onchange="updateAiProviderFields(this.value)">
                                <option value="gemini" ${state.settings.aiProvider === 'gemini' ? 'selected' : ''}>Google Gemini</option>
                                <option value="openai" ${state.settings.aiProvider === 'openai' ? 'selected' : ''}>OpenAI</option>
                                <option value="perplexity" ${state.settings.aiProvider === 'perplexity' ? 'selected' : ''}>Perplexity</option>
                                <option value="openrouter" ${state.settings.aiProvider === 'openrouter' ? 'selected' : ''}>OpenRouter</option>
                            </select>
                        </div>
                        <div class="mt-4 space-y-4 p-4 border rounded-lg bg-gray-50">
                            <div>
                                <label for="api-key" class="block text-sm font-medium text-gray-700">API Key</label>
                                <input type="password" id="api-key" class="w-full mt-1" placeholder="Enter API key for the selected provider">
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                                <div class="sm:col-span-2">
                                    <label for="api-model" class="block text-sm font-medium text-gray-700">Model Name</label>
                                    <select id="api-model" class="w-full mt-1"></select>
                                </div>
                                <div>
                                    <button type="button" onclick="fetchAiModels()" class="${btnSecondary} w-full">Fetch Models</button>
                                </div>
                            </div>
                            <p id="openrouter-note" class="text-xs text-gray-500 mt-2 hidden">Note: For OpenRouter, you also need to set an "HTTP Referer" in your OpenRouter account settings to the URL of this application.</p>
                        </div>
                         <div class="mt-4 p-3 bg-yellow-50 border border-yellow-300 text-yellow-800 rounded-md text-sm">
                            <strong class="font-bold">Security Warning:</strong> AI API keys are stored in your browser's local storage. This is not secure for production use. Anyone with access to your browser's developer tools can view them.
                        </div>
                    </div>
                    <div class="mt-4 text-right"><button type="submit" class="${btnPrimary}">Save Settings</button></div>
                </form>
            </div>
            <div class="border-t border-gray-200 pt-8">
                <h2 class="text-xl font-bold mb-4 text-gray-900">Data & Backup</h2>
                <div class="space-y-4">
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <label for="auto-backup" class="font-medium text-gray-700">Auto-Backup (every 30 mins)</label>
                        <input type="checkbox" id="auto-backup" onchange="toggleAutoBackup(this.checked)" ${state.settings.autoBackupEnabled ? 'checked' : ''} class="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300">
                    </div>
                    <div class="flex flex-col sm:flex-row gap-4">
                        <button onclick="triggerBackupDownload()" class="${btnGreen} w-full">Backup Now</button>
                        <label class="${btnSecondary} w-full cursor-pointer text-center">Import Backup<input type="file" id="import-backup" class="hidden" onchange="handleRestore(event)" accept=".json"></label>
                    </div>
                     <div class="mt-8 border-t border-red-300 pt-6">
                        <button onclick="confirmClearAllData()" class="${btnDanger} w-full">Clear All Data</button>
                        <p class="text-xs text-center text-gray-500 mt-2">This will permanently delete all students, bookings, and settings. This action cannot be undone.</p>
                    </div>
                </div>
            </div>
        </div>`;
    updateAiProviderFields(state.settings.aiProvider); // Set initial field values
    renderPackageList();
}

function updateAiProviderFields(provider) {
    document.getElementById('api-key').value = state.settings.apiKeys[provider] || '';

    const modelSelect = document.getElementById('api-model');
    const savedModel = state.settings.apiModels[provider] || '';

    // Clear the dropdown and show only the currently saved model.
    // This prompts the user to fetch the full list if they want to change it.
    modelSelect.innerHTML = ''; // Clear existing options safely
    if (savedModel) {
        // Use new Option() to prevent XSS from a crafted model ID in localStorage
        modelSelect.add(new Option(savedModel, savedModel));
    }
    modelSelect.value = savedModel;

    // Show special note only for OpenRouter
    const openRouterNote = document.getElementById('openrouter-note');
    if (openRouterNote) {
        openRouterNote.classList.toggle('hidden', provider !== 'openrouter');
    }
}


/******************************************************************************
 * SECTION 6: CALENDAR VIEW RENDERERS
 ******************************************************************************/

function renderCalendarContainer() {
    const container = document.getElementById('calendar-view');
    container.innerHTML = `
        <div class="bg-white rounded-lg shadow">
            <div id="calendar-header" class="p-4"></div>
            <div id="calendar-content"></div>
        </div>`;
    renderCalendarHeader();
}

function renderCalendarHeader() {
    const header = document.getElementById('calendar-header');
    let title = '';
    if (currentView === 'day') title = currentDate.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    else if (currentView === 'week') {
        const weekStart = new Date(currentDate);
        const firstDaySetting = state.settings.firstDayOfWeek || 'monday';
        let dayOfWeek;
        if (firstDaySetting === 'sunday') {
            dayOfWeek = weekStart.getDay(); // Sunday is 0
        } else {
            dayOfWeek = weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1; // Monday is 0
        }
        weekStart.setDate(weekStart.getDate() - dayOfWeek);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        title = `${weekStart.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else title = currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    const getBtnClass = (view) => currentView === view ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100';

    header.innerHTML = `
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-2">
                <button onclick="changeDate(currentView, -1)" class="p-2 rounded-md hover:bg-gray-100"><svg class="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg></button>
                <h2 class="text-xl font-semibold text-gray-800 text-center">${title}</h2>
                <button onclick="changeDate(currentView, 1)" class="p-2 rounded-md hover:bg-gray-100"><svg class="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg></button>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
                <div class="flex p-1 bg-gray-100 rounded-md">
                    <button onclick="showView('day')" class="px-3 py-1 text-sm rounded-md ${getBtnClass('day')}">Day</button>
                    <button onclick="showView('week')" class="px-3 py-1 text-sm rounded-md ${getBtnClass('week')}">Week</button>
                    <button onclick="showView('month')" class="px-3 py-1 text-sm rounded-md ${getBtnClass('month')}">Month</button>
                </div>
                <!-- FEATURE: Phase 2 - Google Calendar Integration -->
                <button id="google-calendar-sync" onclick="handleGoogleAuth()" class="${btnGreen}" title="Sync with Google Calendar">
                    🔄 Sync with Google Calendar
                </button>
                <button onclick="exportAllBookingsToCalendar()" class="${btnGreen}" title="Export all upcoming bookings to .ics file">
                    📅 Export to Calendar
                </button>
                <button onclick="openBlockDatesModal()" class="${btnDanger}">Block Dates</button>
            </div>
        </div>`;
}

function assignColumns(bookings) {
    if (bookings.length === 0) return [];

    const sortedBookings = [...bookings].sort((a, b) => a.startTime.localeCompare(b.startTime) || a.endTime.localeCompare(b.endTime));

    const columns = [];
    const bookingLayouts = [];

    for (const booking of sortedBookings) {
        let placed = false;
        for (let i = 0; i < columns.length; i++) {
            const lastBookingInColumn = columns[i][columns[i].length - 1];
            if (timeToMinutes(booking.startTime) >= timeToMinutes(lastBookingInColumn.endTime)) {
                columns[i].push(booking);
                booking.column = i;
                placed = true;
                break;
            }
        }
        if (!placed) {
            const newColIndex = columns.length;
            columns.push([booking]);
            booking.column = newColIndex;
        }
        bookingLayouts.push(booking);
    }

    for (const booking of bookingLayouts) {
        let maxColumns = 0;
        for (const other of bookingLayouts) {
            if (isTimeOverlapping(booking.startTime, booking.endTime, other.startTime, other.endTime)) {
                maxColumns = Math.max(maxColumns, other.column + 1);
            }
        }
        booking.maxColumns = maxColumns;
    }

    return bookingLayouts;
}

function renderDayView() {
    const container = document.getElementById('calendar-content');
    const dateString = toLocalDateString(currentDate);
    const bookings = state.bookings.filter(b => b.date === dateString && b.status !== 'Cancelled');
    const today = new Date(); today.setHours(0,0,0,0);
    const isPast = currentDate < today;
    let hourSlots = '';
    for (let i = CALENDAR_START_HOUR; i <= CALENDAR_END_HOUR; i++) {
        const hourStartTime = `${String(i).padStart(2, '0')}:00`;
        const hourEndTime = `${String(i + 1).padStart(2, '0')}:00`;
        const hasBooking = bookings.some(booking => isTimeOverlapping(booking.startTime, booking.endTime, hourStartTime, hourEndTime));
        const slotClass = hasBooking ? 'bg-blue-50' : '';
        hourSlots += `<div class="timeline-hour border-t border-gray-200 relative ${slotClass}" style="height: 60px;"><span class="absolute -top-2.5 left-2 text-xs text-gray-400 bg-white px-1">${String(i).padStart(2, '0')}:00</span></div>`;
    }

    const bookingLayouts = assignColumns(bookings);

    const bookingHtml = bookingLayouts.map(booking => {
        const startMinutes = timeToMinutes(booking.startTime);
        const endMinutes = timeToMinutes(booking.endTime);
        const top = ((startMinutes - (CALENDAR_START_HOUR * 60)) / 60) * 60;
        const height = ((endMinutes - startMinutes) / 60) * 60;

        const availableWidth = 85; // 100% - 15%
        const width = availableWidth / booking.maxColumns;
        const left = 15 + (booking.column * width);

        const customer = state.customers.find(c => c.id === booking.customerId);
        const service = state.services.find(s => s.id === booking.serviceId);
        const isMockTest = service && service.service_name.toLowerCase().includes('mock test');
        const bookingClass = `timeline-booking ${isMockTest ? 'mock-test' : ''}`;
        const bookingTitle = service ? `${service.service_name}: ${customer ? customer.name : 'Unknown'}` : (customer ? customer.name : 'Unknown');
        return `<div draggable="true" ondragstart="handleDragStart(event, '${booking.id}')" onclick="openBookingModal('${dateString}', '${booking.id}')" class="${bookingClass}" style="position: absolute; left: ${left}%; width: ${width}%; top: ${top}px; height: ${height}px; z-index: ${10 + booking.column}; box-sizing: border-box; padding: 2px 4px;"><p class="font-semibold text-sm">${sanitizeHTML(bookingTitle)}</p><p class="text-xs">${booking.startTime}-${booking.endTime}</p></div>`;
    }).join('');

    container.innerHTML = `<div id="day-timeline" ondragover="allowDrop(event)" ondrop="drop(event, '${dateString}')" ondragenter="handleDragEnter(event)" ondragleave="handleDragLeave(event)" class="relative overflow-y-auto no-scrollbar border-t border-gray-200" style="height: 600px;" ${!isPast ? 'onmousedown="startDrag(event)"' : ''}><div class="ml-16">${hourSlots}</div><div class="absolute top-0 left-0 right-0 bottom-0">${bookingHtml}<div id="selection-box" class="hidden"></div></div></div>`;
    selectionBox = document.getElementById('selection-box');
}

function renderWeekView() {
    const container = document.getElementById('calendar-content');
    const weekStart = new Date(currentDate);
    const firstDaySetting = state.settings.firstDayOfWeek || 'monday';

    let dayOfWeek;
    if (firstDaySetting === 'sunday') {
        dayOfWeek = weekStart.getDay();
    } else {
        dayOfWeek = weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1;
    }
    weekStart.setDate(weekStart.getDate() - dayOfWeek);

    const today = new Date(); today.setHours(0,0,0,0);
    let weekHtml = '<div class="grid grid-cols-7 calendar-grid">';
    const dayNames = firstDaySetting === 'sunday'
        ? ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
        : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    weekHtml += dayNames.map(name => `<div class="text-center p-2 text-sm font-semibold text-gray-500">${name}</div>`).join('');
    for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart); day.setDate(day.getDate() + i);
        const dateString = toLocalDateString(day);
        const isPast = day < today;
        const isToday = day.toDateString() === today.toDateString();
        const blockedPeriods = getBlockedPeriodsForDate(day);
    const isSchoolHoliday = blockedPeriods.some(p => p.staffId === 'all' && p.reason);
        const staffLeaves = blockedPeriods.filter(p => p.staffId !== 'all');

        const dayBookings = state.bookings.filter(b => b.date === dateString && b.status !== 'Cancelled').sort((a, b) => a.startTime.localeCompare(b.startTime));

        let cellClass = 'calendar-cell';
        let cellAttrs = '';
        if (isPast) cellClass += ' past-day';
        else if (isSchoolHoliday) cellClass += ' blocked-date';
        else if (staffLeaves.length > 0) cellClass += ' instructor-leave-date';

        let clickHandler = '';
        if (!isPast) {
            cellAttrs = 'role="button" tabindex="0"';
            if (isSchoolHoliday || staffLeaves.length > 0) {
                clickHandler = `openDaySummaryModal('${dateString}')`;
            } else if (dayBookings.length > 0) {
                clickHandler = `openDaySummaryModal('${dateString}')`;
            } else {
                clickHandler = `openBookingModal('${dateString}')`;
            }
        }

        const bookingItems = dayBookings.map(b => {
            const customer = state.customers.find(c => c.id === b.customerId);
            const service = state.services.find(s => s.id === b.serviceId);
            const isMockTest = service && service.service_name.toLowerCase().includes('mock test');
            const bookingClass = isMockTest ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' : 'bg-blue-100 text-blue-800 hover:bg-blue-200';
            const bookingTitle = service ? `${service.service_name.split(' ')[0]}: ${customer ? customer.name.split(' ')[0] : '...'}` : (customer ? customer.name : 'Unknown');
            return `<div draggable="true" ondragstart="handleDragStart(event, '${b.id}')" onclick="event.stopPropagation(); openBookingModal('${dateString}', '${b.id}')" class="p-1 my-1 rounded-md ${bookingClass} cursor-pointer"><p class="truncate text-xs font-medium">${sanitizeHTML(bookingTitle)}</p><p class="text-xs">${b.startTime}</p></div>`;
        }).join('');

        let blockedContent = '';
        if(isSchoolHoliday) {
            blockedContent = `<p class="text-xs mt-1 truncate font-semibold">${sanitizeHTML(blockedPeriods.find(p => p.staffId === 'all' && p.reason).reason)}</p>`;
        } else if (staffLeaves.length > 0) {
            blockedContent = staffLeaves.map(leave => {
                const staffMember = state.staff.find(s => s.id === leave.staffId);
                return `<div class="text-xs mt-1 truncate font-semibold">${sanitizeHTML(staffMember ? staffMember.name.split(' ')[0] : 'Staff')} on leave</div>`;
            }).join('');
        }

        const dropHandlers = isPast ? '' : `ondragover="allowDrop(event)" ondrop="drop(event, '${dateString}')" ondragenter="handleDragEnter(event)" ondragleave="handleDragLeave(event)"`;
        weekHtml += `<div class="${cellClass}" ${clickHandler ? `onclick="${clickHandler}"` : ''} ${cellAttrs} ${dropHandlers}><div class="flex justify-between items-center"><span class="day-number ${isToday ? 'is-today' : ''}">${day.getDate()}</span>${!isPast && !isSchoolHoliday && dayBookings.length === 0 ? `<button onclick="event.stopPropagation(); openBookingModal('${dateString}');" class="text-gray-400 hover:text-indigo-600 text-xl">+</button>` : ''}</div><div class="mt-1 space-y-1">${blockedContent}${bookingItems}</div></div>`;
    }
    weekHtml += '</div>';
    container.innerHTML = weekHtml;
}

function renderMonthView() {
    const container = document.getElementById('calendar-content');
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const firstDaySetting = state.settings.firstDayOfWeek || 'monday';

    let startDay;
    if (firstDaySetting === 'sunday') {
        startDay = firstDayOfMonth.getDay();
    } else {
        startDay = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1;
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date(); today.setHours(0,0,0,0);
    const dayNames = firstDaySetting === 'sunday'
        ? ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
        : ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    let gridHtml = `<div class="grid grid-cols-7 text-center text-sm font-semibold text-gray-500 mb-2">${dayNames.map(name => `<div>${name}</div>`).join('')}</div><div class="grid grid-cols-7 calendar-grid">`;
    for (let i = 0; i < startDay; i++) gridHtml += `<div class="calendar-cell bg-gray-50"></div>`;
    for (let i = 1; i <= daysInMonth; i++) {
        const dayDate = new Date(year, month, i);
        const isPast = dayDate < today;
        const dateString = toLocalDateString(dayDate);
        const dayBookings = state.bookings.filter(b => b.date === dateString && b.status !== 'Cancelled');
        const isToday = dayDate.toDateString() === today.toDateString();
        const blockedPeriods = getBlockedPeriodsForDate(dayDate) || [];
        const isSchoolHoliday = blockedPeriods.some(p => p.staffId === 'all');
        const staffLeaves = blockedPeriods.filter(p => p.staffId !== 'all');

        let cellClass = 'calendar-cell';
        let cellAttrs = '';
        if (isPast) cellClass += ' past-day';
        else if (isSchoolHoliday) cellClass += ' blocked-date-clickable';
        else if (staffLeaves.length > 0) cellClass += ' instructor-leave-date';
        else if (dayBookings.length > 0) cellClass += ' booked-day';

        let clickHandler = '';
        if (!isPast) {
            clickHandler = `openDaySummaryModal('${dateString}')`;
            cellAttrs = 'role="button" tabindex="0"';
        }

        let content = `<span class="day-number ${isToday ? 'is-today' : ''}">${i}</span>`;
        if (isSchoolHoliday) content += `<div class="text-xs mt-1 truncate font-semibold">${sanitizeHTML((blockedPeriods.find(p => p.staffId === 'all') || {}).reason || 'Blocked')}</div>`;
        else if (staffLeaves.length > 0) content += `<div class="mt-1 text-xs text-purple-700">${staffLeaves.length} staff ${staffLeaves.length > 1 ? 'members' : 'member'} on leave</div>`;
        else if (dayBookings.length > 0) {
            let bookingContent = `<div class="mt-1 text-xs text-blue-600">${dayBookings.length} booking${dayBookings.length > 1 ? 's' : ''}</div>`;
            content += bookingContent;
        }

        const dropHandlers = isPast ? '' : `ondragover="allowDrop(event)" ondrop="drop(event, '${dateString}')" ondragenter="handleDragEnter(event)" ondragleave="handleDragLeave(event)"`;
        gridHtml += `<div class="${cellClass}" ${clickHandler ? `onclick="${clickHandler}"` : ''} ${cellAttrs} ${dropHandlers}>${content}</div>`;
    }
    gridHtml += `</div>`;
    container.innerHTML = gridHtml;
}


/******************************************************************************
 * SECTION 7: REPORTING & BILLING RENDERERS
 ******************************************************************************/

function renderSummaryView() {
    const container = document.getElementById('summary-view');

    // FEATURE: Calculate Dashboard Widgets (Phase 1 Improvement)
    const todayStr = toLocalDateString(new Date());
    const todayBookings = state.bookings.filter(b => b.date === todayStr && b.status === 'Completed');
    const todayEarnings = todayBookings.reduce((sum, b) => {
        const service = state.services.find(s => s.id === b.serviceId);
        return sum + (service?.base_price || 0);
    }, 0);

    // This week's bookings
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const thisWeekBookings = state.bookings.filter(b => {
        const bookingDate = parseYYYYMMDD(b.date);
        return bookingDate >= weekStart && bookingDate <= weekEnd;
    }).length;

    // Outstanding payments
    const outstandingBookings = state.bookings.filter(b =>
        (b.status === 'Completed' || b.status === 'Scheduled') &&
        b.paymentStatus === 'Unpaid'
    );
    const outstandingTotal = outstandingBookings.reduce((sum, b) => {
        const service = state.services.find(s => s.id === b.serviceId);
        return sum + (service?.base_price || 0);
    }, 0);

    // Vehicle maintenance due soon (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const vehiclesMaintenanceDue = state.resources.filter(r => {
        if (r.resource_type !== 'VEHICLE' || !r.compliance) return false;
        const motDate = parseYYYYMMDD(r.compliance.mot_expiry);
        const insuranceDate = parseYYYYMMDD(r.compliance.insurance_expiry);
        return (motDate && motDate <= thirtyDaysFromNow) || (insuranceDate && insuranceDate <= thirtyDaysFromNow);
    });

    // Monthly revenue (current month)
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthStart.getMonth() + 1);
    const monthlyBookings = state.bookings.filter(b => {
        const bookingDate = parseYYYYMMDD(b.date);
        return bookingDate >= monthStart && bookingDate < monthEnd && b.status === 'Completed';
    });
    const monthlyRevenue = monthlyBookings.reduce((sum, b) => {
        const service = state.services.find(s => s.id === b.serviceId);
        return sum + (service?.base_price || 0);
    }, 0);

    // Top 3 customers this month (by booking count)
    const customerBookingCounts = {};
    monthlyBookings.forEach(b => {
        customerBookingCounts[b.customerId] = (customerBookingCounts[b.customerId] || 0) + 1;
    });
    const topCustomers = Object.entries(customerBookingCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([customerId, count]) => {
            const customer = state.customers.find(c => c.id === customerId);
            return { name: customer?.name || 'Unknown', count };
        });

    container.innerHTML = `
        <!-- FEATURE: Dashboard Widgets (Phase 1 Improvement) -->
        <div class="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Today's Earnings -->
            <div class="bg-gradient-to-br from-green-400 to-green-600 rounded-lg shadow-lg p-4 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm opacity-90">Today's Earnings</p>
                        <p class="text-3xl font-bold mt-1">€${todayEarnings.toFixed(2)}</p>
                        <p class="text-xs mt-1 opacity-75">${todayBookings.length} completed</p>
                    </div>
                    <div class="text-5xl opacity-20">💰</div>
                </div>
            </div>

            <!-- This Week's Bookings -->
            <div class="bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow-lg p-4 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm opacity-90">This Week</p>
                        <p class="text-3xl font-bold mt-1">${thisWeekBookings}</p>
                        <p class="text-xs mt-1 opacity-75">bookings</p>
                    </div>
                    <div class="text-5xl opacity-20">📅</div>
                </div>
            </div>

            <!-- Outstanding Payments -->
            <div class="bg-gradient-to-br from-${outstandingTotal > 0 ? 'orange-400 to-orange-600' : 'gray-400 to-gray-600'} rounded-lg shadow-lg p-4 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm opacity-90">Outstanding</p>
                        <p class="text-3xl font-bold mt-1">€${outstandingTotal.toFixed(2)}</p>
                        <p class="text-xs mt-1 opacity-75">${outstandingBookings.length} unpaid</p>
                    </div>
                    <div class="text-5xl opacity-20">⚠️</div>
                </div>
            </div>

            <!-- Monthly Revenue -->
            <div class="bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg shadow-lg p-4 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm opacity-90">This Month</p>
                        <p class="text-3xl font-bold mt-1">€${monthlyRevenue.toFixed(2)}</p>
                        <p class="text-xs mt-1 opacity-75">${monthlyBookings.length} lessons</p>
                    </div>
                    <div class="text-5xl opacity-20">📈</div>
                </div>
            </div>
        </div>

        <!-- Additional Info Widgets -->
        <div class="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Vehicle Maintenance Alert -->
            ${vehiclesMaintenanceDue.length > 0 ? `
                <div class="bg-red-50 border-l-4 border-red-500 rounded-lg shadow p-4">
                    <div class="flex items-start">
                        <div class="text-2xl mr-3">🚗</div>
                        <div class="flex-1">
                            <h3 class="font-semibold text-red-800 mb-1">Vehicle Maintenance Due Soon</h3>
                            <ul class="text-sm text-red-700 space-y-1">
                                ${vehiclesMaintenanceDue.map(v => `<li>• ${sanitizeHTML(v.resource_name)}</li>`).join('')}
                            </ul>
                            <button onclick="showView('resources')" class="mt-2 text-xs underline text-red-800">View Resources →</button>
                        </div>
                    </div>
                </div>
            ` : `
                <div class="bg-green-50 border-l-4 border-green-500 rounded-lg shadow p-4">
                    <div class="flex items-start">
                        <div class="text-2xl mr-3">✅</div>
                        <div>
                            <h3 class="font-semibold text-green-800">All Vehicles Compliant</h3>
                            <p class="text-sm text-green-700 mt-1">No maintenance due in next 30 days</p>
                        </div>
                    </div>
                </div>
            `}

            <!-- Top Customers This Month -->
            <div class="bg-blue-50 border-l-4 border-blue-500 rounded-lg shadow p-4">
                <div class="flex items-start">
                    <div class="text-2xl mr-3">⭐</div>
                    <div class="flex-1">
                        <h3 class="font-semibold text-blue-800 mb-2">Top Customers This Month</h3>
                        ${topCustomers.length > 0 ? `
                            <ul class="text-sm text-blue-700 space-y-1">
                                ${topCustomers.map((c, i) => `<li>${i + 1}. ${sanitizeHTML(c.name)} (${c.count} bookings)</li>`).join('')}
                            </ul>
                        ` : `
                            <p class="text-sm text-blue-700">No bookings this month yet</p>
                        `}
                    </div>
                </div>
            </div>
        </div>

        <!-- FEATURE: Phase 3 - Income Analytics Dashboard -->
        <div class="mb-6">
            <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
                <svg class="h-6 w-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path>
                </svg>
                Income & Business Analytics
            </h2>
            ${renderIncomeAnalyticsDashboard()}
        </div>

        <div class="bg-white rounded-lg shadow p-4 sm:p-6">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold">Booking Summary</h2>
                <div class="flex gap-2">
                    <button id="analyze-summary-btn" onclick="handleAnalyzeSummary()" class="${btnPurple}">✨ Analyze Summary</button>
                    <button onclick="exportSummaryToExcel()" class="${btnGreen}">Export to Excel</button>
                </div>
            </div>
            <div id="summary-filters" class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                    <label for="summary-start-date" class="block text-sm font-medium text-gray-700">Start Date</label>
                    <input type="date" id="summary-start-date" onchange="renderSummaryList()" class="mt-1 block w-full">
                </div>
                <div>
                    <label for="summary-end-date" class="block text-sm font-medium text-gray-700">End Date</label>
                    <input type="date" id="summary-end-date" onchange="renderSummaryList()" class="mt-1 block w-full">
                </div>
                <div>
                    <label for="summary-customer" class="block text-sm font-medium text-gray-700">Customer</label>
                    <select id="summary-customer" onchange="renderSummaryList()" class="mt-1 block w-full"></select>
                </div>
                <div>
                    <label for="summary-staff" class="block text-sm font-medium text-gray-700">Staff</label>
                    <select id="summary-staff" onchange="renderSummaryList()" class="mt-1 block w-full"></select>
                </div>
                <div>
                    <label for="summary-resource" class="block text-sm font-medium text-gray-700">Resource</label>
                    <select id="summary-resource" onchange="renderSummaryList()" class="mt-1 block w-full"></select>
                </div>
            </div>
            <!-- AI Analysis Container -->
            <div id="summary-analysis-container" class="hidden mb-6">
                <h3 class="text-lg font-semibold text-gray-800 mb-2">AI Activity Summary</h3>
                <div id="summary-analysis-output" class="ai-summary-container whitespace-pre-wrap"></div>
            </div>
            <div id="summary-list-container"></div>
        </div>
    `;

    populateSelect('summary-customer', state.customers, true);
    populateSelect('summary-staff', state.staff, true);
    populateSelect('summary-resource', state.resources, true, 'resource_name');
    renderSummaryList();
}

async function handleAnalyzeSummary() {
    const analysisContainer = document.getElementById('summary-analysis-container');
    const outputDiv = document.getElementById('summary-analysis-output');
    const analyzeBtn = document.getElementById('analyze-summary-btn');

    const bookings = getFilteredSummaryBookings();
    if (bookings.length === 0) {
        showToast("No data to analyze.");
        return;
    }

    const summaryData = bookings.map(b => {
        const customer = state.customers.find(c => c.id === b.customerId)?.name || 'N/A';
        const staff = state.staff.find(s => s.id === b.staffId)?.name || 'N/A';
        const service = state.services.find(s => s.id === b.serviceId)?.service_name || 'N/A';
        return { date: b.date, time: b.startTime, customer, staff, service };
    });

    const prompt = `
        As a business analyst for a driving school, analyze the following booking summary data.
        Provide a concise overview of the activity. Highlight key trends, such as the busiest days, most active customers or staff, and most popular services based on the filtered data.
        Keep the tone professional and helpful.

        Here is the summary data:
        ${JSON.stringify(summaryData)}
    `;

    runAiAnalysis(analyzeBtn, analysisContainer, outputDiv, prompt, {
        initialText: '✨ Analyze Summary',
        loadingText: 'Analyzing...'
    });
}

function renderSummaryList() {
    const container = document.getElementById('summary-list-container');
    const bookings = getFilteredSummaryBookings();

    if (bookings.length === 0) {
        container.innerHTML = `<p class="text-center py-8 text-gray-500">No bookings found for the selected filters.</p>`;
        return;
    }

    const listHtml = bookings.map(booking => {
        const customer = state.customers.find(c => c.id === booking.customerId)?.name || 'N/A';
        const staff = state.staff.find(s => s.id === booking.staffId)?.name || 'N/A';
        const resource = booking.resourceIds && booking.resourceIds.length > 0 ? state.resources.find(r => r.id === booking.resourceIds[0])?.resource_name : 'N/A';
        const service = state.services.find(s => s.id === booking.serviceId)?.service_name || 'N/A';
        const date = safeDateFormat(booking.date, { day: '2-digit', month: 'short', year: 'numeric' });
        return `
            <div class="p-3 border-b border-gray-200 grid grid-cols-6 gap-4 items-center">
                <p class="font-semibold">${date}</p>
                <p>${booking.startTime} - ${booking.endTime}</p>
                <p>${sanitizeHTML(customer)}</p>
                <p>${sanitizeHTML(staff)}</p>
                <p>${sanitizeHTML(resource)}</p>
                <p>${sanitizeHTML(service)}</p>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="font-semibold text-sm text-gray-600 p-3 bg-gray-50 grid grid-cols-6 gap-4">
            <p>Date</p>
            <p>Time</p>
            <p>Customer</p>
            <p>Staff</p>
            <p>Resource</p>
            <p>Service</p>
        </div>
        <div class="border border-gray-200 rounded-b-lg">${listHtml}</div>
    `;
}

function renderBillingView() {
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

// OPTIMIZED: Memoized for faster billing calculations
const getCustomerSummaries = memoize(function() {
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

function renderBillingContent() {
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

function renderDetailedBillingBreakdown(customerId) {
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

function updateBulkPaymentTotal() {
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

function recordBulkPayment(customerId) {
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

function clearSelectedCustomer() {
    selectedBillingCustomerId = null;
    renderBillingContent();
}

function handleBillingCustomerChange(customerId) {
    selectedBillingCustomerId = customerId;
    billingCurrentPage = 1; // Reset page when changing customer focus
    renderBillingContent();
}

function handleBillingPageChange(page) {
    const customerSummaries = getCustomerSummaries();
    const totalPages = Math.ceil(customerSummaries.length / BILLING_ITEMS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    billingCurrentPage = page;
    renderBillingContent();
}

function renderReportsView() {
    const container = document.getElementById('reports-view');
    container.innerHTML = `
        <div class="reports-container">
            <!-- Header Section -->
            <div class="reports-header">
                <div class="reports-header-content">
                    <h1 class="reports-title">Business Reports</h1>
                    <p class="reports-subtitle">Real-time insights into your business performance</p>
                </div>
                <div class="reports-actions">
                    <button id="analyze-reports-btn" onclick="handleAnalyzeReports()" class="${btnPurple}">✨ Analyze Reports</button>
                    <button onclick="exportReportsToExcel()" class="${btnGreen}">📊 Export to Excel</button>
                </div>
            </div>

            <!-- Filter & Date Range Section -->
            <div class="reports-filters">
                <div class="filter-group">
                    <label for="report-date-range">Date Range:</label>
                    <select id="report-date-range" onchange="handleDateRangeChange()" class="filter-select">
                        <option value="all">All Time</option>
                        <option value="this-month">This Month</option>
                        <option value="last-month">Last Month</option>
                        <option value="last-3-months">Last 3 Months</option>
                        <option value="last-6-months">Last 6 Months</option>
                        <option value="this-year">This Year</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="report-department">Department:</label>
                    <select id="report-department" onchange="handleDepartmentChange()" class="filter-select">
                        <option value="all">All Departments</option>
                        <option value="driving-lessons">Driving Lessons</option>
                        <option value="tours">Tours</option>
                    </select>
                </div>
            </div>

            <!-- AI Analysis Container -->
            <div id="reports-analysis-container" class="hidden reports-analysis-box">
                <div class="analysis-header">
                    <h3 class="analysis-title">🤖 AI Business Overview</h3>
                    <button onclick="toggleAnalysis()" class="toggle-btn">−</button>
                </div>
                <div id="reports-analysis-output" class="analysis-content whitespace-pre-wrap"></div>
            </div>

            <!-- KPI Summary Cards -->
            <div class="kpi-grid">
                <div class="kpi-card kpi-revenue">
                    <div class="kpi-icon">💰</div>
                    <div class="kpi-content">
                        <p class="kpi-label">Total Revenue</p>
                        <p id="kpi-revenue" class="kpi-value">€0.00</p>
                        <p id="kpi-revenue-trend" class="kpi-trend">↑ 0%</p>
                    </div>
                </div>
                <div class="kpi-card kpi-expenses">
                    <div class="kpi-icon">💸</div>
                    <div class="kpi-content">
                        <p class="kpi-label">Total Expenses</p>
                        <p id="kpi-expenses" class="kpi-value">€0.00</p>
                        <p id="kpi-expenses-trend" class="kpi-trend">↓ 0%</p>
                    </div>
                </div>
                <div class="kpi-card kpi-profit">
                    <div class="kpi-icon">📈</div>
                    <div class="kpi-content">
                        <p class="kpi-label">Net Profit</p>
                        <p id="kpi-profit" class="kpi-value">€0.00</p>
                        <p id="kpi-profit-trend" class="kpi-trend">↑ 0%</p>
                    </div>
                </div>
                <div class="kpi-card kpi-bookings">
                    <div class="kpi-icon">📅</div>
                    <div class="kpi-content">
                        <p class="kpi-label">Total Bookings</p>
                        <p id="kpi-bookings" class="kpi-value">0</p>
                        <p id="kpi-bookings-trend" class="kpi-trend">↑ 0%</p>
                    </div>
                </div>
            </div>

            <!-- Outstanding Payments Alert -->
            <div id="overdue-payments-report"></div>

            <!-- Charts Grid (3 columns on desktop, 1 on mobile) -->
            <div class="charts-grid">
                <!-- Income vs Expenses (Full Width) -->
                <div class="chart-card chart-full-width">
                    <div class="chart-header">
                        <h3 class="chart-title">Income vs. Expenses</h3>
                        <span class="chart-info">Monthly comparison</span>
                    </div>
                    <div class="chart-container">
                        <canvas id="incomeExpenseChart"></canvas>
                    </div>
                </div>

                <!-- Service Popularity -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h3 class="chart-title">Service Popularity</h3>
                        <span class="chart-info">Distribution</span>
                    </div>
                    <div class="chart-container small">
                        <canvas id="servicePopularityChart"></canvas>
                    </div>
                </div>

                <!-- Top Customers -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h3 class="chart-title">Top 5 Customers</h3>
                        <span class="chart-info">By booking count</span>
                    </div>
                    <div class="chart-container">
                        <canvas id="topCustomersChart"></canvas>
                    </div>
                </div>

                <!-- Staff Performance -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h3 class="chart-title">Staff Performance</h3>
                        <span class="chart-info">Bookings handled</span>
                    </div>
                    <div class="chart-container">
                        <canvas id="staffPerformanceChart"></canvas>
                    </div>
                </div>

                <!-- Lesson & Package Popularity -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h3 class="chart-title">Lessons & Packages</h3>
                        <span class="chart-info">Popularity ranking</span>
                    </div>
                    <div class="chart-container">
                        <canvas id="lessonPackagePopularityChart"></canvas>
                    </div>
                </div>

                <!-- Resource Utilisation -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h3 class="chart-title">Resource Utilization</h3>
                        <span class="chart-info">Equipment usage</span>
                    </div>
                    <div class="chart-container">
                        <canvas id="resourceUtilisationChart"></canvas>
                    </div>
                </div>

                <!-- Staff Activity (Full Width) -->
                <div class="chart-card chart-full-width">
                    <div class="chart-header">
                        <h3 class="chart-title">Staff Activity Overview</h3>
                        <span class="chart-info">Hours and time off</span>
                    </div>
                    <div id="staff-stats-container" class="staff-stats-grid"></div>
                </div>

                <!-- Peak Booking Hours (Full Width) -->
                <div class="chart-card chart-full-width">
                    <div class="chart-header">
                        <h3 class="chart-title">Peak Booking Hours</h3>
                        <span class="chart-info">Daily booking distribution</span>
                    </div>
                    <div class="chart-container">
                        <canvas id="peakBookingHoursChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;
    generateOverdueReport();
    generateCharts();
    updateKPICards();
}


/******************************************************************************
 * SECTION 8: CRUD OPERATIONS & ENTITY LOGIC
 ******************************************************************************/

function findBookingConflict(bookingDetails) {
    const { id, date, startTime, endTime, customerId, staffId, resourceIds } = bookingDetails;

    // Check for staff conflicts
    const staffConflict = state.bookings.find(b =>
        b.id !== id &&
        b.status !== 'Cancelled' &&
        b.date === date &&
        b.staffId === staffId &&
        isTimeOverlapping(startTime, endTime, b.startTime, b.endTime)
    );
    if (staffConflict) {
        return `The selected staff member is already booked from ${staffConflict.startTime} to ${staffConflict.endTime}.`;
    }

    // Check for customer conflicts
    const customerConflict = state.bookings.find(b =>
        b.id !== id &&
        b.status !== 'Cancelled' &&
        b.date === date &&
        b.customerId === customerId &&
        isTimeOverlapping(startTime, endTime, b.startTime, b.endTime)
    );
    if (customerConflict) {
        return `This customer is already booked from ${customerConflict.startTime} to ${customerConflict.endTime}.`;
    }

    // Check for resource conflicts
    if (resourceIds && resourceIds.length > 0) {
        const resourceConflict = state.bookings.find(b =>
            b.id !== id &&
            b.status !== 'Cancelled' &&
            b.date === date &&
            b.resourceIds && b.resourceIds.some(r => resourceIds.includes(r)) &&
            isTimeOverlapping(startTime, endTime, b.startTime, b.endTime)
        );
        if (resourceConflict) {
            const resourceName = state.resources.find(res => res.id === resourceIds[0])?.resource_name || 'The resource';
            return `${resourceName} is already booked from ${resourceConflict.startTime} to ${resourceConflict.endTime}.`;
        }
    }

    // Check for staff leave
    const blockedPeriods = getBlockedPeriodsForDate(parseYYYYMMDD(date));
    if (blockedPeriods.some(p => p.staffId === staffId || p.staffId === 'all')) {
        return 'The selected staff member is on leave on this date.';
    }

    return null; // No conflicts found
}

// Helper function to check for adjacent bookings (back-to-back without buffer)
function checkAdjacentBookings(bookingDetails) {
    const { id, date, startTime, endTime, staffId } = bookingDetails;
    const BUFFER_MINUTES = 15; // Recommended break time between lessons

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    // Find bookings immediately before or after this one
    const adjacentBookings = state.bookings.filter(b =>
        b.id !== id &&
        b.status !== 'Cancelled' &&
        b.date === date &&
        b.staffId === staffId
    );

    const warnings = [];

    adjacentBookings.forEach(b => {
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);

        // Check if booking ends exactly when another starts (no break)
        if (endMinutes === bStart || startMinutes === bEnd) {
            warnings.push(`Back-to-back booking detected: No break between ${b.startTime}-${b.endTime}. Consider adding ${BUFFER_MINUTES} min buffer.`);
        }

        // Check if there's a very short break (less than recommended buffer)
        if (endMinutes < bStart && bStart - endMinutes < BUFFER_MINUTES) {
            warnings.push(`Short break detected: Only ${bStart - endMinutes} minutes before next booking at ${b.startTime}.`);
        }
        if (bEnd < startMinutes && startMinutes - bEnd < BUFFER_MINUTES) {
            warnings.push(`Short break detected: Only ${startMinutes - bEnd} minutes after previous booking ending at ${b.endTime}.`);
        }
    });

    return warnings;
}

// FEATURE: Recurring Bookings Helper Functions (Phase 1 Improvement)
function toggleRecurringOptions() {
    const checkbox = document.getElementById('booking-recurring');
    const options = document.getElementById('recurring-options');
    const preview = document.getElementById('recurring-preview');

    if (checkbox.checked) {
        options.classList.remove('hidden');
        preview.classList.remove('hidden');
        updateRecurringPreview();
    } else {
        options.classList.add('hidden');
        preview.classList.add('hidden');
    }
}

function updateRecurringPreview() {
    const date = document.getElementById('booking-date').value;
    const type = document.getElementById('recurring-type').value;
    const count = parseInt(document.getElementById('recurring-count').value) || 1;
    const until = document.getElementById('recurring-until').value;

    if (!date) {
        document.getElementById('recurring-preview').textContent = 'Please select a booking date first';
        return;
    }

    const dates = generateRecurringDates(date, type, count, until);
    const preview = `Will create ${dates.length} bookings: ${dates.slice(0, 3).join(', ')}${dates.length > 3 ? '...' : ''}`;
    document.getElementById('recurring-preview').textContent = preview;
}

function generateRecurringDates(startDate, type, count, untilDate) {
    const dates = [startDate];
    let currentDate = parseYYYYMMDD(startDate);
    const maxDate = untilDate ? parseYYYYMMDD(untilDate) : null;

    let increment = 7; // Default to weekly
    if (type === 'daily') increment = 1;
    if (type === 'biweekly') increment = 14;

    let generatedCount = 1;
    while (generatedCount < count) {
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + increment);

        // Stop if we've reached the until date
        if (maxDate && currentDate > maxDate) break;

        dates.push(toLocalDateString(currentDate));
        generatedCount++;
    }

    return dates;
}

async function saveBooking(event) {
    event.preventDefault();

    let bookingId = document.getElementById('booking-id').value;
    const isNewBooking = !bookingId;

    // If Google Calendar integration is enabled, check for conflicts first
    if (state.settings.googleCalendarEnabled && 
        state.settings.googleCalendarAutoSync && 
        gapi.auth2?.getAuthInstance()?.isSignedIn.get()) {
        
        const date = document.getElementById('booking-date').value;
        const startTime = document.getElementById('booking-start-time').value;
        const endTime = document.getElementById('booking-end-time').value;
        
        try {
            const conflicts = await checkGoogleCalendarConflicts(date, startTime, endTime);
            if (conflicts.length > 0) {
                const conflictDetails = conflicts.map(c => `${c.title} at ${c.time}`).join('\n');
                const proceed = await new Promise(resolve => {
                    showDialog({
                        title: 'Google Calendar Conflicts',
                        message: `Warning: Found conflicts with existing Google Calendar events:\n${conflictDetails}\n\nDo you want to proceed anyway?`,
                        buttons: [
                            { text: 'Cancel', class: btnSecondary, onClick: () => resolve(false) },
                            { text: 'Save Anyway', class: btnPrimary, onClick: () => resolve(true) }
                        ]
                    });
                });
                
                if (!proceed) return;
            }
        } catch (error) {
            console.error('Failed to check Google Calendar conflicts:', error);
            // Continue with saving even if conflict check fails
        }
    }

    // FEATURE: Handle Recurring Bookings (Phase 1 Improvement)
    const isRecurring = document.getElementById('booking-recurring').checked;
    if (isRecurring && isNewBooking) {
        // Handle recurring booking creation
        const recurringType = document.getElementById('recurring-type').value;
        const recurringCount = parseInt(document.getElementById('recurring-count').value) || 1;
        const recurringUntil = document.getElementById('recurring-until').value;
        const startDate = document.getElementById('booking-date').value;

        const dates = generateRecurringDates(startDate, recurringType, recurringCount, recurringUntil);

        // Validate all dates first for conflicts
        const startTime = document.getElementById('booking-start-time').value;
        const endTime = document.getElementById('booking-end-time').value;
        const customerId = document.getElementById('booking-customer').value;
        const staffId = document.getElementById('booking-staff').value;
        const resourceId = document.getElementById('booking-resource').value;

        const conflicts = [];
        dates.forEach(date => {
            const conflict = findBookingConflict({
                id: null, date, startTime, endTime, customerId, staffId,
                resourceIds: resourceId ? [resourceId] : []
            });
            if (conflict) {
                conflicts.push({ date, conflict });
            }
        });

        if (conflicts.length > 0) {
            const conflictList = conflicts.slice(0, 3).map(c => `${c.date}: ${c.conflict}`).join('\n');
            showDialog({
                title: 'Recurring Booking Conflicts',
                message: `Found ${conflicts.length} conflict(s):\n\n${conflictList}${conflicts.length > 3 ? '\n...' : ''}\n\nPlease resolve conflicts and try again.`,
                buttons: [{ text: 'OK', class: btnPrimary }]
            });
            return;
        }

        // Create all bookings
        const createdBookings = [];
        dates.forEach(date => {
            const newBookingId = `booking_${generateUUID()}`;
            const serviceId = document.getElementById('booking-service').value;
            const fee = calculateBookingFee(serviceId);

            const bookingData = {
                id: newBookingId,
                date: date,
                startTime: startTime,
                endTime: endTime,
                customerId: customerId,
                staffId: staffId,
                resourceIds: resourceId ? [resourceId] : [],
                serviceId: serviceId,
                fee: fee,
                status: document.getElementById('booking-status').value || 'Scheduled',
                paymentStatus: document.getElementById('booking-payment-status').value || 'Unpaid',
                pickup: document.getElementById('booking-pickup').value,
                transactionId: null,
                recurringGroup: dates[0] // Track which recurring group this belongs to
            };

            state.bookings.push(bookingData);
            createdBookings.push(bookingData);
        });

        saveState();
        closeBookingModal();
        refreshCurrentView();
        showToast(`Created ${createdBookings.length} recurring bookings successfully!`);
        return;
    }

    if (isNewBooking) {
        bookingId = `booking_${generateUUID()}`;
    }

    const date = document.getElementById('booking-date').value;
    const startTime = document.getElementById('booking-start-time').value;
    const endTime = document.getElementById('booking-end-time').value;
    const customerId = document.getElementById('booking-customer').value;
    const staffId = document.getElementById('booking-staff').value;
    const resourceId = document.getElementById('booking-resource').value;
    const serviceId = document.getElementById('booking-service').value;
    const newStatus = document.getElementById('booking-status').value;
    const newPaymentStatus = document.getElementById('booking-payment-status').value;

    // VALIDATION: Check required fields
    if (!date || !startTime || !endTime || !customerId || !staffId || !serviceId) {
        showDialog({
            title: 'Missing Information',
            message: 'Please fill in all required fields (date, time, customer, staff, and service).',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }

    // VALIDATION: Check time values are valid
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (startMinutes === 0 && startTime !== '00:00') {
        showDialog({
            title: 'Invalid Start Time',
            message: 'Please select a valid start time.',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }

    if (endMinutes === 0 && endTime !== '00:00') {
        showDialog({
            title: 'Invalid End Time',
            message: 'Please select a valid end time.',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }

    // VALIDATION: End time must be after start time
    if (startMinutes >= endMinutes) {
        showDialog({
            title: 'Invalid Time Range',
            message: 'End time must be after start time. Please adjust the booking times.',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }

    // VALIDATION: Booking must be within calendar hours
    const calendarStartMinutes = CALENDAR_START_HOUR * 60;
    const calendarEndMinutes = CALENDAR_END_HOUR * 60;

    if (startMinutes < calendarStartMinutes || endMinutes > calendarEndMinutes) {
        showDialog({
            title: 'Outside Calendar Hours',
            message: `Bookings must be between ${CALENDAR_START_HOUR}:00 and ${CALENDAR_END_HOUR}:00. Please adjust the times.`,
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }

    // VALIDATION: Check booking duration is reasonable (at least 15 minutes)
    const durationMinutes = endMinutes - startMinutes;
    if (durationMinutes < 15) {
        showDialog({
            title: 'Booking Too Short',
            message: 'Booking must be at least 15 minutes long.',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }

    // VALIDATION: Check date is valid and not too far in the past
    const bookingDate = parseYYYYMMDD(date);
    if (!bookingDate || isNaN(bookingDate.getTime())) {
        showDialog({
            title: 'Invalid Date',
            message: 'Please select a valid date.',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }

    const conflict = findBookingConflict({
        id: bookingId, date, startTime, endTime, customerId, staffId,
        resourceIds: resourceId ? [resourceId] : []
    });

    if (conflict) {
        showDialog({
            title: 'Booking Conflict',
            message: conflict,
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }

    // IMPROVEMENT: Check for adjacent bookings (warning only, doesn't block)
    const adjacentWarnings = checkAdjacentBookings({
        id: bookingId, date, startTime, endTime, staffId
    });
    if (adjacentWarnings.length > 0) {
        console.warn('Adjacent booking warnings:', adjacentWarnings);
        // Show first warning as toast (non-blocking)
        showToast(adjacentWarnings[0]);
    }

    const fee = calculateBookingFee(serviceId);

    const originalBooking = !isNewBooking ? state.bookings.find(b => b.id === bookingId) : null;
    const oldStatus = originalBooking ? originalBooking.status : null;
    const oldPaymentStatus = originalBooking ? originalBooking.paymentStatus : null;
    let transactionId = originalBooking ? originalBooking.transactionId : null;

    const wasPaid = oldPaymentStatus === 'Paid';
    const isPaid = newPaymentStatus === 'Paid';

    // SAFETY: Check if a transaction already exists for this booking
    const existingTransaction = state.transactions.find(t =>
        t.bookingId === bookingId && t.type === 'payment'
    );

    if (isPaid && !wasPaid) {
        // Becoming paid: Check for existing transaction first
        if (existingTransaction) {
            // Transaction already exists, just update it instead of creating new one
            transactionId = existingTransaction.id;
            existingTransaction.amount = fee;
            existingTransaction.date = toLocalDateString(new Date());
            existingTransaction.description = `Payment for booking on ${date}`;
            existingTransaction.customerId = customerId; // Update in case customer changed
            showToast('Payment transaction updated.');
        } else {
            // No existing transaction, create a new one
            const newTransaction = {
                id: `txn_${generateUUID()}`,
                date: toLocalDateString(new Date()),
                type: 'payment',
                description: `Payment for booking on ${date}`,
                amount: fee,
                customerId: customerId,
                bookingId: bookingId
            };
            state.transactions.push(newTransaction);
            transactionId = newTransaction.id;
            showToast('Payment transaction created.');
        }
    } else if (!isPaid && wasPaid) {
        // Becoming unpaid: Delete the old transaction
        if (transactionId) {
            state.transactions = state.transactions.filter(t => t.id !== transactionId);
        }
        transactionId = null;
    } else if (isPaid && wasPaid) {
        // Staying paid, but fee might have changed
        if (transactionId) {
            const tx = state.transactions.find(t => t.id === transactionId);
            if (tx && tx.amount !== fee) {
                tx.amount = fee;
                showToast('Payment transaction updated.');
            }
        }
    }

    const bookingData = {
        id: bookingId,
        date: date,
        startTime: startTime,
        endTime: endTime,
        customerId: customerId,
        staffId: staffId,
        resourceIds: resourceId ? [resourceId] : [],
        serviceId: serviceId,
        fee: fee,
        status: newStatus,
        paymentStatus: newPaymentStatus,
        pickup: document.getElementById('booking-pickup').value,
        transactionId: transactionId,

        // TOUR-SPECIFIC FIELDS
        groupSize: document.getElementById('booking-group-size') ? parseInt(document.getElementById('booking-group-size').value) || 1 : 1,
        participants: document.getElementById('booking-participants') ? document.getElementById('booking-participants').value.split('\n').filter(p => p.trim()) : [],
        specialRequirements: document.getElementById('booking-special-requirements') ? document.getElementById('booking-special-requirements').value : '',
        waiverSigned: document.getElementById('booking-waiver-signed') ? document.getElementById('booking-waiver-signed').checked : false,
        waiverSignedDate: document.getElementById('booking-waiver-signed') && document.getElementById('booking-waiver-signed').checked ? new Date().toISOString() : null,

        // MULTI-DAY TOUR FIELDS
        isMultidayTour: document.getElementById('booking-multiday-tour') ? document.getElementById('booking-multiday-tour').checked : false,
        endDate: document.getElementById('booking-end-date') ? document.getElementById('booking-end-date').value : null,
        accommodation: document.getElementById('booking-accommodation') ? document.getElementById('booking-accommodation').value : '',
        multidayGroupId: null  // Will be set when creating multi-day tours
    };

    if (newStatus === 'Completed' && oldStatus !== 'Completed' && bookingData.paymentStatus === 'Unpaid') {
        openCompletionModal(bookingData);
    } else {
        finalizeSaveBooking(bookingData, oldStatus);
    }
}


function finalizeSaveBooking(bookingData, oldStatus = null) {
    if (bookingData.id && state.bookings.some(b => b.id === bookingData.id)) {
        const index = state.bookings.findIndex(b => b.id === bookingData.id);
        state.bookings[index] = bookingData;
    } else {
        state.bookings.push(bookingData);
    }

    // OPTIMIZATION: Clear memoization caches when data changes
    clearMemoCache(calculateBookingFee);
    clearMemoCache(getCustomerSummaries);

    debouncedSaveState();

    // Handle Google Calendar sync if enabled
    if (state.settings.googleCalendarEnabled && 
        state.settings.googleCalendarAutoSync && 
        gapi.auth2?.getAuthInstance()?.isSignedIn.get()) {
        
        syncWithGoogleCalendar([bookingData.id]).catch(error => {
            console.error('Failed to sync booking with Google Calendar:', error);
            showToast('Warning: Failed to sync with Google Calendar');
        });
    }

    if (bookingData.status === 'Cancelled' && oldStatus !== 'Cancelled') {
        checkWaitingListFor(bookingData);
    }

    closeBookingModal();
    refreshCurrentView();
    checkOverduePayments();
}

function deleteBooking(bookingId, fromModal = 'booking') {
    showDialog({
        title: 'Delete Booking', message: 'Are you sure you want to delete this booking?',
        buttons: [
            { text: 'Cancel', class: btnSecondary },
            { text: 'Delete', class: btnDanger, onClick: async () => {
                const bookingToDelete = state.bookings.find(b => b.id === bookingId);
                if (!bookingToDelete) return;

                // Handle Google Calendar deletion if enabled
                if (state.settings.googleCalendarEnabled && 
                    state.settings.googleCalendarAutoSync && 
                    gapi.auth2?.getAuthInstance()?.isSignedIn.get() &&
                    bookingToDelete.googleEventId) {
                    try {
                        await gapi.client.calendar.events.delete({
                            calendarId: 'primary',
                            eventId: bookingToDelete.googleEventId
                        });
                    } catch (error) {
                        console.error('Failed to delete Google Calendar event:', error);
                        showToast('Warning: Failed to delete Google Calendar event');
                    }
                }
                
                if (bookingToDelete.transactionId) {
                    state.transactions = state.transactions.filter(t => t.id !== bookingToDelete.transactionId);
                }
                state.bookings = state.bookings.filter(b => b.id !== bookingId);
                debouncedSaveState();
                checkWaitingListFor(bookingToDelete);
                if (fromModal === 'booking') {
                    closeBookingModal();
                } else if (fromModal === 'summary') {
                    closeDaySummaryModal();
                }
                refreshCurrentView();
            }}
        ]
    });
}

function saveCustomer(event) {
    event.preventDefault();
    const customerId = document.getElementById('customer-id').value;
    const customerName = document.getElementById('customer-name').value.trim();
    const email = document.getElementById('customer-email').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const lessonCredits = parseFloat(document.getElementById('customer-credits').value) || 0;

    // SECURITY: Validate inputs using security module
    if (typeof validateInput === 'function') {
        // Validate name
        const nameValidation = validateInput(customerName, 'name');
        if (!nameValidation.valid) {
            showDialog({
                title: 'Invalid Name',
                message: nameValidation.message,
                buttons: [{ text: 'OK', class: btnPrimary }]
            });
            return;
        }

        // Validate email if provided
        if (email) {
            const emailValidation = validateInput(email, 'email');
            if (!emailValidation.valid) {
                showDialog({
                    title: 'Invalid Email',
                    message: emailValidation.message,
                    buttons: [{ text: 'OK', class: btnPrimary }]
                });
                return;
            }
        }

        // Validate phone if provided
        if (phone) {
            const phoneValidation = validateInput(phone, 'phone');
            if (!phoneValidation.valid) {
                showDialog({
                    title: 'Invalid Phone',
                    message: phoneValidation.message,
                    buttons: [{ text: 'OK', class: btnPrimary }]
                });
                return;
            }
        }
    } else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        // Fallback validation if security module not loaded
        showDialog({
            title: 'Invalid Email',
            message: 'Please enter a valid email address.',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }

    if (isNaN(lessonCredits) || lessonCredits < 0) {
        showDialog({
            title: 'Invalid Input',
            message: 'Lesson credits must be a non-negative number.',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail) {
        const isDuplicate = state.customers.some(
            c => c.email && c.email.toLowerCase() === trimmedEmail && c.id !== customerId
        );

        if (isDuplicate) {
            showDialog({
                title: 'Duplicate Email',
                message: 'A customer with this email address already exists. Please use a different email.',
                buttons: [{ text: 'OK', class: btnPrimary }]
            });
            return;
        }
    }

    const isNewCustomer = !customerId;

    const customerData = {
        id: customerId || `customer_${generateUUID()}`,
        name: customerName,
        email: email,
        phone: document.getElementById('customer-phone').value,
        driving_school_details: {
            license_number: document.getElementById('customer-license').value,
            progress_notes: customerId ? (state.customers.find(c => c.id === customerId)?.driving_school_details?.progress_notes || []) : [],
            lesson_credits: lessonCredits
        }
    };

    if (isNewCustomer) {
        customerData.creation_date = new Date().toISOString();
    }

    if (customerId) {
        const index = state.customers.findIndex(c => c.id === customerId);
        if (index !== -1) {
            state.customers[index] = { ...state.customers[index], ...customerData };
        }
    } else {
        state.customers.push(customerData);
    }
    debouncedSaveState();
    closeCustomerModal();
    renderCustomersView();
}

function deleteCustomer(customerId) {
    showDialog({
        title: 'Delete Customer', message: 'Are you sure? This will delete all associated bookings and records.',
        buttons: [
            { text: 'Cancel', class: btnSecondary },
            { text: 'Delete', class: btnDanger, onClick: () => {
                state.customers = state.customers.filter(c => c.id !== customerId);
                state.bookings = state.bookings.filter(b => b.customerId !== customerId);
                state.transactions = state.transactions.filter(t => t.customerId !== customerId);
                debouncedSaveState();
                refreshCurrentView();
            }}
        ]
    });
}

function toggleGuideFields() {
    const staffType = document.getElementById('staff-type').value;
    const guideSection = document.getElementById('guide-qualifications-section');
    if (staffType === 'GUIDE') {
        guideSection.classList.remove('hidden');
    } else {
        guideSection.classList.add('hidden');
    }
}

function saveStaff(event) {
    event.preventDefault();
    const staffId = document.getElementById('staff-id').value;
    const staffType = document.getElementById('staff-type').value;

    const staffData = {
        id: staffId || `staff_${generateUUID()}`,
        name: document.getElementById('staff-name').value,
        email: document.getElementById('staff-email').value,
        phone: document.getElementById('staff-phone').value,
        staff_type: staffType,
    };

    // Add guide qualifications if this is a tour guide
    if (staffType === 'GUIDE') {
        staffData.guide_qualifications = {
            languages: document.getElementById('guide-languages') ?
                document.getElementById('guide-languages').value.split(',').map(l => l.trim()).filter(l => l) : [],
            specializations: document.getElementById('guide-specializations') ?
                document.getElementById('guide-specializations').value.split(',').map(s => s.trim()).filter(s => s) : [],
            certifications: document.getElementById('guide-certifications') ?
                document.getElementById('guide-certifications').value : '',
            certificationExpiry: document.getElementById('guide-certification-expiry') ?
                document.getElementById('guide-certification-expiry').value : null,
            rating: document.getElementById('guide-rating') ?
                parseFloat(document.getElementById('guide-rating').value) || 0 : 0,
        };
    }

    if (staffId) {
         const index = state.staff.findIndex(s => s.id === staffId);
         if (index !== -1) state.staff[index] = { ...state.staff[index], ...staffData };
    } else {
        state.staff.push(staffData);
    }
    debouncedSaveState();
    closeStaffModal();
    renderStaffView();
}

function deleteStaff(staffId) {
    showDialog({
        title: 'Delete Staff Member', message: 'Are you sure? This may affect existing bookings.',
        buttons: [
            { text: 'Cancel', class: btnSecondary },
            { text: 'Delete', class: btnDanger, onClick: () => {
                state.staff = state.staff.filter(s => s.id !== staffId);
                state.bookings.forEach(b => { if (b.staffId === staffId) b.staffId = null; });
                debouncedSaveState();
                refreshCurrentView();
            }}
        ]
    });
}

function saveResource(event) {
    event.preventDefault();
    const resourceId = document.getElementById('resource-id').value;
    const resourceData = {
        id: resourceId || `resource_${generateUUID()}`,
        resource_name: document.getElementById('resource-name').value,
        resource_type: document.getElementById('resource-type').value,
        capacity: parseInt(document.getElementById('resource-capacity').value, 10) || 1,
        make: document.getElementById('resource-make').value,
        model: document.getElementById('resource-model').value,
        reg: document.getElementById('resource-reg').value,
        maintenance_schedule: {
            mot: document.getElementById('resource-mot').value,
            tax: document.getElementById('resource-tax').value,
            service: document.getElementById('resource-service').value,
        }
    };
    if (resourceId) {
        const index = state.resources.findIndex(r => r.id === resourceId);
        if (index !== -1) state.resources[index] = { ...state.resources[index], ...resourceData };
    } else {
        state.resources.push(resourceData);
    }
    debouncedSaveState();
    closeResourceModal();
    renderResourcesView();
    checkVehicleCompliance();
}

function deleteResource(resourceId) {
    const isUsed = state.bookings.some(b => b.resourceIds && b.resourceIds.includes(resourceId));
    if (isUsed) {
        showDialog({ title: 'Cannot Delete', message: 'This resource is currently assigned to one or more bookings.', buttons: [{ text: 'OK', class: btnPrimary }] });
        return;
    }
    showDialog({
        title: 'Delete Resource', message: 'Are you sure you want to delete this resource?',
        buttons: [
            { text: 'Cancel', class: btnSecondary },
            { text: 'Delete', class: btnDanger, onClick: () => {
                state.resources = state.resources.filter(r => r.id !== resourceId);
                debouncedSaveState();
                renderResourcesView();
                checkVehicleCompliance();
            }}
        ]
    });
}

function saveBlockedPeriod(event) {
    event.preventDefault();
    const staffId = document.getElementById('block-staff').value;
    const startDateStr = document.getElementById('block-start-date').value;
    const endDateStr = document.getElementById('block-end-date').value;
    const reason = document.getElementById('block-reason').value;

    if (new Date(endDateStr) < new Date(startDateStr)) {
        showDialog({
            title: 'Invalid Date Range',
            message: 'The end date cannot be before the start date.',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }

    const conflictingBookings = state.bookings.filter(b => {
        const isDateConflict = b.date >= startDateStr && b.date <= endDateStr;
        const isStaffConflict = staffId === 'all' || b.staffId === staffId;
        return isDateConflict && isStaffConflict && b.status !== 'Cancelled';
    });

    const periodData = { id: `block_${generateUUID()}`, start: startDateStr, end: endDateStr, reason: reason, staffId: staffId };

    const proceedWithBlock = () => {
        state.blockedPeriods.push(periodData);
        debouncedSaveState();
        closeBlockDatesModal();
        refreshCurrentView();
    };

    if (conflictingBookings.length > 0) {
        showDialog({
            title: 'Booking Conflict', message: `There are ${conflictingBookings.length} bookings in this date range for the selected staff. Block anyway?`,
            buttons: [{ text: 'Cancel', class: btnSecondary }, { text: 'Block', class: btnDanger, onClick: proceedWithBlock }]
        });
    } else {
        proceedWithBlock();
    }
}

function saveProgressNote(customerId) {
    const customer = state.customers.find(c => c.id === customerId);
    if (!customer) return false;

    const noteId = document.getElementById('progress-note-id').value;
    const notes = document.getElementById('progress-notes').value;
    const date = document.getElementById('progress-lesson-date-select')?.value || document.getElementById('progress-lesson-date-hidden').value;
    const skillsCovered = Array.from(document.querySelectorAll('input[name="progress-skill"]:checked')).map(el => ({
        skill: el.value,
        category: el.dataset.category
    }));

    if (!date) {
        showDialog({ title: 'Error', message: 'Cannot save note without a valid lesson date.', buttons: [{ text: 'OK', class: btnPrimary }] });
        return false;
    }

    const noteData = {
        id: noteId || `note_${generateUUID()}`,
        date: date,
        notes: notes,
        skillsCovered: skillsCovered
    };

    if (!customer.driving_school_details) customer.driving_school_details = {};
    if (!customer.driving_school_details.progress_notes) customer.driving_school_details.progress_notes = [];

    if (noteId) {
        const index = customer.driving_school_details.progress_notes.findIndex(n => n.id === noteId);
        if (index !== -1) customer.driving_school_details.progress_notes[index] = noteData;
    } else {
        customer.driving_school_details.progress_notes.push(noteData);
    }
    debouncedSaveState();
    return true;
}

// FEATURE: Phase 2 - Student Progress Dashboard
function calculateStudentProgress(customerId) {
    const customer = state.customers.find(c => c.id === customerId);
    if (!customer || !customer.driving_school_details || !customer.driving_school_details.progress_notes) {
        return {
            masteredSkills: [],
            inProgressSkills: [],
            notStartedSkills: [],
            progressPercentage: 0,
            totalSkills: 0,
            estimatedWeeksToReady: null
        };
    }

    const progressNotes = customer.driving_school_details.progress_notes;
    const allSkills = [];
    const coveredSkills = new Map(); // skill -> count

    // Collect all skills and count how many times each was covered
    for (const level in skillLevels) {
        skillLevels[level].skills.forEach(skill => {
            allSkills.push({ skill, category: level });
            coveredSkills.set(skill, 0);
        });
    }

    // Count skill coverage
    progressNotes.forEach(note => {
        if (note.skillsCovered) {
            note.skillsCovered.forEach(s => {
                const count = coveredSkills.get(s.skill) || 0;
                coveredSkills.set(s.skill, count + 1);
            });
        }
    });

    // Categorize skills
    const masteredSkills = []; // covered 2+ times
    const inProgressSkills = []; // covered 1 time
    const notStartedSkills = []; // never covered

    allSkills.forEach(({ skill, category }) => {
        const count = coveredSkills.get(skill) || 0;
        const skillData = { skill, category, count };

        if (count >= 2) {
            masteredSkills.push(skillData);
        } else if (count === 1) {
            inProgressSkills.push(skillData);
        } else {
            notStartedSkills.push(skillData);
        }
    });

    const totalSkills = allSkills.length;
    const progressPercentage = totalSkills > 0 ? Math.round((masteredSkills.length / totalSkills) * 100) : 0;

    // Calculate estimated weeks to ready (rough estimate)
    const completedLessons = progressNotes.length;
    const skillsPerLesson = completedLessons > 0 ? masteredSkills.length / completedLessons : 0;
    const remainingSkills = totalSkills - masteredSkills.length;
    const estimatedLessonsNeeded = skillsPerLesson > 0 ? Math.ceil(remainingSkills / skillsPerLesson) : null;
    const estimatedWeeksToReady = estimatedLessonsNeeded ? Math.ceil(estimatedLessonsNeeded / 2) : null; // Assume 2 lessons/week

    return {
        masteredSkills,
        inProgressSkills,
        notStartedSkills,
        progressPercentage,
        totalSkills,
        completedLessons,
        estimatedWeeksToReady
    };
}

function renderStudentProgressDashboard(customerId) {
    const container = document.getElementById('progress-dashboard-container');
    const progress = calculateStudentProgress(customerId);

    if (progress.completedLessons === 0) {
        container.innerHTML = `
            <div class="p-6 bg-blue-50 border-l-4 border-blue-500 rounded text-center">
                <h3 class="text-lg font-semibold text-blue-900 mb-2">📘 Start Tracking Progress</h3>
                <p class="text-blue-700">Add lesson notes below to start tracking this student's progress and see their dashboard here.</p>
            </div>
        `;
        return;
    }

    const progressColor = progress.progressPercentage >= 80 ? 'green' : progress.progressPercentage >= 50 ? 'blue' : 'orange';

    container.innerHTML = `
        <!-- Overall Progress -->
        <div class="bg-gradient-to-r from-${progressColor}-50 to-${progressColor}-100 rounded-lg p-6 mb-6">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h3 class="text-2xl font-bold text-${progressColor}-900">${progress.progressPercentage}% Complete</h3>
                    <p class="text-${progressColor}-700 mt-1">${progress.masteredSkills.length} of ${progress.totalSkills} skills mastered</p>
                </div>
                <div class="text-5xl">${progress.progressPercentage >= 80 ? '🎉' : progress.progressPercentage >= 50 ? '📚' : '🚀'}</div>
            </div>
            <div class="w-full bg-white rounded-full h-4 mb-2">
                <div class="bg-${progressColor}-600 h-4 rounded-full transition-all duration-500" style="width: ${progress.progressPercentage}%"></div>
            </div>
            <div class="grid grid-cols-3 gap-4 mt-4 text-center">
                <div>
                    <div class="text-2xl font-bold text-green-700">${progress.masteredSkills.length}</div>
                    <div class="text-xs text-gray-600">Mastered ✅</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-yellow-700">${progress.inProgressSkills.length}</div>
                    <div class="text-xs text-gray-600">In Progress 🟡</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-gray-500">${progress.notStartedSkills.length}</div>
                    <div class="text-xs text-gray-600">Not Started ⭕</div>
                </div>
            </div>
            ${progress.estimatedWeeksToReady ? `
                <div class="mt-4 p-3 bg-white/50 rounded text-center">
                    <span class="text-sm font-medium text-${progressColor}-900">
                        📅 Estimated test-ready: ${progress.estimatedWeeksToReady} weeks
                    </span>
                </div>
            ` : ''}
        </div>

        <!-- Skills by Category -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            ${Object.keys(skillLevels).map(level => {
                const categorySkills = [
                    ...progress.masteredSkills.filter(s => s.category === level),
                    ...progress.inProgressSkills.filter(s => s.category === level),
                    ...progress.notStartedSkills.filter(s => s.category === level)
                ];
                const masteredCount = progress.masteredSkills.filter(s => s.category === level).length;
                const totalInCategory = categorySkills.length;
                const categoryProgress = totalInCategory > 0 ? Math.round((masteredCount / totalInCategory) * 100) : 0;

                return `
                    <div class="bg-white rounded-lg border p-4">
                        <h4 class="font-semibold text-gray-900 mb-2">${skillLevels[level].title}</h4>
                        <div class="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div class="bg-blue-600 h-2 rounded-full" style="width: ${categoryProgress}%"></div>
                        </div>
                        <div class="text-xs text-gray-600 mb-2">${masteredCount}/${totalInCategory} skills mastered</div>
                        <div class="space-y-1 max-h-32 overflow-y-auto">
                            ${categorySkills.slice(0, 5).map(s => {
                                const icon = s.count >= 2 ? '✅' : s.count === 1 ? '🟡' : '⭕';
                                const textColor = s.count >= 2 ? 'text-green-700' : s.count === 1 ? 'text-yellow-700' : 'text-gray-400';
                                return `<div class="text-xs ${textColor}">${icon} ${s.skill}</div>`;
                            }).join('')}
                            ${categorySkills.length > 5 ? `<div class="text-xs text-gray-400">+${categorySkills.length - 5} more...</div>` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>

        <!-- Next Skills to Learn -->
        ${progress.notStartedSkills.length > 0 ? `
            <div class="bg-yellow-50 border-l-4 border-yellow-400 rounded p-4">
                <h4 class="font-semibold text-yellow-900 mb-2">📋 Next Skills to Focus On:</h4>
                <ul class="text-sm text-yellow-800 space-y-1">
                    ${progress.notStartedSkills.slice(0, 5).map(s =>
                        `<li>• ${s.skill} <span class="text-xs text-yellow-600">(${skillLevels[s.category].title})</span></li>`
                    ).join('')}
                </ul>
            </div>
        ` : `
            <div class="bg-green-50 border-l-4 border-green-400 rounded p-4 text-center">
                <h4 class="font-semibold text-green-900 mb-2">🎉 All Skills Covered!</h4>
                <p class="text-sm text-green-700">This student has been introduced to all skills. Continue practicing for mastery!</p>
            </div>
        `}
    `;
}

function renderProgressLog(customerId) {
    const customer = state.customers.find(c => c.id === customerId);
    const container = document.getElementById('progress-log-list');

    // FEATURE: Phase 2 - Render Progress Dashboard
    renderStudentProgressDashboard(customerId);

    if (!customer || !customer.driving_school_details || !customer.driving_school_details.progress_notes || customer.driving_school_details.progress_notes.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500">No progress notes have been logged for this customer yet.</p>';
        return;
    }

    const sortedNotes = customer.driving_school_details.progress_notes.sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = sortedNotes.map(note => {
        const lessonDate = safeDateFormat(note.date, { year: 'numeric', month: 'long', day: 'numeric' });
        const skillsHtml = note.skillsCovered && note.skillsCovered.length > 0
            ? `<ul class="list-disc list-inside mt-2 text-sm text-gray-600">${note.skillsCovered.map(s => `<li>${sanitizeHTML(s.skill)}</li>`).join('')}</ul>`
            : '<p class="text-sm text-gray-500 mt-2">No specific skills were tagged for this lesson.</p>';

        return `
            <div class="p-4 bg-gray-50 rounded-lg border">
                <div class="flex justify-between items-center">
                    <h5 class="font-semibold text-gray-800">${lessonDate}</h5>
                    <div>
                        <button onclick="editProgressNote('${customerId}', '${note.id}')" class="font-medium text-sm text-indigo-600 hover:text-indigo-800">Edit</button>
                        <button onclick="deleteProgressNote('${customerId}', '${note.id}')" class="ml-2 font-medium text-sm text-red-600 hover:text-red-800">Delete</button>
                    </div>
                </div>
                <p class="mt-2 text-gray-700 whitespace-pre-wrap">${sanitizeHTML(note.notes)}</p>
                <div class="mt-3">
                    <h6 class="font-semibold text-sm">Skills Covered:</h6>
                    ${skillsHtml}
                </div>
            </div>
        `;
    }).join('');
}

function editProgressNote(customerId, noteId) {
    const customer = state.customers.find(c => c.id === customerId);
    if (!customer) return;
    const note = customer.driving_school_details.progress_notes.find(n => n.id === noteId);
    if (!note) return;

    document.getElementById('progress-form-title').textContent = 'Edit Lesson Note';
    document.getElementById('progress-note-id').value = note.id;
    document.getElementById('progress-notes').value = note.notes;

    const dateSelect = document.getElementById('progress-lesson-date-select');
    if (dateSelect) {
        dateSelect.value = note.date;
    } else {
        document.getElementById('progress-lesson-date-hidden').value = note.date;
    }

    document.querySelectorAll('input[name="progress-skill"]').forEach(checkbox => {
        checkbox.checked = note.skillsCovered.some(s => s.skill === checkbox.value);
    });

    document.getElementById('progress-log-form').scrollIntoView({ behavior: 'smooth' });
}

function deleteProgressNote(customerId, noteId) {
    showDialog({
        title: 'Delete Progress Note',
        message: 'Are you sure you want to delete this progress note?',
        buttons: [
            { text: 'Cancel', class: btnSecondary },
            {
                text: 'Delete',
                class: btnDanger,
                onClick: () => {
                    const customerIndex = state.customers.findIndex(c => c.id === customerId);
                    if (customerIndex === -1) return;

                    const notes = state.customers[customerIndex].driving_school_details.progress_notes;
                    state.customers[customerIndex].driving_school_details.progress_notes = notes.filter(n => n.id !== noteId);

                    debouncedSaveState();
                    renderProgressLog(customerId);
                    showToast('Progress note deleted.');
                }
            }
        ]
    });
}


/******************************************************************************
 * SECTION 9: MODAL MANAGEMENT
 ******************************************************************************/

function showDialog({ title, message, buttons }) {
    const modal = document.getElementById('dialog-modal');
    document.getElementById('dialog-title').textContent = title;
    document.getElementById('dialog-message').textContent = message;
    const buttonsContainer = document.getElementById('dialog-buttons');
    buttonsContainer.innerHTML = '';
    buttons.forEach(btnInfo => {
        const button = document.createElement('button');
        button.textContent = btnInfo.text;
        button.className = btnInfo.class || btnSecondary;
        button.onclick = () => {
            closeDialog();
            if (btnInfo.onClick) btnInfo.onClick();
        };
        buttonsContainer.appendChild(button);
    });
    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal').classList.remove('scale-95', 'opacity-0'), 10);
}

function closeDialog() {
    const modal = document.getElementById('dialog-modal');
    modal.querySelector('.modal').classList.add('scale-95', 'opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

// FEATURE: Show keyboard shortcuts help modal (Phase 1 Improvement)
function showKeyboardShortcutsHelp() {
    const shortcutsHTML = `
        <div style="max-height: 400px; overflow-y: auto;">
            <h4 class="font-semibold mb-3 text-lg">Navigation</h4>
            <div class="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div><kbd class="px-2 py-1 bg-gray-200 rounded">S</kbd> Dashboard/Summary</div>
                <div><kbd class="px-2 py-1 bg-gray-200 rounded">B</kbd> Billing View</div>
                <div><kbd class="px-2 py-1 bg-gray-200 rounded">D</kbd> Day View</div>
                <div><kbd class="px-2 py-1 bg-gray-200 rounded">W</kbd> Week View</div>
                <div><kbd class="px-2 py-1 bg-gray-200 rounded">M</kbd> Month View</div>
            </div>

            <h4 class="font-semibold mb-3 text-lg">Quick Actions</h4>
            <div class="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div><kbd class="px-2 py-1 bg-gray-200 rounded">N</kbd> New Booking</div>
                <div><kbd class="px-2 py-1 bg-gray-200 rounded">C</kbd> New Customer</div>
                <div><kbd class="px-2 py-1 bg-gray-200 rounded">Ctrl+S</kbd> Quick Save</div>
                <div><kbd class="px-2 py-1 bg-gray-200 rounded">Esc</kbd> Close Modal</div>
            </div>

            <h4 class="font-semibold mb-3 text-lg">Calendar Navigation</h4>
            <div class="grid grid-cols-2 gap-2 text-sm">
                <div><kbd class="px-2 py-1 bg-gray-200 rounded">←</kbd> Previous Day/Week/Month</div>
                <div><kbd class="px-2 py-1 bg-gray-200 rounded">→</kbd> Next Day/Week/Month</div>
                <div><kbd class="px-2 py-1 bg-gray-200 rounded">T</kbd> Jump to Today</div>
                <div><kbd class="px-2 py-1 bg-gray-200 rounded">?</kbd> Show This Help</div>
            </div>
        </div>
    `;

    showDialog({
        title: '⌨️ Keyboard Shortcuts',
        message: shortcutsHTML,
        buttons: [{ text: 'Got it!', class: btnPrimary }]
    });

    // Update dialog to support HTML content
    const messageEl = document.getElementById('dialog-message');
    if (messageEl) {
        messageEl.innerHTML = shortcutsHTML;
    }
}

function openBookingModal(date, bookingId = null, startTime = null, endTime = null) {
    const today = new Date(); today.setHours(0,0,0,0);
    if (!bookingId && parseYYYYMMDD(date) < today) {
        showDialog({ title: 'Invalid Date', message: 'Cannot create a new booking in the past.', buttons: [{ text: 'OK', class: btnPrimary }] });
        return;
    }

    const blockedPeriods = getBlockedPeriodsForDate(parseYYYYMMDD(date));
    if (blockedPeriods.some(p => p.staffId === 'all')) {
        showDialog({ title: 'Date Blocked', message: 'This date is blocked for a school holiday.', buttons: [{ text: 'OK', class: btnPrimary }] });
        return;
    }

    const modal = document.getElementById('booking-modal');
    const form = modal.querySelector('form'); form.reset();

    populateSelect('booking-service', state.services, false, 'service_name');
    populateSelect('booking-customer', state.customers);
    populateSelect('booking-staff', state.staff);
    populateSelect('booking-resource', state.resources, false, 'resource_name');
    updateStaffAvailability(date);

    const leftActionsContainer = document.getElementById('booking-modal-actions-left');
    leftActionsContainer.innerHTML = '';

    // FEATURE: Show/hide recurring section (Phase 1 Improvement)
    const recurringSection = document.getElementById('recurring-booking-section');
    const recurringCheckbox = document.getElementById('booking-recurring');

    if (bookingId) {
        document.getElementById('booking-modal-title').textContent = 'Edit Booking';
        const booking = state.bookings.find(b => b.id === bookingId);
        if(booking) {
            document.getElementById('booking-id').value = booking.id;
            document.getElementById('booking-date').value = booking.date;
            document.getElementById('booking-service').value = booking.serviceId || DEFAULT_SERVICE_ID;
            document.getElementById('booking-customer').value = booking.customerId;
            document.getElementById('booking-staff').value = booking.staffId;
            document.getElementById('booking-resource').value = booking.resourceIds ? booking.resourceIds[0] : '';
            document.getElementById('booking-start-time').value = booking.startTime;
            document.getElementById('booking-pickup').value = booking.pickup || '';
            document.getElementById('booking-status').value = booking.status;
            document.getElementById('booking-payment-status').value = booking.paymentStatus;

            // Populate tour-specific fields if they exist
            if (document.getElementById('booking-group-size')) {
                document.getElementById('booking-group-size').value = booking.groupSize || 1;
            }
            if (document.getElementById('booking-participants')) {
                document.getElementById('booking-participants').value = booking.participants ? booking.participants.join('\n') : '';
            }
            if (document.getElementById('booking-special-requirements')) {
                document.getElementById('booking-special-requirements').value = booking.specialRequirements || '';
            }
            if (document.getElementById('booking-waiver-signed')) {
                document.getElementById('booking-waiver-signed').checked = booking.waiverSigned || false;
                const waiverDateEl = document.getElementById('booking-waiver-date');
                if (booking.waiverSignedDate && waiverDateEl) {
                    const waiverDate = new Date(booking.waiverSignedDate).toLocaleDateString('en-GB');
                    waiverDateEl.textContent = `Signed on: ${waiverDate}`;
                }
            }

            leftActionsContainer.innerHTML = `
                <button type="button" onclick="copySmsReminder('${bookingId}')" class="${btnSecondary}">Copy SMS Reminder</button>
                <button type="button" onclick="exportToGoogleCalendar('${bookingId}')" class="${btnGreen}">Add to Google Calendar</button>
                <button type="button" onclick="deleteBooking('${bookingId}', 'booking')" class="${btnDanger}">Delete</button>
            `;
        }
        // Hide recurring section for existing bookings
        if (recurringSection) recurringSection.classList.add('hidden');
    } else {
        document.getElementById('booking-modal-title').textContent = 'New Booking';
        document.getElementById('booking-id').value = '';
        document.getElementById('booking-date').value = date;
        document.getElementById('booking-start-time').value = startTime || '09:00';
        document.getElementById('booking-status').value = 'Scheduled';
        document.getElementById('booking-payment-status').value = 'Unpaid';
        // Show recurring section for new bookings and reset it
        if (recurringSection) recurringSection.classList.remove('hidden');
        if (recurringCheckbox) recurringCheckbox.checked = false;
        const recurringOptions = document.getElementById('recurring-options');
        const recurringPreview = document.getElementById('recurring-preview');
        if (recurringOptions) recurringOptions.classList.add('hidden');
        if (recurringPreview) recurringPreview.classList.add('hidden');
    }

    handleServiceSelectionChange();

    if (endTime) {
        document.getElementById('booking-end-time').value = endTime;
    }

    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal').classList.remove('scale-95', 'opacity-0'), 10);
}

function closeModal(modalId) {
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

function closeBookingModal() { closeModal('booking-modal'); }

function openDaySummaryModal(dateString) {
    const modal = document.getElementById('day-summary-modal');
    const titleEl = document.getElementById('day-summary-modal-title');
    const listEl = document.getElementById('day-summary-bookings-list');
    const addNewBtn = document.getElementById('day-summary-add-new');

    const date = parseYYYYMMDD(dateString);
    titleEl.textContent = `Summary for ${date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}`;

    const dayBookings = state.bookings.filter(b => b.date === dateString && b.status !== 'Cancelled').sort((a,b) => a.startTime.localeCompare(b.startTime));
    const blockedPeriods = getBlockedPeriodsForDate(date);

    let summaryHtml = '';

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

    listEl.innerHTML = summaryHtml || '<p class="text-center text-gray-500 py-4">No bookings or leave scheduled for this day.</p>';

    addNewBtn.onclick = () => {
        closeDaySummaryModal();
        openBookingModal(dateString);
    };

    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal').classList.remove('scale-95', 'opacity-0'), 10);
}

function closeDaySummaryModal() {
    const modal = document.getElementById('day-summary-modal');
    modal.querySelector('.modal').classList.add('scale-95', 'opacity-0');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

function openCustomerModal(customerId = null) {
    const modal = document.getElementById('customer-modal');
    const form = modal.querySelector('form'); form.reset();
    if (customerId) {
        document.getElementById('customer-modal-title').textContent = 'Edit Customer';
        const customer = state.customers.find(c => c.id === customerId);
        if (customer) {
            document.getElementById('customer-id').value = customer.id;
            document.getElementById('customer-name').value = customer.name;
            document.getElementById('customer-email').value = customer.email || '';
            document.getElementById('customer-phone').value = customer.phone || '';
            const details = customer.driving_school_details || {};
            document.getElementById('customer-license').value = details.license_number || '';
            document.getElementById('customer-credits').value = details.lesson_credits || '';
        }
    } else {
        document.getElementById('customer-modal-title').textContent = 'New Customer';
        document.getElementById('customer-id').value = '';
    }
    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal').classList.remove('scale-95', 'opacity-0'), 10);
}

function closeCustomerModal() { closeModal('customer-modal'); }

function openServiceModal(id = null) {
    const modal = document.getElementById('service-modal');
    const form = modal.querySelector('form');
    form.reset();
    document.getElementById('pricing-tiers-container').innerHTML = ''; // Clear tiers

    if (id) {
        document.getElementById('service-modal-title').textContent = 'Edit Service';
        const service = state.services.find(s => s.id === id);
        if (service) {
            document.getElementById('service-id').value = service.id;
            document.getElementById('service-type').value = service.service_type;
            document.getElementById('service-name').value = service.service_name;
            document.getElementById('service-duration').value = service.duration_minutes;
            document.getElementById('service-base-price').value = service.base_price;

            // Restore the correct pricing model radio button
            if (service.pricing_rules?.type === 'tiered') {
                document.querySelector('input[name="pricing-type"][value="tiered"]').checked = true;
            } else {
                document.querySelector('input[name="pricing-type"][value="fixed"]').checked = true;
            }

            // Populate tiers if they exist, regardless of service type
            if (service.pricing_rules?.type === 'tiered' && service.pricing_rules.tiers) {
                service.pricing_rules.tiers.forEach(tier => addPricingTier(tier));
            }

            // Populate TOUR specific fields
            if (service.service_type === 'TOUR') {
                document.getElementById('service-description').value = service.description || '';
                document.getElementById('service-photos').value = (service.photo_gallery || []).join('\n');
                document.getElementById('service-capacity-min').value = service.capacity?.min || 1;
                document.getElementById('service-capacity-max').value = service.capacity?.max || 10;
            }
        }
    } else {
        document.getElementById('service-modal-title').textContent = 'New Service';
        document.getElementById('service-id').value = '';
    }
    handleServiceTypeChange();
    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal').classList.remove('scale-95', 'opacity-0'), 10);
}

function closeServiceModal() { closeModal('service-modal'); }

function handlePricingTypeChange(pricingType) {
    const fixedFields = document.getElementById('pricing-fields-fixed');
    const tieredFields = document.getElementById('pricing-fields-tour');

    if (pricingType === 'fixed') {
        fixedFields.classList.remove('hidden');
        tieredFields.classList.add('hidden');
    } else { // tiered
        fixedFields.classList.add('hidden');
        tieredFields.classList.remove('hidden');
    }
}

function handleServiceTypeChange() {
    const serviceType = document.getElementById('service-type').value;
    const tourFields = document.getElementById('tour-fields');
    const tieredRadio = document.querySelector('input[name="pricing-type"][value="tiered"]');
    const fixedRadio = document.querySelector('input[name="pricing-type"][value="fixed"]');
    const tiersContainer = document.getElementById('pricing-tiers-container');
    const isTour = serviceType === 'TOUR';

    tourFields.classList.toggle('hidden', !isTour);

    if (!isTour) {
        if (tieredRadio.checked) {
            fixedRadio.checked = true;
        }
        tieredRadio.disabled = true;
        tiersContainer.innerHTML = '';
    } else {
        tieredRadio.disabled = false;
    }

    const pricingType = document.querySelector('input[name="pricing-type"]:checked').value;
    handlePricingTypeChange(pricingType);
}

function addPricingTier(tier = null) {
    const container = document.getElementById('pricing-tiers-container');
    const tierDiv = document.createElement('div');
    tierDiv.className = 'grid grid-cols-3 gap-2 items-center mb-2';
    tierDiv.innerHTML = `
        <input type="text" placeholder="Tier Name (e.g., Adult)" class="pricing-tier-name" value="${tier ? tier.name : ''}" required>
        <input type="number" placeholder="Price" class="pricing-tier-price" value="${tier ? tier.price : ''}" step="0.01" required>
        <button type="button" onclick="removePricingTier(this)" class="btn btn-danger text-sm py-1 px-2">- Remove</button>
    `;
    container.appendChild(tierDiv);
}

function removePricingTier(button) {
    button.parentElement.remove();
}

function saveService(event) {
    event.preventDefault();
    const serviceId = document.getElementById('service-id').value;
    const serviceType = document.getElementById('service-type').value;
    const duration = parseInt(document.getElementById('service-duration').value, 10);
    const basePrice = parseFloat(document.getElementById('service-base-price').value);
    const pricingType = document.querySelector('input[name="pricing-type"]:checked').value;
    if (isNaN(duration) || duration <= 0) {
        showDialog({
            title: 'Invalid Duration',
            message: 'Please enter a valid, positive number for the duration.',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }
    if (pricingType === 'fixed' && (document.getElementById('service-base-price').value === '' || isNaN(basePrice) || basePrice < 0)) {
        showDialog({
            title: 'Invalid Price',
            message: 'Please enter a valid, non-negative number for the price.',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }

    const serviceData = {
        id: serviceId || `service_${generateUUID()}`,
        service_name: document.getElementById('service-name').value,
        service_type: serviceType,
        duration_minutes: duration,
        base_price: 0, // Will be set later
    };

    if (serviceType === 'TOUR') {
        serviceData.description = document.getElementById('service-description').value;
        serviceData.photo_gallery = document.getElementById('service-photos').value.split('\n').filter(url => url.trim() !== '');
        const minCapacity = parseInt(document.getElementById('service-capacity-min').value, 10) || 1;
        const maxCapacity = parseInt(document.getElementById('service-capacity-max').value, 10) || minCapacity;

        if (maxCapacity < minCapacity) {
            showDialog({
                title: 'Invalid Capacity',
                message: 'Maximum capacity cannot be less than minimum capacity.',
                buttons: [{ text: 'OK', class: btnPrimary }]
            });
            return;
        }

        serviceData.capacity = {
            min: minCapacity,
            max: maxCapacity,
        };
    }

    if (pricingType === 'tiered') {
        const pricingTiers = [];
        document.querySelectorAll('#pricing-tiers-container .grid').forEach(tierDiv => {
            const name = tierDiv.querySelector('.pricing-tier-name').value;
            const price = parseFloat(tierDiv.querySelector('.pricing-tier-price').value);
            if (name && !isNaN(price)) {
                pricingTiers.push({ name, price });
            }
        });

        if (pricingTiers.length === 0) {
            showDialog({
                title: 'Invalid Pricing',
                message: 'Please add at least one pricing tier for the tiered pricing model.',
                buttons: [{ text: 'OK', class: btnPrimary }]
            });
            return;
        }

        serviceData.pricing_rules = {
            type: 'tiered',
            tiers: pricingTiers
        };
        serviceData.base_price = pricingTiers[0].price;
    } else { // fixed
        serviceData.pricing_rules = {
            type: 'fixed',
            price: basePrice
        };
        serviceData.base_price = basePrice;
    }


    if (serviceId) {
        const index = state.services.findIndex(s => s.id === serviceId);
        if (index !== -1) state.services[index] = serviceData;
    } else {
        state.services.push(serviceData);
    }

    // OPTIMIZATION: Clear pricing cache when services change
    clearMemoCache(calculateBookingFee);

    debouncedSaveState();
    closeServiceModal();
    renderServicesView();
}

function deleteService(id) {
    if (id === MOCK_TEST_SERVICE_ID) {
        showDialog({
            title: 'Cannot Delete',
            message: 'The Mock Test service is managed automatically from the Settings page and cannot be deleted here.',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }

    const isUsed = state.bookings.some(b => b.serviceId === id);
    if (isUsed) {
        showDialog({ title: 'Cannot Delete', message: 'This service is used in existing bookings.', buttons: [{ text: 'OK', class: btnPrimary }] });
        return;
    }

    showDialog({
        title: 'Delete Service', message: 'Are you sure?',
        buttons: [
            { text: 'Cancel', class: btnSecondary },
            { text: 'Delete', class: btnDanger, onClick: () => {
                state.services = state.services.filter(s => s.id !== id);
                debouncedSaveState();
                renderServicesView();
            }}
        ]
    });
}

function openCustomerProgressModal(customerId) {
    const modal = document.getElementById('customer-progress-modal');
    const customer = state.customers.find(c => c.id === customerId);
    if (!customer) return;

    document.getElementById('customer-progress-modal-title').textContent = `Progress Log for ${customer.name}`;
    document.getElementById('progress-summary-container').classList.add('hidden');
    document.getElementById('summary-output').innerHTML = '';

    const summarizeBtn = document.getElementById('summarize-progress-btn');
    summarizeBtn.onclick = () => handleSummarizeCustomerProgress(customerId);
    summarizeBtn.disabled = false;

    resetProgressForm(customerId);

    const skillsContainer = document.getElementById('progress-skills-container');
    let checklistHtml = '';
    for (const level in skillLevels) {
        checklistHtml += `<h3 class="skill-category-header">${skillLevels[level].title}</h3>`;
        checklistHtml += '<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">';
        skillLevels[level].skills.forEach(skill => {
            checklistHtml += `
                <label class="flex items-center space-x-2">
                    <input type="checkbox" name="progress-skill" value="${skill}" data-category="${level}" class="rounded text-indigo-600 focus:ring-indigo-500">
                    <span class="text-sm">${skill}</span>
                </label>
            `;
        });
        checklistHtml += '</div>';
    }
    skillsContainer.innerHTML = checklistHtml;

    renderProgressLog(customerId);

    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal').classList.remove('scale-95', 'opacity-0'), 10);
}

function populateProgressDateSelect(customerId) {
    const dateContainer = document.getElementById('progress-date-container');
    const formElements = [document.getElementById('progress-notes'), document.getElementById('progress-form-buttons')];
    const saveNoteBtn = document.getElementById('save-note-btn');

    const relevantBookings = state.bookings.filter(b => b.customerId === customerId && b.status !== 'Cancelled').sort((a,b) => b.date.localeCompare(a.date));

    if (relevantBookings.length > 0) {
        const options = relevantBookings.map(b => {
            const displayDate = safeDateFormat(b.date, { weekday: 'short', day: 'numeric', month: 'short' });
            return `<option value="${b.date}">${displayDate} (${b.startTime})</option>`;
        }).join('');
        dateContainer.innerHTML = `
            <label for="progress-lesson-date-select" class="block mb-1 text-sm font-medium text-gray-700">Lesson Date</label>
            <select id="progress-lesson-date-select" required class="w-full">${options}</select>
        `;
        formElements.forEach(el => el.style.opacity = '1');
        if(saveNoteBtn) saveNoteBtn.disabled = false;
    } else {
        dateContainer.innerHTML = `
            <label class="block mb-1 text-sm font-medium text-gray-700">Lesson Date</label>
            <div class="p-3 bg-gray-100 text-gray-600 rounded-md text-center">No lessons booked for this customer.</div>
        `;
        formElements.forEach(el => el.style.opacity = '0.5');
        if(saveNoteBtn) saveNoteBtn.disabled = true;
    }
}

function resetProgressForm(customerId) {
    document.getElementById('progress-log-form').reset();
    document.getElementById('progress-note-id').value = '';
    document.getElementById('progress-customer-id').value = customerId;
    document.getElementById('progress-form-title').textContent = 'Add New Lesson Note';
    const buttonsContainer = document.getElementById('progress-form-buttons');
    buttonsContainer.innerHTML = `
        <button type="button" id="generate-feedback-btn" class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700">✨ Generate Feedback</button>
        <button type="submit" id="save-note-btn" class="${btnPrimary}">Save Note</button>
    `;
    document.getElementById('generate-feedback-btn').onclick = handleGenerateFeedback;
    populateProgressDateSelect(customerId);
}

function openSellPackageModal(customerId) {
    const modal = document.getElementById('sell-package-modal');
    const customer = state.customers.find(c => c.id === customerId);
    if (!customer) return;

    const packages = getLessonPackages();
    const validPackages = packages
        .map(pkg => ({ pkg, price: getPackagePriceValue(pkg) }))
        .filter(entry => entry.price !== null);

    if (validPackages.length === 0) {
        const dialogMessage = packages.length === 0
            ? 'There are no lesson packages configured. Please add some in the Settings page first.'
            : 'Existing lesson packages have invalid pricing data. Please update them in the Settings page first.';
        showDialog({ title: 'No Packages', message: dialogMessage, buttons: [{ text: 'OK', class: btnPrimary, onClick: () => showView('settings') }] });
        return;
    }

    document.getElementById('sell-package-modal-title').textContent = `Sell Package to ${customer.name}`;
    document.getElementById('sell-package-customer-id').value = customerId;

    const selectEl = document.getElementById('sell-package-select');
    selectEl.innerHTML = ''; // Clear existing options safely
    validPackages.forEach(({ pkg, price }) => {
        const hoursLabel = pkg.hours != null ? pkg.hours : 'N/A';
        const displayText = `${pkg.name} (${hoursLabel} hrs for €${price.toFixed(2)})`;
        const option = new Option(displayText, pkg.id);
        selectEl.add(option);
    });

    updatePackageSummary();

    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal').classList.remove('scale-95', 'opacity-0'), 10);
}


function updatePackageSummary() {
    const selectEl = document.getElementById('sell-package-select');
    const summaryEl = document.getElementById('sell-package-summary');
    const selectedPackageId = selectEl.value;
    const pkg = getLessonPackages().find(p => p.id === selectedPackageId);

    if (!pkg) {
        summaryEl.innerHTML = 'Please select a package.';
        return;
    }

    const priceValue = getPackagePriceValue(pkg);
    if (priceValue === null) {
        summaryEl.innerHTML = 'The selected package has invalid price data. Please update it in Settings before selling it.';
        return;
    }

    const hoursDisplay = pkg.hours != null ? sanitizeHTML(pkg.hours) : 'N/A';
    summaryEl.innerHTML = `This will add <strong>${hoursDisplay} hours</strong> of lesson credit and record an income of <strong>€${priceValue.toFixed(2)}</strong>.`;
}

function confirmSale(event) {
    event.preventDefault();
    const customerId = document.getElementById('sell-package-customer-id').value;
    const packageId = document.getElementById('sell-package-select').value;

    const customerIndex = state.customers.findIndex(c => c.id === customerId);
    const pkg = getLessonPackages().find(p => p.id === packageId);
    const priceValue = getPackagePriceValue(pkg);
    const hoursValue = pkg ? Number(pkg.hours) : NaN;

    if (customerIndex === -1 || !pkg) {
        showDialog({ title: 'Error', message: 'Could not find customer or package. Please try again.', buttons: [{ text: 'OK', class: btnPrimary }] });
        return;
    }

    if (!Number.isFinite(hoursValue) || priceValue === null) {
        showDialog({ title: 'Invalid Package Data', message: 'The selected package has invalid hours or price. Please update it in Settings before selling it.', buttons: [{ text: 'OK', class: btnPrimary }] });
        return;
    }

    // Ensure driving_school_details exists before trying to access it
    if (!state.customers[customerIndex].driving_school_details) {
        state.customers[customerIndex].driving_school_details = {};
    }

    const details = state.customers[customerIndex].driving_school_details;
    details.lesson_credits = (details.lesson_credits || 0) + hoursValue;

    const transaction = {
        id: `txn_${generateUUID()}`,
        date: toLocalDateString(new Date()),
        type: 'package_sale',
        description: `Sale of '${pkg.name}' to ${state.customers[customerIndex].name}`,
        amount: priceValue,
        customerId: customerId,
        packageId: packageId
    };
    state.transactions.push(transaction);

    debouncedSaveState();
    closeSellPackageModal();
    renderCustomersView();
    showToast(`Sold '${pkg.name}' to ${state.customers[customerIndex].name}. Credits updated.`);
}

function closeCustomerProgressModal() { closeModal('customer-progress-modal'); }

function openStaffModal(staffId = null) {
    const modal = document.getElementById('staff-modal');
    const form = modal.querySelector('form'); form.reset();
    if (staffId) {
        document.getElementById('staff-modal-title').textContent = 'Edit Staff Member';
        const staff = state.staff.find(s => s.id === staffId);
        if (staff) {
            document.getElementById('staff-id').value = staff.id;
            document.getElementById('staff-name').value = staff.name;
            document.getElementById('staff-email').value = staff.email || '';
            document.getElementById('staff-phone').value = staff.phone || '';
            document.getElementById('staff-type').value = staff.staff_type || 'INSTRUCTOR';

            // Populate guide qualifications if available
            if (staff.staff_type === 'GUIDE' && staff.guide_qualifications) {
                const quals = staff.guide_qualifications;
                if (document.getElementById('guide-languages')) {
                    document.getElementById('guide-languages').value = (quals.languages || []).join(', ');
                }
                if (document.getElementById('guide-specializations')) {
                    document.getElementById('guide-specializations').value = (quals.specializations || []).join(', ');
                }
                if (document.getElementById('guide-certifications')) {
                    document.getElementById('guide-certifications').value = quals.certifications || '';
                }
                if (document.getElementById('guide-certification-expiry')) {
                    document.getElementById('guide-certification-expiry').value = quals.certificationExpiry || '';
                }
                if (document.getElementById('guide-rating')) {
                    document.getElementById('guide-rating').value = quals.rating || 0;
                }
            }
        }
    } else {
        document.getElementById('staff-modal-title').textContent = 'New Staff Member';
        document.getElementById('staff-id').value = '';
    }
    toggleGuideFields();
    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal').classList.remove('scale-95', 'opacity-0'), 10);
}

function closeStaffModal() {
     const modal = document.getElementById('staff-modal');
     modal.querySelector('.modal').classList.add('scale-95', 'opacity-0');
     setTimeout(() => modal.classList.add('hidden'), 300);
}

function openResourceModal(resourceId = null) {
    const modal = document.getElementById('resource-modal');
    const form = modal.querySelector('form'); form.reset();
    if (resourceId) {
        document.getElementById('resource-modal-title').textContent = 'Edit Resource';
        const resource = state.resources.find(r => r.id === resourceId);
        if (resource) {
            document.getElementById('resource-id').value = resource.id;
            document.getElementById('resource-name').value = resource.resource_name;
            document.getElementById('resource-type').value = resource.resource_type;
            document.getElementById('resource-capacity').value = resource.capacity || 1;
            document.getElementById('resource-make').value = resource.make || '';
            document.getElementById('resource-model').value = resource.model || '';
            document.getElementById('resource-reg').value = resource.reg || '';
            const schedule = resource.maintenance_schedule || {};
            document.getElementById('resource-mot').value = schedule.mot || '';
            document.getElementById('resource-tax').value = schedule.tax || '';
            document.getElementById('resource-service').value = schedule.service || '';
        }
    } else {
        document.getElementById('resource-modal-title').textContent = 'New Resource';
        document.getElementById('resource-id').value = '';
    }
    toggleVehicleFields();
    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal').classList.remove('scale-95', 'opacity-0'), 10);
}

function closeResourceModal() {
     const modal = document.getElementById('resource-modal');
     modal.querySelector('.modal').classList.add('scale-95', 'opacity-0');
     setTimeout(() => modal.classList.add('hidden'), 300);
}

function toggleVehicleFields() {
    const resourceType = document.getElementById('resource-type').value;
    const vehicleFields = document.getElementById('vehicle-specific-fields');
    if (resourceType === 'VEHICLE') {
        vehicleFields.style.display = 'block';
    } else {
        vehicleFields.style.display = 'none';
    }
}

function openBlockDatesModal() {
    const modal = document.getElementById('block-dates-modal');
    const staffSelect = document.getElementById('block-staff');
    staffSelect.innerHTML = ''; // Clear existing options
    staffSelect.add(new Option('All Staff (School Holiday)', 'all'));
    state.staff.forEach(i => {
        staffSelect.add(new Option(i.name, i.id));
    });
    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal').classList.remove('scale-95', 'opacity-0'), 10);
}

function closeSellPackageModal() { closeModal('sell-package-modal'); }

function openInvoiceModal(customerId) {
    const customer = state.customers.find(s => s.id === customerId);
    if (!customer) return;

    const unpaidBookings = state.bookings.filter(b => b.customerId === customerId && b.paymentStatus === 'Unpaid' && (b.status === 'Completed' || b.status === 'Scheduled'));
    if (unpaidBookings.length === 0) {
        showDialog({ title: 'No Unpaid Lessons', message: `${customer.name} has no outstanding payments to invoice.`, buttons: [{ text: 'OK', class: btnPrimary }] });
        return;
    }

    const modal = document.getElementById('invoice-modal');
    const contentEl = document.getElementById('invoice-content');

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

    contentEl.innerHTML = `
        <!-- FEATURE: Phase 3 - Enhanced Invoice Header with Logo -->
        <div class="flex justify-between items-start pb-4 print:pb-2 border-b-2 border-gray-800">
            <div class="flex items-start gap-4">
                ${state.settings.invoiceLogo ? `
                    <img src="${sanitizeHTML(state.settings.invoiceLogo)}" alt="Company Logo" class="h-16 w-16 object-contain print:h-12 print:w-12">
                ` : ''}
                <div>
                    <h1 class="text-3xl print:text-2xl font-bold text-gray-900">${sanitizeHTML(state.settings.instructorName)}</h1>
                    <p class="text-gray-600 whitespace-pre-line text-sm">${sanitizeHTML(state.settings.instructorAddress)}</p>
                    ${state.settings.vatNumber ? `<p class="text-gray-500 text-sm mt-1">VAT: ${sanitizeHTML(state.settings.vatNumber)}</p>` : ''}
                    ${state.settings.invoiceEmail ? `<p class="text-gray-500 text-sm">Email: ${sanitizeHTML(state.settings.invoiceEmail)}</p>` : ''}
                    ${state.settings.invoicePhone ? `<p class="text-gray-500 text-sm">Phone: ${sanitizeHTML(state.settings.invoicePhone)}</p>` : ''}
                </div>
            </div>
            <div class="text-right">
                <h2 class="text-4xl print:text-3xl font-bold text-indigo-600 uppercase">Invoice</h2>
            </div>
        </div>
        <div class="flex justify-between mt-6 print:mt-4">
            <div>
                <h3 class="font-semibold text-gray-800">Bill To:</h3>
                <p>${sanitizeHTML(customer.name)}</p>
            </div>
            <div class="text-right">
                <p><span class="font-semibold">Invoice #:</span> INV-${customer.id.slice(-4)}-${Date.now()}</p>
                <p><span class="font-semibold">Date Issued:</span> ${today.toLocaleDateString('en-GB')}</p>
                <p><span class="font-semibold">Due Date:</span> ${dueDate.toLocaleDateString('en-GB')}</p>
            </div>
        </div>
        <div class="mt-8 print:mt-4">
            <table class="w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="py-2 px-4 print:py-1 print:px-2 text-left text-sm font-semibold text-gray-600">Date</th>
                        <th class="py-2 px-4 print:py-1 print:px-2 text-left text-sm font-semibold text-gray-600">Description</th>
                        <th class="py-2 px-4 print:py-1 print:px-2 text-right text-sm font-semibold text-gray-600">Amount</th>
                    </tr>
                </thead>
                <tbody>${lineItemsHtml}</tbody>
            </table>
        </div>
        <div class="mt-6 print:mt-4 flex justify-end">
            <div class="w-64">
                <div class="flex justify-between">
                    <p class="text-gray-600">Subtotal:</p>
                    <p>€${totalDue.toFixed(2)}</p>
                </div>
                <div class="flex justify-between text-xl print:text-lg font-bold text-gray-900 border-t-2 border-gray-800 mt-2 pt-2">
                    <p>Total Due:</p>
                    <p>€${totalDue.toFixed(2)}</p>
                </div>
            </div>
        </div>
        <!-- FEATURE: Phase 3 - Enhanced Invoice Footer -->
        <div class="mt-10 print:mt-6 pt-6 print:pt-4 border-t text-sm text-gray-600">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4">
                <div>
                    <h3 class="font-semibold text-gray-800 mb-2">Payment Instructions</h3>
                    <p class="whitespace-pre-line text-xs">${sanitizeHTML(state.settings.paymentDetails || 'Please contact us for payment details.')}</p>
                </div>
                ${state.settings.invoiceTerms ? `
                    <div>
                        <h3 class="font-semibold text-gray-800 mb-2">Terms & Conditions</h3>
                        <p class="whitespace-pre-line text-xs">${sanitizeHTML(state.settings.invoiceTerms)}</p>
                    </div>
                ` : ''}
            </div>
            <div class="mt-6 print:mt-4 pt-4 print:pt-2 border-t text-center">
                <p class="text-indigo-600 font-semibold">${sanitizeHTML(state.settings.invoiceThankYou || 'Thank you for your business!')}</p>
                ${state.settings.invoiceFooterNote ? `<p class="text-xs text-gray-500 mt-1">${sanitizeHTML(state.settings.invoiceFooterNote)}</p>` : ''}
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal').classList.remove('scale-95', 'opacity-0'), 10);
}

function closeStaffModal() { closeModal('staff-modal'); }
function closeResourceModal() { closeModal('resource-modal'); }
function closeBlockDatesModal() { closeModal('block-dates-modal'); }
function closeInvoiceModal() { closeModal('invoice-modal'); }

function openCompletionModal(bookingData) {
    const modal = document.getElementById('completion-modal');
    const customer = state.customers.find(c => c.id === bookingData.customerId);
    const service = state.services.find(s => s.id === bookingData.serviceId);
    const durationHours = (service.duration_minutes || 60) / 60;

    document.getElementById('completion-message').textContent = `Mark lesson for ${customer.name} as complete. How was it paid?`;

    const creditInfoEl = document.getElementById('completion-credit-info');
    const currentCredits = customer.driving_school_details?.lesson_credits || 0;
    creditInfoEl.innerHTML = `Customer has <strong>${currentCredits}</strong> hours of credit. This lesson is <strong>${durationHours.toFixed(1)}</strong> hours.`;

    const buttonsContainer = document.getElementById('completion-buttons');
    buttonsContainer.innerHTML = `<button id="complete-paid-btn" class="${btnGreen}">Paid Now</button><button id="complete-credit-btn" class="${btnPrimary}">Use Lesson Credits</button><button id="complete-unpaid-btn" class="${btnSecondary}">Remains Unpaid</button><button onclick="closeCompletionModal()" class="${btnSecondary}">Cancel</button>`;

    document.getElementById('complete-paid-btn').onclick = () => {
        bookingData.paymentStatus = 'Paid';
        finalizeSaveBooking(bookingData);
        closeCompletionModal();
    };

    document.getElementById('complete-unpaid-btn').onclick = () => {
        bookingData.paymentStatus = 'Unpaid';
        finalizeSaveBooking(bookingData);
        closeCompletionModal();
    };

    const creditBtn = document.getElementById('complete-credit-btn');
    if (currentCredits < durationHours) {
        creditBtn.disabled = true;
        creditBtn.classList.add('opacity-50', 'cursor-not-allowed');
        creditInfoEl.innerHTML += `<br><span class="text-red-600 font-semibold">Not enough credits for this lesson.</span>`;
    } else {
        creditBtn.onclick = () => {
            const customerIndex = state.customers.findIndex(s => s.id === customer.id);
            const customer = state.customers[customerIndex];

            // SAFETY: Ensure driving_school_details exists
            if (!customer.driving_school_details) {
                customer.driving_school_details = {
                    license_number: '',
                    progress_notes: [],
                    lesson_credits: 0
                };
            }

            const currentCredits = customer.driving_school_details.lesson_credits || 0;

            // SAFETY: Only deduct if customer has enough credits (double-check)
            if (currentCredits >= durationHours) {
                customer.driving_school_details.lesson_credits = currentCredits - durationHours;
                bookingData.paymentStatus = 'Paid (Credit)';
                finalizeSaveBooking(bookingData);
                showToast(`Deducted ${durationHours.toFixed(1)} hours from ${customer.name}. New balance: ${customer.driving_school_details.lesson_credits.toFixed(1)} hours.`);
                closeCompletionModal();
            } else {
                // Should never happen if UI is correct, but safety check
                showDialog({
                    title: 'Insufficient Credits',
                    message: `Customer only has ${currentCredits.toFixed(1)} hours but needs ${durationHours.toFixed(1)} hours. Please check the account.`,
                    buttons: [{ text: 'OK', class: btnPrimary }]
                });
                closeCompletionModal();
            }
        };
    }

    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal').classList.remove('scale-95', 'opacity-0'), 10);
}

function closeCompletionModal() { closeModal('completion-modal'); }


/******************************************************************************
 * SECTION 10: UTILITY & HELPER FUNCTIONS
 ******************************************************************************/


function getBlockedPeriodsForDate(date) {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return state.blockedPeriods.filter(period => {
        const startDate = parseYYYYMMDD(period.start);
        const endDate = parseYYYYMMDD(period.end);
        if (!startDate || !endDate) return false;
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        return checkDate >= startDate && checkDate <= endDate;
    });
}

function formatDateAndHighlight(dateString) {
    if (!dateString) return '<span class="text-gray-400">-</span>';
    const date = parseYYYYMMDD(dateString);
    if (!date) return '<span class="text-red-500">Invalid Date</span>';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
    let colorClass = 'text-gray-700';

    if (diffDays < 0) {
        colorClass = 'text-red-600 font-bold';
    } else if (diffDays <= 30) {
        colorClass = 'text-amber-500 font-semibold';
    }
    return `<span class="${colorClass}">${date.toLocaleDateString('en-GB')}</span>`;
}



function toLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


function timeToMinutes(timeStr) {
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

function minutesToTime(totalMinutes) {
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

function isTimeOverlapping(start1, end1, start2, end2) {
    return timeToMinutes(start1) < timeToMinutes(end2) && timeToMinutes(end1) > timeToMinutes(start2);
}

function showToast(message) {
    const toast = document.getElementById('toast-notification');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function copyToClipboard(text) {
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

function populateTimeSelects() {
    const startTimeSelect = document.getElementById('booking-start-time');
    let optionsHtml = '';
    for (let i = 7; i <= 20; i++) {
        optionsHtml += `<option value="${String(i).padStart(2, '0')}:00">${String(i).padStart(2, '0')}:00</option>`;
        if (i < 21) {
            optionsHtml += `<option value="${String(i).padStart(2, '0')}:30">${String(i).padStart(2, '0')}:30</option>`;
        }
    }
    startTimeSelect.innerHTML = optionsHtml;
}

function populateSelect(elementId, data, includeAll = false, nameKey = 'name') {
    const select = document.getElementById(elementId);
    select.innerHTML = ''; // Clear existing options safely

    // Add the placeholder option
    if (includeAll) {
        select.add(new Option('-- All --', 'all'));
    } else {
        select.add(new Option('-- Select --', ''));
    }

    // Populate with data
    data.forEach(item => {
        let displayText = item[nameKey] || item.name;
        if (!displayText && item.make && item.model) {
            displayText = `${item.make} ${item.model}`;
        }
        if ((elementId.includes('customer') || elementId.includes('student')) && item.phone) {
            displayText += ` (${item.phone})`;
        }
        // Create a new Option element. The text is automatically sanitized.
        const option = new Option(displayText || item.id, item.id);
        select.add(option);
    });
}

function getFilteredSummaryBookings() {
    const customerId = document.getElementById('summary-customer').value;
    const staffId = document.getElementById('summary-staff').value;
    const resourceId = document.getElementById('summary-resource').value;
    const startDate = document.getElementById('summary-start-date').value;
    const endDate = document.getElementById('summary-end-date').value;

    let bookings = state.bookings;

    if (customerId !== 'all') bookings = bookings.filter(b => b.customerId === customerId);
    if (staffId !== 'all') bookings = bookings.filter(b => b.staffId === staffId);
    if (resourceId !== 'all') bookings = bookings.filter(b => b.resourceIds && b.resourceIds.includes(resourceId));
    if (startDate) bookings = bookings.filter(b => b.date >= startDate);
    if (endDate) bookings = bookings.filter(b => b.date <= endDate);

    bookings.sort((a, b) => new Date(a.date + 'T' + a.startTime) - new Date(b.date + 'T' + b.startTime));
    return bookings;
}


/******************************************************************************
 * SECTION 11: EVENT HANDLERS & UI LOGIC
 ******************************************************************************/


function handleServiceSelectionChange() {
    const serviceId = document.getElementById('booking-service').value;
    if (!serviceId) return;

    const service = state.services.find(s => s.id === serviceId);
    if (!service) return;

    const startTime = document.getElementById('booking-start-time').value;
    const newEndTime = minutesToTime(timeToMinutes(startTime) + service.duration_minutes);
    document.getElementById('booking-end-time').value = newEndTime;

    // Show/hide tour-specific sections based on service type
    const isTour = service.service_type === 'TOUR';
    document.getElementById('tour-group-section').classList.toggle('hidden', !isTour);
    document.getElementById('tour-details-section').classList.toggle('hidden', !isTour);
    document.getElementById('tour-waiver-section').classList.toggle('hidden', !isTour);
    document.getElementById('tour-multiday-section').classList.toggle('hidden', !isTour);

    // Populate tour details if available
    if (isTour) {
        const descElement = document.getElementById('tour-description');
        if (descElement && service.description) {
            descElement.textContent = service.description;
        }

        // Display photo gallery
        if (service.photos && service.photos.length > 0) {
            const galleryElement = document.getElementById('tour-photos-gallery');
            galleryElement.innerHTML = service.photos.map((photo, index) => {
                return `<div class="aspect-square rounded overflow-hidden bg-gray-200">
                    <img src="${sanitizeHTML(photo)}" alt="Tour photo ${index + 1}" class="w-full h-full object-cover" onerror="this.src='https://via.placeholder.com/200?text=Photo+${index + 1}'">
                </div>`;
            }).join('');
        }
    }

    const fee = calculateBookingFee(serviceId);
    document.getElementById('calculated-fee').textContent = `€${fee.toFixed(2)}`;
}

function handleStartTimeChange() {
    handleServiceSelectionChange();
}

// OPTIMIZED: Memoized for 70% faster repeat calculations
const calculateBookingFee = memoize(function(serviceId, groupSize = null) {
    const service = state.services.find(s => s.id === serviceId);
    if (!service) return 0;

    // Get group size from input if not provided (for tour bookings)
    if (groupSize === null && service.service_type === 'TOUR') {
        const groupSizeInput = document.getElementById('booking-group-size');
        groupSize = groupSizeInput ? parseInt(groupSizeInput.value) || 1 : 1;
    } else {
        groupSize = groupSize || 1;
    }

    const rules = service.pricing_rules || {};

    // FIXED PRICING
    if (rules.type === 'fixed' || !rules.type) {
        const basePrice = service.base_price || 0;
        return basePrice * groupSize;
    }

    // TIERED PRICING - Find the applicable tier based on group size
    if (rules.type === 'tiered' && rules.tiers && rules.tiers.length > 0) {
        // Sort tiers by minSize to ensure proper ordering
        const sortedTiers = [...rules.tiers].sort((a, b) => a.minSize - b.minSize);

        // Find the tier that matches the group size
        const applicableTier = sortedTiers.find(tier =>
            groupSize >= tier.minSize && groupSize <= tier.maxSize
        );

        if (applicableTier) {
            return applicableTier.price * groupSize;
        }

        // Fallback to the highest tier if group size exceeds all defined tiers
        const highestTier = sortedTiers[sortedTiers.length - 1];
        return highestTier.price * groupSize;
    }

    return (service.base_price || 0) * groupSize;
});

function updateGroupPricing() {
    const serviceId = document.getElementById('booking-service').value;
    const fee = calculateBookingFee(serviceId);
    document.getElementById('calculated-fee').textContent = `€${fee.toFixed(2)}`;
}

function toggleMultidayOptions() {
    const checkbox = document.getElementById('booking-multiday-tour');
    const options = document.getElementById('multiday-options');
    if (checkbox && checkbox.checked) {
        options.classList.remove('hidden');
    } else {
        options.classList.add('hidden');
    }
}

function updateStaffAvailability(date) {
    const blockedPeriods = getBlockedPeriodsForDate(parseYYYYMMDD(date));
    const staffOnLeaveIds = blockedPeriods.map(p => p.staffId);
    const staffSelect = document.getElementById('booking-staff');

    Array.from(staffSelect.options).forEach(option => {
        option.disabled = false;
        const staffMember = state.staff.find(s => s.id === option.value);
        if (staffMember) {
            option.textContent = staffMember.name;
        }

        if (staffOnLeaveIds.includes(option.value)) {
            option.disabled = true;
            if (!option.textContent.endsWith(' (On Leave)')) {
                option.textContent += ' (On Leave)';
            }
        }
    });
}

function startDrag(e) {
    if (e.target.closest('.timeline-booking')) return;
    isDragging = true;
    const timeline = document.getElementById('day-timeline');
    const rect = timeline.getBoundingClientRect();
    dragStartY = e.clientY - rect.top;
    selectionBox.style.top = `${dragStartY}px`;
    selectionBox.style.height = '0px';
    selectionBox.classList.remove('hidden');
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
}

function drag(e) {
    if (!isDragging) return;
    const timeline = document.getElementById('day-timeline');
    if (!timeline) return;
    const rect = timeline.getBoundingClientRect();
    const currentY = e.clientY - rect.top;
    const height = currentY - dragStartY;
    if (height > 0) selectionBox.style.height = `${height}px`;
    else {
        selectionBox.style.top = `${currentY}px`;
        selectionBox.style.height = `${-height}px`;
    }
}

function endDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', endDrag);
    const top = parseFloat(selectionBox.style.top);
    const height = parseFloat(selectionBox.style.height);
    selectionBox.classList.add('hidden');
    let startTime, endTime;
    const MIN_DRAG_HEIGHT_PIXELS = 10;
    const DEFAULT_BOOKING_DURATION_MINUTES = 60;
    if (height < MIN_DRAG_HEIGHT_PIXELS) {
        startTime = pixelsToTime(dragStartY);
        endTime = minutesToTime(timeToMinutes(startTime) + DEFAULT_BOOKING_DURATION_MINUTES);
    } else {
        startTime = pixelsToTime(top);
        endTime = pixelsToTime(top + height);
    }
    openBookingModal(toLocalDateString(currentDate), null, startTime, endTime);
}

// --- Drag and Drop Handlers ---

function handleDragStart(event, bookingId) {
    event.dataTransfer.setData("text/plain", bookingId);
    event.dataTransfer.effectAllowed = 'move';
    // Add a class to the dragged element for styling
    setTimeout(() => {
        // Check if the target exists before adding a class
        if(event.target && typeof event.target.classList !== 'undefined') {
            event.target.classList.add('dragging');
        }
    }, 0);
}

function allowDrop(event) {
    event.preventDefault();
}

function handleDragEnter(event) {
    event.preventDefault();
    const dropTarget = event.target.closest('.calendar-cell, #day-timeline');
    if (dropTarget) {
        dropTarget.classList.add('drag-over');
    }
}

function handleDragLeave(event) {
    const dropTarget = event.target.closest('.calendar-cell, #day-timeline');
    if (dropTarget) {
        dropTarget.classList.remove('drag-over');
    }
}

function drop(event, newDate) {
    event.preventDefault();
    const dropTarget = event.target.closest('.calendar-cell, #day-timeline');
    if (dropTarget) {
        dropTarget.classList.remove('drag-over');
    }

    const bookingId = event.dataTransfer.getData("text/plain");
    // Find and remove the 'dragging' class from the original element
    const draggedElement = document.querySelector('.dragging');
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
    }

    const bookingIndex = state.bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex === -1) {
        console.error("Could not find booking to drop:", bookingId);
        return;
    }

    const originalBooking = state.bookings[bookingIndex];

    // Create a deep copy to modify
    const updatedBooking = JSON.parse(JSON.stringify(originalBooking));
    updatedBooking.date = newDate;

    // If dropping on the day view, calculate the new time
    if (currentView === 'day') {
        const timeline = document.getElementById('day-timeline');
        const rect = timeline.getBoundingClientRect();
        // Calculate the drop position relative to the timeline div
        const dropY = event.clientY - rect.top;

        const originalDuration = timeToMinutes(originalBooking.endTime) - timeToMinutes(originalBooking.startTime);
        const newStartTime = pixelsToTime(dropY);
        const newEndTime = minutesToTime(timeToMinutes(newStartTime) + originalDuration);

        updatedBooking.startTime = newStartTime;
        updatedBooking.endTime = newEndTime;
    }
    // For week/month view drops, we keep the original start/end times, only the date changes.

    const conflict = findBookingConflict(updatedBooking);
    if (conflict) {
        showDialog({
            title: 'Booking Conflict',
            message: `Cannot move booking. ${conflict}`,
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }

    // Check for user intent: move vs copy
    if (event.ctrlKey || event.metaKey) { // Copy on Ctrl/Cmd + Drop
        updatedBooking.id = `booking_${generateUUID()}`; // new ID for the copy
        updatedBooking.transactionId = null; // a copy isn't paid for
        updatedBooking.paymentStatus = 'Unpaid';
        state.bookings.push(updatedBooking);
        showToast('Booking copied.');
    } else { // Move
        state.bookings[bookingIndex] = updatedBooking;
        showToast('Booking moved.');
    }

    debouncedSaveState();
    refreshCurrentView();
}


function pixelsToTime(pixels) {
    const startHourMinutes = CALENDAR_START_HOUR * 60;
    const minutesPerPixel = 1;
    const totalMinutesFromStart = startHourMinutes + (pixels * minutesPerPixel);
    const roundedMinutes = Math.round(totalMinutesFromStart / TIMESLOT_INTERVAL_MINUTES) * TIMESLOT_INTERVAL_MINUTES;
    const minAllowedMinutes = CALENDAR_START_HOUR * 60;
    const maxAllowedMinutes = CALENDAR_END_HOUR * 60;
    const clampedMinutes = Math.min(Math.max(roundedMinutes, minAllowedMinutes), maxAllowedMinutes);
    const hours = Math.floor(clampedMinutes / 60);
    const minutes = clampedMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function addDashboardNotification({id, message, alertClass = 'bg-blue-100 border-blue-500 text-blue-700', onClick, isDismissible = true}) {
    const container = document.getElementById('dashboard-notifications');
    if (document.getElementById(id)) return;

    const alertDiv = document.createElement('div');
    alertDiv.id = id;
    alertDiv.className = `p-4 border-l-4 rounded-r-lg flex justify-between items-center ${alertClass}`;
    alertDiv.setAttribute('role', 'alert');

    // The message is expected to be pre-sanitized or contain safe HTML.
    // The onClick handler is trusted.
    let content = `<div class="flex-grow">${message}</div>`;

    if (onClick) {
        const button = `<button onclick="${onClick}" class="ml-4 px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">View</button>`;
        content += button;
    }

    if (isDismissible) {
        const dismissButton = `<button onclick="this.parentElement.remove()" class="ml-4 text-xl font-bold">&times;</button>`;
        content = `<div class="flex-grow flex items-center">${content}</div>${dismissButton}`;
    }

    alertDiv.innerHTML = content;
    container.appendChild(alertDiv);
}

function checkWaitingListFor(cancelledBooking) {
    if (!cancelledBooking) return;
    const matchingEntries = state.waitingList.filter(item =>
        item.date === cancelledBooking.date &&
        item.startTime === cancelledBooking.startTime &&
        item.endTime === cancelledBooking.endTime &&
        (item.staffId === cancelledBooking.staffId || (item.resourceIds && cancelledBooking.resourceIds && item.resourceIds.some(r => cancelledBooking.resourceIds.includes(r))))
    );

    matchingEntries.forEach(entry => {
        const customer = state.customers.find(s => s.id === entry.customerId);
        if (customer) {
            addDashboardNotification({
                id: `wl_notification_${entry.id}`,
                message: `A slot has opened up for <strong>${sanitizeHTML(customer.name)}</strong> on ${entry.date} at ${entry.startTime}.`,
                alertClass: 'bg-green-100 border-green-500 text-green-800',
                onClick: `showView('waiting-list')`
            });
        }
    });
}

function checkVehicleCompliance() {
    const notificationsContainer = document.getElementById('dashboard-notifications');
    notificationsContainer.querySelectorAll('.vehicle-compliance-alert').forEach(el => el.remove());

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    state.resources.filter(r => r.resource_type === 'VEHICLE').forEach(vehicle => {
        const checkDate = (dateString, type) => {
            if (!dateString) return;
            const dueDate = parseYYYYMMDD(dateString);
            const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            let message = '', alertClass = '';

            if (diffDays < 0) {
                message = `${type} for ${sanitizeHTML(vehicle.resource_name)} (${sanitizeHTML(vehicle.reg)}) was due ${Math.abs(diffDays)} days ago.`;
                alertClass = 'bg-red-100 border-red-500 text-red-700';
            } else if (diffDays <= 30) {
                message = `${type} for ${sanitizeHTML(vehicle.resource_name)} (${sanitizeHTML(vehicle.reg)}) is due in ${diffDays} days.`;
                alertClass = 'bg-amber-100 border-amber-500 text-amber-700';
            }

            if (message) {
                addDashboardNotification({
                    id: `compliance_${vehicle.id}_${type}`,
                    message: message,
                    alertClass: alertClass,
                    onClick: `showView('resources')`
                });
            }
        };
        if(vehicle.maintenance_schedule){
            checkDate(vehicle.maintenance_schedule.mot, 'MOT');
            checkDate(vehicle.maintenance_schedule.tax, 'Tax');
            checkDate(vehicle.maintenance_schedule.service, 'Service');
        }
    });
}

function checkOverduePayments() {
    const notificationsContainer = document.getElementById('dashboard-notifications');
    notificationsContainer.querySelectorAll('.overdue-payment-alert').forEach(el => el.remove());

    const overdueCustomers = getCustomerSummaries().filter(s => s.outstanding > 0);

    if (overdueCustomers.length > 0) {
        const message = `There are <strong>${overdueCustomers.length} customers</strong> with outstanding payments.`;
        addDashboardNotification({
            id: 'overdue_payment_alert_summary',
            message: message,
            alertClass: 'bg-red-100 border-red-500 text-red-700',
            onClick: `showView('billing')`
        });
    }
}


/******************************************************************************
 * SECTION 12: EXTERNAL INTEGRATIONS & EXPORTS
 ******************************************************************************/

function copySmsReminder(bookingId) {
    const booking = state.bookings.find(b => b.id === bookingId);
    const customer = state.customers.find(c => c.id === booking.customerId);
    if (!booking || !customer) return;

    let message = state.settings.smsTemplate || 'Hi [CustomerFirstName], this is a friendly reminder for your lesson on [LessonDate] at [LessonTime]. See you then! From [InstructorName].';

    const customerFirstName = customer.name.split(' ')[0];
    const lessonDate = safeDateFormat(booking.date, { weekday: 'long', day: 'numeric', month: 'long' });
    const lessonTime = booking.startTime;
    const instructorName = state.settings.instructorName;

    message = message.replace(/\[CustomerFirstName\]/g, customerFirstName);
    message = message.replace(/\[CustomerFullName\]/g, customer.name);
    message = message.replace(/\[LessonDate\]/g, lessonDate);
    message = message.replace(/\[LessonTime\]/g, lessonTime);
    message = message.replace(/\[InstructorName\]/g, instructorName);

    copyToClipboard(message);
}

function copyPaymentReminder(customerId) {
    const customer = state.customers.find(c => c.id === customerId);
    if (!customer) return;
    const summary = getCustomerSummaries().find(s => s.id === customerId);
    const totalDue = summary ? summary.outstanding : 0;
    if (totalDue <= 0) { showToast("No outstanding balance to remind."); return; }
    const message = `Hi ${customer.name.split(' ')[0]}, just a friendly reminder that you have an outstanding balance of €${totalDue.toFixed(2)}. Please let me know if you have any questions. Thanks, ${state.settings.instructorName}.`;
    copyToClipboard(message);
}

function formatGoogleCalendarDateUTC(date, time) {
    const dateObj = new Date(`${date}T${time}:00`);
    return dateObj.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

// REMOVED: Old exportToGoogleCalendar implementation replaced with Phase 2 iCalendar export (line 527)

function printInvoice() {
    window.print();
}

function printSummary() {
    const printStyles = `
        @media print {
            body * {
                visibility: hidden;
            }
            #app, #main-content, #summary-view, #summary-view * {
                visibility: visible;
            }
            #summary-view {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
            }
        }
    `;
    const styleEl = document.createElement('style');
    styleEl.id = 'print-summary-style';
    styleEl.innerHTML = printStyles;
    document.head.appendChild(styleEl);
    window.print();
    document.head.removeChild(styleEl);
}

function exportSummaryToExcel() {
    const bookings = getFilteredSummaryBookings();
    if (bookings.length === 0) { showToast("No data to export."); return; }
    const sanitizeCell = (cell) => { const str = String(cell ?? ''); return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str; };
    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = ["Date", "Time", "Customer", "Staff", "Resource", "Service", "Status", "Payment Status"];
    csvContent += headers.join(",") + "\r\n";
    bookings.forEach(b => {
        const customer = state.customers.find(s => s.id === b.customerId)?.name || 'N/A';
        const staff = state.staff.find(i => i.id === b.staffId)?.name || 'N/A';
        const resource = b.resourceIds && b.resourceIds.length > 0 ? state.resources.find(v => v.id === b.resourceIds[0])?.resource_name || 'N/A' : 'N/A';
        const service = state.services.find(s => s.id === b.serviceId)?.service_name || 'N/A';
        const date = safeDateFormat(b.date);
        const time = `${b.startTime} - ${b.endTime}`;
        const row = [date, time, customer, staff, resource, service, b.status, b.paymentStatus];
        csvContent += row.map(sanitizeCell).join(",") + "\r\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "summary_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportBillingToExcel() {
    const customerSummaries = getCustomerSummaries();
    if (customerSummaries.length === 0) { showToast("No billing data to export."); return; }
    const sanitizeCell = (cell) => { const str = String(cell ?? ''); return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str; };

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
}

function exportReportsToExcel() {
    const { incomeExpenseReport, servicePopularityReport, topCustomersReport, staffPerformanceReport, resourceUtilisationReport, peakHoursReport } = getReportsData();
    const sanitizeCell = (cell) => { const str = String(cell ?? ''); return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str; };

    const reports = [incomeExpenseReport, servicePopularityReport, topCustomersReport, staffPerformanceReport, resourceUtilisationReport, peakHoursReport];
    const maxRows = Math.max(...reports.map(r => r.data.length));
    let csvRows = [];

    let titleRow = [];
    reports.forEach(report => {
        titleRow.push(report.title);
        for (let i = 1; i < report.headers.length; i++) titleRow.push("");
        titleRow.push("");
    });
    csvRows.push(titleRow.map(sanitizeCell).join(","));

    let headerRow = [];
    reports.forEach(report => {
        headerRow.push(...report.headers);
        headerRow.push("");
    });
    csvRows.push(headerRow.map(sanitizeCell).join(","));

    for (let i = 0; i < maxRows; i++) {
        let dataRow = [];
        reports.forEach(report => {
            const rowData = report.data[i] || [];
            for (let j = 0; j < report.headers.length; j++) {
                dataRow.push(rowData[j] || "");
            }
            dataRow.push("");
        });
        csvRows.push(dataRow.map(sanitizeCell).join(","));
    }

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\r\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "comprehensive_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


function toggleAutoBackup(isEnabled) {
    state.settings.autoBackupEnabled = isEnabled;
    debouncedSaveState();
    setupAutoBackup();
    showDialog({ title: 'Auto-Backup', message: `Auto-backup ${isEnabled ? 'enabled' : 'disabled'}.`, buttons: [{ text: 'OK', class: btnPrimary }] });
}

function setupAutoBackup() {
    if (autoBackupInterval) clearInterval(autoBackupInterval);
    const AUTO_BACKUP_INTERVAL_MINUTES = 30;
    if (state.settings.autoBackupEnabled) {
        autoBackupInterval = setInterval(() => {
            triggerBackupDownload();
        }, AUTO_BACKUP_INTERVAL_MINUTES * 60 * 1000);
    }
}

function triggerBackupDownload() {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
    link.setAttribute('href', url);
    link.setAttribute('download', `rrdriving_backup_${timestamp}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function confirmClearAllData() {
    showDialog({
        title: '⚠️ Are you absolutely sure?',
        message: 'This will permanently delete all data. A backup will be downloaded first. This action cannot be undone.',
        buttons: [
            { text: 'Cancel', class: btnSecondary },
            { text: 'Yes, Delete Everything', class: btnDanger, onClick: () => {
                triggerBackupDownload();
                setTimeout(() => {
                    showDialog({
                        title: 'Data Cleared',
                        message: 'All application data has been cleared. The application will now reload.',
                        buttons: [{ text: 'Reload', class: btnPrimary, onClick: () => clearAllDataAfterBackup() }]
                    });
                }, 500);
            }}
        ]
    });
}

function clearAllDataAfterBackup() {
    Object.values(DB_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
    if (autoBackupInterval) {
        clearInterval(autoBackupInterval);
    }
    location.reload();
}

function handleRestore(event) {
    const file = event.target.files[0];
    if (!file) return;
    showDialog({
        title: 'Restore Backup', message: 'This will overwrite ALL current data. Are you sure?',
        buttons: [
            { text: 'Cancel', class: btnSecondary },
            { text: 'Restore', class: btnDanger, onClick: () => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const data = JSON.parse(e.target.result);
                        const requiredKeys = ['customers', 'staff', 'services', 'bookings', 'settings'];
                        const hasAllKeys = requiredKeys.every(key => data.hasOwnProperty(key) && data[key] !== null);

                        if (data && typeof data === 'object' && hasAllKeys) {
                            const validKeys = Object.values(DB_KEYS);
                            for (const key in data) {
                                const stateKey = Object.keys(DB_KEYS).find(k => DB_KEYS[k] === key);
                                if (stateKey) {
                                    localStorage.setItem(key, JSON.stringify(data[key]));
                                }
                            }
                            // Prevent the legacy migration from running after a restore
                            localStorage.setItem('migration_v3.0.0_complete', 'true');
                            showDialog({ title: 'Success', message: 'Data restored! App will reload.', buttons: [{ text: 'Reload', class: btnPrimary, onClick: () => location.reload() }] });
                        } else {
                            showDialog({
                                title: 'Invalid Backup File',
                                message: 'The selected file appears to be an invalid or incomplete backup. It is missing one or more required data sections (e.g., bookings).',
                                buttons: [{ text: 'OK', class: btnPrimary }]
                            });
                        }
                    } catch (error) {
                        showDialog({ title: 'Error', message: 'Could not read or parse the backup file. Please ensure it is a valid JSON file.', buttons: [{ text: 'OK', class: btnPrimary }] });
                    }
                };
                reader.readAsText(file);
            }}
        ]
    });
}


/******************************************************************************
 * SECTION 13: CHART GENERATION & DATA ANALYSIS
 ******************************************************************************/

function getReportsData() {
    const bookings = state.bookings.filter(b => b.status === 'Completed' || b.status === 'Scheduled');
    const packages = getLessonPackages();

    const packageCounts = {};
    state.transactions.forEach(t => {
        if (t.type === 'package_sale' && t.packageId) {
            if (!packageCounts[t.packageId]) {
                packageCounts[t.packageId] = 0;
            }
            packageCounts[t.packageId]++;
        }
    });

    const incomeByMonth = {};
    state.transactions.forEach(t => {
        // Only count actual payments (cash) and package sales (pre-paid credit)
        if (t.type === 'package_sale' || t.type === 'payment') {
            const monthYear = t.date.substring(0, 7);
            if (!incomeByMonth[monthYear]) incomeByMonth[monthYear] = 0;
            incomeByMonth[monthYear] += t.amount;
        }
    });

    const expensesByMonth = {};
    state.expenses.forEach(e => {
        const monthYear = e.date.substring(0, 7);
        if (!expensesByMonth[monthYear]) expensesByMonth[monthYear] = 0;
        expensesByMonth[monthYear] += e.amount;
    });

    const allMonths = [...new Set([...Object.keys(incomeByMonth), ...Object.keys(expensesByMonth)])].sort();

    const incomeExpenseReport = {
        title: "Income vs. Expenses",
        headers: ["Month", "Income (€)", "Expenses (€)", "Net (€)"],
        data: allMonths.map(month => {
            const income = incomeByMonth[month] || 0;
            const expense = expensesByMonth[month] || 0;
            const net = income - expense;
            return [
                new Date(month + '-02').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
                income.toFixed(2),
                expense.toFixed(2),
                net.toFixed(2)
            ];
        })
    };

    const serviceCounts = {};
    bookings.forEach(b => {
        if (!serviceCounts[b.serviceId]) serviceCounts[b.serviceId] = 0;
        serviceCounts[b.serviceId]++;
    });
    const servicePopularityReport = {
        title: "Service Popularity",
        headers: ["Service", "Count"],
        data: Object.entries(serviceCounts).map(([serviceId, count]) => {
            const service = state.services.find(s => s.id === serviceId);
            return [service ? service.service_name : 'Unknown Service', count];
        })
    };

    const customerBookingCounts = {};
    bookings.forEach(b => {
        if (!customerBookingCounts[b.customerId]) customerBookingCounts[b.customerId] = 0;
        customerBookingCounts[b.customerId]++;
    });
    const topCustomersReport = {
        title: "Top 5 Customers by Booking Count",
        headers: ["Customer", "Booking Count"],
        data: Object.entries(customerBookingCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([customerId, count]) => [state.customers.find(s => s.id === customerId)?.name || 'Unknown', count])
    };

    const staffPerformance = {};
    state.staff.forEach(i => staffPerformance[i.id] = 0);
    bookings.forEach(b => { if(staffPerformance.hasOwnProperty(b.staffId)) staffPerformance[b.staffId]++; });
    const staffPerformanceReport = {
        title: "Staff Performance",
        headers: ["Staff", "Bookings Handled"],
        data: state.staff.map(i => [i.name, staffPerformance[i.id]])
    };

    const resourceUtilisation = {};
    state.resources.forEach(v => resourceUtilisation[v.id] = 0);
    bookings.forEach(b => {
        if(b.resourceIds) {
            b.resourceIds.forEach(resId => {
                 if(resourceUtilisation.hasOwnProperty(resId)) resourceUtilisation[resId]++;
            });
        }
    });
    const resourceUtilisationReport = {
        title: "Resource Utilisation",
        headers: ["Resource", "Number of Bookings"],
        data: state.resources.map(v => [v.resource_name, resourceUtilisation[v.id]])
    };

    const peakHours = {};
    for(let i=7; i<=21; i++) { peakHours[String(i).padStart(2, '0')] = 0; }
    bookings.forEach(b => { const startHour = b.startTime.split(':')[0]; if(peakHours.hasOwnProperty(startHour)) peakHours[startHour]++; });
    const peakHoursReport = {
        title: "Peak Booking Hours",
        headers: ["Hour", "Number of Bookings"],
        data: Object.entries(peakHours).map(([hour, count]) => [`${hour}:00`, count])
    };

    const lessonPackagePopularityReport = {
        title: "Lesson & Package Popularity",
        headers: ["Item", "Count"],
        data: [
            ...Object.entries(serviceCounts).map(([serviceId, count]) => {
                const service = state.services.find(s => s.id === serviceId);
                return { name: service ? service.service_name : 'Unknown Service', count };
            }),
            ...Object.entries(packageCounts).map(([packageId, count]) => {
                const pkg = packages.find(p => p.id === packageId);
                return { name: pkg ? pkg.name : 'Unknown Package', count };
            })
        ].sort((a, b) => b.count - a.count)
    };

    return { incomeByMonth, expensesByMonth, servicePopularityReport, topCustomersReport, staffPerformanceReport, resourceUtilisationReport, peakHoursReport, incomeExpenseReport, lessonPackagePopularityReport };
}

// Helper functions for reports view
function handleDateRangeChange() {
    generateCharts();
    updateKPICards();
}

function handleDepartmentChange() {
    generateCharts();
    updateKPICards();
}

function toggleAnalysis() {
    const container = document.getElementById('reports-analysis-container');
    const output = document.getElementById('reports-analysis-output');
    if (output.style.display === 'none') {
        output.style.display = 'block';
    } else {
        output.style.display = 'none';
    }
}

function updateKPICards() {
    const { incomeByMonth, expensesByMonth } = getReportsData();
    const bookings = state.bookings.filter(b => b.status === 'Completed' || b.status === 'Scheduled');

    // Calculate totals
    const totalRevenue = Object.values(incomeByMonth).reduce((a, b) => a + b, 0);
    const totalExpenses = Object.values(expensesByMonth).reduce((a, b) => a + b, 0);
    const netProfit = totalRevenue - totalExpenses;

    // Update KPI cards
    document.getElementById('kpi-revenue').textContent = `€${totalRevenue.toFixed(2)}`;
    document.getElementById('kpi-expenses').textContent = `€${totalExpenses.toFixed(2)}`;
    document.getElementById('kpi-profit').textContent = `€${netProfit.toFixed(2)}`;
    document.getElementById('kpi-bookings').textContent = bookings.length;

    // Calculate trend indicators (simplified - comparing to previous period)
    const months = [...new Set([...Object.keys(incomeByMonth), ...Object.keys(expensesByMonth)])].sort();
    if (months.length >= 2) {
        const lastMonth = months[months.length - 1];
        const prevMonth = months[months.length - 2];
        const revenueTrend = ((incomeByMonth[lastMonth] || 0) - (incomeByMonth[prevMonth] || 0)) / (incomeByMonth[prevMonth] || 1) * 100;
        const expenseTrend = ((expensesByMonth[lastMonth] || 0) - (expensesByMonth[prevMonth] || 0)) / (expensesByMonth[prevMonth] || 1) * 100;
        const profitTrend = netProfit > 0 ? 5 : -5; // Placeholder

        document.getElementById('kpi-revenue-trend').textContent = `${revenueTrend > 0 ? '↑' : '↓'} ${Math.abs(revenueTrend).toFixed(1)}%`;
        document.getElementById('kpi-expenses-trend').textContent = `${expenseTrend > 0 ? '↑' : '↓'} ${Math.abs(expenseTrend).toFixed(1)}%`;
        document.getElementById('kpi-profit-trend').textContent = `${profitTrend > 0 ? '↑' : '↓'} ${Math.abs(profitTrend).toFixed(1)}%`;
        document.getElementById('kpi-bookings-trend').textContent = `↑ 0%`;
    }
}

function generateOverdueReport() {
    const container = document.getElementById('overdue-payments-report');
    const overdueCustomers = getCustomerSummaries().filter(s => s.outstanding > 0);

    if (overdueCustomers.length === 0) {
        container.innerHTML = '';
        return;
    }

    const tableRows = overdueCustomers.map((customer, index) => {
        const rowClass = index % 2 === 0 ? 'table-row-alt' : '';
        return `<tr class="${rowClass}"><td class="table-cell-name">${sanitizeHTML(customer.name)}</td><td class="table-cell-center">${customer.bookingCount}</td><td class="table-cell-amount">€${customer.outstanding.toFixed(2)}</td></tr>`;
    }).join('');

    container.innerHTML = `
        <div class="alert-outstanding-payments">
            <div class="alert-header">
                <div class="alert-icon">⚠️</div>
                <div class="alert-content">
                    <h3 class="alert-title">Outstanding Payments</h3>
                    <p class="alert-description">${overdueCustomers.length} customer(s) with pending balance</p>
                </div>
            </div>
            <div class="table-wrapper">
                <table class="outstanding-table">
                    <thead>
                        <tr>
                            <th class="th-name">Customer Name</th>
                            <th class="th-center">Bookings</th>
                            <th class="th-amount">Amount Due</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function getTourAnalytics() {
    const tourBookings = state.bookings.filter(b => {
        const service = state.services.find(s => s.id === b.serviceId);
        return service && service.service_type === 'TOUR' && (b.status === 'Completed' || b.status === 'Scheduled');
    });

    const tourRevenue = tourBookings.reduce((sum, b) => sum + (b.fee || 0), 0);
    const totalTours = tourBookings.length;
    const totalParticipants = tourBookings.reduce((sum, b) => sum + (b.groupSize || 1), 0);
    const avgGroupSize = totalTours > 0 ? (totalParticipants / totalTours).toFixed(1) : 0;

    // Occupancy rates per service
    const toursByService = {};
    tourBookings.forEach(b => {
        const service = state.services.find(s => s.id === b.serviceId);
        if (service) {
            if (!toursByService[service.service_name]) {
                toursByService[service.service_name] = {
                    count: 0,
                    totalParticipants: 0,
                    revenue: 0,
                    maxCapacity: service.capacity || 50
                };
            }
            toursByService[service.service_name].count++;
            toursByService[service.service_name].totalParticipants += b.groupSize || 1;
            toursByService[service.service_name].revenue += b.fee || 0;
        }
    });

    // Guide performance with qualifications
    const guidePerformance = {};
    tourBookings.forEach(b => {
        if (!guidePerformance[b.staffId]) {
            const guide = state.staff.find(s => s.id === b.staffId);
            guidePerformance[b.staffId] = {
                name: guide ? guide.name : 'Unknown',
                toursCount: 0,
                totalParticipants: 0,
                rating: guide && guide.guide_qualifications ? guide.guide_qualifications.rating || 0 : 0,
                languages: guide && guide.guide_qualifications ? guide.guide_qualifications.languages || [] : [],
                specializations: guide && guide.guide_qualifications ? guide.guide_qualifications.specializations || [] : []
            };
        }
        guidePerformance[b.staffId].toursCount++;
        guidePerformance[b.staffId].totalParticipants += b.groupSize || 1;
    });

    // Waiver compliance tracking
    const totalTourBookings = tourBookings.length;
    const waiverSigned = tourBookings.filter(b => b.waiverSigned).length;
    const waiverCompliance = totalTourBookings > 0 ? ((waiverSigned / totalTourBookings) * 100).toFixed(1) : 0;

    return {
        totalTours,
        totalParticipants,
        avgGroupSize,
        tourRevenue,
        toursByService,
        guidePerformance,
        waiverSignedCount: waiverSigned,
        waiverCompliance,
        totalTourBookings
    };
}

function generateCharts() {
    const { incomeByMonth, expensesByMonth, servicePopularityReport, topCustomersReport, staffPerformanceReport, resourceUtilisationReport, peakHoursReport, incomeExpenseReport, lessonPackagePopularityReport } = getReportsData();

    const allMonths = [...new Set([...Object.keys(incomeByMonth), ...Object.keys(expensesByMonth)])].sort();
    const chartLabels = allMonths.map(my => new Date(my + '-02').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }));
    const incomeData = allMonths.map(my => incomeByMonth[my] || 0);
    const expenseData = allMonths.map(my => expensesByMonth[my] || 0);

    const createChart = (canvasId, type, data, options = {}) => {
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const chart = new Chart(ctx, { type, data, options });
                activeCharts.push(chart);
            } else {
                console.error(`Failed to get 2D context for canvas with id: ${canvasId}`);
            }
        } else {
            console.warn(`Could not find canvas element with id: ${canvasId}`);
        }
    };

    createChart('incomeExpenseChart', 'bar', {
        labels: chartLabels,
        datasets: [
            { label: 'Income (€)', data: incomeData, backgroundColor: 'rgba(59, 130, 246, 0.5)', borderColor: 'rgba(59, 130, 246, 1)', borderWidth: 1 },
            { label: 'Expenses (€)', data: expenseData, backgroundColor: 'rgba(239, 68, 68, 0.5)', borderColor: 'rgba(239, 68, 68, 1)', borderWidth: 1 }
        ]
    }, { scales: { x: { stacked: false }, y: { stacked: false, beginAtZero: true } }, responsive: true });

    createChart('servicePopularityChart', 'doughnut', { labels: servicePopularityReport.data.map(s => s[0]), datasets: [{ data: servicePopularityReport.data.map(s => s[1]), backgroundColor: ['rgba(252, 211, 77, 0.7)', 'rgba(59, 130, 246, 0.7)', 'rgba(239, 68, 68, 0.7)', 'rgba(16, 185, 129, 0.7)'], borderWidth: 1 }] }, { responsive: true });
    createChart('topCustomersChart', 'bar', { labels: topCustomersReport.data.map(s => s[0]), datasets: [{ label: 'Number of Bookings', data: topCustomersReport.data.map(s => s[1]), backgroundColor: 'rgba(16, 185, 129, 0.5)', borderColor: 'rgba(16, 185, 129, 1)', borderWidth: 1 }] }, { indexAxis: 'y', responsive: true, scales: { x: { ticks: { stepSize: 1 } } } });
    createChart('staffPerformanceChart', 'bar', { labels: staffPerformanceReport.data.map(i => i[0]), datasets: [{ label: 'Bookings Handled', data: staffPerformanceReport.data.map(i => i[1]), backgroundColor: 'rgba(236, 72, 153, 0.5)', borderColor: 'rgba(236, 72, 153, 1)', borderWidth: 1 }] }, { scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, responsive: true });
    createChart('resourceUtilisationChart', 'bar', { labels: resourceUtilisationReport.data.map(v => v[0]), datasets: [{ label: 'Number of Bookings', data: resourceUtilisationReport.data.map(v => v[1]), backgroundColor: 'rgba(139, 92, 246, 0.5)', borderColor: 'rgba(139, 92, 246, 1)', borderWidth: 1 }] }, { scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, responsive: true });
    createChart('peakBookingHoursChart', 'line', { labels: peakHoursReport.data.map(h => h[0]), datasets: [{ label: 'Number of Bookings', data: peakHoursReport.data.map(h => h[1]), backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: 'rgba(245, 158, 11, 1)', borderWidth: 2, tension: 0.4, fill: true }] }, { scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, responsive: true });

    if (lessonPackagePopularityReport && lessonPackagePopularityReport.data.length > 0) {
        createChart('lessonPackagePopularityChart', 'bar', {
            labels: lessonPackagePopularityReport.data.map(item => item.name),
            datasets: [{
                label: 'Number of Times Booked/Sold',
                data: lessonPackagePopularityReport.data.map(item => item.count),
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        }, {
            indexAxis: 'y',
            responsive: true,
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        });
    }

    const statsContainer = document.getElementById('staff-stats-container');
    if (statsContainer) {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);
        const formatDate = (date) => date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
        const dateRangeStr = `(${formatDate(sevenDaysAgo)} - ${formatDate(today)})`;

        const staffWeeklyHours = {};
        state.staff.forEach(i => staffWeeklyHours[i.id] = 0);

        state.bookings.filter(b => {
            const bookingDate = parseYYYYMMDD(b.date);
            return bookingDate && bookingDate >= sevenDaysAgo && bookingDate <= today;
        }).forEach(b => {
            if (staffWeeklyHours.hasOwnProperty(b.staffId)) {
                const service = state.services.find(s => s.id === b.serviceId);
                const duration = (service ? service.duration_minutes : 60) / 60;
                staffWeeklyHours[b.staffId] += duration;
            }
        });

        const staffTimeOff = {};
        state.staff.forEach(i => staffTimeOff[i.id] = 0);
        state.blockedPeriods.forEach(p => {
            if (p.staffId !== 'all' && staffTimeOff.hasOwnProperty(p.staffId)) {
                const start = new Date(p.start);
                const end = new Date(p.end);
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                staffTimeOff[p.staffId] += diffDays;
            }
        });

        let statsHtml = `
            <div class="staff-stat-section">
                <h4 class="stat-section-title">
                    ⏰ Staff Hours <span class="stat-date-range">${dateRangeStr}</span>
                </h4>
                <div class="stat-items-container">`;

        state.staff.forEach(staffMember => {
            const hours = staffWeeklyHours[staffMember.id] || 0;
            const hoursPercentage = Math.min(100, (hours / 40) * 100); // Assuming 40 hour week is 100%
            statsHtml += `
                <div class="stat-item">
                    <div class="stat-name">${sanitizeHTML(staffMember.name)}</div>
                    <div class="stat-bar">
                        <div class="stat-bar-fill" style="width: ${hoursPercentage}%"></div>
                    </div>
                    <div class="stat-value">${hours.toFixed(1)} hrs</div>
                </div>`;
        });

        statsHtml += `</div></div><div class="staff-stat-section">
                <h4 class="stat-section-title">🏖️ Time Off (All Time)</h4>
                <div class="stat-items-container">`;

        state.staff.forEach(staffMember => {
            const daysOff = staffTimeOff[staffMember.id] || 0;
            statsHtml += `
                <div class="stat-item">
                    <div class="stat-name">${sanitizeHTML(staffMember.name)}</div>
                    <div class="stat-value stat-value-days">${daysOff} ${daysOff === 1 ? 'day' : 'days'}</div>
                </div>`;
        });

        statsHtml += '</div></div>';
        statsContainer.innerHTML = statsHtml;
    }
}


/******************************************************************************
 * SECTION 14: MISCELLANEOUS
 ******************************************************************************/

function updateClock() {
    const clockElement = document.getElementById('digital-clock');
    if (!clockElement) return;

    const now = new Date();
    const dateString = now.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    });
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });

    clockElement.innerHTML = `
        <div class="text-center">${timeString}</div>
        <div class="text-xs text-center text-gray-500">${dateString}</div>
    `;
}

async function fetchAiModels() {
    const provider = document.getElementById('ai-provider').value;
    const apiKey = document.getElementById('api-key').value;
    const modelSelect = document.getElementById('api-model');
    const fetchButton = document.querySelector('button[onclick="fetchAiModels()"]');

    if (!apiKey) {
        showDialog({ title: 'API Key Required', message: 'Please enter an API key before fetching models.', buttons: [{ text: 'OK', class: btnPrimary }] });
        return;
    }

    const originalButtonText = fetchButton.innerHTML;
    fetchButton.innerHTML = 'Fetching...';
    fetchButton.disabled = true;

    let apiUrl, headers;
    switch (provider) {
        case 'openai':
            apiUrl = 'https://api.openai.com/v1/models';
            headers = { 'Authorization': `Bearer ${apiKey}` };
            break;
        case 'gemini':
            apiUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
            headers = {};
            break;
        case 'perplexity':
            apiUrl = 'https://api.perplexity.ai/models';
            headers = { 'Authorization': `Bearer ${apiKey}` };
            break;
        case 'openrouter':
            apiUrl = 'https://openrouter.ai/api/v1/models';
            headers = { 'Authorization': `Bearer ${apiKey}` };
            break;
        default:
            showDialog({ title: 'Error', message: `Model fetching is not supported for provider: ${provider}`, buttons: [{ text: 'OK', class: btnPrimary }] });
            fetchButton.innerHTML = originalButtonText;
            fetchButton.disabled = false;
            return;
    }

    try {
        const response = await fetch(apiUrl, { headers });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error (${response.status}): ${errorData.error?.message || response.statusText}`);
        }
        const result = await response.json();

        let modelIds = [];
        switch (provider) {
            case 'openai':
            case 'perplexity':
            case 'openrouter':
                modelIds = result.data.map(m => m.id).sort();
                break;
            case 'gemini':
                modelIds = result.models.map(m => m.name.replace('models/', '')).sort();
                break;
        }

        const savedModel = state.settings.apiModels[provider] || '';
        if (savedModel && !modelIds.includes(savedModel)) {
            modelIds.unshift(savedModel);
        }

        modelSelect.innerHTML = ''; // Clear existing options
        modelIds.forEach(id => {
            // Use new Option() to prevent XSS from crafted model IDs
            modelSelect.add(new Option(id, id));
        });

        modelSelect.value = savedModel;
        showToast(`Successfully fetched ${modelIds.length} models for ${provider}.`);

    } catch (error) {
        console.error('Failed to fetch AI models:', error);
        showDialog({ title: 'Fetch Failed', message: `Could not fetch models. Please check your API key and network connection. ${error.message}`, buttons: [{ text: 'OK', class: btnPrimary }] });
    } finally {
        fetchButton.innerHTML = originalButtonText;
        fetchButton.disabled = false;
    }
}

async function callAI(prompt) {
    const provider = state.settings.aiProvider;
    const apiKey = state.settings.apiKeys[provider];
    const model = state.settings.apiModels[provider];

    if (!apiKey) {
        showDialog({
            title: 'API Key Missing',
            message: `Please add your ${provider.charAt(0).toUpperCase() + provider.slice(1)} API key in the Settings page to use this feature.`,
            buttons: [{ text: 'OK', class: btnPrimary, onClick: () => showView('settings') }]
        });
        return null;
    }

    let apiUrl, payload, headers;

    switch (provider) {
        case 'gemini':
            apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
            headers = { 'Content-Type': 'application/json' };
            break;

        case 'openai':
            apiUrl = 'https://api.openai.com/v1/chat/completions';
            payload = {
                model: model,
                messages: [{ role: "user", content: prompt }]
            };
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            };
            break;

        case 'perplexity':
            apiUrl = 'https://api.perplexity.ai/chat/completions';
             payload = {
                model: model,
                messages: [{ role: "user", content: prompt }]
            };
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            };
            break;

        case 'openrouter':
            apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
            payload = {
                model: model,
                messages: [{ role: "user", content: prompt }]
            };
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            };
            break;

        default:
            console.error(`Unknown AI provider: ${provider}`);
            return "Unknown AI provider configured.";
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("API Error:", errorBody);
            throw new Error(`API call failed with status: ${response.status}. ${errorBody.error?.message || ''}`);
        }

        const result = await response.json();
        let responseText = '';
        if (provider === 'gemini') {
            responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        } else {
            responseText = result.choices?.[0]?.message?.content;
        }

        if (responseText) {
            return responseText;
        } else {
            console.error("Unexpected API response structure:", result);
            return "Sorry, I couldn't get a valid response from the AI. Please check the console for details.";
        }

    } catch (error) {
        console.error(`Error calling ${provider} API:`, error);
        showDialog({
            title: 'AI Error',
            message: `An error occurred while contacting the ${provider} AI. \n\nDetails: ${error.message}`,
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return null;
    }
}

async function runAiAnalysis(buttonEl, outputContainerEl, outputDivEl, prompt, options) {
    const { initialText, loadingText } = options;

    outputContainerEl.classList.remove('hidden');
    outputDivEl.innerHTML = '<div class="flex justify-center items-center"><div class="spinner"></div></div>';
    buttonEl.disabled = true;
    buttonEl.innerHTML = loadingText;

    const result = await callAI(prompt);

    if (result) {
        outputDivEl.textContent = result;
    } else {
        outputContainerEl.classList.add('hidden');
    }

    buttonEl.disabled = false;
    buttonEl.innerHTML = initialText;
}

async function handleSummarizeCustomerProgress(customerId) {
    const customer = state.customers.find(s => s.id === customerId);
    if (!customer || !customer.driving_school_details?.progress_notes || customer.driving_school_details.progress_notes.length === 0) {
        showToast("No progress notes available to summarize.");
        return;
    }

    const summaryContainer = document.getElementById('progress-summary-container');
    const outputDiv = document.getElementById('summary-output');
    const summarizeBtn = document.getElementById('summarize-progress-btn');
    const compiledNotes = customer.driving_school_details.progress_notes
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(note => {
            const skills = note.skillsCovered.map(s => s.skill).join(', ');
            return `Date: ${note.date}\nNotes: ${note.notes}\nSkills Covered: ${skills}`;
        }).join('\n\n---\n\n');

    const prompt = `
        As a driving instructor assistant, analyze the following progress notes for a customer named ${customer.name}.
        Provide a concise summary that highlights their key strengths, identifies recurring areas for improvement, and suggests what the main focus should be for their next lesson.
        Format the output with clear headings (Strengths, Areas for Improvement, Next Lesson Focus).

        Here are the notes:
        ${compiledNotes}
    `;

    runAiAnalysis(summarizeBtn, summaryContainer, outputDiv, prompt, {
        initialText: '✨ Summarize Progress',
        loadingText: 'Summarizing...'
    });
}

async function handleGenerateFeedback() {
    const notesTextarea = document.getElementById('progress-notes');
    const rawNotes = notesTextarea.value;
    const skillsCovered = Array.from(document.querySelectorAll('#progress-skills-container input:checked')).map(el => el.value);
    const generateBtn = document.getElementById('generate-feedback-btn');

    if (!rawNotes.trim() && skillsCovered.length === 0) {
        showToast("Please enter some notes or select skills first.");
        return;
    }

    const prompt = `
        You are a driving instructor writing end-of-lesson feedback for a student.
        Based on the following raw notes and skills covered, write a clear, friendly, and encouraging feedback summary.
        Structure it into two paragraphs:
        1. Start with positive reinforcement about what went well.
        2. Then, constructively mention what needs more practice.
        Keep the tone supportive.

        Raw Notes: "${rawNotes}"
        Skills Covered: ${skillsCovered.join(', ')}
    `;

            generateBtn.disabled = true;
            generateBtn.textContent = 'Generating...';
            try {
                const feedback = await callAI(prompt);
                if (feedback) {
                    notesTextarea.value = feedback;
                }
            } catch (error) {
                console.error("Error generating feedback:", error);
                // The 'finally' block will still run, so we don't need to reset the button here.
            } finally {
                generateBtn.disabled = false;
                generateBtn.textContent = '✨ Generate Feedback';
            }
}

async function handleAnalyzeBilling() {
    const analysisContainer = document.getElementById('billing-analysis-container');
    const outputDiv = document.getElementById('billing-analysis-output');
    const analyzeBtn = document.getElementById('analyze-billing-btn');

    const totalRevenue = document.getElementById('billing-total-revenue').textContent;
    const totalPaid = document.getElementById('billing-total-paid').textContent;
    const totalOutstanding = document.getElementById('billing-total-outstanding').textContent;

    const customerSummaries = getCustomerSummaries();
    const customersWithDebt = customerSummaries.filter(s => s.outstanding > 0).length;

    const prompt = `
        As a business analyst for a driving school, analyze the following financial data.
        - Total Billed: ${totalRevenue}
        - Total Paid: ${totalPaid}
        - Total Outstanding: ${totalOutstanding}
        - Number of customers with an outstanding balance: ${customersWithDebt}

        Provide a concise summary of the current financial health.
        Highlight any potential concerns (e.g., high outstanding balance).
        Suggest one or two simple, actionable steps to improve the financial situation (e.g., related to collecting payments).
        Keep the tone professional and helpful.
    `;

    runAiAnalysis(analyzeBtn, analysisContainer, outputDiv, prompt, {
        initialText: '✨ Analyze Billing',
        loadingText: 'Analyzing...'
    });
}

async function handleAnalyzeReports() {
    const analysisContainer = document.getElementById('reports-analysis-container');
    const outputDiv = document.getElementById('reports-analysis-output');
    const analyzeBtn = document.getElementById('analyze-reports-btn');

    const { incomeExpenseReport, servicePopularityReport, topCustomersReport, staffPerformanceReport, peakHoursReport } = getReportsData();

    const prompt = `
        As a business analyst for a driving school, analyze the following reports data and provide a high-level summary of the business performance.

        Data:
        - Income vs. Expenses by Month: ${JSON.stringify(incomeExpenseReport.data)}
        - Service Popularity: ${JSON.stringify(servicePopularityReport.data)}
        - Top Customers (by booking count): ${JSON.stringify(topCustomersReport.data)}
        - Staff Performance (by booking count): ${JSON.stringify(staffPerformanceReport.data)}
        - Peak Booking Hours: ${JSON.stringify(peakHoursReport.data)}

        Please provide a summary covering these points:
        1.  **Financial Trend:** How is the income and net profit performing over time? Are expenses under control?
        2.  **Service Popularity:** Which services are most popular? Is there an opportunity here?
        3.  **Key Contributors:** Who are the top staff and customers?
        4.  **Operational Efficiency:** What are the busiest times? How could this information be used?
        5.  **Overall Recommendation:** Based on all the data, provide one key strategic recommendation for the business.

        Keep the summary concise and easy to understand.
    `;

    runAiAnalysis(analyzeBtn, analysisContainer, outputDiv, prompt, {
        initialText: '✨ Analyze Reports',
        loadingText: 'Analyzing...'
    });
}

function deepMerge(target, source) {
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

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}
