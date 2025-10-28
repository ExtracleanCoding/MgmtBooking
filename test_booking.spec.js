const { test, expect } = require('@playwright/test');
const path = require('path');

// This helper function dispatches events in the browser context to simulate a drag and drop.
async function simulateDragAndDrop(page, sourceLocator, targetLocator, isCopy = false) {
    const sourceElement = await sourceLocator.elementHandle();
    const targetElement = await targetLocator.elementHandle();

    // Ensure elements are not null before proceeding
    if (!sourceElement || !targetElement) {
        throw new Error("Could not find source or target element for drag-and-drop.");
    }

    await page.evaluate(({ source, target, isCopy }) => {
        const dataTransfer = new DataTransfer();
        // Extract booking ID from the ondragstart attribute
        const bookingId = source.getAttribute('ondragstart').match(/'([^']+)'/)[1];
        dataTransfer.setData('text/plain', bookingId);

        // Dispatch drag events
        source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer }));
        target.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer }));
        target.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer }));

        const dropEvent = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer });
        if (isCopy) {
            Object.defineProperty(dropEvent, 'ctrlKey', { value: true });
            Object.defineProperty(dropEvent, 'metaKey', { value: true });
        }
        target.dispatchEvent(dropEvent);

        source.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer }));
    }, { source: sourceElement, target: targetElement, isCopy });
}

// Helper for day view drops where we need to specify a coordinate.
async function simulateDayViewDrop(page, sourceLocator, targetLocator, dropYPosition, isCopy = false) {
    const sourceElement = await sourceLocator.elementHandle();
    const targetElement = await targetLocator.elementHandle();

    await page.evaluate(({ source, target, dropY, isCopy }) => {
        const dataTransfer = new DataTransfer();
        const bookingId = source.getAttribute('ondragstart').match(/'([^']+)'/)[1];
        dataTransfer.setData('text/plain', bookingId);
        const targetRect = target.getBoundingClientRect();

        const dropEvent = new DragEvent('drop', {
            bubbles: true,
            cancelable: true,
            dataTransfer,
            clientY: targetRect.top + dropY,
            ctrlKey: isCopy,
            metaKey: isCopy,
        });

        target.dispatchEvent(dropEvent);
    }, { source: sourceElement, target: targetElement, dropY: dropYPosition, isCopy });
}

test.beforeEach(async ({ page }) => {
  await page.goto(`file://${path.join(__dirname, 'index.html')}`);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('migration_v3.0.0_complete', 'true');

    const toLocalDateString = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const today = new Date('2025-10-29T10:00:00Z'); // A Wednesday
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const bookings = [
      { id: 'booking_1', date: toLocalDateString(today), startTime: '10:00', endTime: '11:00', customerId: 'customer_1', staffId: 'staff_1', resourceIds: ['resource_1'], serviceId: 'service_lesson_1', status: 'Completed', paymentStatus: 'Unpaid', fee: 30 },
      { id: 'booking_2', date: toLocalDateString(today), startTime: '14:00', endTime: '15:00', customerId: 'customer_2', staffId: 'staff_1', resourceIds: ['resource_1'], serviceId: 'service_lesson_1', status: 'Completed', paymentStatus: 'Unpaid', fee: 30 },
      { id: 'booking_3', date: toLocalDateString(tomorrow), startTime: '11:00', endTime: '12:00', customerId: 'customer_1', staffId: 'staff_1', resourceIds: ['resource_1'], serviceId: 'service_lesson_1', status: 'Completed', paymentStatus: 'Unpaid', fee: 30 }
    ];
    const customers = [{id: 'customer_1', name: 'Customer 1'}, {id: 'customer_2', name: 'Customer 2'}];
    const staff = [{id: 'staff_1', name: 'Ray Ryan'}];
    const resources = [{id: 'resource_1', resource_name: 'Ford Focus'}];
    const services = [{ id: 'service_lesson_1', service_name: 'Standard Driving Lesson', duration_minutes: 60 }];

    localStorage.setItem('bookings', JSON.stringify(bookings));
    localStorage.setItem('customers', JSON.stringify(customers));
    localStorage.setItem('staff', JSON.stringify(staff));
    localStorage.setItem('resources', JSON.stringify(resources));
    localStorage.setItem('services', JSON.stringify(services));
    localStorage.setItem('settings', JSON.stringify({firstDayOfWeek: 'monday'}));
  });
  await page.reload();
});

