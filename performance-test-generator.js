/**
 * Performance Test Dataset Generator
 * Generates large datasets for performance testing the Ray Ryan Management System
 *
 * Usage in browser console:
 * 1. Load the application
 * 2. Copy and paste this script
 * 3. Run: generateLargeDataset()
 * 4. Test performance with realistic data volumes
 */

function generateLargeDataset() {
    console.log('🚀 Starting performance test dataset generation...');
    const startTime = performance.now();

    // Clear existing data (optional - comment out if you want to keep existing data)
    // state.customers = [];
    // state.staff = [];
    // state.services = [];
    // state.resources = [];
    // state.bookings = [];

    // Generate 500 customers
    console.log('📝 Generating 500 customers...');
    for (let i = 0; i < 500; i++) {
        const customer = {
            id: `perf_customer_${i}`,
            name: `Test Customer ${i}`,
            email: `customer${i}@test.com`,
            phone: `+1${String(Math.floor(Math.random() * 10000000000)).padStart(10, '0')}`,
            licenseNumber: `DL${String(i).padStart(6, '0')}`,
            lessonCredits: Math.floor(Math.random() * 20)
        };
        state.customers.push(customer);
    }

    // Generate 50 staff members (mix of instructors and guides)
    console.log('👥 Generating 50 staff members...');
    for (let i = 0; i < 50; i++) {
        const staffType = i < 30 ? 'INSTRUCTOR' : 'GUIDE';
        const staff = {
            id: `perf_staff_${i}`,
            name: `Test ${staffType === 'INSTRUCTOR' ? 'Instructor' : 'Guide'} ${i}`,
            email: `staff${i}@test.com`,
            phone: `+1${String(Math.floor(Math.random() * 10000000000)).padStart(10, '0')}`,
            staff_type: staffType
        };

        if (staffType === 'GUIDE') {
            staff.guide_qualifications = {
                languages: ['English', 'French', 'Spanish'][Math.floor(Math.random() * 3)],
                specializations: ['History', 'Nature', 'Adventure'][Math.floor(Math.random() * 3)],
                certifications: 'First Aid, Guide License',
                certificationExpiry: '2026-12-31',
                rating: (Math.random() * 2 + 3).toFixed(1) // 3.0 to 5.0
            };
        }

        state.staff.push(staff);
    }

    // Generate 20 services (mix of lessons and tours)
    console.log('🎓 Generating 20 services...');
    for (let i = 0; i < 20; i++) {
        const isTour = i >= 15;
        const service = {
            id: `perf_service_${i}`,
            service_name: isTour ? `Test Tour ${i - 14}` : `Lesson Type ${i + 1}`,
            service_type: isTour ? 'TOUR' : 'DRIVING_LESSON',
            duration_minutes: isTour ? 180 : 60,
            base_price: isTour ? 150 : 50,
            capacity: isTour ? 15 : 1,
            pricing_rules: {
                type: isTour ? 'tiered' : 'fixed',
                tiers: isTour ? [
                    { minSize: 1, maxSize: 5, price: 150 },
                    { minSize: 6, maxSize: 10, price: 120 },
                    { minSize: 11, maxSize: 15, price: 100 }
                ] : undefined
            }
        };

        if (isTour) {
            service.description = `Test tour description for ${service.service_name}`;
            service.photos = [];
        }

        state.services.push(service);
    }

    // Generate 30 resources
    console.log('🚗 Generating 30 resources...');
    for (let i = 0; i < 30; i++) {
        const resource = {
            id: `perf_resource_${i}`,
            name: `Test Vehicle ${i + 1}`,
            type: 'VEHICLE',
            capacity: 1,
            make: 'Ford',
            model: 'Focus',
            registration: `TEST${String(i).padStart(3, '0')}`,
            mot_due: '2025-12-31',
            tax_due: '2025-12-31',
            service_due: '2025-06-30'
        };
        state.resources.push(resource);
    }

    // Generate 2000 bookings (mix of past, present, and future)
    console.log('📅 Generating 2000 bookings...');
    const today = new Date();
    const statuses = ['Completed', 'Scheduled', 'Pending', 'Cancelled'];
    const paymentStatuses = ['Paid', 'Unpaid', 'Paid (Credit)'];

    for (let i = 0; i < 2000; i++) {
        // Random date within 6 months before and 3 months after today
        const daysOffset = Math.floor(Math.random() * 270) - 180; // -180 to +90 days
        const bookingDate = new Date(today);
        bookingDate.setDate(bookingDate.getDate() + daysOffset);

        const dateString = bookingDate.toISOString().split('T')[0];

        // Random time between 9 AM and 5 PM
        const startHour = Math.floor(Math.random() * 8) + 9; // 9 to 16
        const startTime = `${String(startHour).padStart(2, '0')}:00`;
        const endHour = startHour + 1;
        const endTime = `${String(endHour).padStart(2, '0')}:00`;

        const customerId = state.customers[Math.floor(Math.random() * state.customers.length)]?.id;
        const staffId = state.staff[Math.floor(Math.random() * state.staff.length)]?.id;
        const serviceId = state.services[Math.floor(Math.random() * state.services.length)]?.id;
        const resourceId = state.resources[Math.floor(Math.random() * state.resources.length)]?.id;

        const service = state.services.find(s => s.id === serviceId);
        const isTour = service?.service_type === 'TOUR';
        const groupSize = isTour ? Math.floor(Math.random() * 12) + 1 : 1;

        // Calculate fee based on service pricing
        let fee = service?.base_price || 50;
        if (isTour && service.pricing_rules.type === 'tiered') {
            const tier = service.pricing_rules.tiers.find(t =>
                groupSize >= t.minSize && groupSize <= t.maxSize
            );
            if (tier) {
                fee = tier.price * groupSize;
            }
        }

        const status = daysOffset < 0 ? 'Completed' : statuses[Math.floor(Math.random() * statuses.length)];

        const booking = {
            id: `perf_booking_${i}`,
            date: dateString,
            startTime: startTime,
            endTime: endTime,
            customerId: customerId,
            staffId: staffId,
            resourceIds: [resourceId],
            serviceId: serviceId,
            fee: fee,
            status: status,
            paymentStatus: status === 'Completed' ?
                (Math.random() > 0.3 ? 'Paid' : 'Unpaid') :
                paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
            pickupLocation: `Test Location ${i % 10}`
        };

        if (isTour) {
            booking.groupSize = groupSize;
            booking.participants = Array.from({ length: groupSize }, (_, idx) =>
                `Participant ${idx + 1}`
            );
            booking.specialRequirements = Math.random() > 0.7 ? 'Vegetarian meals' : '';
            booking.waiverSigned = Math.random() > 0.2;
            booking.waiverSignedDate = booking.waiverSigned ? new Date().toISOString() : null;
        }

        state.bookings.push(booking);
    }

    // Generate 200 expenses
    console.log('💰 Generating 200 expenses...');
    const expenseCategories = ['Fuel', 'Insurance', 'Maintenance', 'Tax', 'Office Supplies', 'Other'];
    for (let i = 0; i < 200; i++) {
        const daysOffset = Math.floor(Math.random() * 180) - 180; // Last 6 months
        const expenseDate = new Date(today);
        expenseDate.setDate(expenseDate.getDate() + daysOffset);

        const expense = {
            id: `perf_expense_${i}`,
            date: expenseDate.toISOString().split('T')[0],
            category: expenseCategories[Math.floor(Math.random() * expenseCategories.length)],
            description: `Test expense ${i + 1}`,
            amount: Math.floor(Math.random() * 500) + 20
        };
        state.expenses.push(expense);
    }

    // Generate 300 transactions
    console.log('💳 Generating 300 transactions...');
    const paidBookings = state.bookings.filter(b => b.paymentStatus === 'Paid');
    for (let i = 0; i < Math.min(300, paidBookings.length); i++) {
        const booking = paidBookings[i];
        const transaction = {
            id: `perf_transaction_${i}`,
            bookingId: booking.id,
            customerId: booking.customerId,
            amount: booking.fee,
            date: booking.date,
            paymentMethod: ['Cash', 'Card', 'Bank Transfer'][Math.floor(Math.random() * 3)],
            notes: `Payment for booking ${booking.id}`
        };
        state.transactions.push(transaction);
    }

    // Save to localStorage
    console.log('💾 Saving to localStorage...');
    saveState();

    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('✅ Performance test dataset generated!');
    console.log(`⏱️  Generation time: ${duration} seconds`);
    console.log('📊 Dataset summary:');
    console.log(`   - Customers: ${state.customers.length}`);
    console.log(`   - Staff: ${state.staff.length}`);
    console.log(`   - Services: ${state.services.length}`);
    console.log(`   - Resources: ${state.resources.length}`);
    console.log(`   - Bookings: ${state.bookings.length}`);
    console.log(`   - Expenses: ${state.expenses.length}`);
    console.log(`   - Transactions: ${state.transactions.length}`);
    console.log('');
    console.log('🔄 Refresh the page to see the new data!');

    return {
        duration: duration,
        counts: {
            customers: state.customers.length,
            staff: state.staff.length,
            services: state.services.length,
            resources: state.resources.length,
            bookings: state.bookings.length,
            expenses: state.expenses.length,
            transactions: state.transactions.length
        }
    };
}

