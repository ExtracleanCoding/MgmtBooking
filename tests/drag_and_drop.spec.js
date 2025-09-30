const { test, expect } = require('@playwright/test');

// Helper function to get the bounding box of an element
const getBoundingBox = async (page, selector) => {
    return await page.evaluate(selector => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
    }, selector);
};

// Helper function to get the count of booking elements on the page
const getBookingCount = async (page) => {
    return await page.locator('.booking, .p-1.my-1.rounded-md').count();
};

test.describe('Drag and Drop Booking Functionality', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:8000');
        // Clear local storage to ensure a clean state for each test
        await page.evaluate(() => localStorage.clear());
        // Reload the page to apply the cleared storage
        await page.goto('http://localhost:8000');
        // Wait for the app to initialize, e.g., by checking for a known element
        await expect(page.locator('#nav-calendar')).toBeVisible();
    });

    test('should move a booking to a new day in week view', async ({ page }) => {
        // Ensure we are in week view
        await page.click('button:has-text("Week")');
        await expect(page.locator('.calendar-grid')).toBeVisible();

        // There should be one booking initially from dummy data
        await expect(page.locator('.p-1.my-1.rounded-md')).toHaveCount(1);
        const initialBooking = page.locator('.p-1.my-1.rounded-md').first();

        // Get the initial date cell of the booking
        const initialCell = initialBooking.locator('xpath=./ancestor::div[contains(@class, "calendar-cell")]');
        const initialDate = await initialCell.locator('.day-number').textContent();

        // Find a target cell to drop the booking into (e.g., the next day)
        const targetCell = initialCell.locator('xpath=./following-sibling::div[contains(@class, "calendar-cell")]');
        await expect(targetCell).toBeVisible();
        const targetDate = await targetCell.locator('.day-number').textContent();
        expect(initialDate).not.toEqual(targetDate);

        // Perform drag and drop
        await initialBooking.dragTo(targetCell);

        // Verification
        // There should still be only one booking
        await expect(page.locator('.p-1.my-1.rounded-md')).toHaveCount(1);

        // The booking should now be in the new cell
        const newBookingCell = page.locator('.p-1.my-1.rounded-md').locator('xpath=./ancestor::div[contains(@class, "calendar-cell")]');
        const newDate = await newBookingCell.locator('.day-number').textContent();
        expect(newDate).toEqual(targetDate);

        // Take a screenshot for visual confirmation
        await page.screenshot({ path: 'tests/screenshots/drag-drop-move-week-view.png' });
    });

    test('should copy a booking with Ctrl key in week view', async ({ page }) => {
        // Ensure we are in week view
        await page.click('button:has-text("Week")');
        await expect(page.locator('.calendar-grid')).toBeVisible();

        const initialBooking = page.locator('.p-1.my-1.rounded-md').first();
        const initialCell = initialBooking.locator('xpath=./ancestor::div[contains(@class, "calendar-cell")]');

        // Find a target cell (e.g., two days after)
        const targetCell = initialCell.locator('xpath=./following-sibling::div[contains(@class, "calendar-cell")][2]');
        await expect(targetCell).toBeVisible();

        // Perform drag and drop with the Control key pressed
        await initialBooking.dragTo(targetCell, { modifiers: ['Control'] });

        // Verification
        // There should now be two bookings
        await expect(page.locator('.p-1.my-1.rounded-md')).toHaveCount(2);

        // Take a screenshot
        await page.screenshot({ path: 'tests/screenshots/drag-drop-copy-week-view.png' });
    });

    test('should move a booking to a new time in day view', async ({ page }) => {
        // Switch to day view
        await page.click('button:has-text("Day")');
        await expect(page.locator('#day-timeline')).toBeVisible();

        const bookingElement = page.locator('.timeline-booking').first();
        const initialBookingBox = await bookingElement.boundingBox();

        // The drop target is the timeline itself, but we need to specify a coordinate
        const timeline = page.locator('#day-timeline');
        const timelineBox = await timeline.boundingBox();

        // Calculate a new position (e.g., 2 hours later)
        const targetX = timelineBox.x + timelineBox.width / 2;
        const targetY = initialBookingBox.y + 120; // 2 hours * 60px/hour

        // Perform drag by coordinates
        await page.mouse.move(initialBookingBox.x + initialBookingBox.width / 2, initialBookingBox.y + initialBookingBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(targetX, targetY, { steps: 5 });
        await page.mouse.up();

        // Verification
        await expect(page.locator('.timeline-booking')).toHaveCount(1);
        const newBookingBox = await bookingElement.boundingBox();

        // The new Y position should be significantly different
        expect(newBookingBox.y).toBeGreaterThan(initialBookingBox.y + 100);

        // Take a screenshot
        await page.screenshot({ path: 'tests/screenshots/drag-drop-move-day-view.png' });
    });

    test('should show conflict dialog when moving a booking onto another', async ({ page }) => {
        // First, create a second booking right after the first one to set up the conflict
        await page.click('button:has-text("Add Booking")'); // Assuming a global add booking button or similar
        await page.selectOption('#booking-customer', { label: 'Customer 2 (222)' });
        await page.fill('#booking-start-time', '11:00');
        await page.click('button:has-text("Save Booking")');
        await expect(page.locator('.p-1.my-1.rounded-md')).toHaveCount(2);

        // Ensure we are in week view
        await page.click('button:has-text("Week")');

        const firstBooking = page.locator('.p-1.my-1.rounded-md:has-text("10:00")');
        const secondBooking = page.locator('.p-1.my-1.rounded-md:has-text("11:00")');
        await expect(firstBooking).toBeVisible();
        await expect(secondBooking).toBeVisible();

        // Listen for the dialog
        let dialogMessage = '';
        page.on('dialog', async dialog => {
            dialogMessage = dialog.message();
            await dialog.accept();
        });

        // Attempt to drag the 11:00 booking onto the 10:00 booking's cell
        const targetCell = firstBooking.locator('xpath=./ancestor::div[contains(@class, "calendar-cell")]');
        await secondBooking.dragTo(targetCell);

        // Verification
        expect(dialogMessage).toContain('Booking Conflict');
        // The number of bookings should remain 2
        await expect(page.locator('.p-1.my-1.rounded-md')).toHaveCount(2);

        // Take a screenshot
        await page.screenshot({ path: 'tests/screenshots/drag-drop-move-conflict.png' });
    });
});