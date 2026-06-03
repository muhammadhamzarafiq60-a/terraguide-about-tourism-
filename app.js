// start date=25 may 2026
const API_URL = 'http://localhost:3000';
let allPlaces = [];

const placesGrid = document.getElementById('placesGrid');
const filterEra = document.getElementById('filterEra');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMsg = document.getElementById('errorMsg');
const inquiryForm = document.getElementById('inquiryForm');


async function fetchPlaces() {
    showLoading(true);
    errorMsg.classList.add('d-none');
    try {
        const response = await fetch(`${API_URL}/places`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allPlaces = await response.json();
        renderPlaces(allPlaces);
    } catch (err) {
        errorMsg.innerText = `Failed to load places. Is JSON Server running? Error: ${err.message}`;
        errorMsg.classList.remove('d-none');
        placesGrid.innerHTML = '';
    } finally {
        showLoading(false);
    }
}

function renderPlaces(places) {
    if (!places.length) {
        placesGrid.innerHTML = `<div class="col-12 text-center">No heritage sites match the filter.</div>`;
        return;
    }
    placesGrid.innerHTML = places.map(place => `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 place-card shadow-sm">
                <img src="${place.image || 'https://via.placeholder.com/600x400'}" class="card-img-top" alt="${place.name}">
                <div class="card-body">
                    <h5 class="card-title">${place.name}</h5>
                    <p class="badge badge-location"><i class="fas fa-map-marker-alt"></i> ${place.location}</p>
                    <p class="badge bg-secondary">${place.era}</p>
                    <p class="card-text small">${place.history?.substring(0, 100)}...</p>
                    <button class="btn btn-outline-primary btn-sm view-detail" data-id="${place.id}">View Details</button>
                </div>
            </div>
        </div>
    `).join('');

    // Attach detail view listeners (simple alert for demo, or you can expand)
    document.querySelectorAll('.view-detail').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const place = allPlaces.find(p => p.id == id);
            alert(`${place.name}\n${place.history}\nBest season: ${place.bestSeason}`);
        });
    });
}

function showLoading(show) {
    if (show) loadingSpinner.classList.remove('d-none');
    else loadingSpinner.classList.add('d-none');
}

// Filter by era
function filterPlaces() {
    const era = filterEra.value;
    if (!era) {
        renderPlaces(allPlaces);
        return;
    }
    const filtered = allPlaces.filter(p => p.era === era);
    renderPlaces(filtered);
}

filterEra.addEventListener('change', filterPlaces);

// Inquiry Form - POST to /bookings with inline validation
inquiryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Get fields
    const name = document.getElementById('inqName');
    const email = document.getElementById('inqEmail');
    const phone = document.getElementById('inqPhone');
    const date = document.getElementById('inqDate');
    const place = document.getElementById('inqPlace');
    const message = document.getElementById('inqMessage');
    const feedback = document.getElementById('formFeedback');

    // Reset validation
    [name, email, phone, date].forEach(f => f.classList.remove('is-invalid'));
    let isValid = true;

    if (!name.value.trim()) { name.classList.add('is-invalid'); isValid = false; }
    if (!email.value.trim() || !email.validity.valid) { email.classList.add('is-invalid'); isValid = false; }
    if (!phone.value.trim() || !/^\d{10,13}$/.test(phone.value)) { phone.classList.add('is-invalid'); isValid = false; }
    if (!date.value) { date.classList.add('is-invalid'); isValid = false; }

    if (!isValid) {
        feedback.innerHTML = `<div class="alert alert-danger">Please fix the errors above.</div>`;
        return;
    }

    
    const booking = {
        name: name.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim(),
        travelDate: date.value,
        interestedPlace: place.value.trim(),
        message: message.value.trim(),
        createdAt: new Date().toISOString()
    };

    try {
        const response = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(booking)
        });
        if (!response.ok) throw new Error('Failed to submit');
        feedback.innerHTML = `<div class="alert alert-success">Thank you! We'll contact you soon.</div>`;
        inquiryForm.reset();
        setTimeout(() => feedback.innerHTML = '', 3000);
    } catch (err) {
        feedback.innerHTML = `<div class="alert alert-danger">Server error. Please try again.</div>`;
    }
});


fetchPlaces(); 
// end date =26 may 2026