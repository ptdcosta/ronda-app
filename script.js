// -------------------------------------------------------------------
// PASTE YOUR GOOGLE APPS SCRIPT URL HERE
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzMzxicSiA6h6vO6N-2b58klstgzhUA8Ca0GmOya6fJE_HaAkLqZSqtHTuCTre_cgUXLw/exec";
// -------------------------------------------------------------------
// PASTE YOUR GOOGLE SHEET URL HERE (for the "Ir para BD" button)
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1yAm_nYTCJ9urDiPv4kp965jwaxV_TSZw1ZyTBkQXsVY/edit?gid=1545989912#gid=1545989912";
// -------------------------------------------------------------------

const form = document.getElementById('entryForm');
const ruaSelect = document.getElementById('ruaSelect');
const newRuaInput = document.getElementById('newRuaInput');
const addRuaBtn = document.getElementById('addRuaBtn');
const newRoundBtn = document.getElementById('newRoundBtn');
const dbLink = document.getElementById('dbLink');
const fields = ['utentes', 'kit', 'sopa', 'cafe', 'roupa'];
let sessionEntries = {}; // **NEW**: Variable to hold current entries

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    form.action = SCRIPT_URL;
    loadInitialData();
    setupCounters();
    dbLink.href = SHEET_URL;
});

// Event Listeners
form.addEventListener('submit', handleFormSubmit);
addRuaBtn.addEventListener('click', addNewRua);
newRoundBtn.addEventListener('click', startNewRound);
ruaSelect.addEventListener('change', displayDataForSelectedStreet); // **RE-ADDED**

function handleFormSubmit(e) {
    const submitButton = e.target.querySelector('.btn-submit');
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    setTimeout(() => {
        alert('Data saved successfully!');
        location.reload(); 
    }, 1500);
}

function startNewRound() {
    if (!confirm('Tem a certeza que quer arquivar os dados e começar uma nova ronda?')) {
        return;
    }
    newRoundBtn.disabled = true;
    newRoundBtn.textContent = 'A arquivar...';

    const tempForm = document.createElement('form');
    tempForm.method = 'post';
    tempForm.action = SCRIPT_URL;
    tempForm.target = 'hidden_iframe';
    
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'action';
    hiddenInput.value = 'startNewRound';
    tempForm.appendChild(hiddenInput);
    
    document.body.appendChild(tempForm);
    tempForm.submit();
    
    setTimeout(() => {
        alert('Nova ronda iniciada!');
        location.reload();
    }, 2000);
}

// **UPDATED**: This function now loads streets, totals, AND entries
function loadInitialData() {
    ruaSelect.innerHTML = '<option>A carregar...</option>';
    fetch(SCRIPT_URL)
        .then(res => res.json())
        .then(data => {
            if (data.ruas) {
                populateRuaDropdown(data.ruas);
            }
            if (data.totals) {
                displayTotals(data.totals);
            }
            if (data.entries) {
                sessionEntries = data.entries; // Save entries to memory
                displayDataForSelectedStreet(); // Display data for the initially selected street
            }
        })
        .catch(error => console.error("Error loading initial data:", error));
}

// **NEW**: Displays the data for the currently selected street
function displayDataForSelectedStreet() {
    const selectedRua = ruaSelect.value;
    const entry = sessionEntries[selectedRua];

    if (entry) {
        // If data exists, populate the fields
        document.getElementById('utentes').value = entry.utentes || 0;
        document.getElementById('kit').value = entry.kit || 0;
        document.getElementById('sopa').value = entry.sopa || 0;
        document.getElementById('cafe').value = entry.café || 0; // Note the 'é'
        document.getElementById('roupa').value = entry.roupa || 0;
    } else {
        // Otherwise, reset the fields to zero
        fields.forEach(field => document.getElementById(field).value = 0);
    }
}

function displayTotals(totals) {
    document.getElementById('totalUtentes').textContent = totals.utentes || 0;
    document.getElementById('totalKit').textContent = totals.kit || 0;
    document.getElementById('totalSopa').textContent = totals.sopa || 0;
    document.getElementById('totalCafe').textContent = totals.café || 0;
    document.getElementById('totalRoupa').textContent = totals.roupa || 0;
}

function populateRuaDropdown(ruas) {
    if (ruas.length > 0) {
        ruaSelect.innerHTML = ruas.map(rua => `<option value="${rua}">${rua}</option>`).join('');
    } else {
        ruaSelect.innerHTML = '<option>Adicione uma rua</option>';
    }
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
    alert('Nova rua adicionada!');
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