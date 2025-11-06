/**
 * Customers Module for Ray Ryan Management System
 * Handles all customer-related operations including CRUD, progress tracking,
 * driving school details, and package sales
 */

// ============================================
// IMPORTS
// ============================================

import {
    state,
    getCollection,
    addToCollection,
    updateInCollection,
    removeFromCollection,
    findById
} from '../core/state.js';

import {
    saveState,
    debouncedSaveState
} from '../core/storage.js';

import {
    generateUUID,
    safeDateFormat,
    toLocalDateString,
    showToast,
    showDialog,
    sanitizeHTML
} from '../core/utils.js';

import {
    clearSearchCache,
    btnPrimary,
    btnSecondary,
    btnDanger
} from '../core/optimization.js';

import {
    DB_KEYS,
    skillLevels
} from '../core/constants.js';

// ============================================
// CUSTOMER LIST VIEW
// ============================================

/**
 * Render customers list view
 * Uses generic list view renderer with customer-specific columns
 */
export function renderCustomersView() {
    const columns = [
        { header: 'Name', render: item => item.name },
        { header: 'Email', render: item => item.email || '-', class: 'hidden sm:table-cell' },
        { header: 'Phone', render: item => item.phone || '-', class: 'hidden md:table-cell' }
    ];

    // Call generic list view renderer
    if (typeof window.renderGenericListView === 'function') {
        window.renderGenericListView('customers', 'Customers', columns, state.customers, 'Customer');
    }
}

/**
 * View customer details from search results
 * Navigates to customers view and opens customer modal
 * @param {string} customerId - Customer ID to view
 */
export function viewCustomerFromSearch(customerId) {
    // Hide search results
    document.getElementById('search-results')?.classList.add('hidden');
    const searchInput = document.getElementById('global-search');
    if (searchInput) searchInput.value = '';

    // Navigate to customers view and open customer modal
    if (typeof window.showView === 'function') {
        window.showView('customers');
    }
    setTimeout(() => openCustomerModal(customerId), 300);
}

// ============================================
// CUSTOMER CRUD OPERATIONS
// ============================================

/**
 * Save customer (create new or edit existing)
 * Includes validation for name, email, phone, and lesson credits
 * @param {Event} event - Form submit event
 */
