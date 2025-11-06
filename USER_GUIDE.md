# User Guide
## Ray Ryan Management System
### Complete Guide to Managing Your Driving School & Tour Business

**Version:** 3.1.0
**Last Updated:** 2025-11-05
**For:** Business Owners, Administrators, Staff

---

## Welcome! 👋

Thank you for choosing the Ray Ryan Management System. This guide will walk you through everything you need to know to manage your driving school or tour guide business efficiently.

###What You'll Learn
- How to get started (5 minutes)
- Managing customers and bookings
- Handling payments and billing
- Running reports
- Tips and best practices

### Who This Guide Is For
- 📚 New users learning the system
- 👤 Business owners managing operations
- 📋 Administrators handling bookings
- 👨‍🏫 Instructors/guides checking schedules

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Managing Customers](#managing-customers)
4. [Managing Staff](#managing-staff)
5. [Managing Vehicles & Equipment](#managing-vehicles--equipment)
6. [Managing Services](#managing-services)
7. [Creating & Managing Bookings](#creating--managing-bookings)
8. [Calendar Views](#calendar-views)
9. [Billing & Payments](#billing--payments)
10. [Tour Group Management](#tour-group-management)
11. [Reports & Analytics](#reports--analytics)
12. [Settings & Configuration](#settings--configuration)
13. [Tips & Best Practices](#tips--best-practices)
14. [Troubleshooting](#troubleshooting)
15. [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Getting Started

### Opening the Application

**First Time Setup (2 minutes):**

1. **Locate the file:** Find `index.html` in your MgmtBooking folder
2. **Open it:** Double-click the file
   - It will open in your default web browser
   - Recommended: Google Chrome, Firefox, or Safari

3. **You'll see:** Sample data is automatically loaded for practice

**Already Using It:**
- Just double-click `index.html` again
- Your data is saved automatically and will load

### What You See First

When you first open the system, you'll see:

```
┌─────────────────────────────────────────────┐
│  RAY RYAN MANAGEMENT SYSTEM                 │
├─────────────────────────────────────────────┤
│                                              │
│  📅 CALENDAR                                 │
│  ├─ Today's bookings                        │
│  ├─ Week ahead                              │
│  └─ Notifications                           │
│                                              │
│  ⚠️ Reminders:                              │
│  • Vehicle 1 insurance expires in 10 days   │
│  • 2 payments overdue                       │
│                                              │
└─────────────────────────────────────────────┘
```

### Navigation Sidebar

On the left, you'll see the main menu:

```
📅 Calendar    ← View bookings by day/week/month
👥 Customers   ← Manage customer information
👨‍🏫 Staff       ← Manage instructors and guides
🚗 Resources   ← Manage vehicles and equipment
🎓 Services    ← Manage lesson and tour types
💰 Billing     ← Handle payments and invoices
📊 Reports     ← View business analytics
⚙️  Settings    ← Configure the system
```

**Click any item** to switch to that view.

---

## Dashboard Overview

### Understanding Your Dashboard

**Top Section - Date & Navigation:**
```
◀ Today Nov 15, 2025  ▶     [Today Button]
```
- Click ◀ to go to previous day
- Click ▶ to go to next day
- Click **Today** to jump to current date

**Calendar Views:**
- **Day:** Hourly timeline for one day
- **Week:** 7-day overview
- **Month:** Full month grid

**Notifications Panel:**
Shows important alerts:
- 🔴 Urgent (insurance expiring, overdue payments)
- 🟡 Warning (bookings today, service due)
- 🟢 Info (new waiting list entries)

**Quick Stats:**
- Today's bookings: 8
- Today's revenue: £400
- This week: 35 bookings
- Outstanding payments: £150

---

## Managing Customers

### Adding a New Customer

**Step-by-Step:**

1. **Navigate to Customers**
   - Click "Customers" in the sidebar
   - You'll see a list of all customers

2. **Click "+ Add Customer"**
   - Blue button in top-right corner

3. **Fill in the form:**
   ```
   Name:     [John Smith              ]  *Required
   Email:    [john@example.com        ]  Optional
   Phone:    [+44 7700 900123         ]  *Required
   Address:  [123 Main Street         ]
             [London, UK              ]
   Notes:    [Prefers morning slots   ]
   ```

4. **Click "Save Customer"**
   - Customer appears in the list
   - ✅ Green notification: "Customer saved successfully"

### Finding a Customer

**Method 1: Scroll through the list**
- Customers are listed alphabetically

**Method 2: Global Search**
- Click search box at top
- Type customer name
- Results appear instantly
- Click result to view

**Method 3: Filter**
- Use dropdown filters:
  - All customers
  - Has outstanding balance
  - Has package credits
  - Recent customers

### Editing a Customer

1. **Find the customer** (using methods above)
2. **Click on their name** in the list
3. **Modal opens** with their information
4. **Make changes**
5. **Click "Save Customer"**

### Viewing Customer History

When you click on a customer, you'll see:

```
┌──────────────────────────────────────┐
│  JOHN SMITH                          │
│  ✉ john@example.com                 │
│  📞 +44 7700 900123                  │
├──────────────────────────────────────┤
│  📊 Summary                          │
│  • Total Bookings: 15                │
│  • Completed: 12                     │
│  • Upcoming: 3                       │
│  • Total Spent: £750                 │
│  • Balance: £50 (owed)               │
│  • Package Credits: 5 remaining      │
├──────────────────────────────────────┤
│  📅 Recent Bookings                  │
│  ✅ Nov 10 - 1-Hour Lesson - £50     │
│  ✅ Nov 3  - 1-Hour Lesson - £50     │
│  📅 Nov 17 - 1-Hour Lesson - £50     │
├──────────────────────────────────────┤
│  Actions:                            │
│  [View Progress] [Sell Package]      │
│  [New Booking]   [Delete]            │
└──────────────────────────────────────┘
```

### Tracking Student Progress

**For driving school students:**

1. **Open customer**
2. **Click "View Progress"**
3. **Add progress note:**
   ```
   Date:    [Nov 15, 2025    ▼]
   Lesson:  [Select booking   ▼]

   Skills Practiced:
   ☑ Parallel parking
   ☑ Highway driving
   ☐ Night driving
   ☐ Reverse parking

   Performance: ⭐⭐⭐⭐☆ (4/5)

   Notes:
   [Great improvement on parallel parking.
    Ready for highway practice next week.]

   [Save Note]
   ```

4. **View progress dashboard:**
   - Overall progress: 65%
   - Skills mastered: 8/12
   - Average rating: 4.2/5
   - Estimated test ready: 4-6 weeks

### Selling Lesson Packages

**To sell a package of lessons:**

1. **Open customer**
2. **Click "Sell Package"**
3. **Select package:**
   ```
   Choose Package:
   ○ 5-Lesson Package  - £200 (Save £50)
   ● 10-Lesson Package - £400 (Save £100)
   ○ 20-Lesson Package - £750 (Save £250)
   ```

4. **Record payment:**
   ```
   Amount:  [£400.00]
   Method:  [Card ▼]
   Date:    [Nov 15, 2025]
   ```

5. **Click "Confirm Sale"**
   - Credits added to customer: 10
   - Payment recorded
   - Receipt available

### Deleting a Customer

⚠️ **Warning:** This cannot be undone!

1. **Open customer**
2. **Click "Delete Customer"** (red button)
3. **Confirmation dialog:**
   ```
   ⚠️  Delete Customer?

   This will delete John Smith and all
   associated data:
   • 15 bookings
   • 3 progress notes
   • 5 transactions

   This cannot be undone!

   [Cancel] [Yes, Delete]
   ```

4. **Click "Yes, Delete"** to confirm

---

## Managing Staff

### Adding an Instructor

**For driving instructors:**

1. **Go to "Staff" view**
2. **Click "+ Add Staff"**
3. **Fill in details:**
   ```
   Name:        [Sarah Johnson      ]
   Email:       [sarah@driving.com  ]
   Phone:       [+44 7700 900456    ]

   Staff Type:  [Instructor ▼]

   License No:  [DL123456           ]
   Expires:     [2026-12-31         ]
   ```

4. **Click "Save Staff"**

### Adding a Tour Guide

**For tour guides:**

1. **Go to "Staff" view**
2. **Click "+ Add Staff"**
3. **Fill in basic details**
4. **Select Staff Type: "Guide"**
5. **Additional fields appear:**
   ```
   Languages Spoken:
   ☑ English
   ☑ Spanish
   ☐ French
   ☐ German
   ☐ Italian

   Specializations:
   ☑ History tours
   ☑ Nature tours
   ☐ Food tours
   ☐ Adventure tours

   Certifications:
   [Tour Guide License, First Aid,
    CPR Certified                 ]

   Expiry Date: [2026-06-30]

   Rating: ⭐⭐⭐⭐⭐ (4.8/5)
   ```

6. **Click "Save Staff"**

### Blocking Staff Availability

**For vacations, sick days, etc.:**

1. **Go to "Staff" view**
2. **Click "Block Dates"** button
3. **Fill in form:**
   ```
   Staff Member: [Sarah Johnson  ▼]
   Start Date:   [2025-12-20]
   End Date:     [2025-12-31]
   Reason:       [Christmas Vacation]
   ```

4. **Click "Block Period"**
   - Staff unavailable for booking during these dates
   - Shows as "Blocked" in calendar

---

## Managing Vehicles & Equipment

### Adding a Vehicle

**For driving school cars:**

1. **Go to "Resources" view**
2. **Click "+ Add Resource"**
3. **Fill in details:**
   ```
   Name:         [Vehicle 1 - Toyota]
   Type:         [Vehicle ▼]

   Registration: [ABC 123]
   Make:         [Toyota]
   Model:        [Corolla]
   Year:         [2020]
   Color:        [Blue]
   Capacity:     [4] seats

   📋 Compliance:
   Insurance Expires: [2026-03-31]
   Service Due:       [2025-12-15]
   Last Service:      [2025-06-15]
   ```

4. **Click "Save Resource"**

### Compliance Warnings

**System automatically warns you:**

🔴 **Critical (30 days):**
- "Vehicle 1 insurance expires in 15 days"

🟡 **Warning (7 days):**
- "Vehicle 2 service due in 5 days"

**Action:**
- Click notification
- Opens resource details
- Update expiry dates
- Warning disappears

### Adding Equipment (Tours)

**For tour buses, equipment:**

1. **Go to "Resources"**
2. **Click "+ Add Resource"**
3. **Select Type: "Equipment"**
4. **Fill in:**
   ```
   Name:     [Tour Bus 1]
   Type:     [Equipment ▼]
   Capacity: [30] people
   Notes:    [Air conditioned, WiFi]
   ```

5. **Click "Save Resource"**

---

## Managing Services

### Creating a Driving Lesson Service

1. **Go to "Services" view**
2. **Click "+ Add Service"**
3. **Fill in form:**
   ```
   Service Name: [1-Hour Standard Lesson]
   Service Type: [Driving Lesson ▼]
   Duration:     [60] minutes

   Pricing Type: [Fixed ▼]
   Base Price:   [£50.00]

   Capacity:     [4] (max students in car)
   ```

4. **Click "Save Service"**

### Creating a Tour Service with Group Pricing

**For tours with tiered pricing:**

1. **Go to "Services"**
2. **Click "+ Add Service"**
3. **Fill in basic info:**
   ```
   Service Name: [London Historical Tour]
   Service Type: [Tour ▼]
   Duration:     [120] minutes
   ```

4. **Select Pricing Type: "Tiered"**
5. **Add pricing tiers:**
   ```
   Tier 1:  [1] to [5] people   × [£100] per person
   Tier 2:  [6] to [15] people  × [£80]  per person
   Tier 3:  [16] to [50] people × [£60]  per person

   [+ Add Tier]
   ```

6. **Add description:**
   ```
   Description:
   [Explore London's rich history with our
    expert guides. Visit iconic landmarks
    including Tower of London, Westminster
    Abbey, and Buckingham Palace.        ]

   Photo URLs:
   [https://example.com/tour1.jpg        ]
   [+ Add Photo]
   ```

7. **Click "Save Service"**

### How Tiered Pricing Works

**Example: London Historical Tour**

- **3 people book:** 3 × £100 = **£300**
- **8 people book:** 8 × £80 = **£640**
- **20 people book:** 20 × £60 = **£1,200**

**System automatically:**
- Selects correct tier based on group size
- Calculates total price
- Updates when group size changes

---

## Creating & Managing Bookings

### Creating a Simple Booking

**Quick Method - From Calendar:**

1. **Go to Calendar (Day View)**
2. **Click on a time slot** (e.g., 10:00 AM)
3. **Booking form opens** with time pre-filled
4. **Fill in details:**
   ```
   Date:     [2025-11-15        ]
   Customer: [John Smith      ▼]
   Service:  [1-Hour Lesson   ▼]
   Staff:    [Sarah Johnson   ▼]
   Vehicle:  [Vehicle 1       ▼]

   Start:    [10:00] End: [11:00]

   Fee:      [£50.00]  (auto-calculated)
   Status:   [Scheduled ▼]
   Payment:  [Unpaid    ▼]

   Notes:
   [Pick up from home]
   ```

5. **Click "Save Booking"**
   - ✅ "Booking created successfully"
   - Appears on calendar

### Understanding Conflict Detection

**If you try to double-book:**

```
⚠️  BOOKING CONFLICT

Sarah Johnson is already booked:
• Date: Nov 15, 2025
• Time: 10:00 - 11:00
• Customer: Jane Doe
• Service: 1-Hour Lesson

Options:
[Cancel] [Choose Different Time] [Override]
```

**What to do:**
- **Cancel:** Go back and change time/staff
- **Choose Different Time:** System suggests alternatives
- **Override:** Create anyway (not recommended)

### Creating Recurring Bookings

**For regular weekly lessons:**

1. **Start creating a booking** (as above)
2. **Check "Recurring Booking" box**
3. **Select pattern:**
   ```
   Repeat:    [Weekly     ▼]
   Every:     [1] week(s)
   On:        ☑ Monday

   Ends:
   ○ After [10] occurrences
   ● On date [2026-01-31]
   ```

4. **Preview shows:**
   ```
   📅 This will create 10 bookings:
   • Mon, Nov 15, 2025 at 10:00
   • Mon, Nov 22, 2025 at 10:00
   • Mon, Nov 29, 2025 at 10:00
   ... (7 more)

   ✅ No conflicts found
   ```

5. **Click "Create All Bookings"**
   - All 10 bookings created
   - ✅ "10 recurring bookings created"

### Editing a Booking

1. **Find the booking** (in calendar or customer view)
2. **Click on it**
3. **Modal opens** with current details
4. **Make changes**
5. **Click "Save Booking"**

**Note:** Editing one booking in a recurring series only changes that one instance.

### Cancelling a Booking

1. **Open the booking**
2. **Change Status to "Cancelled"**
3. **Click "Save Booking"**
4. **System checks waiting list:**
   ```
   ℹ️  Waiting List Alert

   2 customers are waiting for this slot:
   • Alice Brown - prefers 10:00-11:00
   • Bob Wilson - flexible time

   [Notify Them] [Close]
   ```

5. **Click "Notify Them"** to send alerts

### Marking a Booking Complete

**After the lesson/tour finishes:**

1. **Open the booking**
2. **Change Status: "Completed"**
3. **Optional: Add progress note** (for students)
4. **Click "Save Booking"**
5. Booking appears grayed out or with ✅ checkmark

---

## Calendar Views

### Day View

**Best for: Managing today's schedule**

**What you see:**
```
Time   Bookings
07:00  ┌─────────────────────┐
08:00  │                     │
09:00  └─────────────────────┘
10:00  ┌─────────────────────┬─────────────────┐
       │ John Smith          │ Jane Doe        │
11:00  │ 1-Hour Lesson       │ 1-Hour Lesson   │
       │ Sarah Johnson       │ Mike Brown      │
12:00  └─────────────────────┴─────────────────┘
13:00
14:00  ┌─────────────────────┐
15:00  │ City Tour (8 ppl)   │
16:00  │ Ray Ryan            │
17:00  └─────────────────────┘
```

**Features:**
- **Click any time slot** to create booking
- **Click a booking** to edit it
- **Drag booking** to reschedule (if enabled)
- **Zoom in/out** for different time granularity

### Week View

**Best for: Planning the week ahead**

**What you see:**
```
        Mon   Tue   Wed   Thu   Fri   Sat   Sun
09:00   [B1]        [B3]        [B5]  [B7]
10:00   [B2]  [B4]        [B6]              [B8]
11:00
...
```

**Features:**
- Navigate weeks with ◀ ▶ arrows
- See all staff schedules at once
- Spot gaps and opportunities
- Color-coded by status

### Month View

**Best for: Long-term planning**

**What you see:**
```
November 2025
─────────────────────────────────────────
Mon  Tue  Wed  Thu  Fri  Sat  Sun
 1    2    3    4    5    6    7
5📅   3📅   4📅   2📅   6📅   1📅   -

 8    9   10   11   12   13   14
4📅   5📅   3📅   7📅   2📅   1📅   -

15   16   17   18   19   20   21
6📅   4📅   5📅   3📅   8📅   2📅   1📅
```

**Numbers = bookings that day**

**Features:**
- Click any date to see day view
- See busy vs slow periods
- Plan staff time off
- Spot seasonal trends

### Calendar Tips

💡 **Quick Actions:**
- **Double-click date** in month view → Day view
- **Right-click booking** → Quick menu
- **Hover over booking** → Preview details

💡 **Color Coding:**
- 🟢 Green = Completed
- 🔵 Blue = Scheduled
- 🟡 Yellow = Pending
- 🔴 Red = Cancelled
- ⚪ Gray = Past/unpaid

---

## Billing & Payments

### Viewing Customer Balance

1. **Go to "Billing" view**
2. **See all customers with balances:**
   ```
   Customer          Bookings  Total    Paid     Balance
   ─────────────────────────────────────────────────────
   John Smith        15        £750     £700     £50
   Jane Doe          8         £400     £400     £0
   Bob Wilson        12        £600     £500     £100
   Alice Brown       5         £250     £300     -£50 (credit)
   ```

3. **Click on customer** for details

### Recording a Payment

**Method 1: Single Booking Payment**

1. **Select customer from dropdown**
2. **Booking list appears:**
   ```
   Date        Service         Amount  Status
   ───────────────────────────────────────────
   ☐ Nov 10    1-Hour Lesson   £50     Unpaid
   ☐ Nov 12    1-Hour Lesson   £50     Unpaid
   ☑ Nov 15    1-Hour Lesson   £50     Unpaid  ← Selected
   ```

3. **Check the booking(s)** to pay
4. **Enter payment:**
   ```
   Amount:     [£50.00]
   Method:     [Cash ▼]
   Date:       [2025-11-15]
   Reference:  [Optional]
   ```

5. **Click "Record Payment"**
   - ✅ "Payment recorded"
   - Booking marked "Paid"
   - Balance updated

**Method 2: Bulk Payment**

1. **Select customer**
2. **Check multiple bookings:**
   ```
   ☑ Nov 10 - £50
   ☑ Nov 12 - £50
   ☑ Nov 15 - £50
   Total: £150
   ```

3. **Enter amount:** £150
4. **Click "Record Payment"**
   - Single transaction for all three
   - All marked "Paid"

**Method 3: Partial Payment**

1. **Booking amount:** £100
2. **Customer pays:** £50
3. **Enter:** £50
4. **Result:**
   - Status: "Partially Paid"
   - Remaining: £50
   - Can accept another payment later

### Handling Overpayments (Credits)

**If customer pays more than owed:**

```
Total Owed: £100
Payment:    £150

✅ Payment recorded
💰 £50 credit added to customer account

This credit will be automatically applied to
future bookings.
```

**Customer's credit balance:**
- Shows on customer profile
- Auto-applied to next booking
- Can request refund

### Overdue Payments

**System automatically tracks overdue:**

```
⚠️  OVERDUE PAYMENTS

John Smith  - £50  - 5 days overdue
Bob Wilson  - £100 - 12 days overdue

[Send Reminders]
```

**To send reminder:**

1. **Click "Send Reminders"**
2. **Email/SMS sent:**
   ```
   Subject: Payment Reminder

   Dear John,

   This is a friendly reminder that you have
   an outstanding balance of £50 for your
   lesson on Nov 10, 2025.

   Please settle this at your earliest
   convenience.

   Thank you!
   Ray Ryan Driving School
   ```

3. **Reminder logged** in customer history

### Generating Invoices

1. **Go to Billing**
2. **Select customer**
3. **Click "Generate Invoice"**
4. **Invoice preview:**
   ```
   ┌────────────────────────────────────────┐
   │  RAY RYAN DRIVING SCHOOL               │
   │  123 Main Street, London               │
   │  +44 7700 900123                       │
   ├────────────────────────────────────────┤
   │  INVOICE #001234                       │
   │  Date: Nov 15, 2025                    │
   │                                        │
   │  Bill To:                              │
   │  John Smith                            │
   │  john@example.com                      │
   ├────────────────────────────────────────┤
   │  Date      Service         Amount      │
   │  ──────────────────────────────────   │
   │  Nov 10    1-Hour Lesson   £50.00     │
   │  Nov 12    1-Hour Lesson   £50.00     │
   │  Nov 15    1-Hour Lesson   £50.00     │
   │                            ───────     │
   │                   Total:   £150.00     │
   │                   Paid:    £100.00     │
   │                   Balance: £50.00      │
   ├────────────────────────────────────────┤
   │  Payment Terms: Due upon receipt       │
   │  Thank you for your business!          │
   └────────────────────────────────────────┘
   ```

5. **Actions:**
   - **[Print]** - Print invoice
   - **[Email]** - Send to customer
   - **[Download PDF]** - Save as PDF (if configured)

---

## Tour Group Management

### Booking a Tour

**Creating a group tour booking:**

1. **Go to Calendar**
2. **Click time slot**
3. **Select tour service:**
   ```
   Service: [London Historical Tour ▼]
   ```

4. **Tour-specific fields appear:**
   ```
   Group Size: [8] people

   Participants (comma-separated):
   [John Doe, Jane Smith, Bob Wilson,
    Alice Brown, Charlie Davis, Eve White,
    Frank Black, Grace Green            ]

   Special Requirements:
   [2 vegetarian meals, 1 wheelchair
    accessible seat                      ]

   ☑ Waiver Signed

   Tour Guide: [Ray Ryan ▼]
   Equipment:  [Tour Bus 1 ▼]
   ```

5. **Price auto-calculates:**
   ```
   8 people × £80 = £640.00
   (Tier 2: 6-15 people rate)
   ```

6. **Click "Save Booking"**

### Multi-Day Tours

**For tours spanning multiple days:**

1. **Start creating tour booking**
2. **Check "Multi-Day Tour" box**
3. **Additional fields:**
   ```
   Start Date: [2025-11-20]
   End Date:   [2025-11-23]  (4 days)

   Accommodation:
   [Grand Hotel London
    Rooms 301-304
    Breakfast included          ]

   Itinerary:
   [Day 1: Tower of London, Thames Cruise
    Day 2: Westminster, British Museum
    Day 3: Windsor Castle
    Day 4: Departure                    ]
   ```

4. **Price calculation:**
   ```
   8 people × £300/day × 4 days = £9,600
   ```

5. **Booking appears on all 4 days** in calendar

### Waiver Management

**Tracking legal waivers:**

1. **When creating tour:**
   ```
   ☐ Waiver Signed
   ```

2. **Before tour starts, check box:**
   ```
   ☑ Waiver Signed
   ```

3. **System records:**
   - Date/time signed: 2025-11-19 14:30
   - Signed by: Admin user

4. **Compliance report shows:**
   ```
   Tour Compliance Summary:
   • Total Tours: 45
   • Waivers Signed: 43
   • Missing Waivers: 2  ⚠️
   • Compliance Rate: 96%
   ```

### Tour Analytics

**To view tour performance:**

1. **Go to "Reports"**
2. **Scroll to "Tour Analytics"**
3. **See metrics:**
   ```
   📊 TOUR ANALYTICS (This Month)

   Total Tours:         45
   Total Participants:  380
   Average Group Size:  8.4 people
   Total Revenue:       £28,500

   Occupancy Rate:      68%
   (380 actual / 558 capacity)

   Most Popular:
   1. London Historical Tour (25 tours)
   2. Nature Hike (12 tours)
   3. Food Tour (8 tours)

   Top Guides:
   1. Ray Ryan (20 tours, 4.9★)
   2. Sarah Johnson (15 tours, 4.8★)
   ```

---

## Reports & Analytics

### Accessing Reports

1. **Click "Reports" in sidebar**
2. **Select date range:**
   ```
   From: [2025-01-01]
   To:   [2025-11-15]

   Quick Filters:
   [This Month] [Last Month] [This Year] [All Time]
   ```

3. **Reports auto-update**

### Revenue Reports

**Income Overview:**
```
┌─────────────────────────────────────┐
│  TOTAL REVENUE:  £15,000            │
│  TOTAL EXPENSES: £3,000             │
│  NET PROFIT:     £12,000            │
│  GROWTH:         +15% vs last month │
└─────────────────────────────────────┘
```

**Revenue by Month (Chart):**
```
£8000 ┤        ╭─╮
      │       ╭╯ ╰╮
£6000 │      ╭╯   ╰╮
      │     ╭╯     ╰╮
£4000 │   ╭╮╯       ╰╮╭
      │  ╭╯╰╮        ╰╯╰╮
£2000 │ ╭╯  ╰╮          ╰╮
      └─┴────┴────────────┴───
       J F M A M J J A S O N D
```

**Revenue by Service:**
```
Service            Bookings  Revenue    %
──────────────────────────────────────────
1-Hour Lesson      80        £4,000     27%
City Tour          45        £6,750     45%
Intensive Lesson   25        £3,250     22%
Other              10        £1,000     6%
```

### Service Popularity

**Most Booked Services:**
```
1. 🥇 City Tour           (45 bookings)
2. 🥈 1-Hour Lesson       (80 bookings)
3. 🥉 Intensive Lesson    (25 bookings)
4.    Test Preparation    (15 bookings)
5.    Nature Hike         (12 bookings)
```

### Staff Performance

**Instructor/Guide Metrics:**
```
Staff Member     Bookings  Revenue   Avg Rating
─────────────────────────────────────────────────
Ray Ryan         75        £8,250    ⭐ 4.9
Sarah Johnson    65        £5,850    ⭐ 4.8
Mike Brown       35        £2,100    ⭐ 4.7
```

### Expense Tracking

**Adding an Expense:**

1. **In Reports, scroll to "Expenses"**
2. **Click "+ Add Expense"**
3. **Fill in:**
   ```
   Date:     [2025-11-15]
   Category: [Fuel      ▼]
   Amount:   [£80.00]

   Description:
   [Fuel for Vehicle 1, 45 liters]

   Receipt URL (optional):
   [https://...]
   ```

4. **Click "Save Expense"**

**Expense Summary:**
```
Category      This Month  % of Total
──────────────────────────────────────
Fuel          £450        30%
Maintenance   £600        40%
Insurance     £300        20%
Marketing     £150        10%
──────────────────────────────────────
TOTAL         £1,500
```

### Exporting Reports

**To Excel:**
1. **Click "Export to Excel"** button
2. **File downloads:** `Reports-2025-11-15.xlsx`
3. **Open in Excel/Google Sheets**

**To Print:**
1. **Click "Print Report"**
2. **Print dialog opens**
3. **Choose printer or "Save as PDF"**

---

## Settings & Configuration

### Business Information

1. **Go to "Settings"**
2. **Update business details:**
   ```
   Business Name:    [Ray Ryan Driving School]
   Address:          [123 Main Street
                      London, UK             ]
   Phone:            [+44 7700 900123        ]
   Email:            [info@rayryan.com       ]
   Website:          [www.rayryan.com        ]
   Logo URL:         [https://...            ]
   ```

3. **Click "Save Settings"**
   - Appears on invoices
   - Shows on emails
   - Displays in reports

### Calendar Settings

**Working Hours:**
```
Calendar Display:
Start Hour:  [07:00 ▼]  (7 AM)
End Hour:    [21:00 ▼]  (9 PM)

Default Booking Duration: [60] minutes
```

**This affects:**
- What times show in calendar
- Available booking slots
- Report calculations

### Pricing Settings

**Default Rates:**
```
Standard Lesson:    [£50.00]
Intensive Lesson:   [£80.00]
Cancellation Fee:   [£20.00]
```

**Lesson Packages:**
```
5-Lesson Package:   [£200] (Save £50)
10-Lesson Package:  [£400] (Save £100)
20-Lesson Package:  [£750] (Save £250)
```

### Notification Settings

**Email Configuration:**

1. **Sign up for EmailJS:** https://www.emailjs.com/
2. **Get credentials:**
   - Public Key: `pub_xxxxxxx`
   - Service ID: `service_xxxxxxx`
   - Template ID: `template_xxxxxxx`

3. **Enter in Settings:**
   ```
   Email Service:  [EmailJS ▼]
   Public Key:     [pub_xxxxxxx]
   Service ID:     [service_xxxxxxx]
   Template ID:    [template_xxxxxxx]
   From Name:      [Ray Ryan Driving School]
   ```

4. **Auto-reminders:**
   ```
   ☑ Enable Auto Email Reminders
   Send: [24] hours before booking
   ```

**SMS Configuration:**

1. **Sign up for Twilio:** https://www.twilio.com/
2. **Get credentials:**
   - Account SID
   - Auth Token
   - Phone Number

3. **Enter in Settings**
4. **Note:** Requires backend setup (see documentation)

### Invoice Settings

**Customize invoices:**
```
Invoice Prefix:     [INV-]
Starting Number:    [1000]
Payment Terms:      [Due upon receipt]

Footer Text:
[Thank you for your business!
For questions, contact us at
info@rayryan.com              ]
```

### Data Management

**Backup Your Data:**
1. **In Settings, click "Download Backup"**
2. **File saves:** `rayRyan-backup-2025-11-15.json`
3. **Store safely** (Google Drive, USB drive, etc.)
4. **Backup regularly!** (weekly recommended)

**Restore from Backup:**
1. **Click "Restore from Backup"**
2. **Select backup file**
3. **Confirm:** "Replace current data?"
4. **Page reloads** with restored data

**Auto-Backup (Optional):**
```
☑ Enable Auto-Backup
Frequency: [Daily ▼]
Time:      [01:00] (1 AM)
```
- Automatically downloads backup
- Saves to browser's default download location

**Clear All Data:**
⚠️ **DANGER ZONE**
```
⚠️  This will delete ALL data!

Before clearing, we'll automatically
download a backup for you.

[❌ Clear All Data]
```

---

## Tips & Best Practices

### Daily Workflow

**Start of Day (5 minutes):**
1. ✅ Open system and check calendar
2. ✅ Review today's bookings
3. ✅ Check notifications (compliance, payments)
4. ✅ Send any manual reminders

**After Each Lesson/Tour:**
1. ✅ Mark booking as "Completed"
2. ✅ Add progress note (for students)
3. ✅ Record payment if received

**End of Day (5 minutes):**
1. ✅ Review completed bookings
2. ✅ Follow up on unpaid bookings
3. ✅ Prepare for tomorrow

### Weekly Tasks

**Every Monday:**
- Review week's schedule
- Check staff availability
- Confirm vehicle maintenance
- Send week-ahead reminders

**Every Friday:**
- Review week's revenue
- Process any outstanding payments
- Download weekly backup
- Plan next week

### Monthly Tasks

**First of Month:**
- Review previous month's reports
- Calculate staff performance
- Update any expired certifications
- Plan marketing for slow periods

**Mid-Month:**
- Check vehicle insurance/service dates
- Review customer package credits
- Identify customers for package sales
- Send overdue payment reminders

### Pro Tips

💡 **Use Recurring Bookings**
- Set up regular students weekly
- Saves time entering bookings
- Ensures consistent schedule

💡 **Sell Packages**
- Encourage bulk purchases
- Improves cash flow
- Increases customer commitment
- Easier payment tracking

💡 **Track Progress**
- Add notes after every lesson
- Students appreciate detailed feedback
- Helps plan future lessons
- Great for marketing (testimonials)

💡 **Regular Backups**
- Set reminder to backup weekly
- Store in multiple locations
- Test restore occasionally
- Don't risk losing data!

💡 **Use Global Search**
- Fastest way to find anything
- Type customer name, booking date, etc.
- Works across all views

💡 **Check Compliance**
- Set calendar reminders for renewals
- Update dates immediately
- Don't let insurance lapse!

---

## Troubleshooting

### Data Not Saving

**Problem:** Changes disappear after closing

**Solutions:**
1. **Check browser settings:**
   - Ensure cookies/localStorage enabled
   - Not in private/incognito mode

2. **Check storage space:**
   - Browser may be full
   - Download backup
   - Clear old browser data

3. **Check for errors:**
   - Press F12 to open Console
   - Look for red error messages
   - Screenshot and report

### Calendar Not Showing Bookings

**Problem:** Calendar appears empty

**Solutions:**
1. **Check date range:**
   - Are you viewing the right date?
   - Click "Today" to reset

2. **Check filters:**
   - Any filters applied?
   - Clear all filters

3. **Refresh view:**
   - Click "Refresh" or F5
   - Switch to different view and back

### Payment Not Recording

**Problem:** Payment saved but booking still "Unpaid"

**Solutions:**
1. **Check amount:**
   - Was full amount entered?
   - Partial payments show "Partially Paid"

2. **Check booking selection:**
   - Was booking checkbox checked?
   - Try recording payment again

3. **Check transaction log:**
   - Go to Billing
   - View customer transactions
   - Transaction should be listed

### Email/SMS Not Sending

**Problem:** Reminders not being sent

**Solutions:**
1. **Check configuration:**
   - Go to Settings
   - Verify EmailJS/Twilio credentials
   - Test with "Send Test" button

2. **Check auto-reminders:**
   - Are they enabled?
   - Settings → Notifications

3. **Check internet:**
   - Email/SMS requires connection
   - Try manual send

4. **Check customer contact:**
   - Does customer have email/phone?
   - Is it formatted correctly?

### Browser Issues

**Problem:** Page not loading correctly

**Solutions:**
1. **Try different browser:**
   - Chrome (recommended)
   - Firefox
   - Safari

2. **Clear cache:**
   - Ctrl+Shift+Delete (Windows)
   - Cmd+Shift+Delete (Mac)
   - Select "Cached images and files"

3. **Update browser:**
   - Use latest version
   - Check for updates

### Lost Data

**Problem:** Data disappeared!

**Solutions:**
1. **Check for backup:**
   - Look in Downloads folder
   - Auto-backup enabled?
   - Manual backup exists?

2. **Restore from backup:**
   - Settings → Restore
   - Select backup file
   - Confirm restore

3. **Prevention:**
   - Enable auto-backup NOW
   - Download manual backup weekly
   - Store in cloud (Google Drive, Dropbox)

---

## Keyboard Shortcuts

### Navigation
- **Ctrl+H** - Go to Home/Calendar
- **Ctrl+1** - Customers view
- **Ctrl+2** - Staff view
- **Ctrl+3** - Resources view
- **Ctrl+4** - Services view
- **Ctrl+5** - Billing view
- **Ctrl+6** - Reports view

### Actions
- **Ctrl+N** - New booking
- **Ctrl+F** - Focus search
- **Ctrl+S** - Save current form
- **Esc** - Close modal
- **Ctrl+P** - Print current view
- **Ctrl+B** - Download backup

### Calendar
- **← →** - Previous/Next day
- **↑ ↓** - Previous/Next week
- **Ctrl+T** - Go to Today
- **D** - Day view
- **W** - Week view
- **M** - Month view

### Quick Entry
- **Alt+C** - New customer
- **Alt+S** - New staff
- **Alt+B** - New booking

---

## Getting Help

### Documentation
- **Product Specs:** `PRODUCT_SPECIFICATIONS.md`
- **Technical Docs:** `FUNCTIONALITY_SPECIFICATIONS.md`
- **This Guide:** `USER_GUIDE.md`
- **Testing Guide:** `TESTING_GUIDE.md`

### Support
- **GitHub Issues:** Report bugs
- **Community Forum:** Ask questions
- **Email Support:** Coming soon

### Video Tutorials
- Coming soon: YouTube channel
- Feature walkthroughs
- Tips and tricks
- Common workflows

---

## Conclusion

Congratulations! You now know how to use the Ray Ryan Management System to manage your driving school or tour business efficiently.

### Remember:
- ✅ **Backup regularly** - Don't lose your data!
- ✅ **Keep software updated** - Check for new versions
- ✅ **Use recurring bookings** - Save time
- ✅ **Track progress** - Better student outcomes
- ✅ **Sell packages** - Improve cash flow
- ✅ **Monitor compliance** - Stay legal

### Next Steps:
1. **Set up your business** in Settings
2. **Add your staff** and vehicles
3. **Create your services**
4. **Import your customers** (or add as you go)
5. **Start booking!**

### Need More Help?
- Re-read relevant sections
- Check troubleshooting guide
- Refer to technical docs
- Contact support

**Thank you for using Ray Ryan Management System!**

We hope this system helps you run your business more efficiently and profitably. 🎉

---

**Document Version:** 1.0
**Last Updated:** 2025-11-05
**Author:** Claude Code
**Status:** Complete ✅

For technical details, see `FUNCTIONALITY_SPECIFICATIONS.md`
For product overview, see `PRODUCT_SPECIFICATIONS.md`
