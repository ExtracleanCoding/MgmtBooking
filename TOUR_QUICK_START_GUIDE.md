# 🚌 Tour Business Quick Start Guide

## Getting Started with Tour Bookings

### Step 1: Create a Tour Service
1. Go to **Settings → Services**
2. Click **+ Add Service**
3. Fill in:
   - **Service Name:** "City Walking Tour" (or your tour name)
   - **Service Type:** `TOUR` ← **Important!**
   - **Duration:** 120 minutes
   - **Base Price:** €150 (per person)
   - **Description:** "2-hour guided walking tour of historic downtown"
   - **Photos:** Add tour image URLs (optional)

4. **Pricing Strategy (choose one):**

   **Option A: Fixed Price per Person**
   ```
   Pricing Type: Fixed
   Base Price: €150 per person

   Results:
   - 1 person = €150
   - 5 people = €750
   - 20 people = €3,000
   ```

   **Option B: Group Discounts (Tiered)**
   ```
   Pricing Type: Tiered

   Tier 1: 1-5 people @ €150 each
   Tier 2: 6-15 people @ €120 each
   Tier 3: 16+ people @ €100 each

   Results:
   - 3 people = €450 (150×3)
   - 10 people = €1,200 (120×10)
   - 20 people = €2,000 (100×20)
   ```

5. Click **Save Service**

---

### Step 2: Create Tour Guide Staff
1. Go to **Staff Management**
2. Click **+ Add Staff Member**
3. Fill in:
   - **Name:** "Marie Dubois"
   - **Email:** marie@example.com
   - **Phone:** +33 123 456 789
   - **Staff Type:** `Tour Guide` ← **Important!**

4. **Guide Qualifications** section appears automatically:
   - **Languages:** English, French, Spanish
   - **Specializations:** History, Art, Architecture
   - **Certifications:** "First Aid Certificate, Licensed Tour Guide"
   - **Cert Expiry:** 2026-06-15
   - **Rating:** 4.8

5. Click **Save Staff Member**

---

### Step 3: Book a Tour
1. Go to **Calendar**
2. Click on a date → **+ New Booking**
3. Fill in standard fields:
   - **Service:** City Walking Tour
   - **Customer:** John Smith
   - **Staff:** Marie Dubois
   - **Resource:** (if applicable - tour bus)
   - **Date & Time:** 2025-11-15, 09:00 AM - 11:00 AM

4. **NEW: Group Details** section auto-appears:
   - **Group Size:** 8 people
   - **Participant Names:**
     ```
     John Smith
     Jane Smith
     David Johnson
     Sara Johnson
     Michael Brown
     Emily Brown
     Robert Wilson
     Lisa Wilson
     ```
   - **Special Requirements:** 2 wheelchair accessible seats, vegetarian meals for 3

5. **Tour Details** shows:
   - Description and photos (for info only)

6. **Waiver** section:
   - ✅ Check: "Waiver/Insurance Agreement Signed"
   - Date auto-populates

7. Click **Save Booking**
   - **Price auto-calculates:** 8 × €150 = **€1,200**

---

### Step 4: View Tour Reports

#### In Reports Page:
1. New **KPI Cards** show tour revenue data
2. Service breakdown shows tour income separately
3. Staff performance shows guide activity

#### Via Code (Console):
```javascript
// Get all tour metrics
const tourMetrics = getTourAnalytics();

console.log(tourMetrics);
// Output:
{
  totalTours: 5,
  totalParticipants: 42,
  avgGroupSize: "8.4",
  tourRevenue: 6300,
  waiverCompliance: "100",
  guidePerformance: {
    staff_marie: {
      name: "Marie Dubois",
      toursCount: 5,
      totalParticipants: 42,
      rating: 4.8,
      languages: ["English", "French", "Spanish"],
      specializations: ["History", "Art", "Architecture"]
    }
  }
}
```

---

## Common Tasks

### Task: Edit Tour Booking
1. Click booking on calendar
2. Modify group size → price auto-updates
3. Add/remove participant names
4. Update special requirements
5. Save

