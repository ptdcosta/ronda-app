// -------------------------------------------------------------------
// PASTE YOUR GOOGLE APPS SCRIPT URL HERE
const SCRIPT_URL = "YOUR_SCRIPT_URL_GOES_HERE";
// -------------------------------------------------------------------
// PASTE YOUR GOOGLE SHEET URL HERE (for the "Ir para BD" button)
const SHEET_URL = "YOUR_GOOGLE_SHEET_URL_GOES_HERE";
// -------------------------------------------------------------------


// DOM Elements
const form = document.getElementById('entryForm');
const ruaSelect = document.getElementById('ruaSelect');
const newRuaInput = document.getElementById('newRuaInput');
const addRuaBtn = document.getElementById('addRuaBtn');
const clearDataBtn = document.getElementById('clearDataBtn');
const dbLink = document.getElementById('dbLink');

// Data fields
const fields = ['utentes', 'kit', 'sopa', 'cafe', 'roupa'];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadRuas();
    loadTotals();
    setupCounters();
    dbLink.href = SHEET_URL;
});

// Event Listeners
form.addEventListener('submit', handleFormSubmit);
addRuaBtn.addEventListener('click', addNewRua);
clearDataBtn.addEventListener('click', clearDailyData);
// **NEW**: Listen for changes on the dropdown to reset the form
ruaSelect.addEventListener('change', resetFormFields);

function resetFormFields() {
    fields.forEach(field => document.getElementById(field).value = 0);
}

function setupCounters() {
    document.querySelectorAll('.btn-plus, .btn-minus').forEach(button => {
        button.addEventListener('click', (e) => {
            const field = e.target.dataset.field;
            const input = document.getElementById(field);
            let value = parseInt(input.value, 10);
            if (e.target.classList.contains('btn-plus')) {
                value++;
            } else {
                value = Math.max(0, value - 1);
            }
            input.value = value;
        });
    });
}

function loadRuas() {
    ruaSelect.innerHTML = '<option>Loading streets...</option>';
    fetch(SCRIPT_URL)
        .then(res => res.json())
        .then(data => {
            if (data.ruas && data.ruas.length > 0) {
                populateRuaDropdown(data.ruas);
                localStorage.setItem('ruas', JSON.stringify(data.ruas));
            } else {
                const localRuas = JSON.parse(localStorage.getItem('ruas')) || [];
                populateRuaDropdown(localRuas);
            }
        })
        .catch(error => {
            console.error("Error fetching streets, loading from backup:", error);
            const localRuas = JSON.parse(localStorage.getItem('ruas')) || [];
            populateRuaDropdown(localRuas);
        });
}

function populateRuaDropdown(ruas) {
    if (ruas.length > 0) {
        ruaSelect.innerHTML = ruas.map(rua => `<option value="${rua}">${rua}</option>`).join('');
    } else {
        ruaSelect.innerHTML = '<option>No streets found. Add one below.</option>';
    }
}

// **UPDATED**: This function now saves the new street to the Google Sheet
async function addNewRua() {
    const newRua = newRuaInput.value.trim();
    if (!newRua) return;

    addRuaBtn.disabled = true;
    addRuaBtn.textContent = 'Adding...';

    // Create a dummy record to send to the sheet
    const formData = {
        timestamp: new Date().toLocaleString("pt-PT"),
        rua: newRua,
        utentes: '', kit: '', sopa: '', cafe: '', roupa: ''
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const result = await response.json();

        if (result.result === 'success') {
            // Add the new street to the dropdown locally for immediate use
            const optionExists = Array.from(ruaSelect.options).some(opt => opt.value === newRua);
            if (!optionExists) {
                const newOption = document.createElement('option');
                newOption.value = newRua;
                newOption.textContent = newRua;
                ruaSelect.appendChild(newOption);
                ruaSelect.value = newRua; // Select the newly added street
            }
            alert('New street added successfully!');
            newRuaInput.value = '';
        } else {
            throw new Error(result.message || 'Failed to add street.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Could not add new street. Please try again.');
    } finally {
        addRuaBtn.disabled = false;
        addRuaBtn.textContent = 'Adicionar';
    }
}


function loadTotals() {
    fields.forEach(field => {
        const total = localStorage.getItem(`total_${field}`) || 0;
        document.getElementById(`total${capitalize(field)}`).textContent = total;
    });
}

function updateTotals(data) {
    fields.forEach(field => {
        if (data[field]) { // Only add to total if data exists
            const currentTotal = parseInt(localStorage.getItem(`total_${field}`) || 0, 10);
            const newTotal = currentTotal + parseInt(data[field], 10);
            localStorage.setItem(`total_${field}`, newTotal);
        }
    });
    loadTotals();
}

function clearDailyData() {
    if (confirm('Are you sure you want to clear all totals for the day?')) {
        fields.forEach(field => {
            localStorage.setItem(`total_${field}`, 0);
        });
        loadTotals();
    }
}

function handleFormSubmit(e) {
    e.preventDefault();
    const submitButton = e.target.querySelector('.btn-submit');
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    const formData = {
        timestamp: new Date().toLocaleString("pt-PT"),
        rua: ruaSelect.value
    };
    fields.forEach(field => formData[field] = document.getElementById(field).value);

    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if(data.result === 'success') {
            updateTotals(formData);
            resetFormFields(); // Reset form fields after successful submission
            alert('Data saved successfully!');
        } else {
            throw new Error(data.message || 'Unknown error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to save data. Please try again.');
    })
    .finally(() => {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit';
    });
}

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
}