/**
 * Calendar Module for Ray Ryan Management System
 * Handles calendar rendering (month/week/day views) and drag-and-drop functionality
 *
 * Extracted from script.js lines 3196-3462, 6424-6435, 6746-6907
 */

// NOTE: During migration, these imports will be properly wired up
// For now, these must be available in global scope
// import { state, currentView, currentDate, isDragging, dragStartY, selectionBox } from '../core/state.js';
// import { CALENDAR_START_HOUR, CALENDAR_END_HOUR, TIMESLOT_INTERVAL_MINUTES, btnGreen, btnDanger } from '../core/constants.js';
// import { toLocalDateString, timeToMinutes, minutesToTime, isTimeOverlapping, sanitizeHTML, parseYYYYMMDD } from '../core/utils.js';

// ============================================
// MAIN CALENDAR RENDERING
// ============================================

/**
 * Render the calendar container and header
 * Entry point for calendar view
 */
export function renderCalendarContainer() {
    const container = document.getElementById('calendar-view');
    container.innerHTML = `
        <div class="bg-white rounded-lg shadow">
            <div id="calendar-header" class="p-4"></div>
            <div id="calendar-content"></div>
        </div>`;
    renderCalendarHeader();
}

/**
 * Render calendar header with navigation and view switcher
 * Displays current date/week/month title and view controls
 */
export function renderCalendarHeader() {
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

// ============================================
// HELPER: COLUMN ASSIGNMENT FOR DAY VIEW
// ============================================

/**
 * Assign columns to overlapping bookings for day view layout
 * Prevents bookings from overlapping visually
 * @param {Array} bookings - Bookings to layout
 * @returns {Array} Bookings with column and maxColumns properties
 */
export function assignColumns(bookings) {
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

// ============================================
// DAY VIEW
// ============================================

/**
 * Render day view with timeline and bookings
 * Shows hourly slots from CALENDAR_START_HOUR to CALENDAR_END_HOUR
 * Supports drag to create, drag to move, and click to open
 */
export function renderDayView() {
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

// ============================================
// WEEK VIEW
// ============================================

/**
 * Render week view with 7-day grid
 * Respects firstDayOfWeek setting (Monday or Sunday)
 * Shows bookings, blocked periods, and staff leaves
 */
export function renderWeekView() {
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

// ============================================
// MONTH VIEW
// ============================================

/**
 * Render month view with full calendar grid
 * Shows booking counts, blocked periods, and staff leaves
 * Respects firstDayOfWeek setting (Monday or Sunday)
 */
export function renderMonthView() {
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

// ============================================
// HELPER: BLOCKED PERIODS
// ============================================

/**
 * Get blocked periods (holidays, staff leave) for a specific date
 * @param {Date} date - Date to check
 * @returns {Array} Blocked periods overlapping with the date
 */
export function getBlockedPeriodsForDate(date) {
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

// ============================================
// DRAG AND DROP: TIME SELECTION IN DAY VIEW
// ============================================

/**
 * Start drag to select time range in day view
 * @param {Event} e - Mouse down event
 */
export function startDrag(e) {
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

/**
 * Handle mouse move during drag selection
 * @param {Event} e - Mouse move event
 */
export function drag(e) {
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

/**
 * End drag selection and open booking modal
 * @param {Event} e - Mouse up event
 */
export function endDrag(e) {
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

// ============================================
// DRAG AND DROP: BOOKING MOVEMENT
// ============================================

/**
 * Handle drag start for booking element
 * @param {Event} event - Drag start event
 * @param {string} bookingId - ID of booking being dragged
 */
export function handleDragStart(event, bookingId) {
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

/**
 * Allow drop on calendar cells
 * @param {Event} event - Drag over event
 */
export function allowDrop(event) {
    event.preventDefault();
}

/**
 * Handle drag enter on calendar cell
 * @param {Event} event - Drag enter event
 */
export function handleDragEnter(event) {
    event.preventDefault();
    const dropTarget = event.target.closest('.calendar-cell, #day-timeline');
    if (dropTarget) {
        dropTarget.classList.add('drag-over');
    }
}

/**
 * Handle drag leave on calendar cell
 * @param {Event} event - Drag leave event
 */
export function handleDragLeave(event) {
    const dropTarget = event.target.closest('.calendar-cell, #day-timeline');
    if (dropTarget) {
        dropTarget.classList.remove('drag-over');
    }
}

/**
 * Handle drop of booking on new date/time
 * Supports move (default) and copy (Ctrl/Cmd + drop)
 * @param {Event} event - Drop event
 * @param {string} newDate - New date for booking (YYYY-MM-DD)
 */
export function drop(event, newDate) {
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

// ============================================
// HELPER: PIXELS TO TIME CONVERSION
// ============================================

/**
 * Convert pixel position in day view to time string
 * Snaps to TIMESLOT_INTERVAL_MINUTES
 * @param {number} pixels - Pixel position from top of timeline
 * @returns {string} Time in HH:MM format
 */
export function pixelsToTime(pixels) {
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
