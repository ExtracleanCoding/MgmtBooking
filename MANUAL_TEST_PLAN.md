# Comprehensive Manual Test Plan
## Ray Ryan Management System - Full Regression Testing Guide

**Version:** 3.1.0
**Last Updated:** 2025-11-05
**Test Type:** Manual UI/UX & Integration Testing

---

## Table of Contents
1. [Pre-Test Setup](#pre-test-setup)
2. [Customer Management Tests](#customer-management-tests)
3. [Staff Management Tests](#staff-management-tests)
4. [Resource Management Tests](#resource-management-tests)
5. [Service Management Tests](#service-management-tests)
6. [Booking System Tests](#booking-system-tests)
7. [Calendar View Tests](#calendar-view-tests)
8. [Billing & Payment Tests](#billing--payment-tests)
9. [Tour-Specific Tests](#tour-specific-tests)
10. [Reports & Analytics Tests](#reports--analytics-tests)
11. [Settings & Configuration Tests](#settings--configuration-tests)
12. [Data Persistence Tests](#data-persistence-tests)
13. [Edge Cases & Error Handling](#edge-cases--error-handling)
14. [Performance & Usability Tests](#performance--usability-tests)

---

## Pre-Test Setup

### Environment Setup
- [ ] Open `index.html` in **Google Chrome** (latest version)
- [ ] Open **Developer Console** (F12)
- [ ] Run automated test suite first (paste `comprehensive-test-suite.js`)
- [ ] Verify all automated tests pass before manual testing
- [ ] Clear localStorage if fresh start needed: `localStorage.clear()`
- [ ] Reload page to get dummy data

### Test Data Verification
- [ ] Verify at least 3 customers exist
- [ ] Verify at least 2 staff members exist
- [ ] Verify at least 1 vehicle resource exists
- [ ] Verify at least 2 services exist (1 DRIVING_LESSON, 1 TOUR)
- [ ] Verify at least 5 bookings exist across different dates

---

## Customer Management Tests

### TC-CM-001: Create New Customer
**Steps:**
1. Click "Customers" in navigation
2. Click "+ Add Customer" button
3. Fill in customer details:
   - Name: "Test Customer Manual"
   - Email: "test@manual.com"
   - Phone: "+1234567890"
   - Address: "123 Test Street"
4. Click "Save Customer"

**Expected Result:**
- ✅ Customer appears in customers list
- ✅ Toast notification shows "Customer saved"
- ✅ Modal closes automatically
- ✅ Customer ID is generated

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-CM-002: Edit Existing Customer
**Steps:**
1. Navigate to Customers view
2. Click on any customer row
3. Modify the name (append " EDITED")
4. Click "Save Customer"

**Expected Result:**
- ✅ Customer name updates in list
- ✅ Toast shows success message
- ✅ Other fields remain unchanged
- ✅ Modal closes

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-CM-003: Delete Customer (No Bookings)
**Steps:**
1. Create a new customer
2. Click on the customer
3. Click "Delete Customer" button
4. Confirm deletion in dialog

**Expected Result:**
- ✅ Customer removed from list
- ✅ Toast confirmation shown
- ✅ Modal closes

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-CM-004: Delete Customer (With Bookings)
**Steps:**
1. Select a customer who has bookings
2. Click "Delete Customer"
3. Observe warning message

**Expected Result:**
- ✅ Warning dialog appears
- ✅ Shows count of affected bookings
- ✅ If confirmed, customer AND bookings are deleted
- ✅ Toast shows confirmation

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-CM-005: Customer Progress Tracking
**Steps:**
1. Click on a customer
2. Click "View Progress" button
3. Add a progress note:
   - Select a past booking date
   - Enter skills practiced: "Parallel parking, Highway merging"
   - Enter notes: "Good progress on parking"
   - Set performance rating: 4/5
4. Click "Save Note"

**Expected Result:**
- ✅ Progress note appears in timeline
- ✅ Skills badges shown
- ✅ Progress percentage updates
- ✅ Note saved to customer record

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-CM-006: Input Validation
**Steps:**
1. Try to create customer with empty name
2. Try to create customer with invalid email format
3. Try to create customer with invalid phone

**Expected Result:**
- ✅ Form validation prevents submission
- ✅ Error messages shown for invalid fields
- ✅ Modal remains open until valid data entered

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

## Staff Management Tests

### TC-SM-001: Create Driving Instructor
**Steps:**
1. Navigate to Staff view
2. Click "+ Add Staff"
3. Fill details:
   - Name: "John Instructor"
   - Email: "john@driving.com"
   - Phone: "+1234567890"
   - Staff Type: "INSTRUCTOR"
4. Save

**Expected Result:**
- ✅ Instructor added to list
- ✅ Shows as "INSTRUCTOR" type
- ✅ Available for driving lesson bookings

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-SM-002: Create Tour Guide with Qualifications
**Steps:**
1. Click "+ Add Staff"
2. Fill basic details
3. Select Staff Type: "GUIDE"
4. Observe guide-specific fields appear
5. Fill guide qualifications:
   - Languages: "English, Spanish"
   - Specializations: "History, Nature"
   - Certifications: "Tour Guide License, First Aid"
   - Expiry Date: Future date
   - Rating: 4.5
6. Save

**Expected Result:**
- ✅ Guide-specific fields appear when GUIDE selected
- ✅ Qualifications saved correctly
- ✅ Guide available for tour bookings
- ✅ Languages and specializations display in list

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-SM-003: Edit Staff Member
**Steps:**
1. Click on existing staff
2. Change phone number
3. Change staff type from INSTRUCTOR to GUIDE
4. Add qualifications
5. Save

**Expected Result:**
- ✅ Changes persist
- ✅ Type change reflected in bookings
- ✅ Qualifications added successfully

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-SM-004: Delete Staff Member
**Steps:**
1. Create new staff with no bookings
2. Delete staff
3. Confirm deletion

**Expected Result:**
- ✅ Staff removed from list
- ✅ No longer available in booking dropdowns

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-SM-005: Staff with Active Bookings
**Steps:**
1. Try to delete staff with upcoming bookings
2. Observe warning

**Expected Result:**
- ✅ Warning shows count of affected bookings
- ✅ Option to proceed or cancel
- ✅ If confirmed, bookings remain but show "Unassigned" staff

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

## Resource Management Tests

### TC-RM-001: Create Vehicle Resource
**Steps:**
1. Navigate to Resources
2. Click "+ Add Resource"
3. Fill details:
   - Name: "Test Vehicle 1"
   - Type: "VEHICLE"
   - Registration: "ABC-123"
   - Insurance Expiry: Future date
   - Service Due: Future date
   - Capacity: 4
4. Save

**Expected Result:**
- ✅ Vehicle added to list
- ✅ Compliance dates tracked
- ✅ Available for booking selection

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-RM-002: Create Equipment Resource
**Steps:**
1. Add resource
2. Type: "EQUIPMENT"
3. Name: "Tour Bus 1"
4. Capacity: 30
5. Save

**Expected Result:**
- ✅ Equipment added
- ✅ Different fields shown for equipment vs vehicle
- ✅ Capacity limit enforced in bookings

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-RM-003: Resource Compliance Warnings
**Steps:**
1. Create vehicle with insurance expiring in 7 days
2. Navigate to Calendar view
3. Check for compliance warnings

**Expected Result:**
- ✅ Warning notification appears on dashboard
- ✅ Shows which resource needs attention
- ✅ Resource marked in red/warning color

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-RM-004: Edit Resource
**Steps:**
1. Click on resource
2. Update insurance expiry date
3. Save

**Expected Result:**
- ✅ Date updates
- ✅ Warning status recalculated
- ✅ Changes reflect immediately

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-RM-005: Delete Resource
**Steps:**
1. Create resource with no bookings
2. Delete it

**Expected Result:**
- ✅ Resource removed
- ✅ Not available in booking forms

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

## Service Management Tests

### TC-SV-001: Create Fixed-Price Service
**Steps:**
1. Navigate to Services
2. Click "+ Add Service"
3. Fill details:
   - Name: "1-Hour Standard Lesson"
   - Type: "DRIVING_LESSON"
   - Duration: 60 minutes
   - Pricing Type: "Fixed"
   - Base Price: £50
4. Save

**Expected Result:**
- ✅ Service created
- ✅ Shows in services list
- ✅ Available in booking form
- ✅ Price calculation uses fixed price

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-SV-002: Create Tiered-Price Tour Service
**Steps:**
1. Add new service
2. Type: "TOUR"
3. Name: "City Historical Tour"
4. Duration: 120 minutes
5. Pricing Type: "Tiered"
6. Add tiers:
   - Tier 1: 1-5 people @ £100/person
   - Tier 2: 6-15 people @ £80/person
   - Tier 3: 16+ people @ £60/person
7. Save

**Expected Result:**
- ✅ Multiple pricing tiers saved
- ✅ Tier selection works in booking
- ✅ Price auto-calculates based on group size

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-SV-003: Edit Service Pricing
**Steps:**
1. Open existing service
2. Change pricing from Fixed to Tiered
3. Add pricing tiers
4. Save

**Expected Result:**
- ✅ Pricing type changes
- ✅ Existing bookings keep old price
- ✅ New bookings use new pricing
- ✅ UI updates to show tier options

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-SV-004: Service with Capacity Limits
**Steps:**
1. Create service with capacity: 4
2. Try to book with 6 people

**Expected Result:**
- ✅ Warning shown if exceeds capacity
- ✅ Can still book (warning only)
- ✅ Capacity check works

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-SV-005: Delete Service
**Steps:**
1. Create service with no bookings
2. Delete it

**Expected Result:**
- ✅ Service removed
- ✅ Not in booking dropdown

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

## Booking System Tests

### TC-BK-001: Create Simple Driving Lesson Booking
**Steps:**
1. Navigate to Calendar (Day View)
2. Click on a time slot (e.g., 10:00 AM)
3. Fill booking form:
   - Customer: Select existing
   - Service: "1-Hour Standard Lesson"
   - Staff: Select instructor
   - Resource: Select vehicle
   - Date: Today or future date
   - Start Time: 10:00
   - End Time: 11:00
4. Save

**Expected Result:**
- ✅ Booking appears on calendar
- ✅ Shows customer name
- ✅ Shows correct time slot
- ✅ Color-coded properly
- ✅ Fee calculated automatically

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-BK-002: Create Tour Booking with Group
**Steps:**
1. Create booking
2. Select tour service
3. Set group size: 8
4. Add participants (comma-separated names)
5. Check "Waiver Signed" checkbox
6. Add special requirements: "Wheelchair accessible"
7. Save

**Expected Result:**
- ✅ Booking saved with group details
- ✅ Waiver timestamp recorded
- ✅ Participants list saved
- ✅ Group pricing calculated correctly (8 × tier price)
- ✅ Special requirements saved

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-BK-003: Booking Conflict Detection - Same Staff
**Steps:**
1. Create booking: Staff A, 10:00-11:00
2. Try to create another: Staff A, 10:30-11:30 (overlapping)

**Expected Result:**
- ✅ Conflict warning shown
- ✅ Shows conflicting booking details
- ✅ Prevents double-booking (or allows with warning)
- ✅ User can override if needed

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-BK-004: Booking Conflict Detection - Same Resource
**Steps:**
1. Create booking: Vehicle 1, 14:00-15:00
2. Try to create: Vehicle 1, 14:30-15:30

**Expected Result:**
- ✅ Conflict detected
- ✅ Warning shown
- ✅ Suggests different resource or time

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-BK-005: Adjacent Booking Warning
**Steps:**
1. Create booking: 10:00-11:00
2. Create booking: 11:00-12:00 (no gap)

**Expected Result:**
- ✅ Warning about no buffer time
- ✅ Informational only (not blocking)
- ✅ Can proceed if desired

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-BK-006: Edit Existing Booking
**Steps:**
1. Click on existing booking
2. Change start time
3. Change staff member
4. Save

**Expected Result:**
- ✅ Changes saved
- ✅ Conflict detection runs again
- ✅ Calendar updates immediately

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-BK-007: Delete Booking
**Steps:**
1. Click on booking
2. Click "Delete Booking"
3. Confirm

**Expected Result:**
- ✅ Booking removed from calendar
- ✅ If payment made, transaction still exists
- ✅ Toast confirmation shown

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-BK-008: Recurring Booking - Daily
**Steps:**
1. Create new booking
2. Check "Recurring" checkbox
3. Select "Daily"
4. Set count: 5
5. Save

**Expected Result:**
- ✅ Preview shows 5 dates
- ✅ All 5 bookings created
- ✅ Each has unique ID
- ✅ All linked by recurring group ID

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-BK-009: Recurring Booking - Weekly
**Steps:**
1. Recurring booking
2. Type: "Weekly"
3. Count: 4 (4 weeks)
4. Save

**Expected Result:**
- ✅ Bookings created 7 days apart
- ✅ Same day of week
- ✅ 4 bookings total

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-BK-010: Recurring Booking - With Conflicts
**Steps:**
1. Create single booking on Nov 20
2. Try to create recurring (weekly) that would conflict on Nov 20

**Expected Result:**
- ✅ Conflict detected for Nov 20
- ✅ Shows which dates conflict
- ✅ Option to skip conflicting dates
- ✅ Creates non-conflicting bookings

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-BK-011: Multi-Day Tour Booking
**Steps:**
1. Create tour booking
2. Check "Multi-day Tour" checkbox
3. Set end date: 3 days after start
4. Add accommodation details
5. Save

**Expected Result:**
- ✅ Multi-day fields appear
- ✅ Booking spans multiple days
- ✅ Shows on all days in calendar
- ✅ Accommodation info saved

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-BK-012: Mark Booking as Completed
**Steps:**
1. Click on scheduled booking
2. Change status to "Completed"
3. Save

**Expected Result:**
- ✅ Status updates
- ✅ Visual indicator changes (grayed out or strikethrough)
- ✅ Included in completed bookings count

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-BK-013: Cancel Booking
**Steps:**
1. Open booking
2. Set status: "Cancelled"
3. Save

**Expected Result:**
- ✅ Booking marked cancelled
- ✅ Waiting list checked for slot
- ✅ Notification sent to waiting list customers

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-BK-014: Booking with Payment on Creation
**Steps:**
1. Create booking
2. Set payment status: "Paid"
3. Enter amount
4. Save

**Expected Result:**
- ✅ Transaction created automatically
- ✅ Booking linked to transaction
- ✅ Shows as paid in billing view

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

## Calendar View Tests

### TC-CV-001: Month View Navigation
**Steps:**
1. Navigate to Calendar
2. Click "Month" view
3. Click next month arrow
4. Click previous month arrow

**Expected Result:**
- ✅ Calendar shows full month grid
- ✅ Bookings appear on correct dates
- ✅ Navigation changes month
- ✅ Current date highlighted

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-CV-002: Week View Navigation
**Steps:**
1. Switch to "Week" view
2. Navigate to next week
3. Navigate to previous week

**Expected Result:**
- ✅ Shows 7 days horizontally
- ✅ Time slots shown vertically
- ✅ Bookings appear in correct time slots
- ✅ Week navigation works

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-CV-003: Day View with Multiple Bookings
**Steps:**
1. Switch to "Day" view
2. Select a day with 3+ bookings

**Expected Result:**
- ✅ All bookings shown in timeline
- ✅ No overlapping visual elements
- ✅ Time slots clearly marked
- ✅ Bookings color-coded by status

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-CV-004: Day View Time Slot Click
**Steps:**
1. In Day view, click on empty 2:00 PM slot

**Expected Result:**
- ✅ Booking modal opens
- ✅ Date pre-filled
- ✅ Start time set to 2:00 PM
- ✅ End time auto-calculated (+1 hour)

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-CV-005: Booking Click in Calendar
**Steps:**
1. Click on existing booking in any view

**Expected Result:**
- ✅ Booking modal opens
- ✅ All fields pre-filled
- ✅ In edit mode (not create)
- ✅ Can modify and save

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-CV-006: Calendar Today Button
**Steps:**
1. Navigate to different month
2. Click "Today" button

**Expected Result:**
- ✅ Calendar jumps to current date
- ✅ Correct view maintained
- ✅ Current date highlighted

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-CV-007: Overlapping Bookings Display
**Steps:**
1. Create 3 overlapping bookings (same time, different resources/staff)
2. View in Day view

**Expected Result:**
- ✅ All 3 bookings visible
- ✅ Columns assigned to prevent overlap
- ✅ Each booking readable
- ✅ No visual corruption

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-CV-008: Drag and Drop Booking (if supported)
**Steps:**
1. Drag booking from 10:00 to 14:00

**Expected Result:**
- ✅ Booking moves to new time
- ✅ Conflict check runs
- ✅ Visual feedback during drag
- ✅ Save occurs on drop

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-CV-009: Day Summary Modal
**Steps:**
1. Click on date header or summary icon
2. View day summary

**Expected Result:**
- ✅ Modal shows all bookings for day
- ✅ Shows total revenue
- ✅ Shows total hours scheduled
- ✅ List of customers

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

## Billing & Payment Tests

### TC-BP-001: View Customer Billing Summary
**Steps:**
1. Navigate to Billing view
2. Select a customer from dropdown

**Expected Result:**
- ✅ Shows all bookings for customer
- ✅ Shows total fees
- ✅ Shows total paid
- ✅ Shows outstanding balance
- ✅ Breakdown by booking visible

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-BP-002: Record Single Payment
**Steps:**
1. Select customer with unpaid bookings
2. Select one booking
3. Enter payment amount
4. Click "Record Payment"

**Expected Result:**
- ✅ Transaction created
- ✅ Booking status updates to "Paid"
- ✅ Balance recalculates
- ✅ Transaction listed in history

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-BP-003: Bulk Payment for Customer
**Steps:**
1. Select customer with 3 unpaid bookings
2. Check all 3 bookings
3. Enter total payment amount
4. Click "Record Bulk Payment"

**Expected Result:**
- ✅ Single transaction for all
- ✅ All bookings marked paid
- ✅ Payment distributed correctly
- ✅ Customer balance = 0

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-BP-004: Partial Payment
**Steps:**
1. Booking fee: £100
2. Record payment: £50
3. Save

**Expected Result:**
- ✅ Booking shows "Partially Paid"
- ✅ Remaining balance: £50
- ✅ Transaction for £50 created
- ✅ Can make additional payment later

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-BP-005: Overpayment (Credit)
**Steps:**
1. Booking fee: £100
2. Record payment: £150

**Expected Result:**
- ✅ Transaction recorded
- ✅ Booking marked "Paid (Credit)"
- ✅ £50 credit shown on customer
- ✅ Credit applied to future bookings

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-BP-006: Overdue Payments Report
**Steps:**
1. Create booking in past (2 weeks ago)
2. Leave unpaid
3. Navigate to Billing
4. Check "Overdue" filter

**Expected Result:**
- ✅ Overdue booking appears
- ✅ Shows days overdue
- ✅ Highlighted in red
- ✅ Can send payment reminder

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-BP-007: Send Payment Reminder
**Steps:**
1. Select customer with overdue payment
2. Click "Send Payment Reminder"

**Expected Result:**
- ✅ Email/SMS template shown
- ✅ Contains customer name, amount, days overdue
- ✅ Reminder logged
- ✅ Toast confirmation

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-BP-008: Invoice Generation
**Steps:**
1. Click "Generate Invoice" for customer
2. View invoice modal

**Expected Result:**
- ✅ Invoice shows company details
- ✅ Customer details
- ✅ Itemized booking list
- ✅ Total amount
- ✅ Print button works

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-BP-009: Print Invoice
**Steps:**
1. Generate invoice
2. Click "Print Invoice"

**Expected Result:**
- ✅ Print dialog opens
- ✅ Invoice formatted for printing
- ✅ Headers/footers appropriate
- ✅ No UI elements in print view

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-BP-010: Billing Pagination
**Steps:**
1. Navigate to Billing (with 20+ bookings)
2. Click "Next Page"
3. Click "Previous Page"

**Expected Result:**
- ✅ Shows 10 items per page
- ✅ Navigation works
- ✅ Total count shown
- ✅ Page numbers accurate

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-BP-011: Sell Lesson Package
**Steps:**
1. Navigate to customer
2. Click "Sell Package"
3. Select "10-Lesson Package"
4. Enter price: £400
5. Record payment
6. Save

**Expected Result:**
- ✅ Package credits added to customer (10 credits)
- ✅ Transaction recorded
- ✅ Can use credits for future bookings
- ✅ Package shows in customer details

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-BP-012: Use Package Credits
**Steps:**
1. Customer has 10 lesson credits
2. Create booking
3. Select "Pay with Package Credit"
4. Save

**Expected Result:**
- ✅ Credit deducted (9 remaining)
- ✅ Booking marked as paid
- ✅ No cash transaction created
- ✅ Credit count updates

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

## Tour-Specific Tests

### TC-TR-001: Group Size Auto-Pricing
**Steps:**
1. Create tour booking
2. Set group size: 3
3. Observe calculated fee
4. Change group size: 10
5. Observe fee change

**Expected Result:**
- ✅ Fee = tier price × group size
- ✅ Correct tier selected based on size
- ✅ Real-time price update
- ✅ Tier 1 (1-5): £100/person
- ✅ Tier 2 (6-15): £80/person

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-TR-002: Participant List Management
**Steps:**
1. Create tour with group size 5
2. Enter participants: "John Doe, Jane Smith, Bob Johnson, Alice Brown, Charlie Davis"
3. Save

**Expected Result:**
- ✅ Participants saved as array
- ✅ Displays as list in booking details
- ✅ Count matches group size

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-TR-003: Waiver Signing Workflow
**Steps:**
1. Create tour booking
2. Leave "Waiver Signed" unchecked
3. Save
4. Reopen booking
5. Check "Waiver Signed"
6. Save

**Expected Result:**
- ✅ Waiver timestamp recorded
- ✅ Shows waiver status in list
- ✅ Warning if waiver not signed before tour date

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-TR-004: Special Requirements
**Steps:**
1. Create tour
2. Add special requirements: "Vegetarian meals, Wheelchair access"
3. Save

**Expected Result:**
- ✅ Requirements saved
- ✅ Visible in booking details
- ✅ Shows in tour summary report

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-TR-005: Multi-Day Tour Creation
**Steps:**
1. Create tour booking
2. Check "Multi-day Tour"
3. Start date: Nov 15
4. End date: Nov 18 (4 days)
5. Add accommodation: "Grand Hotel, Room 305"
6. Save

**Expected Result:**
- ✅ Booking spans 4 days in calendar
- ✅ Accommodation details saved
- ✅ Single booking ID for entire tour
- ✅ Fee calculated for full duration

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-TR-006: Tour Analytics Report
**Steps:**
1. Navigate to Reports
2. View "Tour Analytics" section

**Expected Result:**
- ✅ Total participants count
- ✅ Total tour revenue
- ✅ Average group size
- ✅ Occupancy rate
- ✅ Waiver compliance %
- ✅ Popular tour types

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-TR-007: Guide Qualification Display
**Steps:**
1. Create tour booking
2. Select guide from staff dropdown
3. View guide qualifications in tooltip/popup

**Expected Result:**
- ✅ Shows languages spoken
- ✅ Shows specializations
- ✅ Shows certifications
- ✅ Shows rating

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-TR-008: Tour Capacity Limits
**Steps:**
1. Tour service capacity: 15
2. Try to book with group size: 20

**Expected Result:**
- ✅ Warning shown
- ✅ Suggests multiple bookings or larger vehicle
- ✅ Can override if needed

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

## Reports & Analytics Tests

### TC-RA-001: Income Analytics Dashboard
**Steps:**
1. Navigate to Reports
2. View "Income Analytics" section

**Expected Result:**
- ✅ Monthly revenue chart
- ✅ Revenue by service type
- ✅ Revenue by staff member
- ✅ YTD total
- ✅ Average booking value

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-RA-002: Date Range Filtering
**Steps:**
1. In Reports, set date range: Nov 1 - Nov 15
2. View updated analytics

**Expected Result:**
- ✅ Only bookings in range shown
- ✅ Revenue recalculated
- ✅ Charts update
- ✅ Booking count accurate

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-RA-003: Service Popularity Chart
**Steps:**
1. View "Most Popular Services" chart

**Expected Result:**
- ✅ Bar chart shows booking count per service
- ✅ Sorted by popularity
- ✅ Correct colors
- ✅ Labels readable

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-RA-004: Staff Performance Report
**Steps:**
1. View "Staff Performance" section

**Expected Result:**
- ✅ Bookings per staff member
- ✅ Revenue per staff member
- ✅ Average rating (if applicable)
- ✅ Hours worked

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-RA-005: Expense Tracking
**Steps:**
1. Add expense:
   - Category: "Fuel"
   - Amount: £80
   - Date: Today
   - Description: "Fuel for vehicle 1"
2. Save
3. View expense in reports

**Expected Result:**
- ✅ Expense appears in list
- ✅ Included in expense chart
- ✅ Deducted from net profit calculation

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-RA-006: Export Reports to Excel
**Steps:**
1. Click "Export to Excel"

**Expected Result:**
- ✅ Excel file downloads
- ✅ Contains all report data
- ✅ Formatted correctly
- ✅ Filename includes date

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-RA-007: Print Summary Report
**Steps:**
1. Click "Print Summary"

**Expected Result:**
- ✅ Print dialog opens
- ✅ Report formatted for printing
- ✅ Charts included
- ✅ Date range shown

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-RA-008: KPI Cards
**Steps:**
1. View top of Reports page

**Expected Result:**
- ✅ Total Revenue card
- ✅ Total Bookings card
- ✅ Average Booking Value card
- ✅ Outstanding Balance card
- ✅ All values accurate

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

## Settings & Configuration Tests

### TC-ST-001: Update Business Settings
**Steps:**
1. Navigate to Settings
2. Update:
   - Business name
   - Email
   - Phone
   - Address
3. Save

**Expected Result:**
- ✅ Settings saved to state
- ✅ Toast confirmation
- ✅ Changes persist after reload

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-ST-002: Calendar Hour Configuration
**Steps:**
1. Set calendar start hour: 7 AM
2. Set calendar end hour: 9 PM
3. Save
4. View calendar

**Expected Result:**
- ✅ Calendar shows 7 AM - 9 PM
- ✅ Cannot book outside hours
- ✅ Settings persist

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-ST-003: Auto-Reminders Toggle
**Steps:**
1. Enable "Auto Email Reminders"
2. Save
3. Disable "Auto Email Reminders"
4. Save

**Expected Result:**
- ✅ Setting toggles correctly
- ✅ When enabled, reminders sent automatically
- ✅ When disabled, no auto-reminders

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-ST-004: Email Template Customization
**Steps:**
1. Edit SMS template
2. Use placeholders: [CustomerFirstName], [LessonDate], [LessonTime]
3. Save
4. Send test reminder

**Expected Result:**
- ✅ Template saved
- ✅ Placeholders replaced correctly
- ✅ Preview shows substituted values

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-ST-005: Payment Reminder Days
**Steps:**
1. Set "Payment Reminder Days": 7
2. Save

**Expected Result:**
- ✅ Reminders sent 7 days after due date
- ✅ Setting applied to calculations

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-ST-006: Invoice Customization
**Steps:**
1. Update invoice footer text
2. Update business logo URL
3. Save

**Expected Result:**
- ✅ Changes appear in generated invoices
- ✅ Logo displays correctly
- ✅ Footer text shown

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

## Data Persistence Tests

### TC-DP-001: LocalStorage Save on Change
**Steps:**
1. Create new customer
2. Open DevTools → Application → LocalStorage
3. Check for key "rayRyanState" or similar

**Expected Result:**
- ✅ Data saved to localStorage
- ✅ JSON structure valid
- ✅ Customer exists in saved data

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-DP-002: Data Persists After Page Reload
**Steps:**
1. Create booking
2. Reload page (F5)
3. Check if booking still exists

**Expected Result:**
- ✅ All data loads from localStorage
- ✅ Booking visible in calendar
- ✅ No data loss

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-DP-003: Backup Download
**Steps:**
1. Navigate to Settings
2. Click "Download Backup"

**Expected Result:**
- ✅ JSON file downloads
- ✅ Contains all state data
- ✅ Filename includes timestamp
- ✅ File is valid JSON

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-DP-004: Restore from Backup
**Steps:**
1. Download backup
2. Clear all data
3. Click "Restore from Backup"
4. Select backup file
5. Confirm restore

**Expected Result:**
- ✅ All data restored
- ✅ Bookings reappear
- ✅ Customers, staff, resources restored
- ✅ Settings restored

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-DP-005: Clear All Data
**Steps:**
1. Click "Clear All Data"
2. Confirm action
3. Check state

**Expected Result:**
- ✅ All data cleared
- ✅ localStorage emptied
- ✅ Fresh state loaded
- ✅ Warning shown before clearing

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-DP-006: Auto-Backup (if enabled)
**Steps:**
1. Enable auto-backup (daily)
2. Wait 24 hours or simulate

**Expected Result:**
- ✅ Backup triggered automatically
- ✅ File saved to downloads
- ✅ Notification shown

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

## Edge Cases & Error Handling

### TC-EC-001: Null/Undefined Handling
**Steps:**
1. In console: `timeToMinutes(null)`
2. Expected: 0
3. Try: `safeDateFormat(null)`
4. Expected: "Invalid Date"

**Expected Result:**
- ✅ No crashes
- ✅ Graceful fallbacks
- ✅ Errors logged but app continues

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-EC-002: Invalid Date Inputs
**Steps:**
1. Try to create booking with date: "2025-13-45"
2. Try to create booking with past date

**Expected Result:**
- ✅ Validation prevents invalid dates
- ✅ Error message shown
- ✅ Form doesn't submit

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-EC-003: Time Input Edge Cases
**Steps:**
1. Enter start time: "25:99"
2. Enter end time before start time

**Expected Result:**
- ✅ Validation catches invalid time
- ✅ Error for end < start
- ✅ Cannot save

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-EC-004: Empty Required Fields
**Steps:**
1. Try to save customer with no name
2. Try to save booking with no customer

**Expected Result:**
- ✅ Form validation prevents save
- ✅ Red highlights on required fields
- ✅ Error message shown

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-EC-005: XSS Attack Prevention
**Steps:**
1. Enter customer name: `<script>alert('XSS')</script>`
2. Save and view in list

**Expected Result:**
- ✅ Script not executed
- ✅ HTML escaped (shows as text)
- ✅ No security vulnerability

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-EC-006: Large Data Set Performance
**Steps:**
1. Create 100+ bookings
2. Navigate calendar
3. Generate reports

**Expected Result:**
- ✅ UI remains responsive
- ✅ No lag in navigation
- ✅ Charts render correctly
- ✅ LocalStorage doesn't exceed quota

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-EC-007: Concurrent Edits (Same User)
**Steps:**
1. Open booking in modal
2. Open same booking in new tab
3. Edit in both
4. Save both

**Expected Result:**
- ✅ Last save wins
- ✅ No data corruption
- ✅ (Warning if possible)

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-EC-008: Network Errors (External APIs)
**Steps:**
1. Disconnect network
2. Try to export to Google Calendar
3. Observe error handling

**Expected Result:**
- ✅ Error message shown
- ✅ App doesn't crash
- ✅ Retry option available

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

## Performance & Usability Tests

### TC-PU-001: Page Load Time
**Steps:**
1. Clear cache
2. Load page
3. Measure time to interactive

**Expected Result:**
- ✅ Loads in < 3 seconds
- ✅ No visual glitches
- ✅ All assets loaded

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-PU-002: Mobile Responsiveness
**Steps:**
1. Open in mobile viewport (375px width)
2. Navigate all views
3. Test touch interactions

**Expected Result:**
- ✅ Layout adapts to mobile
- ✅ Navigation accessible
- ✅ Forms usable
- ✅ No horizontal scroll

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-PU-003: Keyboard Navigation
**Steps:**
1. Use TAB to navigate forms
2. Use ENTER to submit
3. Use ESC to close modals

**Expected Result:**
- ✅ Logical tab order
- ✅ Keyboard shortcuts work
- ✅ Fully accessible via keyboard

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-PU-004: Browser Compatibility
**Steps:**
1. Test in Chrome
2. Test in Firefox
3. Test in Safari
4. Test in Edge

**Expected Result:**
- ✅ Works in all modern browsers
- ✅ Consistent appearance
- ✅ All features functional

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

### TC-PU-005: Error Messages Clarity
**Steps:**
1. Trigger various errors
2. Read error messages

**Expected Result:**
- ✅ Messages are clear and helpful
- ✅ Suggest corrective action
- ✅ Not overly technical

**Status:** [ ] Pass [ ] Fail [ ] N/A

---

## Test Summary Report Template

### Overall Results

**Total Test Cases:** ___
**Passed:** ___
**Failed:** ___
**Not Applicable:** ___
**Pass Rate:** ___%

### Critical Issues Found
1.
2.
3.

### Medium Priority Issues
1.
2.
3.

### Low Priority Issues / Enhancements
1.
2.
3.

### Recommendations
1.
2.
3.

### Sign-Off

**Tested By:** _______________
**Date:** _______________
**Version Tested:** 3.1.0
**Status:** ☐ Approved ☐ Conditional ☐ Rejected

---

## Notes for Testers

- **Take screenshots** of any failures
- **Log console errors** when issues occur
- **Document** steps to reproduce bugs
- **Test on multiple browsers** when possible
- **Test with realistic data** volumes
- **Check for data consistency** across views

**Good luck testing!** 🚀
