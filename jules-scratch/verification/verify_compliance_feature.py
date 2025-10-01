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

        # 1. Add a non-compliant vehicle directly via JavaScript to ensure state is correct
        # This avoids UI interaction and potential race conditions
        page.evaluate("""() => {
            const newVehicle = {
                id: 'resource_test_expired',
                resource_name: 'Expired Test Car',
                resource_type: 'VEHICLE',
                make: 'TestMake',
                model: 'TestModel',
                reg: 'EXP-TEST',
                maintenance_schedule: {
                    mot: '2024-01-01',
                    tax: '2025-01-01',
                    service: ''
                },
                isCompliant: false
            };
            state.resources.push(newVehicle);
            // Also call the function that sets the compliance flag, just in case
            updateVehicleComplianceStatus();
        }""")

        # 2. Open the booking modal directly for a specific date
        # This is more robust than clicking through the UI
        today = datetime.date.today()
        date_string = today.strftime('%Y-%m-%d')

        # We will call the JS function that opens the booking modal directly
        page.evaluate(f"openBookingModal('{date_string}')")

        # 3. Verify the modal is visible and the non-compliant vehicle is disabled
        expect(page.locator("#booking-modal")).to_be_visible(timeout=5000)

        # Locate the option for the expired vehicle
        expired_vehicle_option = page.locator("#booking-resource option", has_text="Expired Test Car (Non-Compliant)")

        # Assert that the option exists and is disabled
        expect(expired_vehicle_option).to_have_count(1)
        expect(expired_vehicle_option).to_be_disabled()

        # 4. Take a screenshot for visual confirmation
        page.screenshot(path="jules-scratch/verification/verification.png")
        print("Screenshot taken successfully.")

    except Exception as e:
        # On failure, take a screenshot to help with debugging
        page.screenshot(path="jules-scratch/verification/error_screenshot.png")
        print(f"An error occurred during verification: {e}")
        raise e

    finally:
        # 5. Clean up by reloading the page to reset the state
        page.reload()
        browser.close()


with sync_playwright() as playwright:
    run_verification(playwright)

print("Verification script executed successfully.")