test.describe('Booking Drag and Drop', () => {
    test('should move a booking to a different time on the same day in day view', async ({ page }) => {
        await page.click('#nav-calendar');
        await page.click('button:has-text("Day")');

        const sourceLocator = page.locator("[ondragstart*='booking_1']");
        const targetLocator = page.locator("#day-timeline");

        // 1 hour = 60px, CALENDAR_START_HOUR is 7. 12:00 is (12-7)*60 = 300px
        await simulateDayViewDrop(page, sourceLocator, targetLocator, 300);
        await page.waitForTimeout(500);

        const newBooking = page.locator("[ondragstart*='booking_1']");
        const newBookingTime = await newBooking.locator('p.text-xs').innerText();

        expect(newBookingTime).toBe('12:00-13:00');
    });

    test('should move a booking to a different day in week view', async ({ page }) => {
        await page.click('#nav-calendar');
        await page.click('button:has-text("Week")');
        await page.waitForSelector('.calendar-grid'); // Wait for view to render

        const sourceLocator = page.locator("[ondragstart*='booking_1']");
        const targetLocator = page.locator('div.calendar-cell', { has: page.locator('span.day-number', { hasText: '30' }) });

        await simulateDragAndDrop(page, sourceLocator, targetLocator);
        await page.waitForTimeout(500);

        const newBookingDay = page.locator('div.calendar-cell', { has: page.locator('span.day-number', { hasText: '30' }) });
        await expect(newBookingDay.locator("[ondragstart*='booking_1']")).toBeVisible();
    });

    test('should copy a booking to a different time on the same day in day view with ctrl key', async ({ page }) => {
        await page.click('#nav-calendar');
        await page.click('button:has-text("Day")');

        const sourceLocator = page.locator("[ondragstart*='booking_1']");
        const targetLocator = page.locator("#day-timeline");

        // 13:00 is at (13-7)*60 = 360px
        await simulateDayViewDrop(page, sourceLocator, targetLocator, 360, true);
        await page.waitForTimeout(500);

        const allBookingsForCustomer1 = await page.locator('.timeline-booking', { hasText: 'Customer 1' }).all();
        expect(allBookingsForCustomer1.length).toBe(2);

        const times = await Promise.all(allBookingsForCustomer1.map(b => b.locator('p.text-xs').innerText()));
        expect(times.sort()).toEqual(['10:00-11:00', '13:00-14:00']);
    });

    test('should show a conflict dialog when moving a booking to an occupied slot', async ({ page }) => {
        await page.click('#nav-calendar');
        await page.click('button:has-text("Day")');

        const sourceLocator = page.locator("[ondragstart*='booking_1']");
        const targetLocator = page.locator("#day-timeline");

        // 14:00 is at (14-7)*60 = 420px, conflicting with booking_2
        await simulateDayViewDrop(page, sourceLocator, targetLocator, 420);

        const dialog = page.locator('#dialog-modal');
        await expect(dialog).toBeVisible();
        await expect(dialog.locator('#dialog-title')).toHaveText('Booking Conflict');
    });

    test('should not move a booking to a past date', async ({ page }) => {
        await page.click('#nav-calendar');
        await page.click('button:has-text("Week")');
        await page.waitForSelector('.calendar-grid');

        const sourceLocator = page.locator("[ondragstart*='booking_3']");
        const targetLocator = page.locator('div.calendar-cell.past-day', { has: page.locator('span.day-number', { hasText: '27' }) });

        await simulateDragAndDrop(page, sourceLocator, targetLocator);
        await page.waitForTimeout(500);

        const originalBookingDay = page.locator('div.calendar-cell', { has: page.locator('span.day-number', { hasText: '30' }) });
        await expect(originalBookingDay.locator("[ondragstart*='booking_3']")).toBeVisible();
    });

    test('should not move a booking to a blocked date', async ({ page }) => {
        await page.evaluate(() => {
            const blockedDate = new Date('2025-10-30T10:00:00Z');
            const toLocalDateString = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            localStorage.setItem('blockedPeriods', JSON.stringify([{ id: 'block_1', start: toLocalDateString(blockedDate), end: toLocalDateString(blockedDate), reason: 'Holiday', staffId: 'all' }]));
        });
        await page.reload();
        await page.click('#nav-calendar');
        await page.click('button:has-text("Week")');
        await page.waitForSelector('.calendar-grid');

        const sourceLocator = page.locator("[ondragstart*='booking_2']");
        const targetLocator = page.locator('div.calendar-cell.blocked-date', { has: page.locator('span.day-number', { hasText: '30' }) });

        await simulateDragAndDrop(page, sourceLocator, targetLocator);
        await page.waitForTimeout(500);

        const originalBookingDay = page.locator('div.calendar-cell', { has: page.locator('span.day-number', { hasText: '29' }) });
        await expect(originalBookingDay.locator("[ondragstart*='booking_2']")).toBeVisible();
    });
});
