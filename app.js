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
    showLoading(true);    errorMsg.classList.add('d-none');
    try {
        const response = await fetch(`${API_URL}/places`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        allPlaces = await response.json();
        applyFiltersAndSort();
    } catch (err) {
        errorMsg.innerText = `Error: ${err.message}. Is JSON Server running?`;
        errorMsg.classList.remove('d-none');
        placesGrid.innerHTML = '';
    } finally {
        showLoading(false);
    }
}

async function fetchPackages() {
    const packagesContainer = document.getElementById('packagesGrid');
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
        packagesError.innerText = 'Could not load packages.';
    } finally {
        packagesLoading.classList.add('d-none');
    }
}

function renderPackages() {
    const container = document.getElementById('packagesGrid');
    if (!packagesList.length) {
        container.innerHTML = '<div class="col-12">No packages available.</div>';
        return;
    }
    container.innerHTML = packagesList.map(pkg => `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 shadow-sm">
                <div class="card-body">
                    <h5 class="card-title">${pkg.title}</h5>
                    <p class="badge bg-info">${pkg.duration}</p>
                    <p class="badge bg-success">${pkg.price}</p>
                    <p class="card-text small">${pkg.description}</p>
                    <p><strong>Includes:</strong> ${pkg.includes.join(', ')}</p>
                    <button class="btn btn-sm btn-primary book-package" data-title="${pkg.title}">Book Now</button>
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
 function applyFiltersAndSort() {
    let result = [...allPlaces];
    if (currentFilterEra) {
        result = result.filter(p => p.era === currentFilterEra);
    }
        if (currentSearchTerm) {
        const term = currentSearchTerm.toLowerCase();
        result = result.filter(p => p.name.toLowerCase().includes(term) || p.location.toLowerCase().includes(term));
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
        placesGrid.innerHTML = '<div class="col-12 text-center">No places match your criteria.</div>';
        pageInfo.innerText = '';
        prevPageBtn.disabled = true;
        nextPageBtn.disabled = true;
        return;
    }
    placesGrid.innerHTML = pagePlaces.map(place => `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 place-card shadow-sm">
                <img src="${place.image || 'https://via.placeholder.com/600x400'}" class="card-img-top" alt="${place.name}" onerror="this.src='https://via.placeholder.com/600x400'">
                <div class="card-body">
                    <h5 class="card-title">${place.name}</h5>
                    <p class="badge bg-secondary">${place.location}</p>
                    <p class="badge bg-dark">${place.era}</p>
                    <p class="card-text small">${place.history.substring(0, 100)}...</p>
                    <button class="btn btn-outline-primary btn-sm view-detail" data-id="${place.id}">Details</button>
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
            alert(`${place.name}\n${place.history}\nBest season: ${place.bestSeason}\nEntry fee: PKR ${place.entryFee}`);
        });
    });
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
        alert('No data to export.');
        return;
    }
    const headers = ['ID', 'Name', 'Location', 'Era', 'Entry Fee (PKR)', 'Best Season'];
    const rows = filteredPlaces.map(p => [p.id, p.name, p.location, p.era, p.entryFee, p.bestSeason]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `terra-guide-places-${new Date().toISOString().slice(0,19)}.csv`;
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
    // Inline validation
    [name, email, phone, date].forEach(f => f.classList.remove('is-invalid'));
    let valid = true;
    if (!name.value.trim()) { name.classList.add('is-invalid'); valid = false; }
    if (!email.value.trim() || !email.validity.valid) { email.classList.add('is-invalid'); valid = false; }
    if (!phone.value.trim() || !/^\d{10,13}$/.test(phone.value)) { phone.classList.add('is-invalid'); valid = false; }
    if (!date.value) { date.classList.add('is-invalid'); valid = false; }
    if (!valid) { feedback.innerHTML = '<div class="alert alert-danger">Please fix errors above.</div>'; return; }
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
        feedback.innerHTML = '<div class="alert alert-success">Request sent! We will contact you soon.</div>';
        inquiryForm.reset();
        setTimeout(() => feedback.innerHTML = '', 3000);
    } catch (err) {
        feedback.innerHTML = '<div class="alert alert-danger">Server error. Try again later.</div>';
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
