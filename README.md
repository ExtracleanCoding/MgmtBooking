# Ray Ryan Management System

A comprehensive single-page web application (SPA) for managing driving school operations and tour guide business with unified booking, billing, and analytics.

[![Performance Grade](https://img.shields.io/badge/Performance-A+-success)](PHASE_4_3_PERFORMANCE_REPORT.md)
[![Modularization](https://img.shields.io/badge/Modularization-94%25-blue)](PROGRESS.md)
[![Build](https://img.shields.io/badge/Build-Passing-brightgreen)](#)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🌟 Features

### 🚗 Driving School Management
- **Student Progress Tracking** - Lesson history, skills assessment, and AI-powered summaries
- **Lesson Credits System** - Package sales with automatic credit tracking
- **License Management** - Track student license numbers and progress

### 🚌 Tour Guide Business
- **Group Bookings** - Manage tour groups with dynamic pricing (1-200 participants)
- **Guide Qualifications** - Languages, specializations, certifications, ratings
- **Waiver Tracking** - Insurance and liability compliance with timestamps
- **Multi-Day Tours** - Linked bookings with accommodation details

### 📅 Unified Booking System
- **Calendar Views** - Day, week, and month views with drag-and-drop (planned)
- **Conflict Detection** - Prevents double-booking of staff and resources
- **Recurring Bookings** - Weekly, daily, and bi-weekly automatic scheduling
- **Staff Availability** - Block dates for time-off and holidays

### 💰 Billing & Revenue Management
- **Payment Tracking** - Paid, unpaid, and credit payment statuses
- **Invoice Generation** - Professional invoices with line items
- **Transaction History** - Complete payment records with notes
- **Payment Reminders** - Automated email reminders (EmailJS integration)

### 📊 Analytics & Reporting
- **Income Analysis** - Revenue by month, service, and payment status
- **Expense Tracking** - Categorized business expenses (fuel, maintenance, etc.)
- **Service Popularity** - Visual charts showing most-booked services
- **Tour Analytics** - Occupancy rates, group sizes, waiver compliance

---

## 🏗️ Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Vanilla JavaScript (ES6 modules) | Application logic |
| **UI Framework** | HTML5 + TailwindCSS | Responsive design |
| **Build Tool** | Vite 5.0.8 | Module bundling & HMR |
| **Type Safety** | TypeScript 5.3.3 (definitions only) | Development-time type checking |
| **Storage** | LocalStorage + LZ-String | Browser-based persistence (5-10 MB) |
| **Charts** | Chart.js 4.4.1 | Data visualizations |
| **Calendar API** | Google Calendar API | External calendar sync |
| **Email API** | EmailJS (optional) | Notification system |

### Modular Architecture (ES6 Modules)

**94% of codebase modularized** - 7,066 lines across 14 ES6 modules

```
src/
├── core/                    # Core system modules
│   ├── constants.js         # Enums, button classes, calendar settings
│   ├── state.js            # Global state management & CRUD helpers
│   ├── storage.js          # LocalStorage persistence & migrations
│   ├── utils.js            # 50+ utility functions (dates, sanitization, dialogs)
│   └── optimization.js     # Memoization, debounce, chart cleanup (LRU cache)
│
├── modules/                 # Feature modules
│   ├── calendar.js         # Day/week/month calendar rendering (564 lines)
│   ├── billing.js          # Payment tracking & invoices (521 lines)
│   ├── reports.js          # Chart.js visualizations & analytics (693 lines)
│   ├── bookings.js         # Booking CRUD, conflict detection, pricing (822 lines)
│   ├── customers.js        # Customer CRUD, progress tracking (991 lines)
│   ├── staff.js            # Staff CRUD, guide qualifications (405 lines)
│   ├── modals.js           # 10 modal types, form handling (844 lines)
│   └── navigation.js       # View switching, date navigation (226 lines)
│
└── main.js                  # Entry point, window exposure for compatibility (573 lines)
```

**Legacy Scripts (Non-module):**
- `security.js` - XSS protection & sanitization (481 lines)
- `google-calendar.js` - Google Calendar API integration (329 lines)
- `script.js` - Deprecated monolithic file (7,518 lines - superseded by modules)

### Data Model

**Global State Object:**
```javascript
state = {
    customers: [],          // Customer profiles with license & credits
    staff: [],             // Instructors/guides with qualifications
    resources: [],         // Vehicles/equipment with maintenance tracking
    services: [],          // Service types (DRIVING_LESSON, TOUR) with pricing
    bookings: [],          // All reservations with staff/resource assignments
    blockedPeriods: [],    // Staff time-off and school holidays
    expenses: [],          // Business expenses by category
    transactions: [],      // Payment records linked to bookings
    waitingList: [],       // Customers waiting for booking availability
    settings: {}           // App config (email templates, preferences)
}
```

**Key Entities:**
- **Booking** - Date, time, customer, staff, resource, service, fee, status, payment
- **Customer** - Name, contact, license, credits, lesson history
- **Staff** - Name, type (instructor/guide/admin), qualifications, schedule
- **Service** - Name, type, duration, pricing (fixed or tiered), capacity
- **Resource** - Name, type (vehicle/room/equipment), maintenance dates

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (for development)
- **npm** 9+ (package manager)
- Modern browser with ES6 module support (Chrome 90+, Firefox 88+, Safari 14+)

### Installation

```bash
# Clone repository
git clone https://github.com/ExtracleanCoding/MgmtBooking.git
cd MgmtBooking

# Install dependencies
npm install

# Start development server
npm run dev
# Opens http://localhost:3000/

# Build for production
npm run build
# Output in dist/ folder

# Preview production build
npm run preview
# Opens http://localhost:4173/
```

### Quick Start (No Build Required)

For simple testing without build tools:

```bash
# Serve with any HTTP server
python3 -m http.server 8000
# Open http://localhost:8000/
```

**Note:** Module loading requires an HTTP server (not `file://` protocol)

---

## 📦 Production Deployment

### Build & Deploy

```bash
# 1. Build for production
npm run build

# 2. Output files in dist/ folder
dist/
├── index.html              # 48 KB (8.4 KB gzipped)
├── assets/
│   ├── css/
│   │   └── main-*.css      # 27 KB (5.8 KB gzipped)
│   └── js/
│       ├── core-*.js       # 8.8 KB (3.6 KB gzipped)
│       ├── calendar-*.js   # 13 KB (4.4 KB gzipped)
│       ├── billing-*.js    # 33 KB (8.1 KB gzipped)
│       └── main-*.js       # 71 KB (18.5 KB gzipped)

# 3. Deploy dist/ folder to your hosting provider
```

### Hosting Options

**Static Hosting (Recommended):**
- **Vercel** - Zero-config, automatic deployments
- **Netlify** - Drag-and-drop deployment
- **GitHub Pages** - Free hosting for public repos
- **AWS S3 + CloudFront** - Scalable cloud hosting

**Traditional Hosting:**
- Any web server (Apache, Nginx, IIS)
- Just upload `dist/` folder contents

### Performance Characteristics

**Production Build Metrics:**
- **Bundle Size:** 153 KB total (35 KB gzipped)
- **Initial Load:** 9 KB core module (code splitting)
- **Time to Interactive:** ~155ms
- **Performance Grade:** A+ (95/100)

**See detailed performance analysis:** [PHASE_4_3_PERFORMANCE_REPORT.md](PHASE_4_3_PERFORMANCE_REPORT.md)

---

## 🎯 Usage Guide

### Creating Your First Booking

1. **Add a Customer**
   - Navigate to "Customers" view
   - Click "Add New Customer"
   - Fill in name, email, phone

2. **Add a Service**
   - Navigate to "Services" view
   - Click "Add New Service"
   - Choose type: Driving Lesson or Tour
   - Set duration and pricing

3. **Add Staff**
   - Navigate to "Staff" view
   - Click "Add New Staff"
   - Select type: Instructor or Guide
   - For guides: Add languages, specializations, certifications

4. **Add a Resource (Optional)**
   - Navigate to "Resources" view
   - Click "Add New Resource"
   - For vehicles: Add make, model, registration, maintenance dates

5. **Create a Booking**
   - Navigate to "Calendar" view (day/week/month)
   - Click on a time slot or click "Add New Booking"
   - Select customer, staff, resource, service
   - Fee calculates automatically
   - Save booking

### Advanced Features

**Recurring Bookings:**
- Check "Create Recurring Booking" in booking modal
- Choose frequency: weekly, daily, bi-weekly
- Set number of occurrences or end date

**Tour Group Bookings:**
- Select a service with type "Tour"
- Enter group size (1-200)
- Add participant names (one per line)
- Fee calculates based on tiered pricing
- Mark waiver as signed when complete

**Student Progress Tracking:**
- In "Customers" view, click "Progress" button
- View lesson history with notes
- Add new lesson notes with skills assessment
- Generate AI summary (if configured)

**Payment & Billing:**
- Navigate to "Billing & Payments" view
- See all customers with payment summaries
- Click "Generate Invoice" for unpaid bookings
- Record payments with payment method and notes

**Reports & Analytics:**
- Navigate to "Reports" view
- View income by month (bar chart)
- See service popularity (doughnut chart)
- Analyze revenue by service (horizontal bar)
- Track expenses by category

---

## ⚙️ Configuration

### Email Integration (Optional)

**Setup EmailJS for automatic reminders:**

1. Sign up at [emailjs.com](https://emailjs.com/) (free: 200 emails/month)
2. Get your public key, service ID, and template ID
3. Add to application settings (in-app or `src/core/constants.js`)

```javascript
// In settings or constants.js
emailjs_public_key: 'your_public_key',
emailjs_service_id: 'service_gmail',
emailjs_template_id: 'template_booking'
```

See: [EMAILJS_QUICK_SETUP.md](EMAILJS_QUICK_SETUP.md) for detailed guide

### Google Calendar Sync (Optional)

**Export bookings to Google Calendar:**

1. Get Google Calendar API credentials
2. Configure OAuth consent screen
3. Add credentials to application
4. Use "Export to Google Calendar" button in booking modal

See: `google-calendar.js` for implementation details

### SMS Reminders (Optional - Requires Backend)

Currently logs to console. To enable:

1. Sign up for Twilio account
2. Add server-side endpoint (Node.js/PHP/Python)
3. Call Twilio API with booking details
4. Update `checkAndScheduleSMSReminders()` function

---

## 🧪 Testing

### Manual Testing

Use the comprehensive test checklist:
- [PHASE_4_2_TEST_REPORT.md](PHASE_4_2_TEST_REPORT.md) - 28 critical tests

### Performance Testing

Use the built-in performance utilities:

```javascript
// In browser console after loading app:

// 1. Generate large test dataset (500 customers, 2000 bookings)
generateLargeDataset();

// 2. Measure view render times
measureAllViews();

// 3. Check memory usage
measureMemoryUsage();

// 4. Check localStorage size
measureLocalStorageSize();
```

**Utilities:** See [performance-test-generator.js](performance-test-generator.js)

### Type Checking

```bash
# Run TypeScript type checker (no compilation)
npm run type-check
```

---

## 🔧 Development

### Project Structure

```
MgmtBooking/
├── src/                    # ES6 modules (modular architecture)
│   ├── core/              # Core system modules (5 files)
│   ├── modules/           # Feature modules (8 files)
│   └── main.js            # Entry point
├── index.html             # Main HTML template
├── style.css              # Global styles (Tailwind)
├── security.js            # XSS protection
├── google-calendar.js     # Calendar API integration
├── script.js              # Legacy monolithic file (deprecated)
├── vite.config.js         # Build configuration
├── tsconfig.json          # TypeScript configuration
├── package.json           # Dependencies & scripts
├── CLAUDE.md              # AI assistant guidance
├── PROGRESS.md            # Modularization progress
├── PHASE_4_2_TEST_REPORT.md       # Testing documentation
├── PHASE_4_3_PERFORMANCE_REPORT.md # Performance analysis
└── performance-test-generator.js   # Testing utilities
```

### NPM Scripts

```bash
npm run dev        # Start Vite dev server (HMR)
npm run build      # Production build
npm run preview    # Preview production build
npm run type-check # TypeScript type checking
```

### Hot Module Replacement (HMR)

Vite provides instant updates during development:
- Change any module → updates in <200ms
- No full page reload needed
- State preserved across updates

### Module Dependencies

```
main.js
├── Core Modules
│   ├── constants.js
│   ├── state.js
│   ├── storage.js
│   ├── utils.js
│   └── optimization.js
└── Feature Modules
    ├── calendar.js → state, utils, constants
    ├── billing.js → state, storage, utils
    ├── reports.js → state, utils, optimization
    ├── bookings.js → state, storage, utils, constants
    ├── customers.js → state, storage, utils, constants
    ├── staff.js → state, storage, utils, constants
    ├── modals.js → state, utils, constants
    └── navigation.js → state, optimization
```

**No circular dependencies** - Clean dependency graph

---

## 📊 Performance

### Bundle Size

| Chunk | Size (Uncompressed) | Size (Gzipped) | Purpose |
|-------|---------------------|----------------|---------|
| **core.js** | 8.8 KB | 3.6 KB | State, storage, utils |
| **calendar.js** | 13.2 KB | 4.4 KB | Calendar views |
| **billing.js** | 33.2 KB | 8.1 KB | Billing + reports |
| **main.js** | 71.0 KB | 18.5 KB | Entry + feature modules |
| **Total JS** | 153 KB | 35 KB | All JavaScript |
| **CSS** | 27.2 KB | 5.8 KB | Styles |
| **HTML** | 48.0 KB | 8.4 KB | Template |

**Total Page Weight:** 228 KB (49 KB gzipped)

### Load Time

- **Time to Interactive (TTI):** ~155ms
- **First Contentful Paint (FCP):** ~100ms
- **Largest Contentful Paint (LCP):** ~500ms

**Code Splitting Benefits:**
- Initial load: Only 9 KB core module (82% reduction)
- Additional modules loaded on-demand
- Faster initial page load and interactivity

### Scalability

Tested with performance dataset:
- **500 customers** - Smooth operation
- **2000 bookings** - All views under 1 second
- **200 expenses** - Reports generate in <1 second
- **300 transactions** - Billing view renders quickly

### Memoization

Cached operations achieve 100-250x speedup:
- `findBookingConflict`: 20ms → 0.1ms (200x faster)
- `getCustomerSummaries`: 50ms → 0.2ms (250x faster)

**LRU cache** prevents unbounded growth (max 1000 entries)

---

## 🔐 Security

### XSS Protection

All user input sanitized via `security.js`:
- HTML tags stripped
- Event handlers removed
- Entities escaped
- Script injection prevented

### Data Privacy

**Important Notes:**
- No user authentication (single-user application)
- All data stored in browser LocalStorage
- No encryption at rest
- Not suitable for multi-user production without backend

**Recommendations for Production:**
1. Add authentication layer (Firebase Auth, Auth0)
2. Implement backend database (Firebase, Supabase)
3. Add encryption for sensitive data
4. Implement role-based access control (RBAC)

---

## 🐛 Known Issues & Limitations

### Current Limitations

1. **Single User Only** - No multi-user support or authentication
2. **Browser Storage** - Limited to 5-10 MB per domain
3. **No Real-Time Sync** - Data only in browser, no cloud sync
4. **SMS Requires Backend** - SMS reminders need server integration
5. **IE11 Not Supported** - Requires modern browser (ES6 modules)

### Non-Critical Issues

1. **Legacy Scripts Warning** - `security.js` and `google-calendar.js` not bundled as modules (works fine)
2. **Empty Vendor Chunk** - Vite generates empty chunk (cosmetic issue)
3. **NPM Audit Warnings** - 2 moderate vulnerabilities in dev dependencies only

See: [PHASE_4_2_TEST_REPORT.md](PHASE_4_2_TEST_REPORT.md) for complete list

---

## 🚀 Optimization Recommendations

### High Priority (Quick Wins)

1. **Enable Brotli Compression** - 10-20% smaller bundles
2. **Lazy Load Chart.js** - Save 50 KB on initial load
3. **Implement Service Worker** - Offline support + instant repeat loads
4. **Remove Empty Vendor Chunk** - Eliminate unnecessary HTTP request

### Medium Priority

5. **Virtualize Long Lists** - 10x faster rendering for 1000+ items
6. **Web Worker Search** - Non-blocking search operations
7. **IndexedDB for Large Datasets** - 50+ MB storage capacity
8. **Lazy Render Charts** - Render only visible charts

See: [PHASE_4_3_PERFORMANCE_REPORT.md](PHASE_4_3_PERFORMANCE_REPORT.md) - 13 recommendations

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [CLAUDE.md](CLAUDE.md) | Comprehensive guide for AI assistants (architecture, patterns, functions) |
| [PROGRESS.md](PROGRESS.md) | Modularization progress tracking (94% complete) |
| [PHASE_4_2_TEST_REPORT.md](PHASE_4_2_TEST_REPORT.md) | Testing documentation with 28-item checklist |
| [PHASE_4_3_PERFORMANCE_REPORT.md](PHASE_4_3_PERFORMANCE_REPORT.md) | Performance analysis (A+ grade, 95/100) |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Production deployment instructions |
| [EMAILJS_QUICK_SETUP.md](EMAILJS_QUICK_SETUP.md) | Email integration in 5 minutes |

---

## 🤝 Contributing

### Development Workflow

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes in `src/` modules (not `script.js`)
4. Test with `npm run dev`
5. Build with `npm run build`
6. Commit changes (`git commit -m 'Add amazing feature'`)
7. Push to branch (`git push origin feature/amazing-feature`)
8. Open Pull Request

### Code Style

- **ES6 modules** - Use import/export
- **JSDoc comments** - Document all functions
- **Naming conventions** - camelCase for functions, UPPER_CASE for constants
- **File organization** - Keep modules focused and cohesive
- **No inline styles** - Use Tailwind classes

### Adding a New Module

1. Create `src/modules/your-module.js`
2. Export functions: `export function yourFunction() { ... }`
3. Import in `src/main.js`: `import { yourFunction } from './modules/your-module.js'`
4. Expose to window: `window.yourFunction = yourFunction;`
5. Update documentation

---

## 📜 License

MIT License - See [LICENSE](LICENSE) file for details

---

## 📧 Contact & Support

**Project Repository:** [https://github.com/ExtracleanCoding/MgmtBooking](https://github.com/ExtracleanCoding/MgmtBooking)

**Issues & Bug Reports:** [GitHub Issues](https://github.com/ExtracleanCoding/MgmtBooking/issues)

**For help:**
1. Check [CLAUDE.md](CLAUDE.md) for architecture and patterns
2. Review [PHASE_4_2_TEST_REPORT.md](PHASE_4_2_TEST_REPORT.md) for testing guide
3. See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for deployment help
4. Open an issue on GitHub

---

## 🏆 Acknowledgments

- **Vite** - Lightning-fast build tool and dev server
- **Chart.js** - Beautiful data visualizations
- **TailwindCSS** - Utility-first CSS framework
- **LZ-String** - Efficient compression for LocalStorage
- **EmailJS** - Email service without backend
- **Google Calendar API** - External calendar integration

---

## 📈 Project Stats

- **Modularization:** 94% complete (7,066 / 7,518 lines)
- **Modules:** 14 ES6 modules (5 core + 8 feature + 1 entry)
- **Performance:** A+ grade (95/100)
- **Bundle Size:** 35 KB gzipped (82% reduction from code splitting)
- **Time to Interactive:** ~155ms
- **Test Coverage:** 28 critical path tests documented
- **Optimization Recommendations:** 13 identified (4 high-priority)

---

**Built with ❤️ for Ray Ryan Management**

*Last Updated: November 6, 2025 - Phase 4.4 Complete (Modularization Project Finished)*
