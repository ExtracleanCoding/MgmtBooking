import os
from playwright.sync_api import sync_playwright, expect
import datetime

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    try:
        # Get the absolute path to the index.html file
        file_path = os.path.abspath('index.html')
        page.goto(f'file://{file_path}')

        # 1. Set up the scenario: two bookings with different pickup locations
        today = datetime.date.today()
        date_string = today.strftime('%Y-%m-%d')

        page.evaluate(f"""() => {{
            const booking1 = {{
                id: 'booking_route_1',
                date: '{date_string}',
                startTime: '09:00',
                endTime: '10:00',
                customerId: 'customer_1',
                staffId: 'staff_1',
                resourceIds: ['resource_1'],
                serviceId: 'service_lesson_1',
                pickup: 'Dublin, Ireland',
                status: 'Scheduled'
            }};
            const booking2 = {{
                id: 'booking_route_2',
                date: '{date_string}',
                startTime: '11:00',
                endTime: '12:00',
                customerId: 'customer_2',
                staffId: 'staff_1',
                resourceIds: ['resource_1'],
                serviceId: 'service_lesson_1',
                pickup: 'Cork, Ireland',
                status: 'Scheduled'
            }};
            state.bookings.push(booking1, booking2);
            debouncedSaveState();
        }}""")

        # 2. Navigate to the Day View
        page.get_by_role("button", name="Day").click()

        # 3. Verify the "View Route" button is visible
        route_button = page.get_by_role("button", name="View Route")
        expect(route_button).to_be_visible()

        # 4. Take a screenshot for visual confirmation
        page.screenshot(path="jules-scratch/verification/verification.png")
        print("Screenshot of Day View with 'View Route' button taken successfully.")

    except Exception as e:
        page.screenshot(path="jules-scratch/verification/error_screenshot.png")
        print(f"An error occurred during verification: {e}")
        raise e

    finally:
        # 5. Clean up
        browser.close()


with sync_playwright() as playwright:
    run_verification(playwright)

print("Verification script executed successfully.")