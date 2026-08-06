/**
 * MediPulse Smart Hospital - Core Application Logic
 */

// Application State
const AppState = {
    doctors: [],
    appointments: [],
    queue: [],
    selectedDepartment: 'all',
    searchQuery: '',
    bookingFilters: {
        searchQuery: '',
        status: 'all',
        department: 'all',
        consultationType: 'all',
        startDate: '',
        endDate: '',
        sortBy: 'date-desc',
        viewMode: 'cards'
    },
    currentBooking: {
        doctorId: null,
        date: '',
        slot: '',
        consultationType: 'In-person'
    }
};

// DOM Content Loaded Handler
document.addEventListener('DOMContentLoaded', () => {
    initLocalStorage();
    setupEventListeners();
    renderDepartmentPills();
    renderDoctors();
    renderMyBookings();
    renderQueueStatus();
    setupDefaultDates();
});

/**
 * Initialize state from localStorage or seed initial data
 */
function initLocalStorage() {
    const storedDoctors = localStorage.getItem('medipulse_doctors');
    if (storedDoctors) {
        AppState.doctors = JSON.parse(storedDoctors);
    } else {
        AppState.doctors = INITIAL_DOCTORS;
        localStorage.setItem('medipulse_doctors', JSON.stringify(INITIAL_DOCTORS));
    }

    const storedAppointments = localStorage.getItem('medipulse_appointments');
    if (storedAppointments) {
        AppState.appointments = JSON.parse(storedAppointments);
    } else {
        AppState.appointments = SAMPLE_APPOINTMENTS;
        localStorage.setItem('medipulse_appointments', JSON.stringify(SAMPLE_APPOINTMENTS));
    }

    const storedQueue = localStorage.getItem('medipulse_queue');
    if (storedQueue) {
        AppState.queue = JSON.parse(storedQueue);
    } else {
        AppState.queue = INITIAL_QUEUE_STATUS;
        localStorage.setItem('medipulse_queue', JSON.stringify(INITIAL_QUEUE_STATUS));
    }
}

/**
 * Set up global event listeners
 */
function setupEventListeners() {
    // Search Doctor Input
    const searchInput = document.getElementById('doctorSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            AppState.searchQuery = e.target.value.toLowerCase().trim();
            renderDoctors();
        });
    }

    // Appointment Search Input
    const bookingSearch = document.getElementById('bookingSearchInput');
    if (bookingSearch) {
        bookingSearch.addEventListener('input', (e) => {
            AppState.bookingFilters.searchQuery = e.target.value.toLowerCase().trim();
            renderMyBookings();
        });
    }

    // Appointment Status Filter
    const bookingStatus = document.getElementById('bookingStatusFilter');
    if (bookingStatus) {
        bookingStatus.addEventListener('change', (e) => {
            AppState.bookingFilters.status = e.target.value;
            syncStatusPillsUI(e.target.value);
            renderMyBookings();
        });
    }

    // Appointment Specialty Filter
    const bookingDept = document.getElementById('bookingDeptFilter');
    if (bookingDept) {
        bookingDept.addEventListener('change', (e) => {
            AppState.bookingFilters.department = e.target.value;
            renderMyBookings();
        });
    }

    // Appointment Consultation Mode Filter
    const bookingType = document.getElementById('bookingTypeFilter');
    if (bookingType) {
        bookingType.addEventListener('change', (e) => {
            AppState.bookingFilters.consultationType = e.target.value;
            renderMyBookings();
        });
    }

    // Date Range: Start Date
    const startDateInput = document.getElementById('bookingStartDate');
    if (startDateInput) {
        startDateInput.addEventListener('change', (e) => {
            AppState.bookingFilters.startDate = e.target.value;
            renderMyBookings();
        });
    }

    // Date Range: End Date
    const endDateInput = document.getElementById('bookingEndDate');
    if (endDateInput) {
        endDateInput.addEventListener('change', (e) => {
            AppState.bookingFilters.endDate = e.target.value;
            renderMyBookings();
        });
    }

    // Sort By Filter
    const sortByInput = document.getElementById('bookingSortBy');
    if (sortByInput) {
        sortByInput.addEventListener('change', (e) => {
            AppState.bookingFilters.sortBy = e.target.value;
            renderMyBookings();
        });
    }

    // Symptom Checker Form
    const symptomForm = document.getElementById('symptomCheckerForm');
    if (symptomForm) {
        symptomForm.addEventListener('submit', (e) => {
            e.preventDefault();
            runSymptomAnalysis();
        });
    }

    // Booking Form Submit
    const bookingForm = document.getElementById('appointmentBookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmit);
    }

    // Date Picker Input inside Modal
    const bookingDateInput = document.getElementById('bookingDateSelect');
    if (bookingDateInput) {
        bookingDateInput.addEventListener('change', (e) => {
            AppState.currentBooking.date = e.target.value;
            renderTimeSlots(AppState.currentBooking.doctorId);
        });
    }
}

/**
 * Setup default min/max dates for booking
 */
function setupDefaultDates() {
    const bookingDateInput = document.getElementById('bookingDateSelect');
    if (bookingDateInput) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + 14);

        bookingDateInput.min = tomorrow.toISOString().split('T')[0];
        bookingDateInput.max = maxDate.toISOString().split('T')[0];
        bookingDateInput.value = tomorrow.toISOString().split('T')[0];
        AppState.currentBooking.date = bookingDateInput.value;
    }
}

/**
 * Render Department Filter Pills
 */
function renderDepartmentPills() {
    const container = document.getElementById('departmentPillsContainer');
    if (!container) return;

    container.innerHTML = DEPARTMENTS.map(dept => `
        <div class="dept-pill ${AppState.selectedDepartment === dept.id ? 'active' : ''}" 
             onclick="selectDepartment('${dept.id}')">
            <i class="fas ${dept.icon}"></i>
            <span>${dept.name}</span>
        </div>
    `).join('');
}

/**
 * Select Department Filter
 */
function selectDepartment(deptId) {
    AppState.selectedDepartment = deptId;
    renderDepartmentPills();
    renderDoctors();
}

