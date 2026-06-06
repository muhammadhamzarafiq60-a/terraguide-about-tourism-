  // start date =29 may 2026
const API_URL = 'http://localhost:3000';
let currentEditId = null;

const adminTable = document.getElementById('adminPlacesTable');
const placeForm = document.getElementById('placeForm');
const editId = document.getElementById('editId');
const formTitle = document.getElementById('formTitle');
const cancelEditBtn = document.getElementById('cancelEdit');
const totalPlacesSpan = document.getElementById('totalPlaces');
const totalBookingsSpan = document.getElementById('totalBookings');
const avgFeeSpan = document.getElementById('avgFee');


async function fetchPlacesAndRender() {
    try {
        const response = await fetch(`${API_URL}/places`);
        if (!response.ok) throw new Error();
        const places = await response.json();
        renderPlacesTable(places);
        updateStats(places);
    } catch (err) {
        adminTable.innerHTML = '<tr><td colspan="6" class="text-danger text-center"><i class="fas fa-exclamation-triangle me-1"></i>Error loading places. Is JSON Server running?</td></tr>';
    }
}
function renderPlacesTable(places) {
    if (!places.length) {
        adminTable.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No heritage sites found.</td></tr>';
        return;
    }
    adminTable.innerHTML = places.map(place => `
        <tr>
            <td>${place.id}</td>
            <td>${place.name}</td>
            <td>${place.location}</td>
            <td>${place.era}</td>
            <td>PKR ${place.entryFee || 0}</td>
            <td>
                <button class="btn btn-sm btn-warning edit-btn me-1" data-id="${place.id}"><i class="fas fa-edit me-1"></i>Edit</button>
                <button class="btn btn-sm btn-danger delete-btn" data-id="${place.id}"><i class="fas fa-trash me-1"></i>Delete</button>
            </td>
        </tr>
    `).join('');

        document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => loadPlaceForEdit(btn.dataset.id));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deletePlace(btn.dataset.id));
    });
}

async function loadPlaceForEdit(id) {
    try {
        const response = await fetch(`${API_URL}/places/${id}`);
        if (!response.ok) throw new Error();
        const place = await response.json();
        currentEditId = place.id;
        editId.value = place.id;
        document.getElementById('name').value = place.name;
        document.getElementById('location').value = place.location;
        document.getElementById('era').value = place.era;
        document.getElementById('image').value = place.image || '';
        document.getElementById('entryFee').value = place.entryFee || 0;
        document.getElementById('history').value = place.history || '';
        document.getElementById('significance').value = place.significance || '';
        formTitle.innerHTML = '<i class="fas fa-edit me-1"></i>Edit Heritage Site';
        cancelEditBtn.classList.remove('d-none');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
        alert('Could not load place for editing. Check if JSON Server is running.');
    }
}

async function deletePlace(id) {
    const confirmDel = confirm('Are you sure you want to delete this heritage site?');
    if (!confirmDel) return;
    try {
        const response = await fetch(`${API_URL}/places/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error();
        fetchPlacesAndRender();
    } catch (err) {
        alert('Delete failed. Check if JSON Server is running.');
    }
}

placeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const placeData = {
        name: document.getElementById('name').value,
        location: document.getElementById('location').value,
        era: document.getElementById('era').value,
        image: document.getElementById('image').value,
        entryFee: parseInt(document.getElementById('entryFee').value) || 0,
        history: document.getElementById('history').value,
        significance: document.getElementById('significance').value,
        bestSeason: "All year"
    };

    try {
        let response;
        if (currentEditId) {
                        response = await fetch(`${API_URL}/places/${currentEditId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...placeData, id: currentEditId })
            });
        } else {response = await fetch(`${API_URL}/places`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(placeData)
            });
        }
        if (!response.ok) throw new Error();

        resetForm();
        fetchPlacesAndRender();
    } catch (err) {
        alert('Failed to save place. Ensure JSON Server is running.');
    }
});

cancelEditBtn.addEventListener('click', () => {
    resetForm();
});

function resetForm() {
    placeForm.reset();
    editId.value = '';
    currentEditId = null;
    formTitle.innerHTML = '<i class="fas fa-plus-circle me-1"></i>Add New Heritage Site';
    cancelEditBtn.classList.add('d-none');
}


async function updateStats(places) {
    const totalPlaces = places.length;
    const totalFee = places.reduce((sum, p) => sum + (p.entryFee || 0), 0);
    const avgFee = totalPlaces ? (totalFee / totalPlaces).toFixed(0) : 0;
    totalPlacesSpan.innerText = totalPlaces;
    avgFeeSpan.innerText = avgFee;

        try {
        const bookingsRes = await fetch(`${API_URL}/bookings`);
        if (bookingsRes.ok) {
            const bookings = await bookingsRes.json();
            totalBookingsSpan.innerText = bookings.length;
        }
    } catch (err) {
        totalBookingsSpan.innerText = '?';
    }
}


fetchPlacesAndRender();
// end  date =30 may 2026