export function saveCustomer(event) {
    event.preventDefault();

    const customerId = document.getElementById('customer-id')?.value;
    const customerName = document.getElementById('customer-name')?.value.trim();
    const email = document.getElementById('customer-email')?.value.trim();
    const phone = document.getElementById('customer-phone')?.value.trim();
    const lessonCredits = parseFloat(document.getElementById('customer-credits')?.value || '0');

    // SECURITY: Validate inputs using security module
    if (typeof validateInput === 'function') {
        // Validate name
        const nameValidation = validateInput(customerName, 'name');
        if (!nameValidation.valid) {
            showDialog({
                title: 'Invalid Name',
                message: nameValidation.message,
                buttons: [{ text: 'OK', class: btnPrimary }]
            });
            return;
        }

        // Validate email if provided
        if (email) {
            const emailValidation = validateInput(email, 'email');
            if (!emailValidation.valid) {
                showDialog({
                    title: 'Invalid Email',
                    message: emailValidation.message,
                    buttons: [{ text: 'OK', class: btnPrimary }]
                });
                return;
            }
        }

        // Validate phone if provided
        if (phone) {
            const phoneValidation = validateInput(phone, 'phone');
            if (!phoneValidation.valid) {
                showDialog({
                    title: 'Invalid Phone',
                    message: phoneValidation.message,
                    buttons: [{ text: 'OK', class: btnPrimary }]
                });
                return;
            }
        }
    } else if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        // Fallback validation if security module not loaded
        showDialog({
            title: 'Invalid Email',
            message: 'Please enter a valid email address.',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }

    if (isNaN(lessonCredits) || lessonCredits < 0) {
        showDialog({
            title: 'Invalid Input',
            message: 'Lesson credits must be a non-negative number.',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }

    // Check for duplicate email
    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail) {
        const isDuplicate = state.customers.some(
            c => c.email && c.email.toLowerCase() === trimmedEmail && c.id !== customerId
        );

        if (isDuplicate) {
            showDialog({
                title: 'Duplicate Email',
                message: 'A customer with this email address already exists. Please use a different email.',
                buttons: [{ text: 'OK', class: btnPrimary }]
            });
            return;
        }
    }

    const isNewCustomer = !customerId;

    const customerData = {
        id: customerId || `customer_${generateUUID()}`,
        name: customerName,
        email: email,
        phone: document.getElementById('customer-phone')?.value || '',
        driving_school_details: {
            license_number: document.getElementById('customer-license')?.value || '',
            progress_notes: customerId ? (state.customers.find(c => c.id === customerId)?.driving_school_details?.progress_notes || []) : [],
            lesson_credits: lessonCredits
        }
    };

    if (isNewCustomer) {
        customerData.creation_date = new Date().toISOString();
    }

    if (customerId) {
        const index = state.customers.findIndex(c => c.id === customerId);
        if (index !== -1) {
            state.customers[index] = { ...state.customers[index], ...customerData };
        }
    } else {
        state.customers.push(customerData);
    }

    // OPTIMIZATION: Clear search cache when customer data changes
    clearSearchCache();

    debouncedSaveState();
    closeCustomerModal();
    renderCustomersView();
}

/**
 * Delete customer with confirmation
 * Also deletes associated bookings and transactions
 * @param {string} customerId - Customer ID to delete
 */
export function deleteCustomer(customerId) {
    showDialog({
        title: 'Delete Customer',
        message: 'Are you sure? This will delete all associated bookings and records.',
        buttons: [
            { text: 'Cancel', class: btnSecondary },
            {
                text: 'Delete',
                class: btnDanger,
                onClick: () => {
                    state.customers = state.customers.filter(c => c.id !== customerId);
                    state.bookings = state.bookings.filter(b => b.customerId !== customerId);
                    state.transactions = state.transactions.filter(t => t.customerId !== customerId);

                    // OPTIMIZATION: Clear search cache when customer deleted
                    clearSearchCache();

                    debouncedSaveState();

                    if (typeof window.refreshCurrentView === 'function') {
                        window.refreshCurrentView();
                    }
                }
            }
        ]
    });
}

// ============================================
// PROGRESS TRACKING (DRIVING SCHOOL)
// ============================================

/**
 * Save progress note for a customer
 * Tracks skills covered in a lesson
 * @param {string} customerId - Customer ID
 * @returns {boolean} Success status
 */
export function saveProgressNote(customerId) {
    const customer = state.customers.find(c => c.id === customerId);
    if (!customer) return false;

    const noteId = document.getElementById('progress-note-id')?.value;
    const notes = document.getElementById('progress-notes')?.value || '';
    const date = document.getElementById('progress-lesson-date-select')?.value ||
                 document.getElementById('progress-lesson-date-hidden')?.value;
    const skillsCovered = Array.from(document.querySelectorAll('input[name="progress-skill"]:checked')).map(el => ({
        skill: el.value,
        category: el.dataset.category
    }));

    if (!date) {
        showDialog({
            title: 'Error',
            message: 'Cannot save note without a valid lesson date.',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return false;
    }

    const noteData = {
        id: noteId || `note_${generateUUID()}`,
        date: date,
        notes: notes,
        skillsCovered: skillsCovered
    };

    if (!customer.driving_school_details) customer.driving_school_details = {};
    if (!customer.driving_school_details.progress_notes) customer.driving_school_details.progress_notes = [];

    if (noteId) {
        const index = customer.driving_school_details.progress_notes.findIndex(n => n.id === noteId);
        if (index !== -1) customer.driving_school_details.progress_notes[index] = noteData;
    } else {
        customer.driving_school_details.progress_notes.push(noteData);
    }

    debouncedSaveState();
    return true;
}

/**
 * Calculate student progress based on skills covered
 * Categorizes skills as mastered (2+ times), in progress (1 time), or not started
 * @param {string} customerId - Customer ID
 * @returns {Object} Progress data with skill categories and statistics
 */
export function calculateStudentProgress(customerId) {
    const customer = state.customers.find(c => c.id === customerId);
    if (!customer || !customer.driving_school_details || !customer.driving_school_details.progress_notes) {
        return {
            masteredSkills: [],
            inProgressSkills: [],
            notStartedSkills: [],
            progressPercentage: 0,
            totalSkills: 0,
            estimatedWeeksToReady: null
        };
    }

    const progressNotes = customer.driving_school_details.progress_notes;
    const allSkills = [];
    const coveredSkills = new Map(); // skill -> count

    // Collect all skills and count how many times each was covered
    for (const level in skillLevels) {
        skillLevels[level].skills.forEach(skill => {
            allSkills.push({ skill, category: level });
            coveredSkills.set(skill, 0);
        });
    }

    // Count skill coverage
    progressNotes.forEach(note => {
        if (note.skillsCovered) {
            note.skillsCovered.forEach(s => {
                const count = coveredSkills.get(s.skill) || 0;
                coveredSkills.set(s.skill, count + 1);
            });
        }
    });

    // Categorize skills
    const masteredSkills = []; // covered 2+ times
    const inProgressSkills = []; // covered 1 time
    const notStartedSkills = []; // never covered

    allSkills.forEach(({ skill, category }) => {
        const count = coveredSkills.get(skill) || 0;
        const skillData = { skill, category, count };

        if (count >= 2) {
            masteredSkills.push(skillData);
        } else if (count === 1) {
            inProgressSkills.push(skillData);
        } else {
            notStartedSkills.push(skillData);
        }
    });

    const totalSkills = allSkills.length;
    const progressPercentage = totalSkills > 0 ? Math.round((masteredSkills.length / totalSkills) * 100) : 0;

    // Calculate estimated weeks to ready (rough estimate)
    const completedLessons = progressNotes.length;
    const skillsPerLesson = completedLessons > 0 ? masteredSkills.length / completedLessons : 0;
    const remainingSkills = totalSkills - masteredSkills.length;
    const estimatedLessonsNeeded = skillsPerLesson > 0 ? Math.ceil(remainingSkills / skillsPerLesson) : null;
    const estimatedWeeksToReady = estimatedLessonsNeeded ? Math.ceil(estimatedLessonsNeeded / 2) : null; // Assume 2 lessons/week

    return {
        masteredSkills,
        inProgressSkills,
        notStartedSkills,
        progressPercentage,
        totalSkills,
        completedLessons,
        estimatedWeeksToReady
    };
}

/**
 * Render student progress dashboard
 * Shows visual progress bar, skill categories, and estimated completion time
 * @param {string} customerId - Customer ID
 */
export function renderStudentProgressDashboard(customerId) {
    const container = document.getElementById('progress-dashboard-container');
    if (!container) return;

    const progress = calculateStudentProgress(customerId);

    if (progress.completedLessons === 0) {
        container.innerHTML = `
            <div class="p-6 bg-blue-50 border-l-4 border-blue-500 rounded text-center">
                <h3 class="text-lg font-semibold text-blue-900 mb-2">📘 Start Tracking Progress</h3>
                <p class="text-blue-700">Add lesson notes below to start tracking this student's progress and see their dashboard here.</p>
            </div>
        `;
        return;
    }

    const progressColor = progress.progressPercentage >= 80 ? 'green' : progress.progressPercentage >= 50 ? 'blue' : 'orange';

    container.innerHTML = `
        <!-- Overall Progress -->
        <div class="bg-gradient-to-r from-${progressColor}-50 to-${progressColor}-100 rounded-lg p-6 mb-6">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h3 class="text-2xl font-bold text-${progressColor}-900">${progress.progressPercentage}% Complete</h3>
                    <p class="text-${progressColor}-700 mt-1">${progress.masteredSkills.length} of ${progress.totalSkills} skills mastered</p>
                </div>
                <div class="text-5xl">${progress.progressPercentage >= 80 ? '🎉' : progress.progressPercentage >= 50 ? '📚' : '🚀'}</div>
            </div>
            <div class="w-full bg-white rounded-full h-4 mb-2">
                <div class="bg-${progressColor}-600 h-4 rounded-full transition-all duration-500" style="width: ${progress.progressPercentage}%"></div>
            </div>
            <div class="grid grid-cols-3 gap-4 mt-4 text-center">
                <div>
                    <div class="text-2xl font-bold text-green-700">${progress.masteredSkills.length}</div>
                    <div class="text-xs text-gray-600">Mastered ✅</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-yellow-700">${progress.inProgressSkills.length}</div>
                    <div class="text-xs text-gray-600">In Progress 🟡</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-gray-500">${progress.notStartedSkills.length}</div>
                    <div class="text-xs text-gray-600">Not Started ⭕</div>
                </div>
            </div>
            ${progress.estimatedWeeksToReady ? `
                <div class="mt-4 p-3 bg-white/50 rounded text-center">
                    <span class="text-sm font-medium text-${progressColor}-900">
                        📅 Estimated test-ready: ${progress.estimatedWeeksToReady} weeks
                    </span>
                </div>
            ` : ''}
        </div>

        <!-- Skills by Category -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            ${Object.keys(skillLevels).map(level => {
                const categorySkills = [
                    ...progress.masteredSkills.filter(s => s.category === level),
                    ...progress.inProgressSkills.filter(s => s.category === level),
                    ...progress.notStartedSkills.filter(s => s.category === level)
                ];
                const masteredCount = progress.masteredSkills.filter(s => s.category === level).length;
                const totalInCategory = categorySkills.length;
                const categoryProgress = totalInCategory > 0 ? Math.round((masteredCount / totalInCategory) * 100) : 0;

                return `
                    <div class="bg-white rounded-lg border p-4">
                        <h4 class="font-semibold text-gray-900 mb-2">${skillLevels[level].title}</h4>
                        <div class="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div class="bg-blue-600 h-2 rounded-full" style="width: ${categoryProgress}%"></div>
                        </div>
                        <div class="text-xs text-gray-600 mb-2">${masteredCount}/${totalInCategory} skills mastered</div>
                        <div class="space-y-1 max-h-32 overflow-y-auto">
                            ${categorySkills.slice(0, 5).map(s => {
                                const icon = s.count >= 2 ? '✅' : s.count === 1 ? '🟡' : '⭕';
                                const textColor = s.count >= 2 ? 'text-green-700' : s.count === 1 ? 'text-yellow-700' : 'text-gray-400';
                                return `<div class="text-xs ${textColor}">${icon} ${sanitizeHTML(s.skill)}</div>`;
                            }).join('')}
                            ${categorySkills.length > 5 ? `<div class="text-xs text-gray-400">+${categorySkills.length - 5} more...</div>` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>

        <!-- Next Skills to Learn -->
        ${progress.notStartedSkills.length > 0 ? `
            <div class="bg-yellow-50 border-l-4 border-yellow-400 rounded p-4">
                <h4 class="font-semibold text-yellow-900 mb-2">📋 Next Skills to Focus On:</h4>
                <ul class="text-sm text-yellow-800 space-y-1">
                    ${progress.notStartedSkills.slice(0, 5).map(s =>
                        `<li>• ${sanitizeHTML(s.skill)} <span class="text-xs text-yellow-600">(${skillLevels[s.category].title})</span></li>`
                    ).join('')}
                </ul>
            </div>
        ` : `
            <div class="bg-green-50 border-l-4 border-green-400 rounded p-4 text-center">
                <h4 class="font-semibold text-green-900 mb-2">🎉 All Skills Covered!</h4>
                <p class="text-sm text-green-700">This student has been introduced to all skills. Continue practicing for mastery!</p>
            </div>
        `}
    `;
}

/**
 * Render progress log (list of all progress notes)
 * @param {string} customerId - Customer ID
 */
export function renderProgressLog(customerId) {
    const customer = state.customers.find(c => c.id === customerId);
    const container = document.getElementById('progress-log-list');
    if (!container) return;

    // FEATURE: Phase 2 - Render Progress Dashboard
    renderStudentProgressDashboard(customerId);

    if (!customer || !customer.driving_school_details || !customer.driving_school_details.progress_notes || customer.driving_school_details.progress_notes.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500">No progress notes have been logged for this customer yet.</p>';
        return;
    }

    const sortedNotes = customer.driving_school_details.progress_notes.sort((a, b) => new Date(b.date) - new Date(a.date));

    container.innerHTML = sortedNotes.map(note => {
        const lessonDate = safeDateFormat(note.date, { year: 'numeric', month: 'long', day: 'numeric' });
        const skillsHtml = note.skillsCovered && note.skillsCovered.length > 0
            ? `<ul class="list-disc list-inside mt-2 text-sm text-gray-600">${note.skillsCovered.map(s => `<li>${sanitizeHTML(s.skill)}</li>`).join('')}</ul>`
            : '<p class="text-sm text-gray-500 mt-2">No specific skills were tagged for this lesson.</p>';

        return `
            <div class="p-4 bg-gray-50 rounded-lg border">
                <div class="flex justify-between items-center">
                    <h5 class="font-semibold text-gray-800">${lessonDate}</h5>
                    <div>
                        <button onclick="editProgressNote('${customerId}', '${note.id}')" class="font-medium text-sm text-indigo-600 hover:text-indigo-800">Edit</button>
                        <button onclick="deleteProgressNote('${customerId}', '${note.id}')" class="ml-2 font-medium text-sm text-red-600 hover:text-red-800">Delete</button>
                    </div>
                </div>
                <p class="mt-2 text-gray-700 whitespace-pre-wrap">${sanitizeHTML(note.notes)}</p>
                <div class="mt-3">
                    <h6 class="font-semibold text-sm">Skills Covered:</h6>
                    ${skillsHtml}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Edit progress note
 * Populates form with existing note data
 * @param {string} customerId - Customer ID
 * @param {string} noteId - Note ID
 */
export function editProgressNote(customerId, noteId) {
    const customer = state.customers.find(c => c.id === customerId);
    if (!customer) return;

    const note = customer.driving_school_details?.progress_notes?.find(n => n.id === noteId);
    if (!note) return;

    document.getElementById('progress-form-title').textContent = 'Edit Lesson Note';
    document.getElementById('progress-note-id').value = note.id;
    document.getElementById('progress-notes').value = note.notes;

    const dateSelect = document.getElementById('progress-lesson-date-select');
    if (dateSelect) {
        dateSelect.value = note.date;
    } else {
        const hiddenDate = document.getElementById('progress-lesson-date-hidden');
        if (hiddenDate) hiddenDate.value = note.date;
    }

    document.querySelectorAll('input[name="progress-skill"]').forEach(checkbox => {
        checkbox.checked = note.skillsCovered.some(s => s.skill === checkbox.value);
    });

    document.getElementById('progress-log-form')?.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Delete progress note with confirmation
 * @param {string} customerId - Customer ID
 * @param {string} noteId - Note ID to delete
 */
export function deleteProgressNote(customerId, noteId) {
    showDialog({
        title: 'Delete Progress Note',
        message: 'Are you sure you want to delete this progress note?',
        buttons: [
            { text: 'Cancel', class: btnSecondary },
            {
                text: 'Delete',
                class: btnDanger,
                onClick: () => {
                    const customerIndex = state.customers.findIndex(c => c.id === customerId);
                    if (customerIndex === -1) return;

                    const notes = state.customers[customerIndex].driving_school_details.progress_notes;
                    state.customers[customerIndex].driving_school_details.progress_notes = notes.filter(n => n.id !== noteId);

                    debouncedSaveState();
                    renderProgressLog(customerId);
                    showToast('Progress note deleted.');
                }
            }
        ]
    });
}

// ============================================
// MODAL MANAGEMENT
// ============================================

/**
 * Open customer modal for create/edit
 * @param {string|null} customerId - Customer ID to edit, or null for new customer
 */
export function openCustomerModal(customerId = null) {
    const modal = document.getElementById('customer-modal');
    if (!modal) return;

    const form = modal.querySelector('form');
    if (form) form.reset();

    if (customerId) {
        const titleEl = document.getElementById('customer-modal-title');
        if (titleEl) titleEl.textContent = 'Edit Customer';

        const customer = state.customers.find(c => c.id === customerId);
        if (customer) {
            const idField = document.getElementById('customer-id');
            const nameField = document.getElementById('customer-name');
            const emailField = document.getElementById('customer-email');
            const phoneField = document.getElementById('customer-phone');
            const licenseField = document.getElementById('customer-license');
            const creditsField = document.getElementById('customer-credits');

            if (idField) idField.value = customer.id;
            if (nameField) nameField.value = customer.name;
            if (emailField) emailField.value = customer.email || '';
            if (phoneField) phoneField.value = customer.phone || '';

            const details = customer.driving_school_details || {};
            if (licenseField) licenseField.value = details.license_number || '';
            if (creditsField) creditsField.value = details.lesson_credits || '';
        }
    } else {
        const titleEl = document.getElementById('customer-modal-title');
        if (titleEl) titleEl.textContent = 'New Customer';

        const idField = document.getElementById('customer-id');
        if (idField) idField.value = '';
    }

    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal')?.classList.remove('scale-95', 'opacity-0'), 10);
}

/**
 * Close customer modal
 */
export function closeCustomerModal() {
    const modal = document.getElementById('customer-modal');
    if (!modal) return;

    const modalContent = modal.querySelector('.modal');
    if (modalContent) {
        modalContent.classList.add('scale-95', 'opacity-0');
    }
    setTimeout(() => modal.classList.add('hidden'), 300);
}

/**
 * Open customer progress tracking modal
 * Shows progress dashboard and lesson note form
 * @param {string} customerId - Customer ID
 */
export function openCustomerProgressModal(customerId) {
    const modal = document.getElementById('customer-progress-modal');
    if (!modal) return;

    const customer = state.customers.find(c => c.id === customerId);
    if (!customer) return;

    const titleEl = document.getElementById('customer-progress-modal-title');
    if (titleEl) titleEl.textContent = `Progress Log for ${customer.name}`;

    const summaryContainer = document.getElementById('progress-summary-container');
    if (summaryContainer) summaryContainer.classList.add('hidden');

    const summaryOutput = document.getElementById('summary-output');
    if (summaryOutput) summaryOutput.innerHTML = '';

    const summarizeBtn = document.getElementById('summarize-progress-btn');
    if (summarizeBtn) {
        summarizeBtn.onclick = () => {
            if (typeof window.handleSummarizeCustomerProgress === 'function') {
                window.handleSummarizeCustomerProgress(customerId);
            }
        };
        summarizeBtn.disabled = false;
    }

    resetProgressForm(customerId);

    // Populate skills checklist
    const skillsContainer = document.getElementById('progress-skills-container');
    if (skillsContainer) {
        let checklistHtml = '';
        for (const level in skillLevels) {
            checklistHtml += `<h3 class="skill-category-header">${skillLevels[level].title}</h3>`;
            checklistHtml += '<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">';
            skillLevels[level].skills.forEach(skill => {
                checklistHtml += `
                    <label class="flex items-center space-x-2">
                        <input type="checkbox" name="progress-skill" value="${sanitizeHTML(skill)}" data-category="${level}" class="rounded text-indigo-600 focus:ring-indigo-500">
                        <span class="text-sm">${sanitizeHTML(skill)}</span>
                    </label>
                `;
            });
            checklistHtml += '</div>';
        }
        skillsContainer.innerHTML = checklistHtml;
    }

    renderProgressLog(customerId);

    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal')?.classList.remove('scale-95', 'opacity-0'), 10);
}

/**
 * Close customer progress modal
 */
export function closeCustomerProgressModal() {
    const modal = document.getElementById('customer-progress-modal');
    if (!modal) return;

    const modalContent = modal.querySelector('.modal');
    if (modalContent) {
        modalContent.classList.add('scale-95', 'opacity-0');
    }
    setTimeout(() => modal.classList.add('hidden'), 300);
}

/**
 * Populate progress date select dropdown with customer's bookings
 * @param {string} customerId - Customer ID
 */
export function populateProgressDateSelect(customerId) {
    const dateContainer = document.getElementById('progress-date-container');
    if (!dateContainer) return;

    const formElements = [
        document.getElementById('progress-notes'),
        document.getElementById('progress-form-buttons')
    ];
    const saveNoteBtn = document.getElementById('save-note-btn');

    const relevantBookings = state.bookings
        .filter(b => b.customerId === customerId && b.status !== 'Cancelled')
        .sort((a, b) => b.date.localeCompare(a.date));

    if (relevantBookings.length > 0) {
        const options = relevantBookings.map(b => {
            const displayDate = safeDateFormat(b.date, { weekday: 'short', day: 'numeric', month: 'short' });
            return `<option value="${b.date}">${displayDate} (${b.startTime})</option>`;
        }).join('');

        dateContainer.innerHTML = `
            <label for="progress-lesson-date-select" class="block mb-1 text-sm font-medium text-gray-700">Lesson Date</label>
            <select id="progress-lesson-date-select" required class="w-full">${options}</select>
        `;
        formElements.forEach(el => { if (el) el.style.opacity = '1'; });
        if (saveNoteBtn) saveNoteBtn.disabled = false;
    } else {
        dateContainer.innerHTML = `
            <label class="block mb-1 text-sm font-medium text-gray-700">Lesson Date</label>
            <div class="p-3 bg-gray-100 text-gray-600 rounded-md text-center">No lessons booked for this customer.</div>
        `;
        formElements.forEach(el => { if (el) el.style.opacity = '0.5'; });
        if (saveNoteBtn) saveNoteBtn.disabled = true;
    }
}

/**
 * Reset progress form to add new note state
 * @param {string} customerId - Customer ID
 */
export function resetProgressForm(customerId) {
    const form = document.getElementById('progress-log-form');
    if (form) form.reset();

    const noteIdField = document.getElementById('progress-note-id');
    const customerIdField = document.getElementById('progress-customer-id');
    const formTitle = document.getElementById('progress-form-title');

    if (noteIdField) noteIdField.value = '';
    if (customerIdField) customerIdField.value = customerId;
    if (formTitle) formTitle.textContent = 'Add New Lesson Note';

    const buttonsContainer = document.getElementById('progress-form-buttons');
    if (buttonsContainer) {
        buttonsContainer.innerHTML = `
            <button type="button" id="generate-feedback-btn" class="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700">✨ Generate Feedback</button>
            <button type="submit" id="save-note-btn" class="${btnPrimary}">Save Note</button>
        `;

        const generateBtn = document.getElementById('generate-feedback-btn');
        if (generateBtn && typeof window.handleGenerateFeedback === 'function') {
            generateBtn.onclick = window.handleGenerateFeedback;
        }
    }

    populateProgressDateSelect(customerId);
}

// ============================================
// PACKAGE SALES
// ============================================

/**
 * Open package sales modal
 * Allows selling lesson packages to customers
 * @param {string} customerId - Customer ID
 */
export function openSellPackageModal(customerId) {
    const modal = document.getElementById('sell-package-modal');
    if (!modal) return;

    const customer = state.customers.find(c => c.id === customerId);
    if (!customer) return;

    // Get packages from settings
    const packages = typeof window.getLessonPackages === 'function' ? window.getLessonPackages() : [];
    const getPackagePriceValue = typeof window.getPackagePriceValue === 'function' ? window.getPackagePriceValue : (pkg) => pkg.price;

    const validPackages = packages
        .map(pkg => ({ pkg, price: getPackagePriceValue(pkg) }))
        .filter(entry => entry.price !== null);

    if (validPackages.length === 0) {
        const dialogMessage = packages.length === 0
            ? 'There are no lesson packages configured. Please add some in the Settings page first.'
            : 'Existing lesson packages have invalid pricing data. Please update them in the Settings page first.';

        showDialog({
            title: 'No Packages',
            message: dialogMessage,
            buttons: [{
                text: 'OK',
                class: btnPrimary,
                onClick: () => {
                    if (typeof window.showView === 'function') {
                        window.showView('settings');
                    }
                }
            }]
        });
        return;
    }

    const titleEl = document.getElementById('sell-package-modal-title');
    if (titleEl) titleEl.textContent = `Sell Package to ${customer.name}`;

    const customerIdField = document.getElementById('sell-package-customer-id');
    if (customerIdField) customerIdField.value = customerId;

    const selectEl = document.getElementById('sell-package-select');
    if (selectEl) {
        selectEl.innerHTML = ''; // Clear existing options safely
        validPackages.forEach(({ pkg, price }) => {
            const hoursLabel = pkg.hours != null ? pkg.hours : 'N/A';
            const displayText = `${pkg.name} (${hoursLabel} hrs for €${price.toFixed(2)})`;
            const option = new Option(displayText, pkg.id);
            selectEl.add(option);
        });
    }

    updatePackageSummary();

    modal.classList.remove('hidden');
    setTimeout(() => modal.querySelector('.modal')?.classList.remove('scale-95', 'opacity-0'), 10);
}

/**
 * Update package summary display
 * Shows hours and price for selected package
 */
export function updatePackageSummary() {
    const selectEl = document.getElementById('sell-package-select');
    const summaryEl = document.getElementById('sell-package-summary');
    if (!selectEl || !summaryEl) return;

    const selectedPackageId = selectEl.value;
    const getLessonPackages = typeof window.getLessonPackages === 'function' ? window.getLessonPackages : () => [];
    const getPackagePriceValue = typeof window.getPackagePriceValue === 'function' ? window.getPackagePriceValue : (pkg) => pkg.price;

    const pkg = getLessonPackages().find(p => p.id === selectedPackageId);

    if (!pkg) {
        summaryEl.innerHTML = 'Please select a package.';
        return;
    }

    const priceValue = getPackagePriceValue(pkg);
    if (priceValue === null) {
        summaryEl.innerHTML = 'The selected package has invalid price data. Please update it in Settings before selling it.';
        return;
    }

    const hoursDisplay = pkg.hours != null ? sanitizeHTML(String(pkg.hours)) : 'N/A';
    summaryEl.innerHTML = `This will add <strong>${hoursDisplay} hours</strong> of lesson credit and record an income of <strong>€${priceValue.toFixed(2)}</strong>.`;
}

/**
 * Confirm package sale
 * Creates transaction and adds credits to customer
 * @param {Event} event - Form submit event
 */
export function confirmSale(event) {
    event.preventDefault();

    const customerId = document.getElementById('sell-package-customer-id')?.value;
    const packageId = document.getElementById('sell-package-select')?.value;

    const customerIndex = state.customers.findIndex(c => c.id === customerId);

    const getLessonPackages = typeof window.getLessonPackages === 'function' ? window.getLessonPackages : () => [];
    const getPackagePriceValue = typeof window.getPackagePriceValue === 'function' ? window.getPackagePriceValue : (pkg) => pkg.price;

    const pkg = getLessonPackages().find(p => p.id === packageId);
    const priceValue = pkg ? getPackagePriceValue(pkg) : null;
    const hoursValue = pkg ? Number(pkg.hours) : NaN;

    if (customerIndex === -1 || !pkg) {
        showDialog({
            title: 'Error',
            message: 'Could not find customer or package. Please try again.',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }

    if (!Number.isFinite(hoursValue) || priceValue === null) {
        showDialog({
            title: 'Invalid Package Data',
            message: 'The selected package has invalid hours or price. Please update it in Settings before selling it.',
            buttons: [{ text: 'OK', class: btnPrimary }]
        });
        return;
    }

    // Ensure driving_school_details exists
    if (!state.customers[customerIndex].driving_school_details) {
        state.customers[customerIndex].driving_school_details = {};
    }

    const details = state.customers[customerIndex].driving_school_details;
    details.lesson_credits = (details.lesson_credits || 0) + hoursValue;

    const transaction = {
        id: `txn_${generateUUID()}`,
        date: toLocalDateString(new Date()),
        type: 'package_sale',
        description: `Sale of '${pkg.name}' to ${state.customers[customerIndex].name}`,
        amount: priceValue,
        customerId: customerId,
        packageId: packageId
    };
    state.transactions.push(transaction);

    debouncedSaveState();

    if (typeof window.closeSellPackageModal === 'function') {
        window.closeSellPackageModal();
    }

    renderCustomersView();
    showToast(`Sold '${pkg.name}' to ${state.customers[customerIndex].name}. Credits updated.`);
}

// ============================================
// EXPORTS FOR GLOBAL ACCESS (BACKWARDS COMPATIBILITY)
// ============================================

if (typeof window !== 'undefined') {
    window.renderCustomersView = renderCustomersView;
    window.viewCustomerFromSearch = viewCustomerFromSearch;
    window.saveCustomer = saveCustomer;
    window.deleteCustomer = deleteCustomer;
    window.saveProgressNote = saveProgressNote;
    window.calculateStudentProgress = calculateStudentProgress;
    window.renderStudentProgressDashboard = renderStudentProgressDashboard;
    window.renderProgressLog = renderProgressLog;
    window.editProgressNote = editProgressNote;
    window.deleteProgressNote = deleteProgressNote;
    window.openCustomerModal = openCustomerModal;
    window.closeCustomerModal = closeCustomerModal;
    window.openCustomerProgressModal = openCustomerProgressModal;
    window.closeCustomerProgressModal = closeCustomerProgressModal;
    window.populateProgressDateSelect = populateProgressDateSelect;
    window.resetProgressForm = resetProgressForm;
    window.openSellPackageModal = openSellPackageModal;
    window.updatePackageSummary = updatePackageSummary;
    window.confirmSale = confirmSale;
}
