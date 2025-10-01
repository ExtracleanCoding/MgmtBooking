import os
from playwright.sync_api import sync_playwright, expect
import datetime
import json

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    try:
        # Get the absolute path to the index.html file
        file_path = os.path.abspath('index.html')
        page.goto(f'file://{file_path}')

        # 1. Enable the auto-notify setting
        page.evaluate("() => { state.settings.autoNotifyWaitingList = true; }")

        # 2. Set up the scenario directly in the state
        today = datetime.date.today() + datetime.timedelta(days=1)
        date_string = today.strftime('%Y-%m-%d')

        booking_to_cancel = {
            'id': 'booking_to_cancel',
            'date': date_string,
            'startTime': '14:00',
            'endTime': '15:00',
            'customerId': 'customer_2',
            'staffId': 'staff_1',
            'resourceIds': ['resource_1'],
            'serviceId': 'service_lesson_1',
            'status': 'Cancelled'
        }

        page.evaluate(f"""(bookingToCancel) => {{
            const waitingCustomer = {{
                id: 'wl_entry_1',
                date: '{date_string}',
                startTime: '14:00',
                endTime: '15:00',
                customerId: 'customer_1',
                staffId: 'staff_1',
                resourceIds: ['resource_1'],
                addedAt: new Date().toISOString()
            }};
            state.waitingList.push(waitingCustomer);
            // This is the function we want to test
            checkWaitingListFor(bookingToCancel);
        }}""", booking_to_cancel)

        # 3. Verify the dashboard notification is visible
        notification = page.locator("#dashboard-notifications", has_text="SMS notification sent to Customer 1")
        expect(notification).to_be_visible(timeout=5000)

        # 4. **Crucial Step:** Hover over the notification to ensure animations are complete
        notification.hover()

        # 5. Take the screenshot for final visual confirmation
        page.screenshot(path="jules-scratch/verification/verification.png")
        print("Screenshot of dashboard notification taken successfully.")

    except Exception as e:
        page.screenshot(path="jules-scratch/verification/error_screenshot.png")
        print(f"An error occurred during verification: {e}")
        raise e

    finally:
        # 6. Clean up
        browser.close()


with sync_playwright() as playwright:
    run_verification(playwright)

print("Verification script executed successfully.")