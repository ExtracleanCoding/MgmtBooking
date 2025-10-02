import os
from playwright.sync_api import sync_playwright, Page, expect

def run_verification(page: Page):
    """
    Verifies that the bug fixes have been correctly implemented.
    1. Checks if settings persistence is fixed.
    2. Implicitly checks if the app is functional after de-duplication.
    """
    # Get the absolute path to index.html
    # This is necessary because we are running the script from a different directory
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    index_html_path = os.path.join(base_dir, 'index.html')

    # 1. Navigate to the local index.html file
    page.goto(f'file://{index_html_path}')

    # 2. Go to the Settings page
    settings_nav_button = page.get_by_role("button", name="Settings")
    expect(settings_nav_button).to_be_visible()
    settings_nav_button.click()

    # 3. Change the "First Day of the Week" setting
    first_day_select = page.locator("#first-day-of-week")
    expect(first_day_select).to_be_visible()

    # Determine the new value to set
    current_value = first_day_select.evaluate("el => el.value")
    new_value = "sunday" if current_value == "monday" else "monday"

    first_day_select.select_option(new_value)

    # 4. Save the settings
    save_button = page.get_by_role("button", name="Save Settings")
    save_button.click()

    # 5. Wait for the success dialog to appear and then disappear
    dialog_title = page.locator("#dialog-title")
    expect(dialog_title).to_have_text("Success")
    ok_button = page.get_by_role("button", name="OK")
    ok_button.click()
    expect(dialog_title).not_to_be_visible()

    # 6. Reload the page to simulate a new session
    page.reload()

    # 7. Go back to the Settings page
    # We need to wait for the app to re-initialize
    expect(settings_nav_button).to_be_visible()
    settings_nav_button.click()

    # 8. Assert that the setting has persisted
    expect(first_day_select).to_have_value(new_value)
    print(f"Successfully verified that 'First Day of the Week' persisted as '{new_value}'.")

    # 9. Take a screenshot for visual confirmation
    screenshot_path = "jules-scratch/verification/verification.png"
    page.screenshot(path=screenshot_path)
    print(f"Screenshot saved to {screenshot_path}")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()