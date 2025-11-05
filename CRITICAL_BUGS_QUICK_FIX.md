# Critical Bugs - Quick Fix Guide
## Ray Ryan Management System

**⚠️ READ THIS FIRST** - These bugs can cause data corruption or financial errors!

---

## 🔥 Bug #1: Negative Credits (CRITICAL)

**File**: `script.js` line 3456
**Impact**: Customer credits can become negative

### The Problem
```javascript
// Current code:
state.customers[customerIndex].driving_school_details.lesson_credits -= durationHours;
```

If you complete the same booking twice, credits are deducted twice!

### Quick Fix
Replace line 3456 with:
```javascript
// SAFE version - prevent negative credits:
const customer = state.customers[customerIndex];
if (!customer.driving_school_details) {
    customer.driving_school_details = { lesson_credits: 0 };
}
const currentCredits = customer.driving_school_details.lesson_credits || 0;
const newCredits = Math.max(0, currentCredits - durationHours);
customer.driving_school_details.lesson_credits = newCredits;

if (newCredits < currentCredits) {
    showToast(`Deducted ${durationHours.toFixed(1)} hours from ${customer.name}. New balance: ${newCredits.toFixed(1)} hours.`);
} else {
    showToast('Warning: Credits already deducted or insufficient balance.');
}
```

---

## 🔥 Bug #2: Double Billing (CRITICAL)

**File**: `script.js` lines 2164-2176
**Impact**: Customers can be charged multiple times

### The Problem
Editing a booking and toggling payment status creates duplicate transactions.

### Quick Fix
Add this check BEFORE creating transaction at line 2164:

```javascript
// Before creating new transaction, check if one already exists for this booking
const existingTransaction = state.transactions.find(t =>
    t.bookingId === bookingId && t.type === 'payment'
);

if (isPaid && !wasPaid) {
    if (existingTransaction) {
        // Reuse existing transaction instead of creating new one
        transactionId = existingTransaction.id;
        existingTransaction.amount = fee; // Update amount in case fee changed
        showToast('Payment transaction updated.');
    } else {
        // Create new transaction (existing code)
        const newTransaction = {
            id: `txn_${generateUUID()}`,
            date: toLocalDateString(new Date()),
            type: 'payment',
            description: `Payment for booking on ${date}`,
            amount: fee,
            customerId: customerId,
            bookingId: bookingId
        };
        state.transactions.push(newTransaction);
        transactionId = newTransaction.id;
        showToast('Payment transaction created.');
    }
}
```

---

## 🔥 Bug #3: Date Timezone Issues (CRITICAL)

**File**: `script.js` line 54-60
**Impact**: Bookings appear on wrong dates across timezones

### The Problem
```javascript
// Current code creates local midnight:
function parseYYYYMMDD(dateString) {
    if (!dateString) return null;
    const parts = dateString.split('-');
    if (parts.length !== 3) return null;
    return new Date(parts[0], parts[1] - 1, parts[2]); // ← PROBLEM: Local time
}
```

### Quick Fix
Replace the entire function:

```javascript
function parseYYYYMMDD(dateString) {
    if (!dateString) return null;

    // Validate format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        console.warn('Invalid date format:', dateString);
        return null;
    }

    const parts = dateString.split('-');
    if (parts.length !== 3) return null;

    // Create date at noon UTC to avoid timezone issues
    const date = new Date(Date.UTC(
        parseInt(parts[0], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[2], 10),
        12, 0, 0, 0 // Noon UTC
    ));

    // Validate the date is valid
    if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return null;
    }

    return date;
}
```

**ALSO** update `toLocalDateString` at line 3509:

```javascript
function toLocalDateString(date) {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        console.warn('Invalid date object:', date);
        return '';
    }
    // Use UTC to avoid timezone shifts
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
```

---

## 🔥 Bug #4: Time Function Crashes (CRITICAL)

**File**: `script.js` line 3517-3520
**Impact**: App crashes if invalid time passed

### The Problem
```javascript
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}
```

Crashes if `timeStr` is null!

### Quick Fix
Replace function:

```javascript
function timeToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') {
        console.warn('Invalid time string:', timeStr);
        return 0;
    }

    const parts = timeStr.split(':');
    if (parts.length !== 2) {
        console.warn('Invalid time format (expected HH:MM):', timeStr);
        return 0;
    }

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    if (isNaN(hours) || isNaN(minutes)) {
        console.warn('Invalid time values:', timeStr);
        return 0;
    }

    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.warn('Time out of range:', timeStr);
        return 0;
    }

    return hours * 60 + minutes;
}
```

---

## 🔥 Bug #5: Save Race Condition (HIGH)

**File**: `script.js` line 593-606
**Impact**: Data loss if user closes browser quickly

### The Problem
Changes can be lost if user makes many changes then closes browser before debounced save completes.

### Quick Fix
Add this BEFORE the closing `</script>` tag in index.html or at the end of script.js:

```javascript
// Force save before page unload
window.addEventListener('beforeunload', function(e) {
    // Cancel any pending debounced save
    if (saveStateTimeout) {
        clearTimeout(saveStateTimeout);
    }
    // Force immediate save
    saveState();
});
```

---

## 🛠️ Testing Your Fixes

After applying fixes, test these scenarios:

### Test 1: Credits
1. Create customer with 5 hours credit
2. Create 2-hour booking, mark complete, use credits
3. Edit same booking, mark complete again
4. Check credits - should show 3 hours (NOT negative!)

### Test 2: Double Billing
1. Create unpaid booking
2. Edit, mark as Paid
3. Edit again, mark as Unpaid
4. Edit again, mark as Paid
5. Check transactions - should have only 1 payment transaction

### Test 3: Dates
1. Create booking for tomorrow
2. Check it appears on correct date
3. Change system timezone
4. Check booking still on correct date

### Test 4: Time Crashes
1. Open browser console
2. Type: `timeToMinutes(null)`
3. Should return 0, NOT crash

### Test 5: Save on Close
1. Make a change
2. Immediately close browser tab
3. Reopen app
4. Change should be saved

---

## ⚠️ Important Notes

1. **Backup first!** - Export backup before applying any fixes
2. **Test in development** - Don't fix directly in production
3. **One fix at a time** - Apply and test each fix individually
4. **Clear localStorage** - After major fixes, may need to clear and restore from backup
5. **Data migration** - Some fixes may require updating existing data

---

## 📞 Need Help?

If you encounter issues applying these fixes:
1. Check browser console for errors
2. Review BUG_REPORT.md for full details
3. Test with dummy data first
4. Keep backup accessible for rollback

---

**Last Updated**: 2025-10-30
**Priority**: URGENT - Apply ASAP
