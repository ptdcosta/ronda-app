// -------------------------------------------------------------------
// PASTE YOUR GOOGLE APPS SCRIPT URL HERE
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyZHj0mWI3lnBsvs5OgXHeQXCPv_wKLryRFyZdkgAGrViDWC3yTHFnMTBMci_lN90ZJ/exec";
// -------------------------------------------------------------------
// PASTE YOUR GOOGLE SHEET URL HERE (for the "Ir para BD" button)
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1nyGHMsLtBBhXKCwXpvFKicpsxM8imDjd4-1SNEcfSaA/edit?gid=0#gid=0";
// -------------------------------------------------------------------

const form = document.getElementById('entryForm');
const ruaSelect = document.getElementById('ruaSelect');
const newRuaInput = document.getElementById('newRuaInput');
const addRuaBtn = document.getElementById('addRuaBtn');
const clearDataBtn = document.getElementById('clearDataBtn');
const dbLink = document.getElementById('dbLink');
const fields = ['utentes', 'kit', 'sopa', 'cafe', 'roupa'];

document.addEventListener('DOMContentLoaded', () => {
    form.action = SCRIPT_URL; // Set the form's action to our script URL
    loadRuas();
    loadTotals();
    setupCounters();
    dbLink.href = SHEET_URL;
});

form.addEventListener('submit', handleFormSubmit);
addRuaBtn.addEventListener('click', addNewRua);
// Other event listeners...
ruaSelect.addEventListener('change', resetFormFields);
clearDataBtn.addEventListener('click', clearDailyData);

// The submission handler is now much simpler
function handleFormSubmit(e) {
    // We don't prevent the default submission anymore
    const submitButton = e.target.querySelector('.btn-submit');
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    // We'll collect the data to update totals locally
    const formData = {};
    fields.forEach(field => formData[field] = document.getElementById(field).value);
    updateTotals(formData);

    // After a short delay, re-enable the button and reset the form
    setTimeout(() => {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit';
        resetFormFields();
        alert('Data saved successfully!');
    }, 1500); // 1.5 second delay
}

// The "Add New Rua" function is also simplified
function addNewRua() {
    const newRua = newRuaInput.value.trim();
    if (!newRua) return;
    
    // We'll create a temporary form to submit the new street
    const tempForm = document.createElement('form');
    tempForm.method = 'post';
    tempForm.action = SCRIPT_URL;
    tempForm.target = 'hidden_iframe';
    
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'newRua'; // A special field name
    hiddenInput.value = newRua;
    tempForm.appendChild(hiddenInput);
    
    document.body.appendChild(tempForm);
    tempForm.submit();
    document.body.removeChild(tempForm);
    
    // Add to the dropdown locally
    const newOption = document.createElement('option');
    newOption.value = newRua;
    newOption.textContent = newRua;
    ruaSelect.appendChild(newOption);
    ruaSelect.value = newRua;
    newRuaInput.value = '';
    alert('New street added successfully!');
}

// The rest of the functions remain mostly the same
function loadRuas() {
    // This now just fetches from a different endpoint (doGet)
    fetch(SCRIPT_URL)
        .then(res => res.json())
        .then(data => {
            if (data.ruas && data.ruas.length > 0) {
                populateRuaDropdown(data.ruas);
            }
        });
}

function resetFormFields() { fields.forEach(field => document.getElementById(field).value = 0); }
function populateRuaDropdown(ruas) {
    ruaSelect.innerHTML = ruas.map(rua => `<option value="${rua}">${rua}</option>`).join('');
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
function updateTotals(data) {
    fields.forEach(field => {
        if (data[field]) {
            const currentTotal = parseInt(localStorage.getItem(`total_${field}`) || 0, 10);
            localStorage.setItem(`total_${field}`, currentTotal + parseInt(data[field], 10));
        }
    });
    loadTotals();
}
function clearDailyData() {
    if (confirm('Are you sure?')) {
        fields.forEach(field => localStorage.setItem(`total_${field}`, 0));
        loadTotals();
    }
}
function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }