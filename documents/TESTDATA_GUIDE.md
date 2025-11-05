# Test Data Import Guide
## Ray Ryan Management System

**File**: `testdata.json`
**Purpose**: Comprehensive test dataset covering all system functionality
**Created**: 2025-10-30

---

## 📦 What's Included

### Summary Statistics
- **6 Customers** (various credit levels and scenarios)
- **3 Staff Members** (instructors and tour guide)
- **4 Resources** (2 cars, 1 bus, 1 classroom)
- **5 Services** (lessons, mock tests, tours)
- **12 Bookings** (completed, scheduled, cancelled)
- **7 Transactions** (payments and package sales)
- **6 Expenses** (various categories)
- **2 Waiting List Entries**
- **3 Blocked Periods** (holidays and leave)
- **4 Lesson Packages** (configured in settings)

---

## 🎯 Test Scenarios Covered

### 1. Credits System Testing ✅

**Customer: John Murphy** (customer_test_001)
- Starting credits: **10 hours**
- Has completed 1 booking using credits (1 hour deducted)
- Has paid booking scheduled (not using credits)
- **Test**: Try to complete future bookings and use credits

**Customer: Sarah O'Connor** (customer_test_002)
- Starting credits: **5 hours**
- Bought 5-hour package (txn_test_007)
- **Test**: Credit deduction scenarios

**Customer: Lisa Brennan** (customer_test_006)
- Starting credits: **1 hour** (low balance)
- **Test**: Insufficient credits scenario

**Customer: Michael Kelly** (customer_test_003)
- Starting credits: **0 hours** (no credits)
- Has unpaid completed booking
- **Test**: Customer with no credits trying to use credit payment

**Customer: David Ryan** (customer_test_005)
- Starting credits: **20 hours** (high balance)
- Bought 20-hour package (txn_test_006)
- **Test**: Large credit balance management

### 2. Payment & Transaction Testing ✅

**Paid Bookings**:
- booking_test_002: Paid (with transaction txn_test_001)
- booking_test_005: Paid (with transaction txn_test_002)
- booking_test_008: Paid (with transaction txn_test_003)
- booking_test_011: Paid (with transaction txn_test_004)

**Paid (Credit) Bookings**:
- booking_test_001: Completed using credits (no transaction)
- booking_test_012: Completed using credits (no transaction)

**Unpaid Bookings**:
- booking_test_003: Completed but unpaid (outstanding balance)
- booking_test_004: Scheduled, unpaid
- booking_test_006: Scheduled, unpaid
- booking_test_009: Scheduled, unpaid
- booking_test_010: Scheduled, unpaid

**Test Cases**:
- Toggle payment status: unpaid → paid → unpaid → paid
- Verify only 1 transaction created (no duplicates)
- Check billing calculations

### 3. Booking Conflict Testing ✅

**Back-to-Back Bookings** (staff_test_001 on 2024-11-08):
- booking_test_009: 09:00-10:00
- booking_test_010: 10:00-11:00
- **Test**: Should show warning about no buffer time

**No Conflict** (different staff):
- Multiple bookings at same time but different instructors
- **Test**: Should allow booking

**Resource Conflict**:
- Same vehicle (resource_test_001) used by same staff
- **Test**: Try to double-book same car + staff

**Customer Conflict**:
- John Murphy (customer_test_001) has multiple bookings
- **Test**: Try to book same customer at overlapping times

### 4. Blocked Periods Testing ✅

**All Staff Blocked**:
- 2024-12-20 to 2024-12-27: Christmas Holiday
- **Test**: Try to create booking during this period

**Individual Staff Blocked**:
- Patrick Doyle (staff_test_002): 2024-11-15 (Training Day)
- Ray Ryan (staff_test_001): 2024-11-22 to 2024-11-24 (Personal Leave)
- **Test**: Staff should show "On Leave" in dropdown

### 5. Waiting List Testing ✅

**Lisa Brennan** (waiting_test_001):
- Waiting for: 2024-11-10 at 10:00 with Ray Ryan
- **Test**: Cancel a booking at that time → should trigger notification

**Michael Kelly** (waiting_test_002):
- Waiting for: 2024-11-12 at 14:00 with Patrick Doyle
- **Test**: Waiting list display and notifications

### 6. Billing & Financial Testing ✅

**Outstanding Balances**:
- Michael Kelly: €40 (1 unpaid completed lesson)
- Other customers: Various pending amounts

**Package Sales**:
- 3 package transactions (txn_test_005, 006, 007)
- **Test**: Package sales appear in billing

**Total Revenue Calculation**:
- Total from bookings: ~€555
- Total from packages: €1,180
- Total expenses: ~€671
- **Test**: Reports show correct totals

### 7. Calendar View Testing ✅

**Past Bookings** (Completed):
- 2024-10-30: booking_test_011
- 2024-10-31: booking_test_012
- 2024-11-04: booking_test_001, booking_test_002
- 2024-11-05: booking_test_003