/**
 * Render Doctor Grid based on selected department and search query
 */
function renderDoctors() {
    const container = document.getElementById('doctorsGridContainer');
    if (!container) return;

    let filtered = AppState.doctors.filter(doc => {
        const matchDept = AppState.selectedDepartment === 'all' || doc.departmentId === AppState.selectedDepartment;
        const matchSearch = !AppState.searchQuery || 
            doc.name.toLowerCase().includes(AppState.searchQuery) ||
            doc.departmentName.toLowerCase().includes(AppState.searchQuery) ||
            doc.bio.toLowerCase().includes(AppState.searchQuery);

        return matchDept && matchSearch;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="p-4 bg-white rounded-4 border">
                    <i class="fas fa-user-doctor text-muted fa-3x mb-3"></i>
                    <h5 class="fw-bold">No Specialists Found</h5>
                    <p class="text-muted">Try resetting your filter or searching for another keyword.</p>
                    <button class="btn btn-outline-primary rounded-pill px-4" onclick="selectDepartment('all')">View All Doctors</button>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(doc => `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="doctor-card p-3">
                <div class="doctor-avatar-wrapper">
                    <img src="${doc.avatar}" alt="${doc.name}" loading="lazy">
                </div>
                <div class="text-center px-2">
                    <h5 class="fw-bold text-dark mb-1">${doc.name}</h5>
                    <p class="text-primary fw-semibold small mb-2">${doc.title}</p>
                    <div class="d-flex justify-content-center align-items-center gap-2 mb-3">
                        <span class="rating-badge"><i class="fas fa-star text-warning me-1"></i>${doc.rating} (${doc.reviewsCount})</span>
                        <span class="fee-badge">$${doc.consultationFee} Fee</span>
                    </div>
                </div>

                <div class="bg-light p-3 rounded-3 mb-3 fs-7">
                    <div class="d-flex align-items-center mb-1 text-secondary">
                        <i class="fas fa-building-user me-2 text-primary"></i>
                        <span>${doc.departmentName}</span>
                    </div>
                    <div class="d-flex align-items-center mb-1 text-secondary">
                        <i class="fas fa-briefcase me-2 text-primary"></i>
                        <span>${doc.experienceYears} Years Exp.</span>
                    </div>
                    <div class="d-flex align-items-center text-secondary">
                        <i class="fas fa-location-dot me-2 text-primary"></i>
                        <span class="text-truncate">${doc.location}</span>
                    </div>
                </div>

                <p class="text-muted small px-1 line-clamp-2 mb-3 flex-grow-1">${doc.bio}</p>

                <div class="pt-2 border-top d-flex justify-content-between align-items-center">
                    <span class="badge bg-info-subtle text-info-emphasis px-2 py-1"><i class="fas fa-video me-1"></i>${doc.type}</span>
                    <button class="btn btn-primary rounded-pill px-3 py-2 fw-bold btn-sm shadow-sm" onclick="openBookingModal('${doc.id}')">
                        <i class="fas fa-calendar-check me-1"></i> Book Slot
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Handle AI Symptom Checker analysis
 */
function runSymptomAnalysis() {
    const input = document.getElementById('symptomInput');
    const resultBox = document.getElementById('symptomAnalysisResult');
    if (!input || !resultBox) return;

    const query = input.value.toLowerCase().trim();
    if (!query) {
        showToast('Input Required', 'Please enter your symptoms to run the analysis.', 'warning');
        return;
    }

    // Match keywords against rules
    let matchedRule = null;
    let highestMatches = 0;

    SYMPTOM_RULES.forEach(rule => {
        let matches = 0;
        rule.keywords.forEach(kw => {
            if (query.includes(kw)) matches++;
        });
        if (matches > highestMatches) {
            highestMatches = matches;
            matchedRule = rule;
        }
    });

    if (!matchedRule) {
        // Default to General Medicine if no direct match
        matchedRule = SYMPTOM_RULES.find(r => r.departmentId === 'general');
    }

    const urgencyBg = matchedRule.urgency === 'high' ? 'bg-danger-subtle text-danger' : 
                      matchedRule.urgency === 'medium' ? 'bg-warning-subtle text-warning-emphasis' : 
                      'bg-success-subtle text-success';

    resultBox.innerHTML = `
        <div class="alert border-0 shadow-sm p-4 rounded-4 ${matchedRule.urgency === 'high' ? 'bg-rose-light' : 'bg-white'}">
            <div class="d-flex align-items-center justify-content-between mb-3">
                <div class="d-flex align-items-center gap-2">
                    <i class="fas fa-robot text-primary fa-lg"></i>
                    <h6 class="fw-bold mb-0">MediPulse Recommendation</h6>
                </div>
                <span class="badge ${urgencyBg} rounded-pill px-3 py-2 fw-bold">
                    <i class="fas fa-triangle-exclamation me-1"></i>${matchedRule.urgencyLabel}
                </span>
            </div>
            <p class="text-dark mb-3 fs-6">${matchedRule.recommendation}</p>
            <div class="d-flex align-items-center gap-3">
                <button class="btn btn-primary rounded-pill px-4 fw-bold" onclick="filterBySymptomDept('${matchedRule.departmentId}')">
                    <i class="fas fa-user-md me-2"></i>Find ${matchedRule.departmentName} Doctors
                </button>
            </div>
        </div>
    `;
    resultBox.classList.remove('d-none');
}

/**
 * Filter doctor view directly from Symptom Checker
 */
function filterBySymptomDept(deptId) {
    selectDepartment(deptId);
    const doctorSection = document.getElementById('doctorSearchSection');
    if (doctorSection) {
        doctorSection.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Toggle Symptom Chip Selection
 */
function toggleSymptomChip(chipElement, keyword) {
    const input = document.getElementById('symptomInput');
    if (!input) return;

    let currentVal = input.value.trim();
    if (chipElement.classList.contains('selected')) {
        chipElement.classList.remove('selected');
        currentVal = currentVal.replace(keyword, '').replace(/,\s*,/g, ',').trim();
    } else {
        chipElement.classList.add('selected');
        currentVal = currentVal ? `${currentVal}, ${keyword}` : keyword;
    }
    input.value = currentVal;
}

/**
 * Open Booking Modal for a specific doctor
 */
function openBookingModal(doctorId) {
    const doc = AppState.doctors.find(d => d.id === doctorId);
    if (!doc) return;

    AppState.currentBooking.doctorId = doctorId;
    AppState.currentBooking.slot = '';

    // Update modal elements
    document.getElementById('modalDocAvatar').src = doc.avatar;
    document.getElementById('modalDocName').textContent = doc.name;
    document.getElementById('modalDocDept').textContent = `${doc.departmentName} • ${doc.title}`;
    document.getElementById('modalDocFee').textContent = `$${doc.consultationFee}`;
    document.getElementById('modalDocLocation').textContent = doc.location;

    // Reset selected slot state
    renderTimeSlots(doctorId);

    const bookingModal = new bootstrap.Modal(document.getElementById('appointmentModal'));
    bookingModal.show();
}

/**
 * Render time slots for doctor and selected date
 */
function renderTimeSlots(doctorId) {
    const doc = AppState.doctors.find(d => d.id === doctorId);
    const slotsContainer = document.getElementById('slotsGridContainer');
    if (!doc || !slotsContainer) return;

    const selectedDate = AppState.currentBooking.date;
    
    // Check existing appointments on this date to disable booked slots
    const existingBookedSlots = AppState.appointments
        .filter(app => app.doctorId === doctorId && app.date === selectedDate && app.status !== 'Cancelled')
        .map(app => app.timeSlot);

    let html = '';

    const categories = [
        { label: 'Morning Slots', key: 'morning', icon: 'fa-sun text-warning' },
        { label: 'Afternoon Slots', key: 'afternoon', icon: 'fa-cloud-sun text-primary' },
        { label: 'Evening Slots', key: 'evening', icon: 'fa-moon text-indigo' }
    ];

    categories.forEach(cat => {
        const slotsList = doc.slots[cat.key] || [];
        if (slotsList.length > 0) {
            html += `
                <div class="col-12 mt-3 mb-2">
                    <h6 class="fw-bold small text-uppercase text-muted d-flex align-items-center gap-2">
                        <i class="fas ${cat.icon}"></i> ${cat.label}
                    </h6>
                </div>
            `;
            slotsList.forEach(slot => {
                const isBooked = existingBookedSlots.includes(slot);
                const isSelected = AppState.currentBooking.slot === slot;
                html += `
                    <div class="col-4 col-sm-3 mb-2">
                        <button type="button" 
                                class="slot-btn w-100 ${isSelected ? 'selected' : ''}" 
                                ${isBooked ? 'disabled' : ''}
                                onclick="selectSlot(this, '${slot}')">
                            ${slot}
                        </button>
                    </div>
                `;
            });
        }
    });

    slotsContainer.innerHTML = html;
}

/**
 * Slot Selection Handler
 */
function selectSlot(button, slotTime) {
    document.querySelectorAll('.slot-btn').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    AppState.currentBooking.slot = slotTime;
}

/**
 * Confirm Appointment Submission
 */
function handleBookingSubmit(e) {
    e.preventDefault();

    if (!AppState.currentBooking.slot) {
        showToast('Time Slot Required', 'Please select an available time slot before proceeding.', 'warning');
        return;
    }

    const doc = AppState.doctors.find(d => d.id === AppState.currentBooking.doctorId);
    if (!doc) return;

    const patientName = document.getElementById('patientNameInput').value.trim();
    const patientPhone = document.getElementById('patientPhoneInput').value.trim();
    const patientEmail = document.getElementById('patientEmailInput').value.trim();
    const patientAge = document.getElementById('patientAgeInput').value;
    const gender = document.getElementById('patientGenderSelect').value;
    const bloodGroup = document.getElementById('patientBloodSelect').value;
    const consultationType = document.getElementById('consultationTypeSelect').value;
    const reason = document.getElementById('patientReasonInput').value.trim();

    // Generate unique ID & Token
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const appointmentId = `MP-${randomNum}`;
    const deptPrefix = doc.departmentId.substring(0, 4).toUpperCase();
    const tokenNumber = `${deptPrefix}-${Math.floor(10 + Math.random() * 89)}`;

    const newAppointment = {
        id: appointmentId,
        tokenNumber: tokenNumber,
        doctorId: doc.id,
        doctorName: doc.name,
        departmentName: doc.departmentName,
        location: doc.location,
        patientName,
        patientPhone,
        patientEmail,
        patientAge,
        gender,
        bloodGroup,
        consultationType,
        date: AppState.currentBooking.date,
        timeSlot: AppState.currentBooking.slot,
        reason: reason || 'General Consultation',
        fee: doc.consultationFee,
        status: 'Confirmed',
        createdAt: new Date().toISOString()
    };

    // Save to AppState & localStorage
    AppState.appointments.unshift(newAppointment);
    localStorage.setItem('medipulse_appointments', JSON.stringify(AppState.appointments));

    // Hide Modal & Reset Form
    const modalEl = document.getElementById('appointmentModal');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();
    e.target.reset();

    // Refresh UI
    renderMyBookings();
    showToast('Appointment Confirmed!', `Booking ${appointmentId} confirmed successfully with ${doc.name}.`, 'success');

    // Display Digital Pass Modal immediately
    openPassModal(appointmentId);
}

/**
 * Dynamic Status Badge Renderer
 */
function getStatusBadgeHtml(status) {
    const s = (status || 'Approved').trim();
    if (s === 'Approved' || s === 'Confirmed' || s === 'Approve') {
        return '<span class="badge badge-status-approved px-2.5 py-1 rounded-pill fw-semibold"><i class="fas fa-circle-check me-1"></i>Approved</span>';
    } else if (s === 'Rejected' || s === 'Cancelled' || s === 'Reject') {
        return '<span class="badge badge-status-rejected px-2.5 py-1 rounded-pill fw-semibold"><i class="fas fa-circle-xmark me-1"></i>Rejected</span>';
    } else if (s === 'Manual' || s === 'Manual Verification') {
        return '<span class="badge badge-status-manual px-2.5 py-1 rounded-pill fw-semibold"><i class="fas fa-hand me-1"></i>Manual</span>';
    } else if (s === 'Under Review' || s === 'Review' || s === 'Pending Review') {
        return '<span class="badge badge-status-review px-2.5 py-1 rounded-pill fw-semibold"><i class="fas fa-clock me-1"></i>Under Review</span>';
    } else if (s === 'Completed') {
        return '<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2.5 py-1 rounded-pill fw-semibold"><i class="fas fa-check-double me-1"></i>Completed</span>';
    } else {
        return `<span class="badge bg-light text-dark border px-2.5 py-1 rounded-pill fw-semibold">${s}</span>`;
    }
}

/**
 * Quick Status Filter Pill click handler
 */
function setStatusFilter(statusKey) {
    AppState.bookingFilters.status = statusKey;
    
    // Sync select dropdown
    const selectEl = document.getElementById('bookingStatusFilter');
    if (selectEl) {
        selectEl.value = statusKey;
    }
    
    syncStatusPillsUI(statusKey);
    renderMyBookings();
}

/**
 * Sync active state on status filter pills
 */
function syncStatusPillsUI(activeStatus) {
    const pills = document.querySelectorAll('#statusFilterPills .nav-link');
    pills.forEach(pill => {
        const pillStatus = pill.getAttribute('data-status');
        if (pillStatus === activeStatus || (activeStatus === 'all' && pillStatus === 'all')) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });
}

/**
 * Update dynamic badge counts on status filter pills
 */
function updateStatusPillCounts() {
    const appointments = AppState.appointments || [];
    
    const countAll = appointments.length;
    const countApproved = appointments.filter(a => a.status === 'Approved' || a.status === 'Confirmed' || a.status === 'Approve').length;
    const countRejected = appointments.filter(a => a.status === 'Rejected' || a.status === 'Cancelled' || a.status === 'Reject').length;
    const countManual = appointments.filter(a => a.status === 'Manual' || a.status === 'Manual Verification').length;
    const countReview = appointments.filter(a => a.status === 'Review' || a.status === 'Under Review' || a.status === 'Pending Review').length;

    const elAll = document.getElementById('pill-count-all');
    const elApproved = document.getElementById('pill-count-approved');
    const elRejected = document.getElementById('pill-count-rejected');
    const elManual = document.getElementById('pill-count-manual');
    const elReview = document.getElementById('pill-count-review');

    if (elAll) elAll.textContent = countAll;
    if (elApproved) elApproved.textContent = countApproved;
    if (elRejected) elRejected.textContent = countRejected;
    if (elManual) elManual.textContent = countManual;
    if (elReview) elReview.textContent = countReview;
}

/**
 * Update individual appointment status dynamically
 */
function updateAppointmentStatus(appointmentId, newStatus) {
    const index = AppState.appointments.findIndex(app => app.id === appointmentId);
    if (index !== -1) {
        AppState.appointments[index].status = newStatus;
        localStorage.setItem('medipulse_appointments', JSON.stringify(AppState.appointments));
        renderMyBookings();
        showToast('Status Updated', `Appointment ${appointmentId} set to ${newStatus}.`, 'success');
    }
}

/**
 * Filter & Sort Appointments according to active filter criteria
 */
function getFilteredAppointments() {
    const filters = AppState.bookingFilters;
    let list = AppState.appointments.filter(app => {
        // 1. Search Query match
        const q = filters.searchQuery;
        const matchSearch = !q || (
            app.patientName.toLowerCase().includes(q) ||
            app.doctorName.toLowerCase().includes(q) ||
            app.departmentName.toLowerCase().includes(q) ||
            app.tokenNumber.toLowerCase().includes(q) ||
            app.id.toLowerCase().includes(q) ||
            (app.patientPhone && app.patientPhone.toLowerCase().includes(q)) ||
            (app.patientEmail && app.patientEmail.toLowerCase().includes(q)) ||
            (app.reason && app.reason.toLowerCase().includes(q))
        );

        // 2. Status match (supports All, Approved, Rejected, Manual, Review)
        let matchStatus = false;
        if (filters.status === 'all') {
            matchStatus = true;
        } else if (filters.status === 'Approved' || filters.status === 'Approve') {
            matchStatus = (app.status === 'Approved' || app.status === 'Confirmed' || app.status === 'Approve');
        } else if (filters.status === 'Rejected' || filters.status === 'Reject') {
            matchStatus = (app.status === 'Rejected' || app.status === 'Cancelled' || app.status === 'Reject');
        } else if (filters.status === 'Manual') {
            matchStatus = (app.status === 'Manual' || app.status === 'Manual Verification');
        } else if (filters.status === 'Review' || filters.status === 'Under Review') {
            matchStatus = (app.status === 'Review' || app.status === 'Under Review' || app.status === 'Pending Review');
        } else {
            matchStatus = (app.status === filters.status);
        }

        // 3. Department match
        const matchDept = filters.department === 'all' || app.departmentName === filters.department;

        // 4. Consultation Type match
        const matchType = filters.consultationType === 'all' || app.consultationType === filters.consultationType;

        // 5. Date Range match
        let matchDate = true;
        if (filters.startDate) {
            matchDate = matchDate && (app.date >= filters.startDate);
        }
        if (filters.endDate) {
            matchDate = matchDate && (app.date <= filters.endDate);
        }

        return matchSearch && matchStatus && matchDept && matchType && matchDate;
    });

    // Sort list
    list.sort((a, b) => {
        switch (filters.sortBy) {
            case 'date-asc':
                return a.date.localeCompare(b.date);
            case 'date-desc':
                return b.date.localeCompare(a.date);
            case 'patient-asc':
                return a.patientName.localeCompare(b.patientName);
            case 'doctor-asc':
                return a.doctorName.localeCompare(b.doctorName);
            case 'fee-desc':
                return (b.fee || 0) - (a.fee || 0);
            default:
                return b.date.localeCompare(a.date);
        }
    });

    return list;
}

/**
 * Render My Bookings Section (Cards or Table)
 */
function renderMyBookings() {
    const container = document.getElementById('myBookingsContainer');
    if (!container) return;

    // Update Pill Counts & Active States
    updateStatusPillCounts();
    syncStatusPillsUI(AppState.bookingFilters.status);

    const filtered = getFilteredAppointments();

    // Update counts
    const filteredCountText = document.getElementById('filteredCountText');
    const totalCountText = document.getElementById('totalCountText');
    if (filteredCountText) filteredCountText.textContent = filtered.length;
    if (totalCountText) totalCountText.textContent = AppState.appointments.length;

    // Render active filter badges
    renderActiveFilterBadges();

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="bg-white p-5 rounded-4 border shadow-sm max-w-600 mx-auto">
                    <i class="fas fa-filter-circle-xmark text-muted fa-4x mb-3"></i>
                    <h4 class="fw-bold text-dark">No Appointments Found</h4>
                    <p class="text-muted mb-4">No appointment records match your active search and filter criteria.</p>
                    <button class="btn btn-primary rounded-pill px-4 fw-bold" onclick="resetBookingFilters()">
                        <i class="fas fa-rotate-left me-2"></i> Reset All Filters
                    </button>
                </div>
            </div>
        `;
        return;
    }

    if (AppState.bookingFilters.viewMode === 'table') {
        // Table View
        container.innerHTML = `
            <div class="appointments-table-container">
                <div class="table-responsive">
                    <table class="table appointments-table align-middle">
                        <thead>
                            <tr>
                                <th>Token / ID</th>
                                <th>Patient Details</th>
                                <th>Doctor & Specialty</th>
                                <th>Date & Time</th>
                                <th>Mode</th>
                                <th>Fee</th>
                                <th>Status</th>
                                <th class="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.map(app => {
                                const statusBadge = getStatusBadgeHtml(app.status);
                                const isCancelled = app.status === 'Cancelled' || app.status === 'Rejected';

                                return `
                                    <tr class="${isCancelled ? 'opacity-75' : ''}">
                                        <td>
                                            <span class="badge bg-primary-subtle text-primary fw-bold px-2 py-1 mb-1 d-block text-center">${app.tokenNumber}</span>
                                            <span class="text-muted extra-small d-block text-center">${app.id}</span>
                                        </td>
                                        <td>
                                            <div class="fw-bold text-dark">${app.patientName}</div>
                                            <div class="text-muted extra-small"><i class="fas fa-phone me-1"></i>${app.patientPhone || 'N/A'}</div>
                                        </td>
                                        <td>
                                            <div class="fw-semibold text-dark">${app.doctorName}</div>
                                            <div class="text-primary extra-small fw-semibold">${app.departmentName}</div>
                                        </td>
                                        <td>
                                            <div class="fw-semibold text-dark"><i class="fas fa-calendar-day text-primary me-1"></i>${app.date}</div>
                                            <div class="text-muted extra-small"><i class="fas fa-clock text-secondary me-1"></i>${app.timeSlot}</div>
                                        </td>
                                        <td>
                                            <span class="badge bg-light text-dark border">${app.consultationType}</span>
                                        </td>
                                        <td class="fw-bold text-success">$${app.fee}</td>
                                        <td>${statusBadge}</td>
                                        <td class="text-end">
                                            <div class="dropdown d-inline-block me-1">
                                                <button class="btn btn-sm btn-outline-secondary rounded-pill dropdown-toggle px-2 py-1" type="button" data-bs-toggle="dropdown" title="Change Status">
                                                    Status
                                                </button>
                                                <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                                                    <li><a class="dropdown-item text-success" href="#" onclick="updateAppointmentStatus('${app.id}', 'Approved'); return false;"><i class="fas fa-circle-check me-2"></i>Approved</a></li>
                                                    <li><a class="dropdown-item text-danger" href="#" onclick="updateAppointmentStatus('${app.id}', 'Rejected'); return false;"><i class="fas fa-circle-xmark me-2"></i>Rejected</a></li>
                                                    <li><a class="dropdown-item text-warning" href="#" onclick="updateAppointmentStatus('${app.id}', 'Manual'); return false;"><i class="fas fa-hand me-2"></i>Manual</a></li>
                                                    <li><a class="dropdown-item text-info" href="#" onclick="updateAppointmentStatus('${app.id}', 'Under Review'); return false;"><i class="fas fa-clock me-2"></i>Under Review</a></li>
                                                </ul>
                                            </div>
                                            <button class="btn btn-sm btn-outline-secondary rounded-pill me-1" onclick="openPassModal('${app.id}')" title="View Digital Pass">
                                                <i class="fas fa-ticket"></i>
                                            </button>
                                            ${!isCancelled ? `
                                                <button class="btn btn-sm btn-outline-danger rounded-pill" onclick="cancelAppointment('${app.id}')" title="Cancel/Reject">
                                                    <i class="fas fa-times"></i>
                                                </button>
                                            ` : ''}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } else {
        // Cards View
        container.innerHTML = `
            <div class="row">
                ${filtered.map(app => {
                    const statusBadge = getStatusBadgeHtml(app.status);
                    const isCancelled = app.status === 'Cancelled' || app.status === 'Rejected';

                    return `
                        <div class="col-lg-6 mb-4">
                            <div class="ticket-card p-4 h-100 ${isCancelled ? 'opacity-75' : ''}">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <span class="text-muted small fw-bold">TOKEN NO</span>
                                        <div class="ticket-token-box mt-1">${app.tokenNumber}</div>
                                    </div>
                                    <div class="text-end">
                                        ${statusBadge}
                                        <div class="text-muted small mt-1">ID: ${app.id}</div>
                                    </div>
                                </div>

                                <div class="row align-items-center mb-3">
                                    <div class="col-12">
                                        <h5 class="fw-bold text-dark mb-1">${app.doctorName}</h5>
                                        <p class="text-primary fw-semibold mb-0 small">${app.departmentName}</p>
                                        <p class="text-muted small mb-0"><i class="fas fa-location-dot me-1 text-danger"></i>${app.location}</p>
                                    </div>
                                </div>

                                <div class="bg-light p-3 rounded-3 mb-3">
                                    <div class="row g-2 text-dark small fw-semibold">
                                        <div class="col-6">
                                            <i class="fas fa-calendar-day text-primary me-2"></i>Date: ${app.date}
                                        </div>
                                        <div class="col-6">
                                            <i class="fas fa-clock text-primary me-2"></i>Time: ${app.timeSlot}
                                        </div>
                                        <div class="col-6">
                                            <i class="fas fa-user text-secondary me-2"></i>Patient: ${app.patientName}
                                        </div>
                                        <div class="col-6">
                                            <i class="fas fa-stethoscope text-secondary me-2"></i>Type: ${app.consultationType}
                                        </div>
                                    </div>
                                </div>

                                <div class="d-flex gap-2 justify-content-end align-items-center flex-wrap">
                                    <div class="dropdown">
                                        <button class="btn btn-outline-secondary btn-sm rounded-pill dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                            Status
                                        </button>
                                        <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                                            <li><a class="dropdown-item text-success" href="#" onclick="updateAppointmentStatus('${app.id}', 'Approved'); return false;"><i class="fas fa-circle-check me-2"></i>Approved</a></li>
                                            <li><a class="dropdown-item text-danger" href="#" onclick="updateAppointmentStatus('${app.id}', 'Rejected'); return false;"><i class="fas fa-circle-xmark me-2"></i>Rejected</a></li>
                                            <li><a class="dropdown-item text-warning" href="#" onclick="updateAppointmentStatus('${app.id}', 'Manual'); return false;"><i class="fas fa-hand me-2"></i>Manual</a></li>
                                            <li><a class="dropdown-item text-info" href="#" onclick="updateAppointmentStatus('${app.id}', 'Under Review'); return false;"><i class="fas fa-clock me-2"></i>Under Review</a></li>
                                        </ul>
                                    </div>
                                    <button class="btn btn-outline-secondary btn-sm rounded-pill" onclick="openPassModal('${app.id}')">
                                        <i class="fas fa-ticket me-1"></i> View Pass
                                    </button>
                                    ${!isCancelled ? `
                                        <button class="btn btn-outline-danger btn-sm rounded-pill" onclick="cancelAppointment('${app.id}')">
                                            <i class="fas fa-times me-1"></i> Cancel
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
}

/**
 * Render Active Filter Badges
 */
function renderActiveFilterBadges() {
    const badgesContainer = document.getElementById('activeFilterBadges');
    if (!badgesContainer) return;

    const f = AppState.bookingFilters;
    let badges = [];

    if (f.searchQuery) {
        badges.push(`<span class="active-filter-badge">Search: "${f.searchQuery}" <i class="fas fa-times remove-badge" onclick="removeFilterBadge('searchQuery')"></i></span>`);
    }
    if (f.status !== 'all') {
        badges.push(`<span class="active-filter-badge">Status: ${f.status} <i class="fas fa-times remove-badge" onclick="removeFilterBadge('status')"></i></span>`);
    }
    if (f.department !== 'all') {
        badges.push(`<span class="active-filter-badge">Dept: ${f.department} <i class="fas fa-times remove-badge" onclick="removeFilterBadge('department')"></i></span>`);
    }
    if (f.consultationType !== 'all') {
        badges.push(`<span class="active-filter-badge">Mode: ${f.consultationType} <i class="fas fa-times remove-badge" onclick="removeFilterBadge('consultationType')"></i></span>`);
    }
    if (f.startDate) {
        badges.push(`<span class="active-filter-badge">From: ${f.startDate} <i class="fas fa-times remove-badge" onclick="removeFilterBadge('startDate')"></i></span>`);
    }
    if (f.endDate) {
        badges.push(`<span class="active-filter-badge">To: ${f.endDate} <i class="fas fa-times remove-badge" onclick="removeFilterBadge('endDate')"></i></span>`);
    }

    if (badges.length === 0) {
        badgesContainer.innerHTML = '<span class="text-muted small">No active filter constraints applied</span>';
    } else {
        badgesContainer.innerHTML = badges.join('');
    }
}

/**
 * Remove specific active filter badge
 */
function removeFilterBadge(key) {
    if (key === 'searchQuery') {
        AppState.bookingFilters.searchQuery = '';
        const el = document.getElementById('bookingSearchInput');
        if (el) el.value = '';
    } else if (key === 'status') {
        AppState.bookingFilters.status = 'all';
        const el = document.getElementById('bookingStatusFilter');
        if (el) el.value = 'all';
        syncStatusPillsUI('all');
    } else if (key === 'department') {
        AppState.bookingFilters.department = 'all';
        const el = document.getElementById('bookingDeptFilter');
        if (el) el.value = 'all';
    } else if (key === 'consultationType') {
        AppState.bookingFilters.consultationType = 'all';
        const el = document.getElementById('bookingTypeFilter');
        if (el) el.value = 'all';
    } else if (key === 'startDate') {
        AppState.bookingFilters.startDate = '';
        const el = document.getElementById('bookingStartDate');
        if (el) el.value = '';
    } else if (key === 'endDate') {
        AppState.bookingFilters.endDate = '';
        const el = document.getElementById('bookingEndDate');
        if (el) el.value = '';
    }

    renderMyBookings();
}

/**
 * Clear Search Input
 */
function clearBookingSearch() {
    AppState.bookingFilters.searchQuery = '';
    const el = document.getElementById('bookingSearchInput');
    if (el) el.value = '';
    renderMyBookings();
}

/**
 * Reset All Booking Filters
 */
function resetBookingFilters() {
    AppState.bookingFilters.searchQuery = '';
    AppState.bookingFilters.status = 'all';
    AppState.bookingFilters.department = 'all';
    AppState.bookingFilters.consultationType = 'all';
    AppState.bookingFilters.startDate = '';
    AppState.bookingFilters.endDate = '';
    AppState.bookingFilters.sortBy = 'date-desc';

    const searchEl = document.getElementById('bookingSearchInput');
    if (searchEl) searchEl.value = '';
    const statusEl = document.getElementById('bookingStatusFilter');
    if (statusEl) statusEl.value = 'all';
    const deptEl = document.getElementById('bookingDeptFilter');
    if (deptEl) deptEl.value = 'all';
    const typeEl = document.getElementById('bookingTypeFilter');
    if (typeEl) typeEl.value = 'all';
    const startEl = document.getElementById('bookingStartDate');
    if (startEl) startEl.value = '';
    const endEl = document.getElementById('bookingEndDate');
    if (endEl) endEl.value = '';
    const sortEl = document.getElementById('bookingSortBy');
    if (sortEl) sortEl.value = 'date-desc';

    syncStatusPillsUI('all');
    renderMyBookings();
    showToast('Filters Reset', 'All search & filter parameters have been cleared.', 'info');
}

/**
 * Set Booking View Mode (Cards vs Table)
 */
function setBookingViewMode(mode) {
    AppState.bookingFilters.viewMode = mode;

    const cardsBtn = document.getElementById('viewModeCardsBtn');
    const tableBtn = document.getElementById('viewModeTableBtn');

    if (cardsBtn && tableBtn) {
        if (mode === 'cards') {
            cardsBtn.classList.add('btn-primary', 'active');
            cardsBtn.classList.remove('btn-outline-secondary');
            tableBtn.classList.remove('btn-primary', 'active');
            tableBtn.classList.add('btn-outline-secondary');
        } else {
            tableBtn.classList.add('btn-primary', 'active');
            tableBtn.classList.remove('btn-outline-secondary');
            cardsBtn.classList.remove('btn-primary', 'active');
            cardsBtn.classList.add('btn-outline-secondary');
        }
    }

    renderMyBookings();
}

/**
 * Export Filtered Appointments to PDF using jsPDF + AutoTable
 */
function exportBookingsPDF() {
    const list = getFilteredAppointments();
    if (list.length === 0) {
        showToast('Export Error', 'No appointment records available to export with current filters.', 'warning');
        return;
    }

    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
        showToast('Export Error', 'PDF Generation library not loaded properly.', 'danger');
        return;
    }

    const doc = new jsPDF('landscape', 'mm', 'a4');

    // Header Color Banner
    doc.setFillColor(15, 23, 42); // #0f172a
    doc.rect(0, 0, 297, 26, 'F');

    // Logo & Header Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('MediPulse Smart Hospital', 14, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('PATIENT APPOINTMENT & OPD RECORDS REPORT', 14, 19);

    const todayStr = new Date().toLocaleString();
    doc.text(`Generated: ${todayStr}`, 283, 19, { align: 'right' });

    // Filter Parameters Box
    doc.setFillColor(240, 249, 255);
    doc.setDrawColor(186, 230, 253);
    doc.roundedRect(14, 30, 269, 18, 2, 2, 'FD');

    doc.setTextColor(3, 105, 161);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('REPORT METADATA & APPLIED FILTERS:', 18, 36);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const f = AppState.bookingFilters;
    const filterSummaryStr = `Search: "${f.searchQuery || 'None'}" | Status: ${f.status} | Dept: ${f.department} | Mode: ${f.consultationType} | Date Range: ${f.startDate || 'Any'} to ${f.endDate || 'Any'}`;
    doc.text(filterSummaryStr, 18, 42);

    // Calculate Summary Stats
    const totalRecords = list.length;
    const confirmedCount = list.filter(a => a.status === 'Confirmed').length;
    const totalFees = list.reduce((sum, a) => sum + (a.fee || 0), 0);

    doc.setFont('helvetica', 'bold');
    doc.text(`Total Records: ${totalRecords}   |   Confirmed: ${confirmedCount}   |   Total Fee Value: $${totalFees}`, 280, 36, { align: 'right' });

    // Table Data Formatting
    const tableColumns = [
        'Token #',
        'Appt ID',
        'Patient Name',
        'Contact / Email',
        'Doctor Name',
        'Department',
        'Date & Time',
        'Mode',
        'Fee',
        'Status'
    ];

    const tableRows = list.map(app => [
        app.tokenNumber || 'N/A',
        app.id || 'N/A',
        app.patientName || 'N/A',
        `${app.patientPhone || ''}\n${app.patientEmail || ''}`.trim(),
        app.doctorName || 'N/A',
        app.departmentName || 'N/A',
        `${app.date}\n${app.timeSlot}`,
        app.consultationType || 'In-person',
        `$${app.fee}`,
        app.status || 'Confirmed'
    ]);

    doc.autoTable({
        head: [tableColumns],
        body: tableRows,
        startY: 52,
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontSize: 8.5,
            cellPadding: 3,
            valign: 'middle'
        },
        headStyles: {
            fillColor: [2, 132, 199], // #0284c7
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'center', fontStyle: 'bold' },
            1: { halign: 'center' },
            6: { halign: 'center' },
            7: { halign: 'center' },
            8: { halign: 'right', fontStyle: 'bold' },
            9: { halign: 'center', fontStyle: 'bold' }
        },
        didDrawPage: function (data) {
            // Footer on each page
            const str = `Page ${doc.internal.getNumberOfPages()}`;
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(str, 283, 202, { align: 'right' });
            doc.text('Confidential - MediPulse Smart Hospital Patient Management Portal', 14, 202);
        }
    });

    const filename = `MediPulse_Appointments_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    showToast('PDF Exported!', `Report generated successfully with ${list.length} records.`, 'success');
}

/**
 * Export Filtered Doctors to PDF
 */
function exportDoctorsPDF() {
    const list = AppState.doctors.filter(doc => {
        const matchDept = AppState.selectedDepartment === 'all' || doc.departmentId === AppState.selectedDepartment;
        const matchSearch = !AppState.searchQuery || 
            doc.name.toLowerCase().includes(AppState.searchQuery) ||
            doc.departmentName.toLowerCase().includes(AppState.searchQuery) ||
            doc.bio.toLowerCase().includes(AppState.searchQuery);
        return matchDept && matchSearch;
    });

    if (list.length === 0) {
        showToast('Export Error', 'No doctors available to export.', 'warning');
        return;
    }

    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
        showToast('Export Error', 'PDF library not loaded.', 'danger');
        return;
    }

    const doc = new jsPDF('portrait', 'mm', 'a4');

    // Header Banner
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('MediPulse Smart Hospital - Specialist Directory', 14, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Department: ${AppState.selectedDepartment.toUpperCase()} | Generated: ${new Date().toLocaleDateString()}`, 14, 18);

    const tableColumns = ['Doctor Name', 'Department', 'Qualifications', 'Experience', 'Consultation Fee', 'Room Location'];
    const tableRows = list.map(d => [
        d.name,
        d.departmentName,
        d.title,
        `${d.experienceYears} Years`,
        `$${d.consultationFee}`,
        d.location
    ]);

    doc.autoTable({
        head: [tableColumns],
        body: tableRows,
        startY: 30,
        theme: 'striped',
        headStyles: { fillColor: [2, 132, 199], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 }
    });

    doc.save(`MediPulse_Doctors_Directory_${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('Doctors PDF Exported!', `Exported ${list.length} specialist profiles.`, 'success');
}

/**
 * Cancel Appointment Handler
 */
function cancelAppointment(appointmentId) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    const index = AppState.appointments.findIndex(a => a.id === appointmentId);
    if (index !== -1) {
        AppState.appointments[index].status = 'Cancelled';
        localStorage.setItem('medipulse_appointments', JSON.stringify(AppState.appointments));
        renderMyBookings();
        showToast('Appointment Cancelled', `Appointment ${appointmentId} has been cancelled.`, 'danger');
    }
}

/**
 * Open Digital Pass Modal
 */
function openPassModal(appointmentId) {
    const app = AppState.appointments.find(a => a.id === appointmentId);
    if (!app) return;

    const passContent = document.getElementById('printablePassArea');
    if (!passContent) return;

    passContent.innerHTML = `
        <div class="border border-2 border-primary rounded-4 overflow-hidden bg-white shadow">
            <div class="bg-primary text-white p-4 text-center">
                <h4 class="fw-bold mb-1"><i class="fas fa-heart-pulse me-2"></i>MediPulse Smart Hospital</h4>
                <p class="mb-0 small opacity-75">Digital OPD Appointment & Entry Token Pass</p>
            </div>
            
            <div class="p-4">
                <div class="row align-items-center mb-4 border-bottom pb-3">
                    <div class="col-6">
                        <span class="text-muted small fw-bold d-block">TOKEN NUMBER</span>
                        <h2 class="fw-bold text-primary mb-0">${app.tokenNumber}</h2>
                    </div>
                    <div class="col-6 text-end">
                        <span class="text-muted small fw-bold d-block">APPOINTMENT ID</span>
                        <h5 class="fw-bold text-dark mb-1">${app.id}</h5>
                        <div>${getStatusBadgeHtml(app.status)}</div>
                    </div>
                </div>

                <div class="row g-3 mb-4">
                    <div class="col-6">
                        <span class="text-muted small">Doctor:</span>
                        <div class="fw-bold text-dark">${app.doctorName}</div>
                    </div>
                    <div class="col-6">
                        <span class="text-muted small">Department:</span>
                        <div class="fw-bold text-dark">${app.departmentName}</div>
                    </div>
                    <div class="col-6">
                        <span class="text-muted small">Date & Time:</span>
                        <div class="fw-bold text-dark">${app.date} | ${app.timeSlot}</div>
                    </div>
                    <div class="col-6">
                        <span class="text-muted small">Location:</span>
                        <div class="fw-bold text-dark">${app.location}</div>
                    </div>
                    <div class="col-6">
                        <span class="text-muted small">Patient Name:</span>
                        <div class="fw-bold text-dark">${app.patientName} (${app.patientAge}y, ${app.gender})</div>
                    </div>
                    <div class="col-6">
                        <span class="text-muted small">Consultation Fee:</span>
                        <div class="fw-bold text-success">$${app.fee} (Paid at Counter)</div>
                    </div>
                </div>

                <div class="p-3 bg-light rounded-3 text-center mb-3">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(app.id)}" alt="Pass QR Code" class="img-fluid rounded mb-2" style="max-width: 120px;">
                    <p class="small text-muted mb-0">Scan at Hospital Kiosk or OPD Gate for express entry</p>
                </div>
            </div>

            <div class="bg-light p-3 text-center border-top small text-muted">
                Emergency Helpline: +1 (800) 555-0199 | MediPulse Hospital, Block 4 Medical Drive
            </div>
        </div>
    `;

    const passModal = new bootstrap.Modal(document.getElementById('digitalPassModal'));
    passModal.show();
}

/**
 * Print Appointment Pass
 */
function printAppointmentPass() {
    window.print();
}

/**
 * Render Live Queue Tracker
 */
function renderQueueStatus() {
    const container = document.getElementById('liveQueueContainer');
    if (!container) return;

    container.innerHTML = AppState.queue.map(q => `
        <div class="col-md-6 col-lg-3 mb-3">
            <div class="queue-card p-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="fw-bold text-dark small">${q.department}</span>
                    <span class="pulse-dot"></span>
                </div>
                <div class="text-center my-2">
                    <span class="text-muted small d-block">Serving Token</span>
                    <h3 class="fw-bold text-primary mb-0">${q.activeToken}</h3>
                </div>
                <div class="d-flex justify-content-between small text-muted border-top pt-2 mt-2">
                    <span><i class="fas fa-users me-1"></i>Waiting: ${q.totalWaiting}</span>
                    <span><i class="fas fa-clock me-1"></i>Est: ${q.estWaitMinutes} mins</span>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Show Bootstrap Toast Message
 */
function showToast(title, message, type = 'info') {
    const toastEl = document.getElementById('liveToast');
    const toastTitle = document.getElementById('toastTitle');
    const toastBody = document.getElementById('toastBody');
    if (!toastEl || !toastTitle || !toastBody) return;

    toastTitle.textContent = title;
    toastBody.textContent = message;

    const bsToast = new bootstrap.Toast(toastEl, { delay: 4000 });
    bsToast.show();
}

