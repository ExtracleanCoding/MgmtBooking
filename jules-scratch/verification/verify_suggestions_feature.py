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

        # 1. Create an initial booking to cause a conflict
        # We will book a slot for today at 10:00 AM
        today = datetime.date.today()
        date_string = today.strftime('%Y-%m-%d')

        page.evaluate(f"""() => {{
            const conflictingBooking = {{
                id: 'booking_conflict_test',
                date: '{date_string}',
                startTime: '10:00',
                endTime: '11:00',
                customerId: 'customer_1',
                staffId: 'staff_1',
                resourceIds: ['resource_1'],
                serviceId: 'service_lesson_1',
                status: 'Scheduled'
            }};
            state.bookings.push(conflictingBooking);
        }}""")

        # 2. Attempt to create a new booking that overlaps with the first one
        # This should trigger the suggestions dialog
        page.evaluate(f"openBookingModal('{date_string}', null, '10:00')")

        # Fill in the booking details
        page.locator("#booking-customer").select_option("customer_1")
        page.locator("#booking-staff").select_option("staff_1")
        page.locator("#booking-resource").select_option("resource_1")
        page.locator("#booking-service").select_option("service_lesson_1")

        # Click save to trigger the conflict
        page.get_by_role("button", name="Save Booking").click()

        # 3. Verify that the conflict dialog with suggestions is shown
        dialog_modal = page.locator("#dialog-modal")
        expect(dialog_modal).to_be_visible(timeout=5000)

        # Check for the conflict message
        expect(dialog_modal.locator("#dialog-message")).to_contain_text("The selected staff member is already booked")

        # Check that 3 suggestions are shown (the default)
        suggestions_container = dialog_modal.locator("#dialog-suggestions")
        suggestion_buttons = suggestions_container.get_by_role("button")
        expect(suggestion_buttons).to_have_count(3)

        # 4. Take a screenshot for visual confirmation of the suggestions
        page.screenshot(path="jules-scratch/verification/verification.png")
        print("Screenshot of suggestions dialog taken successfully.")

        # 5. Test clicking a suggestion
        first_suggestion = suggestion_buttons.first
        expected_time = "11:00" # The first available slot after 10:00-11:00
        expect(first_suggestion).to_contain_text(expected_time)
        first_suggestion.click()

        # 6. Verify the booking modal is updated with the new time
        expect(dialog_modal).not_to_be_visible() # Dialog should close
        expect(page.locator("#booking-start-time")).to_have_value(expected_time)

        # Take a second screenshot to show the updated modal
        page.screenshot(path="jules-scratch/verification/verification_updated.png")
        print("Screenshot of updated booking modal taken successfully.")

    except Exception as e:
        # On failure, take a screenshot to help with debugging
        page.screenshot(path="jules-scratch/verification/error_screenshot.png")
        print(f"An error occurred during verification: {e}")
        raise e

    finally:
        # 7. Clean up
        page.reload()
        browser.close()


with sync_playwright() as playwright:
    run_verification(playwright)

print("Verification script executed successfully.")