### Task: Change Tour Price Based on Group Size
1. Go to Service settings
2. Change pricing tier ranges
3. Example: Make 10-20 people €100/person (not €120)
4. Next bookings automatically use new price

### Task: Track Participant Names for Confirmation Email
```javascript
// After booking is created:
const booking = state.bookings[state.bookings.length - 1];
const names = booking.participants.join(', ');
// Use in email: "Confirmed for: John, Jane, David, Sara..."
```

### Task: Check Waiver Compliance
```javascript
const tourBookings = state.bookings.filter(b => {
  const service = state.services.find(s => s.id === b.serviceId);
  return service && service.service_type === 'TOUR';
});

const withWaivers = tourBookings.filter(b => b.waiverSigned).length;
const compliance = (withWaivers / tourBookings.length * 100).toFixed(1);

console.log(`Waiver Compliance: ${compliance}%`);
```

### Task: Find Tours by Guide Language
```javascript
const guideLanguage = 'Spanish';
const guidesWhoSpeak = state.staff.filter(s =>
  s.staff_type === 'GUIDE' &&
  s.guide_qualifications?.languages.includes(guideLanguage)
);

console.log(`Guides speaking ${guideLanguage}:`, guidesWhoSpeak);
```

### Task: List All Participants for a Tour Date
```javascript
const tourDate = '2025-11-15';
const dayTours = state.bookings.filter(b => b.date === tourDate);

dayTours.forEach(tour => {
  console.log(`Tour at ${tour.startTime}:`);
  console.log('Participants:', tour.participants.join(', '));
  console.log('---');
});
```

---

## Multi-Day Tour Example

### Scenario: 3-Day Mountain Tour

**Day 1 Booking:**
- Service: Mountain Adventure Tour
- Date: 2025-12-01
- Time: 08:00 AM - 4:00 PM
- Group Size: 12 people
- ✅ Check "📅 Multi-Day Tour"
- End Date: 2025-12-03
- Accommodation: "Pine Lodge Resort, Rooms 101-105, Breakfast incl."

**Result:**
- Booking created for Day 1
- Framework ready for Day 2 & 3 bookings
- All linked with same `multidayGroupId`
- Same 12 participants across all days
- Total price: 12 × price × 3 days

---

## Revenue Scenarios

### Scenario 1: Budget Tours (Small Groups)
```
Service: "Budget City Tour"
Base Price: €80 per person
No discount (fixed pricing)

Booking 1: 3 people = €240
Booking 2: 2 people = €160
Booking 3: 4 people = €320
Monthly Revenue: €720 (easy to scale)
```

### Scenario 2: Premium Tours (Large Groups)
```
Service: "Private Luxury Tour"
Pricing:
- 1-4 people: €300 each
- 5-8 people: €250 each
- 9+ people: €200 each

Booking 1: 4 people = €1,200
Booking 2: 10 people = €2,000
Booking 3: 15 people = €3,000
Monthly Revenue: €6,200 (higher margins)
```

### Scenario 3: Group Packages
```
Service: "School Group Educational Tour"
Pricing:
- Groups of 20-30: €100 per student
- Groups of 31-50: €80 per student
- Groups of 50+: €60 per student

Booking 1: 25 students = €2,500
Booking 2: 45 students = €3,600
Booking 3: 60 students = €3,600
Monthly Revenue: €9,700 (volume business)
```

---

## Customer Communication Templates

### Email: Tour Confirmation
```
Subject: Tour Booking Confirmation - Group of 8

Dear John,

Thank you for booking our City Walking Tour!

📅 Date: November 15, 2025, 9:00 AM - 11:00 AM
👥 Participants (8):
   - John Smith
   - Jane Smith
   - David Johnson
   - Sara Johnson
   - Michael Brown
   - Emily Brown
   - Robert Wilson
   - Lisa Wilson

💰 Price: €1,200 (€150 × 8 people)
🧑‍🏫 Guide: Marie Dubois (Speaks English, French)
📋 Special Notes: Wheelchair access, vegetarian meals

⚠️ Important: Please complete the waiver agreement
   (already marked as signed in our system)

📍 Meeting Point: Town Hall, Main Street
⏰ Please arrive 10 minutes early

Questions? Contact us!
```

