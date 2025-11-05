# Security Quick Reference Guide
## For Developers

---

## 🚀 Quick Start

### Using Sanitization

```javascript
// ✅ ALWAYS do this before displaying user content
const safeContent = sanitizeHTML(userInput);
element.innerHTML = safeContent;

// ✅ BETTER: Use textContent when possible
element.textContent = userInput; // Auto-sanitized

// ❌ NEVER do this
element.innerHTML = userInput; // DANGEROUS!
```

### Validating Inputs

```javascript
// Validate email
const result = validateInput(emailValue, 'email');
if (!result.valid) {
    showDialog({ title: 'Error', message: result.message });
    return;
}

// Available validation types:
// 'email', 'phone', 'name', 'currency', 'time', 'date', 'text'
```

### Checking Required Fields

```javascript
const result = validateRequired(fieldValue);
if (!result.valid) {
    alert('This field is required');
    return;
}
```

---

## 📋 Common Patterns

### Form Validation Pattern

```javascript
function saveMyEntity(event) {
    event.preventDefault();

    // Get values
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();

    // Validate name
    const nameCheck = validateInput(name, 'name');
    if (!nameCheck.valid) {
        showDialog({
            title: 'Invalid Name',
            message: nameCheck.message,
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }

    // Validate email
    if (email) {
        const emailCheck = validateInput(email, 'email');
        if (!emailCheck.valid) {
            showDialog({
                title: 'Invalid Email',
                message: emailCheck.message,
                buttons: [{ text: 'OK', class: btnPrimary }]
            });
            return;
        }
    }

    // Sanitize before saving
    const entityData = {
        name: sanitizeHTML(name),
        email: sanitizeHTML(email)
    };

    // Save...
}
```

### Display Pattern

```javascript
// When rendering data to HTML
function renderMyData(data) {
    const html = `
        <div class="card">
            <h3>${sanitizeHTML(data.title)}</h3>
            <p>${sanitizeHTML(data.description)}</p>
            <a href="${sanitizeURL(data.link)}">
                ${sanitizeHTML(data.linkText)}
            </a>
        </div>
    `;
    container.innerHTML = html;
}
```

### Safe Event Handlers (Future)

```javascript
// ❌ Current (inline handlers)
<button onclick="handleClick()">Click</button>

// ✅ Target (event listeners) - NOT YET IMPLEMENTED
// In HTML: <button id="my-button">Click</button>
// In JS:
document.getElementById('my-button').addEventListener('click', handleClick);
```

---

## 🔐 API Key Handling

### Saving API Keys

```javascript
// Keys are automatically encrypted in saveState()
state.settings.apiKeys.gemini = userProvidedKey;
saveState(); // Encryption happens here
```

### Loading API Keys

```javascript
// Keys are automatically decrypted in loadState()
loadState(); // Decryption happens here
const key = state.settings.apiKeys.gemini; // Already decrypted
```

### Important
- Keys in memory are still plain text
- Keys are encrypted only in localStorage
- For production, use backend proxy

---

## ⚠️ Common Mistakes to Avoid

### ❌ DON'T

```javascript
// DON'T use innerHTML with unsanitized data
element.innerHTML = userData; // DANGEROUS

// DON'T trust user input
const age = userInput; // Must validate first
if (age > 18) { ... }

// DON'T skip validation
saveToDatabase(userInput); // Validate first!

// DON'T use eval
eval(userCode); // EXTREMELY DANGEROUS

// DON'T create functions from strings
new Function(userCode)(); // DANGEROUS

// DON'T use javascript: URLs
location.href = "javascript:alert('XSS')"; // DANGEROUS
```

### ✅ DO

```javascript
// DO sanitize before rendering
element.innerHTML = sanitizeHTML(userData);

// DO validate inputs
const validation = validateInput(age, 'number');
if (validation.valid && age > 18) { ... }

// DO validate before saving
if (validateData(entityData, 'customer').valid) {
    saveToDatabase(sanitizedData);
}

// DO use textContent when possible
element.textContent = userData; // Auto-safe

// DO sanitize URLs
link.href = sanitizeURL(userURL);
```

---

## 🎯 Validation Cheat Sheet

| Field Type | Validation Code | Max Length |
|-----------|----------------|------------|
| Email | `validateInput(val, 'email')` | 254 |
| Phone | `validateInput(val, 'phone')` | 20 |
| Name | `validateInput(val, 'name')` | 100 |
| Money | `validateInput(val, 'currency')` | - |
| Time | `validateInput(val, 'time')` | - |
| Date | `validateInput(val, 'date')` | - |
| Text | `validateInput(val, 'text')` | 5000 |

---

## 🛠️ Testing Your Code

### Test for XSS

Try entering these in your forms:
```
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
"><script>alert('XSS')</script>
javascript:alert('XSS')
```

**Expected Result**: All should be escaped/blocked

### Test Validation

Try these invalid inputs:
```
Email: "notanemail"
Phone: "abcdefg"
Name: "John123"
Currency: "-10" or "10.999"
```

**Expected Result**: All should show validation errors

### Check Console

Open DevTools Console and look for:
- ❌ No XSS warnings
- ❌ No CSP violations (unless expected)
- ❌ No validation errors in valid submissions
- ✅ CSP violations are logged properly

---

## 📚 Function Reference

### Sanitization Functions

| Function | Purpose | Example |
|----------|---------|---------|
| `sanitizeHTML(value)` | Escape HTML | `sanitizeHTML("<script>")` |
| `sanitizeAttribute(value)` | Safe for attributes | `sanitizeAttribute(userId)` |
| `sanitizeURL(url)` | Block bad protocols | `sanitizeURL(userLink)` |

### Validation Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `validateInput(val, type)` | Validate by type | `{valid: bool, message: string}` |
| `validateRequired(val)` | Check if empty | `{valid: bool, message: string}` |
| `validateData(obj, schema)` | Validate object | `{valid: bool, errors: array}` |
| `validateState(state)` | Validate entire state | `{valid: bool, errors: array}` |

### Encryption Functions

| Function | Purpose |
|----------|---------|
| `encryptAPIKey(key)` | Encrypt API key |
| `decryptAPIKey(encrypted)` | Decrypt API key |

### Rate Limiting

| Function | Purpose |
|----------|---------|
| `globalRateLimiter.isAllowed(key)` | Check if action allowed |
| `globalRateLimiter.clear(key)` | Reset limit for key |

---

## 🚨 When to Ask for Help

Ask for a security review if your code:
- [ ] Displays user-generated content
- [ ] Accepts file uploads
- [ ] Makes external API calls
- [ ] Handles authentication/authorization
- [ ] Processes payment information
- [ ] Uses eval() or new Function()
- [ ] Dynamically loads scripts
- [ ] Accesses localStorage/sessionStorage
- [ ] Creates iframes
- [ ] Handles URLs from user input

---

## 📞 Need Help?

1. Check `SECURITY.md` for detailed documentation
2. Review `security.js` source code
3. Test thoroughly before deploying
4. Get code reviewed by another developer
5. Run security scanning tools

---

*Stay safe, code secure! 🔐*