**Current/Future Bookings** (Scheduled):
- 2024-11-05: booking_test_004
- 2024-11-06: booking_test_005, booking_test_006
- 2024-11-07: booking_test_008
- 2024-11-08: booking_test_009, booking_test_010

**Cancelled Bookings**:
- 2024-11-07: booking_test_007 (status: Cancelled)

**Test Cases**:
- Month view shows all bookings
- Week view groups correctly
- Day view shows timeline
- Drag and drop between dates

### 8. Service Types Testing ✅

**Different Service Types**:
- 1-Hour Lesson (€40)
- 2-Hour Lesson (€75)
- Mock Test (€60, 90 minutes)
- EDT Lesson (€45)
- City Tour (€150, tiered pricing)

**Test Cases**:
- Different duration bookings
- Pricing calculations
- Service selection in forms

### 9. Resource Management Testing ✅

**Vehicle Maintenance** (Due Soon):
- Tour Bus (resource_test_003): MOT due 2024-11-15 (OVERDUE!)
- **Test**: Should show compliance warning on dashboard

**Different Resource Types**:
- VEHICLE: Cars and bus
- ROOM: Classroom
- **Test**: Resource availability and conflicts

### 10. Progress Notes Testing ✅

**Customers with Notes**:
- John Murphy: 2 progress notes with skills
- Emma Walsh: 1 progress note
- **Test**: View, edit, delete progress notes

**Customers without Notes**:
- Other customers have empty progress notes
- **Test**: Add new progress note

### 11. Staff Activity Testing ✅

**Ray Ryan** (staff_test_001):
- 7 bookings assigned
- Blocked period: 2024-11-22 to 2024-11-24
- **Test**: Staff workload and availability

**Patrick Doyle** (staff_test_002):
- 4 bookings assigned
- Blocked period: 2024-11-15
- **Test**: Multiple staff scheduling

**Claire Murphy** (staff_test_003):
- 1 tour booking
- **Test**: Different staff types

### 12. Edge Cases ✅

**Back-to-Back Lessons**:
- 2024-11-08: Two lessons with no gap
- **Test**: Warning system for adjacent bookings

**Long Bookings**:
- 2-hour lessons span multiple time slots
- **Test**: Calendar rendering

**Mixed Payment Statuses**:
- Same customer has paid, unpaid, and credit bookings
- **Test**: Billing calculations

**Cancelled Impact**:
- Cancelled booking should not affect conflicts
- **Test**: Can book same time slot after cancellation

---

## 📋 How to Import Test Data

### Method 1: Using Settings Import (Recommended)

1. **Backup Current Data First!**
   - Open app
   - Go to Settings → Data Management
   - Click "Backup Now"
   - Save backup file

2. **Clear Existing Data** (Optional)
   - If you want a fresh start
   - Settings → "Clear All Data"
   - Confirm

3. **Import Test Data**
   - Go to Settings → Data Management
   - Click "Import Backup"
   - Select `testdata.json`
   - Wait for import to complete
   - You should see "Data imported successfully"

4. **Verify Import**
   - Go to Customers view → Should see 6 customers
   - Go to Calendar view → Should see bookings
   - Go to Billing view → Should see transactions

### Method 2: Manual Import via Console (Advanced)

1. Open app
2. Press **F12** (Developer Tools)
3. Go to **Console** tab
4. Paste this code:

```javascript
// Load test data (paste testdata.json contents into testData variable)
const testData = { /* PASTE TESTDATA.JSON CONTENTS HERE */ };

// Import into state
state.customers = testData.customers;
state.staff = testData.staff;
state.resources = testData.resources;
state.services = testData.services;
state.bookings = testData.bookings;
state.transactions = testData.transactions;
state.expenses = testData.expenses;
state.waitingList = testData.waitingList;
state.blockedPeriods = testData.blockedPeriods;
state.settings = testData.settings;

// Save to localStorage
saveState();

// Refresh view
location.reload();
```

---

## 🧪 Recommended Testing Sequence

### Phase 1: Basic Functionality (15 min)

1. **Import test data**
2. **Navigate views**:
   - Calendar (month/week/day)
   - Customers list
   - Services list
   - Billing view
3. **Verify data loaded**:
   - Count customers (should be 6)
   - Check calendar has bookings
   - Billing shows revenue

### Phase 2: Credits Testing (10 min)

1. **View John Murphy** (customer_test_001)
   - Should have 10 hours credit
2. **Find his scheduled booking** (2024-11-06, 14:00-15:30)
   - Mark as "Completed"
   - Choose "Use Lesson Credits"
   - **Verify**: Credits reduced to 8.5 hours (1.5 hour lesson)
3. **Try to complete it again**:
   - Edit same booking
   - Mark complete again
   - **Verify**: Error shown OR credits stay at 8.5

### Phase 3: Transaction Testing (10 min)

1. **Find unpaid booking** (booking_test_006, 2024-11-06, 16:00)
   - Edit booking
   - Change payment status to "Paid"
   - **Verify**: Transaction created
