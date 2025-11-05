# EmailJS Integration - 5-Minute Setup Guide

## 🎯 Goal
Send actual booking confirmation and reminder emails to customers

## ⏱️ Time: 5-10 Minutes

---

## Step 1: Sign Up at EmailJS (2 minutes)

1. Go to **https://www.emailjs.com/**
2. Click **Sign Up** (top right)
3. Create free account with email
4. Verify email
5. Log in to dashboard

---

## Step 2: Get Your Credentials (2 minutes)

### A. Get Service ID
1. Go to **Accounts** → **Email Services**
2. Click **Connect New Service**
3. Select **Gmail** (or your email provider)
4. Follow setup wizard
5. Copy your **Service ID** (looks like: `service_abc123`)

### B. Get Public Key
1. Go to **Accounts** → **API Keys**
2. Copy **Public Key** (looks like: `xyz123public_key`)

### C. Create Email Template
1. Go to **Email Templates**
2. Click **Create New Template**
3. Name it: `booking_confirmation`
4. In template editor, use this:

```
Subject: Booking Confirmation - {{service_name}}

Hi {{customer_name}},

Your booking has been confirmed!

**Booking Details:**
- Service: {{service_name}}
- Date: {{booking_date}}
- Time: {{booking_time}}
- Instructor: {{instructor_name}}
{{#pickup_location}}
- Pickup: {{pickup_location}}
{{/pickup_location}}

Payment Status: {{payment_status}}
{{#amount_due}}Amount Due: €{{amount_due}}{{/amount_due}}

If you need to reschedule, please contact us.

Thank you!
{{instructor_name}}
```

4. Click **Save**
5. Copy **Template ID** (looks like: `template_abc123`)

---

## Step 3: Add EmailJS to Your HTML (1 minute)

**Location:** `index.html` - Add to `<head>` section

```html
<!-- Add this line to the <head> section: -->
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/build/index.min.js"></script>
```

Example (between other scripts):
```html
<head>
    ...existing scripts...
    <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/build/index.min.js"></script>
    <script src="script.js"></script>
</head>
```

---

## Step 4: Update Script Functions (3 minutes)

**Location:** `script.js`

### Find and Update: `prepareEmail()` function

**Current code (Lines 227-248):**
```javascript
function prepareEmail(emailData, type, referenceId) {
    console.log(`📧 Email Ready [${type}]:`, emailData);
    // ... rest of function
}
```

**Replace with:**
```javascript
function prepareEmail(emailData, type, referenceId) {
    // Initialize EmailJS (do once)
    emailjs.init("YOUR_PUBLIC_KEY_HERE");

    // Prepare template variables
    const templateParams = {
        to_email: emailData.to,
        subject: emailData.subject,
        message: emailData.body
    };

    // Send email
    emailjs.send("YOUR_SERVICE_ID_HERE", "booking_confirmation", {
        to_email: emailData.to,
        subject: emailData.subject,
        email_html: emailData.body
    }).then(response => {
        console.log('✅ Email sent successfully!', response);
        showToast('📧 Email sent to ' + emailData.to);

        // Update status in pending emails queue
        if (state.settings.pendingEmails) {
            const email = state.settings.pendingEmails.find(e => e.id === referenceId);
            if (email) {
                email.status = 'sent';
                email.sentAt = new Date().toISOString();
                saveState();
            }
        }
    }).catch(error => {
        console.error('❌ Email failed:', error);
        showToast('❌ Failed to send email. Check console.');

        // Update status
        if (state.settings.pendingEmails) {
            const email = state.settings.pendingEmails.find(e => e.id === referenceId);
            if (email) {
                email.status = 'failed';
                email.error = error.text;
                saveState();
            }
        }
    });

    // Store in queue
    if (!state.settings.pendingEmails) {
        state.settings.pendingEmails = [];
    }

    state.settings.pendingEmails.push({
        id: `email_${generateUUID()}`,
        type,
        referenceId,
        emailData,
        createdAt: new Date().toISOString(),
        status: 'pending'
    });

    saveState();
}
```

