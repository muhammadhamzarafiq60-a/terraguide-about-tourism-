  // start date=25 may 2026
const API_URL = 'http://localhost:3000';
let allPlaces = [];
let filteredPlaces = [];
let currentPage = 1;
const itemsPerPage = 6;
let currentSort = 'name';
let currentFilterEra = '';
let currentSearchTerm = '';
let packagesList = [];

const placesGrid = document.getElementById('placesGrid');
const filterEra = document.getElementById('filterEra');
const searchInput = document.getElementById('searchInput');
const sortBy = document.getElementById('sortBy');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMsg = document.getElementById('errorMsg');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const exportBtn = document.getElementById('exportCsvBtn');
const darkModeToggle = document.getElementById('darkModeToggle');


const FALLBACK_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">' +
    '<rect fill="#e9ecef" width="600" height="400"/>' +
    '<text fill="#6c757d" font-family="Arial,sans-serif" font-size="24" x="50%" y="50%" text-anchor="middle" dy=".3em">Image Unavailable</text>' +
    '</svg>'
);
function initDarkMode() {
    const savedTheme = localStorage.getItem('terra-guide-theme');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-bs-theme', 'dark');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i> Light';
    } else {
        document.body.setAttribute('data-bs-theme', 'light');
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark';
    }
}

darkModeToggle.addEventListener('click', () => {
    const current = document.body.getAttribute('data-bs-theme');
    if (current === 'dark') {
        document.body.setAttribute('data-bs-theme', 'light');
        localStorage.setItem('terra-guide-theme', 'light');
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark';
    } else {
        document.body.setAttribute('data-bs-theme', 'dark');
        localStorage.setItem('terra-guide-theme', 'dark');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i> Light';
    }
});


async function fetchPlaces() {
    showLoading(true);
    errorMsg.classList.add('d-none');
    try {
        const response = await fetch(`${API_URL}/places`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        allPlaces = await response.json();
        populateEraFilter();
        applyFiltersAndSort();
    } catch (err) {
        errorMsg.innerHTML = `<i class="fas fa-exclamation-triangle me-1"></i> Error: ${err.message}. Is JSON Server running? Run: <code>npx json-server --watch db.json</code>`;
        errorMsg.classList.remove('d-none');
        placesGrid.innerHTML = '';
    } finally {
        showLoading(false);
    }
}


async function fetchPackages() {
    const packagesLoading = document.getElementById('packagesLoading');
    const packagesError = document.getElementById('packagesError');
    try {
        packagesLoading.classList.remove('d-none');
        const res = await fetch(`${API_URL}/packages`);
        if (!res.ok) throw new Error();
        packagesList = await res.json();
        renderPackages();
    } catch (err) {
        packagesError.classList.remove('d-none');
        packagesError.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i> Could not load packages. Is JSON Server running?';
    } finally {
        packagesLoading.classList.add('d-none');
    }
}


function renderPackages() {
    const container = document.getElementById('packagesGrid');
    if (!packagesList.length) {
        container.innerHTML = '<div class="col-12 text-center text-muted py-3"><i class="fas fa-box-open fa-2x mb-2"></i><p>No packages available.</p></div>';
        return;
    }
    container.innerHTML = packagesList.map(pkg => `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 shadow-sm">
                <div class="card-body">
                    <h5 class="card-title">${pkg.title}</h5>
                    <p><span class="badge bg-info me-1">${pkg.duration}</span><span class="badge bg-success">${pkg.price}</span></p>
                    <p class="card-text small">${pkg.description}</p>
                    <p class="small"><strong>Includes:</strong> ${pkg.includes.join(', ')}</p>
                    <button class="btn btn-sm btn-primary book-package" data-title="${pkg.title}"><i class="fas fa-bookmark me-1"></i>Book Now</button>
                </div>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.book-package').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('inqPlace').value = btn.dataset.title;
            document.getElementById('inqPlace').scrollIntoView({ behavior: 'smooth' });
        });
    });
}


function populateEraFilter() {
    const eras = [...new Set(allPlaces.map(p => p.era))].sort();
    
    filterEra.innerHTML = '<option value="">All Eras</option>';
    eras.forEach(era => {
        const option = document.createElement('option');
        option.value = era;
        option.textContent = era;
        filterEra.appendChild(option);
    });
}
function applyFiltersAndSort() {
    let result = [...allPlaces];
if (currentFilterEra) {
        result = result.filter(p => p.era === currentFilterEra);
    }

if (currentSearchTerm) {
        const term = currentSearchTerm.toLowerCase();
        result = result.filter(p =>
            p.name.toLowerCase().includes(term) ||
            p.location.toLowerCase().includes(term)
        );
    }
        const [field, order] = currentSort.split('-');
    result.sort((a, b) => {
        let valA, valB;
        if (field === 'name') { valA = a.name; valB = b.name; }
        else if (field === 'era') { valA = a.era; valB = b.era; }
        else if (field === 'fee') { valA = a.entryFee || 0; valB = b.entryFee || 0; }
        else { valA = a.name; valB = b.name; }

        if (typeof valA === 'string') {
            return order === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
        } else {
            return order === 'desc' ? valB - valA : valA - valB;
        }
    });

    filteredPlaces = result;
    currentPage = 1;
    renderPaginatedPlaces();
}

function renderPaginatedPlaces() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pagePlaces = filteredPlaces.slice(start, end);

    if (!pagePlaces.length) {
        placesGrid.innerHTML = '<div class="col-12 text-center text-muted py-5"><i class="fas fa-search fa-3x mb-3"></i><p>No places match your criteria.</p></div>';
        pageInfo.innerText = '';
        prevPageBtn.disabled = true;
        nextPageBtn.disabled = true;
        return;
    }

    placesGrid.innerHTML = pagePlaces.map(place => `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 place-card shadow-sm">
                <img src="${place.image || FALLBACK_IMAGE}"
                     class="card-img-top"
                     alt="${place.name}"
                     loading="lazy"
                     onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${place.name}</h5>
                    <div class="mb-2">
                        <span class="badge bg-secondary me-1"><i class="fas fa-map-pin me-1"></i>${place.location}</span>
                        <span class="badge bg-dark">${place.era}</span>
                    </div>
                    <p class="card-text small flex-grow-1">${(place.history || 'No description available').substring(0, 100)}...</p>
                    <div class="d-flex justify-content-between align-items-center mt-auto">
                        <span class="badge bg-success">PKR ${place.entryFee || 0}</span>
                        <button class="btn btn-outline-primary btn-sm view-detail" data-id="${place.id}"><i class="fas fa-info-circle me-1"></i>Details</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    const totalPages = Math.ceil(filteredPlaces.length / itemsPerPage);
    pageInfo.innerText = `Page ${currentPage} of ${totalPages || 1}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;

        document.querySelectorAll('.view-detail').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const place = allPlaces.find(p => p.id == id);
            if (place) {
                showPlaceDetail(place);
            }
        });
    });
}
function showPlaceDetail(place) {
    const modalHtml = `
        <div class="modal fade" id="placeDetailModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${place.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <img src="${place.image || FALLBACK_IMAGE}" class="img-fluid rounded mb-3" alt="${place.name}" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';">
                        <p><strong><i class="fas fa-map-marker-alt me-1"></i>Location:</strong> ${place.location}</p>
                        <p><strong><i class="fas fa-clock me-1"></i>Era:</strong> ${place.era}</p>
                        <p><strong><i class="fas fa-book me-1"></i>History:</strong> ${place.history || 'No history available.'}</p>
                        <p><strong><i class="fas fa-sun me-1"></i>Best Season:</strong> ${place.bestSeason || 'All year'}</p>
                        <p><strong><i class="fas fa-ticket-alt me-1"></i>Entry Fee:</strong> PKR ${place.entryFee || 0}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
        const existingModal = document.getElementById('placeDetailModal');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('placeDetailModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
}

let debounceTimer;
searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        currentSearchTerm = e.target.value;
        applyFiltersAndSort();
    }, 300);
});

