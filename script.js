// -------------------------------------------------------------------
// PASTE YOUR GOOGLE APPS SCRIPT URL HERE
const SCRIPT_URL = "YOUR_SCRIPT_URL_GOES_HERE";
// -------------------------------------------------------------------
// PASTE YOUR GOOGLE SHEET URL HERE (for the "Ir para BD" button)
const SHEET_URL = "YOUR_SHEET_URL_GOES_HERE";
// -------------------------------------------------------------------

const form = document.getElementById('entryForm');
const ruaSelect = document.getElementById('ruaSelect');
const newRuaInput = document.getElementById('newRuaInput');
const addRuaBtn = document.getElementById('addRuaBtn');
const clearDataBtn = document.getElementById('clearDataBtn');
const dbLink = document.getElementById('dbLink');
const fields = ['utentes', 'kit', 'sopa', 'cafe', 'roupa'];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    form.action = SCRIPT_URL;
    loadRuas();
    loadTotals();
    setupCounters();
    dbLink.href = SHEET_URL;
});

// Event Listeners
form.addEventListener('submit', handleFormSubmit);
addRuaBtn.addEventListener('click', addNewRua);
ruaSelect.addEventListener('change', displayDataForSelectedStreet); // **UPDATED**
clearDataBtn.addEventListener('click', clearDailyData);


// **NEW**: This function now checks memory when you change streets
function displayDataForSelectedStreet() {
    const selectedRua = ruaSelect.value;
    const sessionData = JSON.parse(localStorage.getItem('sessionData')) || {};
    
    if (sessionData[selectedRua]) {
        // If data exists, populate the fields
        const entry = sessionData[selectedRua];
        fields.forEach(field => {
            document.getElementById(field).value = entry[field] || 0;
        });
    } else {
        // Otherwise, reset the fields
        resetFormFields();
    }
}

// **UPDATED**: This function now saves the entry to session memory
function handleFormSubmit(e) {
    const submitButton = e.target.querySelector('.btn-submit');
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    const formData = { rua: ruaSelect.value };
    fields.forEach(field => formData[field] = document.getElementById(field).value);
    
    // Save the current entry to session data
    let sessionData = JSON.parse(localStorage.getItem('sessionData')) || {};
    sessionData[formData.rua] = formData;
    localStorage.setItem('sessionData', JSON.stringify(sessionData));

    updateTotals(formData);

    setTimeout(() => {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit';
        alert('Data saved successfully!');
        // Do not reset fields, keep them showing the submitted data
    }, 1500);
}

// Resets all number fields to 0
function resetFormFields() {
    fields.forEach(field => document.getElementById(field).value = 0);
}

// The rest of the code remains largely the same
function loadRuas() {
    fetch(SCRIPT_URL)
        .then(res => res.json())
        .then(data => {
            if (data.ruas && data.ruas.length > 0) {
                populateRuaDropdown(data.ruas);
            }
        });
}

function populateRuaDropdown(ruas) {
    ruaSelect.innerHTML = ruas.map(rua => `<option value="${rua}">${rua}</option>`).join('');
    // After loading streets, display data for the first one
    displayDataForSelectedStreet(); 
}

function addNewRua() {
    const newRua = newRuaInput.value.trim();
    if (!newRua) return;
    
    const tempForm = document.createElement('form');
    tempForm.method = 'post';
    tempForm.action = SCRIPT_URL;
    tempForm.target = 'hidden_iframe';
    
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'newRua';
    hiddenInput.value = newRua;
    tempForm.appendChild(hiddenInput);
    
    document.body.appendChild(tempForm);
    tempForm.submit();
    document.body.removeChild(tempForm);
    
    const newOption = document.createElement('option');
    newOption.value = newRua;
    newOption.textContent = newRua;
    ruaSelect.appendChild(newOption);
    ruaSelect.value = newRua;
    newRuaInput.value = '';
    alert('New street added successfully!');
}

function setupCounters() {
    document.querySelectorAll('.btn-plus, .btn-minus').forEach(button => {
        button.addEventListener('click', (e) => {
            const field = e.target.dataset.field;
            const input = document.getElementById(field);
            let value = parseInt(input.value, 10);
            value += e.target.classList.contains('btn-plus') ? 1 : -1;
            input.value = Math.max(0, value);
        });
    });
}

function loadTotals() {
    fields.forEach(field => {
        const total = localStorage.getItem(`total_${field}`) || 0;
        document.getElementById(`total${capitalize(field)}`).textContent = total;
    });
}

function updateTotals() {
    const sessionData = JSON.parse(localStorage.getItem('sessionData')) || {};
    const dailyTotals = { utentes: 0, kit: 0, sopa: 0, cafe: 0, roupa: 0 };

    for (const rua in sessionData) {
        for (const field of fields) {
            dailyTotals[field] += parseInt(sessionData[rua][field] || 0, 10);
        }
    }

    fields.forEach(field => {
        localStorage.setItem(`total_${field}`, dailyTotals[field]);
        document.getElementById(`total${capitalize(field)}`).textContent = dailyTotals[field];
    });
}

function clearDailyData() {
    if (confirm('Are you sure you want to clear all data for this session?')) {
        // Clear both totals and the remembered entries for each street
        localStorage.removeItem('sessionData'); 
        fields.forEach(field => localStorage.setItem(`total_${field}`, 0));
        loadTotals();
        resetFormFields();
    }
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }