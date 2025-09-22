// -------------------------------------------------------------------
// PASTE YOUR GOOGLE APPS SCRIPT URL HERE
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwdniM6hGivngDHdoJWcnJgFSuJB_rnx1i9GidtNgNBDRS-aKq344X0MHOI-eRhptS1/exec";
// -------------------------------------------------------------------
// PASTE YOUR GOOGLE SHEET URL HERE (for the "Ir para BD" button)
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1JFg7kvB1RqsjyoVlcocnRugjqkVWEcQctx3KSD8yfQs/edit?gid=0#gid=0";
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

// REPLACE the old loadRuas function with this one
function loadRuas() {
    ruaSelect.innerHTML = '<option>Loading streets...</option>';
    
    // Fetch the list of streets from our Google Sheet
    fetch(SCRIPT_URL) // A GET request is the default
        .then(res => res.json())
        .then(data => {
            if (data.ruas && data.ruas.length > 0) {
                populateRuaDropdown(data.ruas);
                // Save to local storage as a backup for offline use
                localStorage.setItem('ruas', JSON.stringify(data.ruas));
            } else {
                // If sheet is empty, load from backup or show message
                const localRuas = JSON.parse(localStorage.getItem('ruas')) || [];
                if (localRuas.length > 0) {
                    populateRuaDropdown(localRuas);
                } else {
                    ruaSelect.innerHTML = '<option>No streets found. Add one below.</option>';
                }
            }
        })
        .catch(error => {
            console.error("Error fetching streets, loading from backup:", error);
            // If the network fails, load from the backup in local storage
            const localRuas = JSON.parse(localStorage.getItem('ruas')) || [];
            populateRuaDropdown(localRuas);
        });
}

// ADD this new helper function anywhere in your script.js
function populateRuaDropdown(ruas) {
    if (ruas.length > 0) {
        ruaSelect.innerHTML = ruas.map(rua => `<option value="${rua}">${rua}</option>`).join('');
    } else {
        ruaSelect.innerHTML = '<option>No streets found. Add one below.</option>';
    }
}

function addNewRua() {
    const newRua = newRuaInput.value.trim();
    if (newRua) {
        let ruas = JSON.parse(localStorage.getItem('ruas')) || [];
        if (!ruas.includes(newRua)) {
            ruas.push(newRua);
            ruas.sort();
            localStorage.setItem('ruas', JSON.stringify(ruas));
            loadRuas();
            ruaSelect.value = newRua;
        }
        newRuaInput.value = '';
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
        const currentTotal = parseInt(localStorage.getItem(`total_${field}`) || 0, 10);
        const newTotal = currentTotal + parseInt(data[field], 10);
        localStorage.setItem(`total_${field}`, newTotal);
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
            // Reset form fields
            fields.forEach(field => document.getElementById(field).value = 0);
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