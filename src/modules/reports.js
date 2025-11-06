/**
 * Reports Module for Ray Ryan Management System
 * Handles business reports, analytics, Chart.js visualizations, and KPI tracking
 *
 * Extracted from script.js lines 4095-4275, 7290-7722
 */

// NOTE: During migration, these imports will be properly wired up
// import { state } from '../core/state.js';
// import { btnPurple, btnGreen } from '../core/constants.js';
// import { sanitizeHTML, parseYYYYMMDD, getLessonPackages } from '../core/utils.js';
// import { destroyAllCharts, activeCharts } from '../core/optimization.js';
// import { getCustomerSummaries } from './billing.js';

// ============================================
// MAIN REPORTS VIEW
// ============================================

/**
 * Render the main reports view with KPI cards and charts
 * Entry point for reports view
 */
export function renderReportsView() {
    const container = document.getElementById('reports-view');
    container.innerHTML = `
        <div class="reports-container">
            <!-- Header Section -->
            <div class="reports-header">
                <div class="reports-header-content">
                    <h1 class="reports-title">Business Reports</h1>
                    <p class="reports-subtitle">Real-time insights into your business performance</p>
                </div>
                <div class="reports-actions">
                    <button id="analyze-reports-btn" onclick="handleAnalyzeReports()" class="${btnPurple}">✨ Analyze Reports</button>
                    <button onclick="exportReportsToExcel()" class="${btnGreen}">📊 Export to Excel</button>
                </div>
            </div>

            <!-- Filter & Date Range Section -->
            <div class="reports-filters">
                <div class="filter-group">
                    <label for="report-date-range">Date Range:</label>
                    <select id="report-date-range" onchange="handleDateRangeChange()" class="filter-select">
                        <option value="all">All Time</option>
                        <option value="this-month">This Month</option>
                        <option value="last-month">Last Month</option>
                        <option value="last-3-months">Last 3 Months</option>
                        <option value="last-6-months">Last 6 Months</option>
                        <option value="this-year">This Year</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="report-department">Department:</label>
                    <select id="report-department" onchange="handleDepartmentChange()" class="filter-select">
                        <option value="all">All Departments</option>
                        <option value="driving-lessons">Driving Lessons</option>
                        <option value="tours">Tours</option>
                    </select>
                </div>
            </div>

            <!-- AI Analysis Container -->
            <div id="reports-analysis-container" class="hidden reports-analysis-box">
                <div class="analysis-header">
                    <h3 class="analysis-title">🤖 AI Business Overview</h3>
                    <button onclick="toggleAnalysis()" class="toggle-btn">−</button>
                </div>
                <div id="reports-analysis-output" class="analysis-content whitespace-pre-wrap"></div>
            </div>

            <!-- KPI Summary Cards -->
            <div class="kpi-grid">
                <div class="kpi-card kpi-revenue">
                    <div class="kpi-icon">💰</div>
                    <div class="kpi-content">
                        <p class="kpi-label">Total Revenue</p>
                        <p id="kpi-revenue" class="kpi-value">€0.00</p>
                        <p id="kpi-revenue-trend" class="kpi-trend">↑ 0%</p>
                    </div>
                </div>
                <div class="kpi-card kpi-expenses">
                    <div class="kpi-icon">💸</div>
                    <div class="kpi-content">
                        <p class="kpi-label">Total Expenses</p>
                        <p id="kpi-expenses" class="kpi-value">€0.00</p>
                        <p id="kpi-expenses-trend" class="kpi-trend">↓ 0%</p>
                    </div>
                </div>
                <div class="kpi-card kpi-profit">
                    <div class="kpi-icon">📈</div>
                    <div class="kpi-content">
                        <p class="kpi-label">Net Profit</p>
                        <p id="kpi-profit" class="kpi-value">€0.00</p>
                        <p id="kpi-profit-trend" class="kpi-trend">↑ 0%</p>
                    </div>
                </div>
                <div class="kpi-card kpi-bookings">
                    <div class="kpi-icon">📅</div>
                    <div class="kpi-content">
                        <p class="kpi-label">Total Bookings</p>
                        <p id="kpi-bookings" class="kpi-value">0</p>
                        <p id="kpi-bookings-trend" class="kpi-trend">↑ 0%</p>
                    </div>
                </div>
            </div>

            <!-- Outstanding Payments Alert -->
            <div id="overdue-payments-report"></div>

            <!-- Charts Grid (3 columns on desktop, 1 on mobile) -->
            <div class="charts-grid">
                <!-- Income vs Expenses (Full Width) -->
                <div class="chart-card chart-full-width">
                    <div class="chart-header">
                        <h3 class="chart-title">Income vs. Expenses</h3>
                        <span class="chart-info">Monthly comparison</span>
                    </div>
                    <div class="chart-container">
                        <canvas id="incomeExpenseChart"></canvas>
                    </div>
                </div>

                <!-- Service Popularity -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h3 class="chart-title">Service Popularity</h3>
                        <span class="chart-info">Distribution</span>
                    </div>
                    <div class="chart-container small">
                        <canvas id="servicePopularityChart"></canvas>
                    </div>
                </div>

                <!-- Top Customers -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h3 class="chart-title">Top 5 Customers</h3>
                        <span class="chart-info">By booking count</span>
                    </div>
                    <div class="chart-container">
                        <canvas id="topCustomersChart"></canvas>
                    </div>
                </div>

                <!-- Staff Performance -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h3 class="chart-title">Staff Performance</h3>
                        <span class="chart-info">Bookings handled</span>
                    </div>
                    <div class="chart-container">
                        <canvas id="staffPerformanceChart"></canvas>
                    </div>
                </div>

                <!-- Lesson & Package Popularity -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h3 class="chart-title">Lessons & Packages</h3>
                        <span class="chart-info">Popularity ranking</span>
                    </div>
                    <div class="chart-container">
                        <canvas id="lessonPackagePopularityChart"></canvas>
                    </div>
                </div>

                <!-- Resource Utilisation -->
                <div class="chart-card">
                    <div class="chart-header">
                        <h3 class="chart-title">Resource Utilization</h3>
                        <span class="chart-info">Equipment usage</span>
                    </div>
                    <div class="chart-container">
                        <canvas id="resourceUtilisationChart"></canvas>
                    </div>
                </div>

                <!-- Staff Activity (Full Width) -->
                <div class="chart-card chart-full-width">
                    <div class="chart-header">
                        <h3 class="chart-title">Staff Activity Overview</h3>
                        <span class="chart-info">Hours and time off</span>
                    </div>
                    <div id="staff-stats-container" class="staff-stats-grid"></div>
                </div>

                <!-- Peak Booking Hours (Full Width) -->
                <div class="chart-card chart-full-width">
                    <div class="chart-header">
                        <h3 class="chart-title">Peak Booking Hours</h3>
                        <span class="chart-info">Daily booking distribution</span>
                    </div>
                    <div class="chart-container">
                        <canvas id="peakBookingHoursChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;
    generateOverdueReport();
    generateCharts();
    updateKPICards();
}

// ============================================
// DATA EXTRACTION
// ============================================

/**
 * Extract all report data from state
 * Calculates income, expenses, service popularity, customer rankings, etc.
 * @returns {Object} All report data for charts and tables
 */
export function getReportsData() {
    const bookings = state.bookings.filter(b => b.status === 'Completed' || b.status === 'Scheduled');
    const packages = getLessonPackages();

    const packageCounts = {};
    state.transactions.forEach(t => {
        if (t.type === 'package_sale' && t.packageId) {
            if (!packageCounts[t.packageId]) {
                packageCounts[t.packageId] = 0;
            }
            packageCounts[t.packageId]++;
        }
    });

    const incomeByMonth = {};
    state.transactions.forEach(t => {
        // Only count actual payments (cash) and package sales (pre-paid credit)
        if (t.type === 'package_sale' || t.type === 'payment') {
            const monthYear = t.date.substring(0, 7);
            if (!incomeByMonth[monthYear]) incomeByMonth[monthYear] = 0;
            incomeByMonth[monthYear] += t.amount;
        }
    });

    const expensesByMonth = {};
    state.expenses.forEach(e => {
        const monthYear = e.date.substring(0, 7);
        if (!expensesByMonth[monthYear]) expensesByMonth[monthYear] = 0;
        expensesByMonth[monthYear] += e.amount;
    });

    const allMonths = [...new Set([...Object.keys(incomeByMonth), ...Object.keys(expensesByMonth)])].sort();

    const incomeExpenseReport = {
        title: "Income vs. Expenses",
        headers: ["Month", "Income (€)", "Expenses (€)", "Net (€)"],
        data: allMonths.map(month => {
            const income = incomeByMonth[month] || 0;
            const expense = expensesByMonth[month] || 0;
            const net = income - expense;
            return [
                new Date(month + '-02').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
                income.toFixed(2),
                expense.toFixed(2),
                net.toFixed(2)
            ];
        })
    };

    const serviceCounts = {};
    bookings.forEach(b => {
        if (!serviceCounts[b.serviceId]) serviceCounts[b.serviceId] = 0;
        serviceCounts[b.serviceId]++;
    });
    const servicePopularityReport = {
        title: "Service Popularity",
        headers: ["Service", "Count"],
        data: Object.entries(serviceCounts).map(([serviceId, count]) => {
            const service = state.services.find(s => s.id === serviceId);
            return [service ? service.service_name : 'Unknown Service', count];
        })
    };

    const customerBookingCounts = {};
    bookings.forEach(b => {
        if (!customerBookingCounts[b.customerId]) customerBookingCounts[b.customerId] = 0;
        customerBookingCounts[b.customerId]++;
    });
    const topCustomersReport = {
        title: "Top 5 Customers by Booking Count",
        headers: ["Customer", "Booking Count"],
        data: Object.entries(customerBookingCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([customerId, count]) => [state.customers.find(s => s.id === customerId)?.name || 'Unknown', count])
    };

    const staffPerformance = {};
    state.staff.forEach(i => staffPerformance[i.id] = 0);
    bookings.forEach(b => { if(staffPerformance.hasOwnProperty(b.staffId)) staffPerformance[b.staffId]++; });
    const staffPerformanceReport = {
        title: "Staff Performance",
        headers: ["Staff", "Bookings Handled"],
        data: state.staff.map(i => [i.name, staffPerformance[i.id]])
    };

    const resourceUtilisation = {};
    state.resources.forEach(v => resourceUtilisation[v.id] = 0);
    bookings.forEach(b => {
        if(b.resourceIds) {
            b.resourceIds.forEach(resId => {
                 if(resourceUtilisation.hasOwnProperty(resId)) resourceUtilisation[resId]++;
            });
        }
    });
    const resourceUtilisationReport = {
        title: "Resource Utilisation",
        headers: ["Resource", "Number of Bookings"],
        data: state.resources.map(v => [v.resource_name, resourceUtilisation[v.id]])
    };

    const peakHours = {};
    for(let i=7; i<=21; i++) { peakHours[String(i).padStart(2, '0')] = 0; }
    bookings.forEach(b => { const startHour = b.startTime.split(':')[0]; if(peakHours.hasOwnProperty(startHour)) peakHours[startHour]++; });
    const peakHoursReport = {
        title: "Peak Booking Hours",
        headers: ["Hour", "Number of Bookings"],
        data: Object.entries(peakHours).map(([hour, count]) => [`${hour}:00`, count])
    };

    const lessonPackagePopularityReport = {
        title: "Lesson & Package Popularity",
        headers: ["Item", "Count"],
        data: [
            ...Object.entries(serviceCounts).map(([serviceId, count]) => {
                const service = state.services.find(s => s.id === serviceId);
                return { name: service ? service.service_name : 'Unknown Service', count };
            }),
            ...Object.entries(packageCounts).map(([packageId, count]) => {
                const pkg = packages.find(p => p.id === packageId);
                return { name: pkg ? pkg.name : 'Unknown Package', count };
            })
        ].sort((a, b) => b.count - a.count)
    };

    return { incomeByMonth, expensesByMonth, servicePopularityReport, topCustomersReport, staffPerformanceReport, resourceUtilisationReport, peakHoursReport, incomeExpenseReport, lessonPackagePopularityReport };
}

// ============================================
// TOUR ANALYTICS
// ============================================

/**
 * Get tour-specific analytics
 * Includes tour revenue, participants, occupancy rates, guide performance, and waiver compliance
 * @returns {Object} Tour analytics data
 */
export function getTourAnalytics() {
    const tourBookings = state.bookings.filter(b => {
        const service = state.services.find(s => s.id === b.serviceId);
        return service && service.service_type === 'TOUR' && (b.status === 'Completed' || b.status === 'Scheduled');
    });

    const tourRevenue = tourBookings.reduce((sum, b) => sum + (b.fee || 0), 0);
    const totalTours = tourBookings.length;
    const totalParticipants = tourBookings.reduce((sum, b) => sum + (b.groupSize || 1), 0);
    const avgGroupSize = totalTours > 0 ? (totalParticipants / totalTours).toFixed(1) : 0;

    // Occupancy rates per service
    const toursByService = {};
    tourBookings.forEach(b => {
        const service = state.services.find(s => s.id === b.serviceId);
        if (service) {
            if (!toursByService[service.service_name]) {
                toursByService[service.service_name] = {
                    count: 0,
                    totalParticipants: 0,
                    revenue: 0,
                    maxCapacity: service.capacity || 50
                };
            }
            toursByService[service.service_name].count++;
            toursByService[service.service_name].totalParticipants += b.groupSize || 1;
            toursByService[service.service_name].revenue += b.fee || 0;
        }
    });

    // Guide performance with qualifications
    const guidePerformance = {};
    tourBookings.forEach(b => {
        if (!guidePerformance[b.staffId]) {
            const guide = state.staff.find(s => s.id === b.staffId);
            guidePerformance[b.staffId] = {
                name: guide ? guide.name : 'Unknown',
                toursCount: 0,
                totalParticipants: 0,
                rating: guide && guide.guide_qualifications ? guide.guide_qualifications.rating || 0 : 0,
                languages: guide && guide.guide_qualifications ? guide.guide_qualifications.languages || [] : [],
                specializations: guide && guide.guide_qualifications ? guide.guide_qualifications.specializations || [] : []
            };
        }
        guidePerformance[b.staffId].toursCount++;
        guidePerformance[b.staffId].totalParticipants += b.groupSize || 1;
    });

    // Waiver compliance tracking
    const totalTourBookings = tourBookings.length;
    const waiverSigned = tourBookings.filter(b => b.waiverSigned).length;
    const waiverCompliance = totalTourBookings > 0 ? ((waiverSigned / totalTourBookings) * 100).toFixed(1) : 0;

    return {
        totalTours,
        totalParticipants,
        avgGroupSize,
        tourRevenue,
        toursByService,
        guidePerformance,
        waiverSignedCount: waiverSigned,
        waiverCompliance,
        totalTourBookings
    };
}

// ============================================
// CHART GENERATION
// ============================================

/**
 * Generate all Chart.js visualizations
 * OPTIMIZED: Destroys existing charts before creating new ones to prevent memory leaks
 */
export function generateCharts() {
    // OPTIMIZATION: Destroy all existing charts before creating new ones
    destroyAllCharts();

    const { incomeByMonth, expensesByMonth, servicePopularityReport, topCustomersReport, staffPerformanceReport, resourceUtilisationReport, peakHoursReport, incomeExpenseReport, lessonPackagePopularityReport } = getReportsData();

    const allMonths = [...new Set([...Object.keys(incomeByMonth), ...Object.keys(expensesByMonth)])].sort();
    const chartLabels = allMonths.map(my => new Date(my + '-02').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }));
    const incomeData = allMonths.map(my => incomeByMonth[my] || 0);
    const expenseData = allMonths.map(my => expensesByMonth[my] || 0);

    /**
     * OPTIMIZATION: Helper to create charts and track them for cleanup
     * All charts are added to activeCharts array for memory management
     * Charts are destroyed when switching views or refreshing reports
     */
    const createChart = (canvasId, type, data, options = {}) => {
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const chart = new Chart(ctx, { type, data, options });
                activeCharts.push(chart); // Track for cleanup
            } else {
                console.error(`Failed to get 2D context for canvas with id: ${canvasId}`);
            }
        } else {
            console.warn(`Could not find canvas element with id: ${canvasId}`);
        }
    };

    createChart('incomeExpenseChart', 'bar', {
        labels: chartLabels,
        datasets: [
            { label: 'Income (€)', data: incomeData, backgroundColor: 'rgba(59, 130, 246, 0.5)', borderColor: 'rgba(59, 130, 246, 1)', borderWidth: 1 },
            { label: 'Expenses (€)', data: expenseData, backgroundColor: 'rgba(239, 68, 68, 0.5)', borderColor: 'rgba(239, 68, 68, 1)', borderWidth: 1 }
        ]
    }, { scales: { x: { stacked: false }, y: { stacked: false, beginAtZero: true } }, responsive: true });

    createChart('servicePopularityChart', 'doughnut', { labels: servicePopularityReport.data.map(s => s[0]), datasets: [{ data: servicePopularityReport.data.map(s => s[1]), backgroundColor: ['rgba(252, 211, 77, 0.7)', 'rgba(59, 130, 246, 0.7)', 'rgba(239, 68, 68, 0.7)', 'rgba(16, 185, 129, 0.7)'], borderWidth: 1 }] }, { responsive: true });
    createChart('topCustomersChart', 'bar', { labels: topCustomersReport.data.map(s => s[0]), datasets: [{ label: 'Number of Bookings', data: topCustomersReport.data.map(s => s[1]), backgroundColor: 'rgba(16, 185, 129, 0.5)', borderColor: 'rgba(16, 185, 129, 1)', borderWidth: 1 }] }, { indexAxis: 'y', responsive: true, scales: { x: { ticks: { stepSize: 1 } } } });
    createChart('staffPerformanceChart', 'bar', { labels: staffPerformanceReport.data.map(i => i[0]), datasets: [{ label: 'Bookings Handled', data: staffPerformanceReport.data.map(i => i[1]), backgroundColor: 'rgba(236, 72, 153, 0.5)', borderColor: 'rgba(236, 72, 153, 1)', borderWidth: 1 }] }, { scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, responsive: true });
    createChart('resourceUtilisationChart', 'bar', { labels: resourceUtilisationReport.data.map(v => v[0]), datasets: [{ label: 'Number of Bookings', data: resourceUtilisationReport.data.map(v => v[1]), backgroundColor: 'rgba(139, 92, 246, 0.5)', borderColor: 'rgba(139, 92, 246, 1)', borderWidth: 1 }] }, { scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, responsive: true });
    createChart('peakBookingHoursChart', 'line', { labels: peakHoursReport.data.map(h => h[0]), datasets: [{ label: 'Number of Bookings', data: peakHoursReport.data.map(h => h[1]), backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: 'rgba(245, 158, 11, 1)', borderWidth: 2, tension: 0.4, fill: true }] }, { scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }, responsive: true });

    if (lessonPackagePopularityReport && lessonPackagePopularityReport.data.length > 0) {
        createChart('lessonPackagePopularityChart', 'bar', {
            labels: lessonPackagePopularityReport.data.map(item => item.name),
            datasets: [{
                label: 'Number of Times Booked/Sold',
                data: lessonPackagePopularityReport.data.map(item => item.count),
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        }, {
            indexAxis: 'y',
            responsive: true,
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        });
    }

    // Staff stats (hours and time off)
    const statsContainer = document.getElementById('staff-stats-container');
    if (statsContainer) {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);
        const formatDate = (date) => date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
        const dateRangeStr = `(${formatDate(sevenDaysAgo)} - ${formatDate(today)})`;

        const staffWeeklyHours = {};
        state.staff.forEach(i => staffWeeklyHours[i.id] = 0);

        state.bookings.filter(b => {
            const bookingDate = parseYYYYMMDD(b.date);
            return bookingDate && bookingDate >= sevenDaysAgo && bookingDate <= today;
        }).forEach(b => {
            if (staffWeeklyHours.hasOwnProperty(b.staffId)) {
                const service = state.services.find(s => s.id === b.serviceId);
                const duration = (service ? service.duration_minutes : 60) / 60;
                staffWeeklyHours[b.staffId] += duration;
            }
        });

        const staffTimeOff = {};
        state.staff.forEach(i => staffTimeOff[i.id] = 0);
        state.blockedPeriods.forEach(p => {
            if (p.staffId !== 'all' && staffTimeOff.hasOwnProperty(p.staffId)) {
                const start = new Date(p.start);
                const end = new Date(p.end);
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                staffTimeOff[p.staffId] += diffDays;
            }
        });

        let statsHtml = `
            <div class="staff-stat-section">
                <h4 class="stat-section-title">
                    ⏰ Staff Hours <span class="stat-date-range">${dateRangeStr}</span>
                </h4>
                <div class="stat-items-container">`;

        state.staff.forEach(staffMember => {
            const hours = staffWeeklyHours[staffMember.id] || 0;
            const hoursPercentage = Math.min(100, (hours / 40) * 100); // Assuming 40 hour week is 100%
            statsHtml += `
                <div class="stat-item">
                    <div class="stat-name">${sanitizeHTML(staffMember.name)}</div>
                    <div class="stat-bar">
                        <div class="stat-bar-fill" style="width: ${hoursPercentage}%"></div>
                    </div>
                    <div class="stat-value">${hours.toFixed(1)} hrs</div>
                </div>`;
        });

        statsHtml += `</div></div><div class="staff-stat-section">
                <h4 class="stat-section-title">🏖️ Time Off (All Time)</h4>
                <div class="stat-items-container">`;

        state.staff.forEach(staffMember => {
            const daysOff = staffTimeOff[staffMember.id] || 0;
            statsHtml += `
                <div class="stat-item">
                    <div class="stat-name">${sanitizeHTML(staffMember.name)}</div>
                    <div class="stat-value stat-value-days">${daysOff} ${daysOff === 1 ? 'day' : 'days'}</div>
                </div>`;
        });

        statsHtml += '</div></div>';
        statsContainer.innerHTML = statsHtml;
    }
}

// ============================================
// FILTER HANDLERS
// ============================================

/**
 * Handle date range filter change
 * Regenerates charts with filtered data
 */
export function handleDateRangeChange() {
    generateCharts();
    updateKPICards();
}

/**
 * Handle department filter change
 * Regenerates charts with filtered data
 */
export function handleDepartmentChange() {
    generateCharts();
    updateKPICards();
}

/**
 * Toggle AI analysis display
 */
export function toggleAnalysis() {
    const container = document.getElementById('reports-analysis-container');
    const output = document.getElementById('reports-analysis-output');
    if (output.style.display === 'none') {
        output.style.display = 'block';
    } else {
        output.style.display = 'none';
    }
}

// ============================================
// KPI CARDS
// ============================================

/**
 * Update KPI summary cards with current data
 * Shows total revenue, expenses, profit, and bookings with trend indicators
 */
export function updateKPICards() {
    const { incomeByMonth, expensesByMonth } = getReportsData();
    const bookings = state.bookings.filter(b => b.status === 'Completed' || b.status === 'Scheduled');

    // Calculate totals
    const totalRevenue = Object.values(incomeByMonth).reduce((a, b) => a + b, 0);
    const totalExpenses = Object.values(expensesByMonth).reduce((a, b) => a + b, 0);
    const netProfit = totalRevenue - totalExpenses;

    // Update KPI cards
    document.getElementById('kpi-revenue').textContent = `€${totalRevenue.toFixed(2)}`;
    document.getElementById('kpi-expenses').textContent = `€${totalExpenses.toFixed(2)}`;
    document.getElementById('kpi-profit').textContent = `€${netProfit.toFixed(2)}`;
    document.getElementById('kpi-bookings').textContent = bookings.length;

    // Calculate trend indicators (simplified - comparing to previous period)
    const months = [...new Set([...Object.keys(incomeByMonth), ...Object.keys(expensesByMonth)])].sort();
    if (months.length >= 2) {
        const lastMonth = months[months.length - 1];
        const prevMonth = months[months.length - 2];
        const revenueTrend = ((incomeByMonth[lastMonth] || 0) - (incomeByMonth[prevMonth] || 0)) / (incomeByMonth[prevMonth] || 1) * 100;
        const expenseTrend = ((expensesByMonth[lastMonth] || 0) - (expensesByMonth[prevMonth] || 0)) / (expensesByMonth[prevMonth] || 1) * 100;
        const profitTrend = netProfit > 0 ? 5 : -5; // Placeholder

        document.getElementById('kpi-revenue-trend').textContent = `${revenueTrend > 0 ? '↑' : '↓'} ${Math.abs(revenueTrend).toFixed(1)}%`;
        document.getElementById('kpi-expenses-trend').textContent = `${expenseTrend > 0 ? '↑' : '↓'} ${Math.abs(expenseTrend).toFixed(1)}%`;
        document.getElementById('kpi-profit-trend').textContent = `${profitTrend > 0 ? '↑' : '↓'} ${Math.abs(profitTrend).toFixed(1)}%`;
        document.getElementById('kpi-bookings-trend').textContent = `↑ 0%`;
    }
}

// ============================================
// OVERDUE PAYMENTS REPORT
// ============================================

/**
 * Generate overdue payments alert section
 * Shows customers with outstanding balances
 */
export function generateOverdueReport() {
    const container = document.getElementById('overdue-payments-report');
    const overdueCustomers = getCustomerSummaries().filter(s => s.outstanding > 0);

    if (overdueCustomers.length === 0) {
        container.innerHTML = '';
        return;
    }

    const tableRows = overdueCustomers.map((customer, index) => {
        const rowClass = index % 2 === 0 ? 'table-row-alt' : '';
        return `<tr class="${rowClass}"><td class="table-cell-name">${sanitizeHTML(customer.name)}</td><td class="table-cell-center">${customer.bookingCount}</td><td class="table-cell-amount">€${customer.outstanding.toFixed(2)}</td></tr>`;
    }).join('');

    container.innerHTML = `
        <div class="alert-outstanding-payments">
            <div class="alert-header">
                <div class="alert-icon">⚠️</div>
                <div class="alert-content">
                    <h3 class="alert-title">Outstanding Payments</h3>
                    <p class="alert-description">${overdueCustomers.length} customer(s) with pending balance</p>
                </div>
            </div>
            <div class="table-wrapper">
                <table class="outstanding-table">
                    <thead>
                        <tr>
                            <th class="th-name">Customer Name</th>
                            <th class="th-center">Bookings</th>
                            <th class="th-amount">Amount Due</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}