### SMS: Day Before Reminder
```
Hi John,

Reminder: City Walking Tour TOMORROW at 9:00 AM!
📍 Meet at Town Hall
👨‍🏫 Guide: Marie Dubois
👥 Group: You + 7 others

See you tomorrow! 🚌
```

### Post-Tour Follow-up
```
Subject: How Was Your Tour?

Hi John,

We hope you and your group enjoyed the
City Walking Tour with Marie!

⭐ Please rate your experience:
   - Tour guide Marie: [Rate 1-5]
   - Tour organization: [Rate 1-5]
   - Would you recommend? [Yes/No]

Comments: [Text box]

[Submit Button]

Thank you!
```

---

## Troubleshooting

### Q: "Price not updating when I change group size"
**A:** Make sure you selected a **TOUR** service type. Group Details section only appears for TOUR services.

### Q: "My guide's qualifications disappeared"
**A:** Make sure staff type is set to **GUIDE** (not INSTRUCTOR). Qualifications only save for GUIDE type.

### Q: "I want to give different pricing for different customer types"
**A:** Use Tiered Pricing. Create separate tour services or adjust pricing tiers per season.

### Q: "How do I manage multi-day tours?"
**A:** Currently, create separate bookings for each day. Link them conceptually using participant names and accommodation notes. Future: Automated multi-day booking feature available.

### Q: "Can I see which guides are available on a specific date?"
**A:** Yes - when creating booking, Staff dropdown auto-shows available guides (those without time conflicts).

---

## Best Practices

✅ **DO:**
- ✅ Always select TOUR service type for tours
- ✅ Fill in participant names for accountability
- ✅ Use special requirements field for dietary/accessibility
- ✅ Keep guide qualifications updated
- ✅ Check waiver compliance monthly
- ✅ Use pricing tiers for volume discounts
- ✅ Add descriptions and photos to tours

❌ **DON'T:**
- ❌ Leave group size at 1 if you have a group
- ❌ Skip waiver tracking (legal requirement)
- ❌ Mix tour and lesson services (keep separate)
- ❌ Forget to update certification expiry dates
- ❌ Overbook beyond vehicle capacity

---

## Advanced Usage

### Creating Tour Discount Codes
```javascript
// In your code, modify calculateBookingFee():
function calculateBookingFee(serviceId, groupSize = null, promoCode = null) {
  let fee = originalCalculation(serviceId, groupSize);

  if (promoCode === 'EARLYBIRD20') {
    fee = fee * 0.8; // 20% off
  }
  if (promoCode === 'GROUPOF10') {
    fee = fee * 0.85; // 15% off
  }

  return fee;
}
```

### Automated Guide Assignment
```javascript
// Assign guide based on language preference
function suggestGuide(tourLanguage) {
  return state.staff.find(s =>
    s.staff_type === 'GUIDE' &&
    s.guide_qualifications?.languages.includes(tourLanguage)
  );
}
```

### Revenue Forecasting
```javascript
const tourMetrics = getTourAnalytics();
const avgRevenuePerbooking = tourMetrics.tourRevenue / tourMetrics.totalTours;
const projectedMonthlyRevenue = avgRevenuePerbooking * 8; // 8 tours/month estimate
console.log('Projected Monthly Tour Revenue:', projectedMonthlyRevenue);
```

---

## Summary Checklist

Before launching tours:
- [ ] Created at least 2-3 tour services with descriptions
- [ ] Added photos to tours
- [ ] Set up pricing (fixed or tiered)
- [ ] Created tour guide staff members
- [ ] Updated guide qualifications for all guides
- [ ] Made a test booking with 5+ participants
- [ ] Verified group pricing calculates correctly
- [ ] Checked waiver field works
- [ ] Ran getTourAnalytics() successfully
- [ ] Tested on mobile device
- [ ] Created email templates
- [ ] Ready to take real bookings!

---

**Your tour booking system is ready to use! 🚌**

*Questions? Check the TOUR_BUSINESS_IMPLEMENTATION_SUMMARY.md for detailed technical info.*
