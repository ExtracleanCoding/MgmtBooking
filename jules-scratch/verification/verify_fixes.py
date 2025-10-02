from playwright.sync_api import sync_playwright, Page, expect
import time

def run_verification(page: Page):
    """
    This script verifies two fixes:
    1. The calendar week header respects the 'firstDayOfWeek' setting.
    2. Staff names are properly sanitized in dropdowns to prevent XSS.
    """
    # Navigate to the app
    # Using filepath since there's no server running
    page.goto("file:///app/index.html")

    # It's a single-page app, so give it a moment to load the initial view
    page.wait_for_selector("#calendar-view")

    # --- Step 1: Add a staff member with a malicious name ---
    page.get_by_role("button", name="Staff").click()
    expect(page.get_by_role("heading", name="Staff")).to_be_visible()
    page.get_by_role("button", name="Add Staff Member").click()

    # Fill and save the new staff member
    page.locator('#staff-modal').get_by_label("Full Name").fill("<b>XSS Staff</b>")
    page.locator('#staff-modal').get_by_label("Email").fill("xss@test.com")
    page.locator('#staff-modal').get_by_role("button", name="Save Staff Member").click()

    # Wait for modal to close and verify the staff member is in the list
    expect(page.get_by_role("cell", name="<b>XSS Staff</b>")).to_be_visible()

    # --- Step 2: Change first day of week to Sunday ---
    page.get_by_role("button", name="Settings").click()
    expect(page.get_by_role("heading", name="Settings", exact=True)).to_be_visible()
    page.get_by_label("First Day of the Week").select_option("sunday")
    page.get_by_role("button", name="Save Settings").click()
    # Wait for the confirmation dialog
    page.get_by_role("button", name="OK").click()

    # --- Step 3: Verify week header and take screenshot ---
    page.get_by_role("button", name="Calendar").click()
    page.get_by_role("button", name="Week").click()

    # We need to find a reliable way to check the date. Let's check for "SUN"
    # Scope the search to the calendar content to avoid matching other elements
    expect(page.locator("#calendar-content").get_by_text("SUN", exact=True)).to_be_visible()
    page.screenshot(path="jules-scratch/verification/verification_week_view.png")

    # --- Step 4: Verify sanitization in "Block Dates" modal ---
    page.get_by_role("button", name="Block Dates").click()

    # The <select> element for staff
    staff_select = page.locator("#block-staff")

    # The text content of the specific option should be the raw, un-rendered HTML
    option_text = staff_select.locator("option[value^='staff_']").text_content()

    assert option_text == "<b>XSS Staff</b>"

    page.screenshot(path="jules-scratch/verification/verification_block_modal.png")

    # Close the modal
    page.get_by_role("button", name="Cancel").click()


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Clear localStorage before starting to ensure a clean slate
        page.goto("file:///app/index.html")
        page.evaluate("localStorage.clear()")

        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()