filterEra.addEventListener('change', (e) => {
    currentFilterEra = e.target.value;
    applyFiltersAndSort();
});

sortBy.addEventListener('change', (e) => {
    currentSort = e.target.value;
    applyFiltersAndSort();
});

prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; renderPaginatedPlaces(); }
});

nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredPlaces.length / itemsPerPage);
    if (currentPage < totalPages) { currentPage++; renderPaginatedPlaces(); }
});

exportBtn.addEventListener('click', () => {
    if (!filteredPlaces.length) {
        const feedback = document.getElementById('formFeedback');
        feedback.innerHTML = '<div class="alert alert-warning"><i class="fas fa-info-circle me-1"></i>No data to export. Adjust your filters first.</div>';
        setTimeout(() => feedback.innerHTML = '', 3000);
        return;
    }
    const headers = ['ID', 'Name', 'Location', 'Era', 'Entry Fee (PKR)', 'Best Season'];
    const rows = filteredPlaces.map(p => [p.id, p.name, p.location, p.era, p.entryFee, p.bestSeason]);
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `terra-guide-places-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
});
const inquiryForm = document.getElementById('inquiryForm');
inquiryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('inqName');
    const email = document.getElementById('inqEmail');
    const phone = document.getElementById('inqPhone');
    const date = document.getElementById('inqDate');
    const feedback = document.getElementById('formFeedback');

        [name, email, phone, date].forEach(f => f.classList.remove('is-invalid'));
    let valid = true;

    if (!name.value.trim()) { name.classList.add('is-invalid'); valid = false; }
    if (!email.value.trim() || !email.validity.valid) { email.classList.add('is-invalid'); valid = false; }
    if (!phone.value.trim() || !/^\d{10,13}$/.test(phone.value)) { phone.classList.add('is-invalid'); valid = false; }
    if (!date.value) { date.classList.add('is-invalid'); valid = false; }

    if (!valid) {
        feedback.innerHTML = '<div class="alert alert-danger"><i class="fas fa-exclamation-circle me-1"></i>Please fix errors above.</div>';
        return;
    }

    const booking = {
        name: name.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim(),
        travelDate: date.value,
        interestedPlace: document.getElementById('inqPlace').value.trim(),
        message: document.getElementById('inqMessage').value.trim(),
        createdAt: new Date().toISOString()
    };

    try {
        const res = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(booking)
        });
        if (!res.ok) throw new Error();
        feedback.innerHTML = '<div class="alert alert-success"><i class="fas fa-check-circle me-1"></i>Request sent! We will contact you soon.</div>';
        inquiryForm.reset();
        setTimeout(() => feedback.innerHTML = '', 4000);
    } catch (err) {
        feedback.innerHTML = '<div class="alert alert-danger"><i class="fas fa-exclamation-triangle me-1"></i>Server error. Try again later.</div>';
    }
});

function showLoading(show) {
    if (show) loadingSpinner.classList.remove('d-none');
    else loadingSpinner.classList.add('d-none');
}


initDarkMode();
fetchPlaces();
fetchPackages();
// end date =26 may 2026