2. **Change to unpaid**:
   - Edit same booking
   - Change to "Unpaid"
   - **Verify**: Transaction removed
3. **Change to paid again**:
   - Edit same booking
   - Change to "Paid"
   - **Verify**: Only 1 transaction exists (check billing)

### Phase 4: Booking Validation (10 min)

1. **Try to create invalid booking**:
   - New booking
   - Set end time before start time (e.g., 10:00 to 09:00)
   - **Verify**: Error message shown
2. **Try out-of-hours booking**:
   - New booking 22:00-23:00
   - **Verify**: Error about calendar hours
3. **Try conflicting booking**:
   - Same staff, same time as existing booking
   - **Verify**: Conflict warning

### Phase 5: Adjacent Booking Warning (5 min)

1. **View 2024-11-08**
   - Should see two back-to-back bookings (09:00-10:00, 10:00-11:00)
2. **Edit one of them**
   - Save without changes
   - **Verify**: Toast warning about short break

### Phase 6: Billing & Reports (10 min)

1. **Go to Billing view**
   - **Verify**: Shows all customers
   - Check Michael Kelly has €40 outstanding
2. **View customer statement**:
   - Click "View Statement" for any customer
   - **Verify**: Shows bookings and transactions
3. **Check totals**:
   - Total billed, total paid, outstanding
   - **Verify**: Math is correct

### Phase 7: Blocked Periods (5 min)

1. **Try to create booking on 2024-12-25** (Christmas)
   - **Verify**: All staff should be unavailable
2. **Try booking Patrick on 2024-11-15**
   - **Verify**: Patrick shows "On Leave"

### Phase 8: Waiting List (5 min)

1. **Go to Waiting List view**
   - Should see 2 entries
2. **Cancel booking_test_010** (2024-11-08 at 10:00)
   - **Verify**: No notification (different time than waiting list)
3. **Check waiting list still shows entries**

---

## 📊 Expected Results After Import

### Customers View
```
✅ 6 customers listed
✅ Credits shown correctly
✅ John Murphy: 10.0 hours
✅ Sarah O'Connor: 5.0 hours
✅ Michael Kelly: 0.0 hours
✅ Emma Walsh: 2.5 hours
✅ David Ryan: 20.0 hours
✅ Lisa Brennan: 1.0 hours
```

### Calendar View (November 2024)
```
✅ Multiple bookings on Nov 4, 5, 6, 7, 8
✅ Different colors for different statuses
✅ Drag and drop works
✅ Day view shows timeline
```

### Billing View
```
✅ Shows 6 customers
✅ Michael Kelly: €40 outstanding
✅ Others: Various amounts
✅ Total revenue: ~€1,735
✅ Package sales: 3 transactions
```

### Services View
```
✅ 5 services listed
✅ Prices shown correctly
✅ Durations: 60, 120, 90 minutes
```

### Resources View
```
✅ 4 resources listed
✅ Tour Bus shows overdue MOT warning
✅ Cars have upcoming maintenance dates
```

---

## 🔧 Troubleshooting

### Import Fails
**Problem**: "Invalid JSON" error
**Solution**:
- Open testdata.json in text editor
- Verify it's valid JSON (no trailing commas)
- Use JSON validator online

### No Data Showing
**Problem**: Import succeeds but no data visible
**Solution**:
- Hard refresh: Ctrl+Shift+R
- Check console for errors (F12)
- Verify localStorage has data (F12 → Application → Local Storage)

### Wrong Data Count
**Problem**: Not seeing all 6 customers or 12 bookings
**Solution**:
- Clear all data first, then reimport
- Check browser console for errors
- Verify testdata.json is complete

### Dates Look Wrong
**Problem**: Bookings appear on wrong dates
**Solution**:
- This is expected if importing old test data
- Update dates in testdata.json to current/future dates
- Or just test with existing dates

---

## ✏️ Customizing Test Data

### To Update Dates:

1. Open `testdata.json` in text editor
2. Find bookings section
3. Change dates to suit your testing:
   ```json
   "date": "2024-11-04"  → "2024-12-01"
   ```
4. Save and reimport

### To Add More Data:

Copy existing entries and change IDs:
```json
{
  "id": "customer_test_007",  // ← New ID
  "name": "New Customer",
  // ... rest of fields
}
```

### To Change Credit Amounts:

Find customer, update `lesson_credits`:
```json
"lesson_credits": 10  // ← Change this
```

---

## 🎯 Summary

This test data provides:
- ✅ Comprehensive coverage of all features
- ✅ Edge cases for bug testing
- ✅ Realistic business scenarios
- ✅ Data for all test cases in TEST_GUIDE.md
- ✅ Examples of all booking statuses
- ✅ Financial transactions for billing tests
- ✅ Conflicts and warnings to test validation

**Ready to import?**

1. Backup current data
2. Import testdata.json
3. Follow testing sequence above
4. Check all expected results

**Good luck with testing! 🧪**