// Performance measurement utilities
function measureViewRenderTime(viewName) {
    console.log(`⏱️  Measuring render time for ${viewName} view...`);
    const startTime = performance.now();

    showView(viewName);

    // Use requestAnimationFrame to measure after render
    requestAnimationFrame(() => {
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(2);
        console.log(`✅ ${viewName} view rendered in ${duration}ms`);
    });
}

function measureAllViews() {
    const views = ['day', 'week', 'month', 'summary', 'billing', 'customers', 'staff', 'resources', 'services', 'reports'];
    const results = {};
    let index = 0;

    function measureNext() {
        if (index >= views.length) {
            console.log('✅ All views measured!');
            console.table(results);
            return;
        }

        const viewName = views[index];
        const startTime = performance.now();

        showView(viewName);

        requestAnimationFrame(() => {
            const endTime = performance.now();
            const duration = (endTime - startTime).toFixed(2);
            results[viewName] = `${duration}ms`;
            console.log(`✅ ${viewName}: ${duration}ms`);

            index++;
            setTimeout(measureNext, 100); // Small delay between views
        });
    }

    measureNext();
}

function measureMemoryUsage() {
    if (performance.memory) {
        const memory = performance.memory;
        console.log('💾 Memory Usage:');
        console.log(`   Used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Total: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Limit: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`);
        return {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit
        };
    } else {
        console.log('⚠️  Memory measurement not available (Chrome only)');
        return null;
    }
}

function measureLocalStorageSize() {
    let total = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            total += localStorage[key].length + key.length;
        }
    }
    const sizeKB = (total / 1024).toFixed(2);
    const sizeMB = (total / 1024 / 1024).toFixed(2);
    console.log(`💾 localStorage size: ${sizeKB} KB (${sizeMB} MB)`);
    return total;
}

// Export for use
if (typeof window !== 'undefined') {
    window.generateLargeDataset = generateLargeDataset;
    window.measureViewRenderTime = measureViewRenderTime;
    window.measureAllViews = measureAllViews;
    window.measureMemoryUsage = measureMemoryUsage;
    window.measureLocalStorageSize = measureLocalStorageSize;

    console.log('📊 Performance testing utilities loaded!');
    console.log('Available functions:');
    console.log('  - generateLargeDataset()');
    console.log('  - measureViewRenderTime(viewName)');
    console.log('  - measureAllViews()');
    console.log('  - measureMemoryUsage()');
    console.log('  - measureLocalStorageSize()');
}