---

## Step 5: Replace Your Credentials (1 minute)

In the code above, replace:

```javascript
"YOUR_PUBLIC_KEY_HERE"     // ← Replace with your Public Key
"YOUR_SERVICE_ID_HERE"     // ← Replace with your Service ID
```

**Example:**
```javascript
emailjs.init("pk_9a8b7c6d5e4f3g2h1i0j");
emailjs.send("service_xyz123abc", "booking_confirmation", {
    // ...
});
```

---

## Step 6: Test It (2 minutes)

1. Open your booking system in browser
2. Go to **Settings** → **Email Notifications**
3. Click **Test Booking Confirmation Email**
4. Should see toast: "📧 Email sent to [customer email]"
5. Check your email inbox (Gmail spam folder if not found)
6. You should receive the confirmation email!

---

## Step 7: Enable Auto Reminders (30 seconds)

1. Go to **Settings**
2. Check both:
   - ✅ **Enable Auto-Reminders** (SMS prep)
   - ✅ **Enable Auto-Email Reminders** (Email send)
3. Save

---

## ✅ What You Can Do Now

**Test Features:**
- [x] Send confirmation email when booking created
- [x] Send reminder email 1 day before booking
- [x] Manual test email button
- [x] Auto email reminders (when enabled)
- [x] Email queue tracking

**What You Still Need (Optional):**
- [ ] SMS via Twilio (add later if needed)
- [ ] Server-side scheduling (add later if needed)

---

## 📧 Email Functions Reference

### Send Confirmation Email
```javascript
sendBookingConfirmationEmail(bookingId);
```

### Send Reminder Email
```javascript
sendBookingReminderEmail(bookingId);
```

### Send Payment Receipt
```javascript
sendPaymentReceiptEmail(transactionId);
```

### Check Pending Emails
```javascript
console.log(state.settings.pendingEmails);
```

---

## 🐛 Troubleshooting

### "Email not received"
**Solution 1:** Check spam/junk folder
**Solution 2:** Verify customer has valid email address
**Solution 3:** Check browser console (F12) for errors

### "API Key error"
**Solution:** Make sure you:
- Replaced PUBLIC_KEY correctly
- Replaced SERVICE_ID correctly
- No quotes issues

### "Template not found"
**Solution:** Make sure template name matches exactly

---

## 📊 What Happens Now

```
1. User creates booking
   ↓
2. confirmBooking() called
   ↓
3. sendBookingConfirmationEmail(bookingId) ← Called
   ↓
4. prepareEmail() function runs
   ↓
5. EmailJS API called with your credentials
   ↓
6. Email sent to customer immediately ✅
   ↓
7. Toast shows: "📧 Email sent to customer@example.com"
   ↓
8. Customer receives email in inbox ✅
```

---

## 🎯 Next Steps

**Immediate:**
- [ ] Complete steps 1-7 above
- [ ] Test with yourself
- [ ] Create sample bookings

**Soon (Optional):**
- [ ] Add Twilio for SMS
- [ ] Customize email templates
- [ ] Add email logging/reporting

**Later (Optional):**
- [ ] Backend scheduling
- [ ] Email analytics
- [ ] Custom branding

---

## 📞 Costs

**EmailJS:**
- Free tier: 200 emails/month ✅
- Paid tier: €15/month for unlimited

**For most small businesses:**
- Free tier is enough
- 200 emails = ~6-7 bookings per day
- Plenty for start

---

## ✨ You're Done!

Your booking system now sends real emails to customers.

**What's Working:**
- ✅ Confirmation emails
- ✅ Reminder emails
- ✅ Receipt emails
- ✅ Auto-reminders (if enabled)
- ✅ Manual test button

**Next:** Want to add SMS? See SMS_EMAIL_REMINDERS_DIAGNOSTIC.md

---

**Enjoy automated email confirmations! 📧**
