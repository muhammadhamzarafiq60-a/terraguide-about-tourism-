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
        console.error(err);
        adminTable.innerHTML = '<tr><td colspan="6" class="text-danger">Error loading places. Is JSON Server running?</td></tr>';
    }
}

function renderPlacesTable(places) {
    if (!places.length) {
        adminTable.innerHTML = '<tr><td colspan="6">No heritage sites found.</td></tr>';
        return;
    }
    adminTable.innerHTML = places.map(place => `
        <tr>
            <td>${place.id}</td>
            <td>${place.name}</td>
            <td>${place.location}</td>
            <td>${place.era}</td>
            <td>${place.entryFee || '0'}</td>
            <td>
                <button class="btn btn-sm btn-warning edit-btn" data-id="${place.id}"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn btn-sm btn-danger delete-btn" data-id="${place.id}"><i class="fas fa-trash"></i> Delete</button>
            </td>
        </tr>
    `).join('');

    // Attach edit and delete events
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
        formTitle.innerText = 'Edit Heritage Site';
        cancelEditBtn.classList.remove('d-none');
    } catch (err) {
        alert('Could not load place for editing.');
    }
}
async function deletePlace(id) {
    const confirmDel = confirm('Are you sure you want to delete this heritage site?');
    if (!confirmDel) return;
    try {
        const response = await fetch(`${API_URL}/places/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error();
        fetchPlacesAndRender(); // refresh list and stats
    } catch (err) {
        alert('Delete failed. Check server.');
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
        bestSeason: "All year"  // default
    };
    try {
        let response;
        if (currentEditId) {
            
            response = await fetch(`${API_URL}/places/${currentEditId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...placeData, id: currentEditId })
            });
        } else {
            
            response = await fetch(`${API_URL}/places`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(placeData)
            });
        }
        if (!response.ok) throw new Error();
        
        placeForm.reset();
        editId.value = '';
        currentEditId = null;
        formTitle.innerText = 'Add New Heritage Site';
        cancelEditBtn.classList.add('d-none');
        fetchPlacesAndRender();
    } catch (err) {
        alert('Failed to save place. Ensure server is running.');
    }
});
cancelEditBtn.addEventListener('click', () => {
    placeForm.reset();
    editId.value = '';
    currentEditId = null;
    formTitle.innerText = 'Add New Heritage Site';
    cancelEditBtn.classList.add('d-none');
});
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