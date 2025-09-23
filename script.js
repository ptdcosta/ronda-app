// -------------------------------------------------------------------
// PASTE YOUR GOOGLE APPS SCRIPT URL HERE
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzMzxicSiA6h6vO6N-2b58klstgzhUA8Ca0GmOya6fJE_HaAkLqZSqtHTuCTre_cgUXLw/exec";
// -------------------------------------------------------------------
// PASTE YOUR GOOGLE SHEET URL HERE (for the "Ir para BD" button)
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1yAm_nYTCJ9urDiPv4kp965jwaxV_TSZw1ZyTBkQXsVY/edit?gid=1545989912#gid=1545989912";
// -------------------------------------------------------------------

// --- DOM Elements ---
const form = document.getElementById('entryForm');
const ruaSelect = document.getElementById('ruaSelect');
const dbLink = document.getElementById('dbLink');

// FAB (Floating Action Button) Elements
const fabContainer = document.querySelector('.fab-container');
const fabMain = document.querySelector('.fab-main');
const addRuaBtn = document.getElementById('addRuaBtn');
const newRoundBtn = document.getElementById('newRoundBtn');
const generateReportBtn = document.getElementById('generateReportBtn'); // **NEW**

// Modal Elements
const addRuaModal = document.getElementById('addRuaModal');
const newRuaInput = document.getElementById('newRuaInput');
const modalAddBtn = document.getElementById('modalAddBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');

const fields = ['utentes', 'kit', 'sopa', 'cafe', 'roupa'];
let sessionEntries = {};

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    form.action = SCRIPT_URL;
    loadInitialData();
    setupCounters();
    setupFAB();
    setupModal();
    dbLink.href = SHEET_URL;
});

// --- Event Listeners ---
form.addEventListener('submit', handleFormSubmit);
ruaSelect.addEventListener('change', displayDataForSelectedStreet);
newRoundBtn.addEventListener('click', startNewRound);
generateReportBtn.addEventListener('click', generateReport); // **NEW**

// --- Core Functions ---
function handleFormSubmit(e) {
    const submitButton = e.target.querySelector('.btn-submit');
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="material-symbols-outlined">sync</span> Submitting...';

    setTimeout(() => {
        alert('Data saved successfully!');
        location.reload(); 
    }, 1500);
}

function loadInitialData() {
    ruaSelect.innerHTML = '<option>Loading...</option>';
    fetch(SCRIPT_URL)
        .then(res => res.json())
        .then(data => {
            if (data.ruas) { populateRuaDropdown(data.ruas); }
            if (data.totals) { displayTotals(data.totals); }
            if (data.entries) {
                sessionEntries = data.entries;
                displayDataForSelectedStreet();
            }
        })
        .catch(error => console.error("Error loading initial data:", error));
}

// **NEW FUNCTION TO GENERATE REPORT**
function generateReport() {
    alert('A gerar o relatório em "Sheet4". Isto pode demorar alguns segundos...');
    
    // We add ?action=report to the URL to tell our script what to do
    fetch(`${SCRIPT_URL}?action=report`)
        .then(res => res.json())
        .then(data => {
            if (data.result === 'success') {
                alert('Relatório gerado com sucesso!');
            } else {
                throw new Error(data.message || 'Ocorreu um erro desconhecido.');
            }
        })
        .catch(error => {
            alert(`Erro ao gerar o relatório: ${error.message}`);
        });
}


// --- UI Functions ---
function setupFAB() {
    fabMain.addEventListener('click', () => {
        fabContainer.classList.toggle('active');
    });
}

function setupModal() {
    addRuaBtn.addEventListener('click', () => {
        addRuaModal.style.display = 'flex';
    });
    modalCancelBtn.addEventListener('click', () => {
        addRuaModal.style.display = 'none';
    });
    modalAddBtn.addEventListener('click', () => {
        addNewRua();
        addRuaModal.style.display = 'none';
    });
}

function displayDataForSelectedStreet() {
    const selectedRua = ruaSelect.value;
    const entry = sessionEntries[selectedRua];

    if (entry) {
        fields.forEach(field => {
            document.getElementById(field).value = entry[field] || 0;
        });
    } else {
        fields.forEach(field => document.getElementById(field).value = 0);
    }
}

function displayTotals(totals) {
    document.getElementById('totalUtentes').textContent = totals.utentes || 0;
    document.getElementById('totalKit').textContent = totals.kit || 0;
    document.getElementById('totalSopa').textContent = totals.sopa || 0;
    document.getElementById('totalCafe').textContent = totals.cafe || 0;
    document.getElementById('totalRoupa').textContent = totals.roupa || 0;
}

function populateRuaDropdown(ruas) {
    if (ruas.length > 0) {
        ruaSelect.innerHTML = ruas.map(rua => `<option value="${rua}">${rua}</option>`).join('');
    } else {
        ruaSelect.innerHTML = '<option>Add a stop</option>';
    }
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

// --- Action Functions ---
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
    alert('New stop added successfully!');
}

function startNewRound() {
    if (!confirm('Are you sure you want to archive all data and start a new round?')) {
        return;
    }

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
    
    alert('New round starting... The page will now reload.');
    setTimeout(() => location.reload(), 1500);
}