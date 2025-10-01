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

        # 1. Create a new vehicle with an initial mileage
        page.get_by_role("button", name="Resources").click()
        page.get_by_role("button", name="Add Resource").click()

        resource_modal = page.locator("#resource-modal")
        expect(resource_modal).to_be_visible()

        resource_modal.locator("#resource-name").fill("Test Car 2")
        resource_modal.locator("#resource-type").select_option("VEHICLE")
        resource_modal.locator("#resource-mileage").fill("60000")
        resource_modal.get_by_role("button", name="Save Resource").click()

        # 2. Add a booking for this new vehicle
        today = datetime.date.today()
        date_string = today.strftime('%Y-%m-%d')

        page.evaluate(f"""() => {{
            const booking = {{
                id: 'booking_mileage_test_2',
                date: '{date_string}',
                startTime: '13:00',
                endTime: '14:00',
                customerId: 'customer_3',
                staffId: 'staff_1',
                resourceIds: [state.resources.find(r => r.resource_name === 'Test Car 2').id],
                serviceId: 'service_lesson_1',
                status: 'Scheduled'
            }};
            state.bookings.push(booking);

            const fuelExpense = {{
                id: 'fuel_expense_test_2',
                date: '{date_string}',
                category: 'Fuel',
                description: 'Test Fuel 2',
                amount: 75.00
            }};
            state.expenses.push(fuelExpense);

            debouncedSaveState();
        }}""")

        # 3. Complete the booking to trigger mileage entry
        page.evaluate("openCompletionModal(state.bookings.find(b => b.id === 'booking_mileage_test_2'))")

        # 4. Verify the completion modal and enter mileage
        completion_modal = page.locator("#completion-modal")
        expect(completion_modal).to_be_visible()

        start_mileage_input = completion_modal.locator("#completion-start-mileage")
        end_mileage_input = completion_modal.locator("#completion-end-mileage")

        expect(start_mileage_input).to_have_value("60000")
        end_mileage_input.fill("60300")

        completion_modal.get_by_role("button", name="Paid Now").click()

        # 5. Navigate to the reports page and verify the mileage report
        page.get_by_role("button", name="Reports").click()

        mileage_report_container = page.locator("#mileage-report-container")
        expect(mileage_report_container).to_be_visible()
        expect(mileage_report_container).to_contain_text("Total Distance (All Vehicles)")
        expect(mileage_report_container).to_contain_text("300 km")

        # 6. Take a screenshot for visual confirmation
        page.screenshot(path="jules-scratch/verification/verification.png")
        print("Screenshot of mileage report taken successfully.")

    except Exception as e:
        page.screenshot(path="jules-scratch/verification/error_screenshot.png")
        print(f"An error occurred during verification: {e}")
        raise e

    finally:
        # 7. Clean up
        browser.close()


with sync_playwright() as playwright:
    run_verification(playwright)

print("Verification script executed successfully.")