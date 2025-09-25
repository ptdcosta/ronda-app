const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwzPif3erLNXE9EqvqMrydNn7V3MvRxlS4xh5RupiJiSnql0d5nWtY2R9MEb0jlbebJdg/exec";
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1yAm_nYTCJ9urDiPv4kp965jwaxV_TSZw1ZyTBkQXsVY/edit?gid=1545989912#gid=1545989912";


// --- DOM Elements ---
const form = document.getElementById('entryForm');
const ruaSelect = document.getElementById('ruaSelect');
const dbLink = document.getElementById('dbLink');
const fabContainer = document.querySelector('.fab-container');
const fabMain = document.querySelector('.fab-main');
const addRuaBtn = document.getElementById('addRuaBtn');
const newRoundBtn = document.getElementById('newRoundBtn');
const generateReportBtn = document.getElementById('generateReportBtn');
const emailReportBtn = document.getElementById('emailReportBtn');
const addRuaModal = document.getElementById('addRuaModal');
const newRuaInput = document.getElementById('newRuaInput');
const modalAddBtn = document.getElementById('modalAddBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const hiddenIframe = document.getElementById('hidden_iframe');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
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
generateReportBtn.addEventListener('click', generateReport);
emailReportBtn.addEventListener('click', emailReport);

/**
 * This is the callback function that receives data from the Google Script.
 * @param {object} data The data object returned from the script.
 */
function handleDataResponse(data) {
    if (data.error) {
        console.error("Error from Google Script:", data.error);
        return;
    }
    if (data.ruas) { populateRuaDropdown(data.ruas); }
    if (data.totals) { displayTotals(data.totals); }
    if (data.entries) {
        sessionEntries = data.entries;
        displayDataForSelectedStreet();
    }
    if (data.totalStops !== undefined && data.completedStops !== undefined) {
        updateProgressBar(data.completedStops, data.totalStops);
    }
}

/**
 * Loads the initial data from the Google Script using the JSONP method.
 */
function loadInitialData() {
    ruaSelect.innerHTML = '<option>A carregar...</option>';
    const oldScript = document.getElementById('jsonp_script');
    if (oldScript) {
        oldScript.remove();
    }
    const script = document.createElement('script');
    script.id = 'jsonp_script';
    script.src = `${SCRIPT_URL}?callback=handleDataResponse`; 
    document.head.appendChild(script);
}

/**
 * Handles the main form submission.
 */
function handleFormSubmit(e) {
    e.preventDefault();
    const submitButton = e.target.querySelector('.btn-submit');
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="material-symbols-outlined">sync</span> Submitting...';
    localStorage.setItem('lastSelectedRua', ruaSelect.value);
    hiddenIframe.onload = () => { location.reload(); };
    form.submit();
}

/**
 * Updates the progress bar UI.
 * @param {number} completed The number of completed stops.
 * @param {number} total The total number of stops.
 */
function updateProgressBar(completed, total) {
    if (total === 0) {
        progressText.textContent = "Adicione paragens em Sheet2";
        progressBar.style.width = '0%';
        return;
    }
    const percentage = Math.round((completed / total) * 100);
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${completed} / ${total} Paragens Concluídas (${percentage}%)`;
}

/**
 * Triggers the report generation in the backend.
 */
function generateReport() {
    if (!confirm('Tem a certeza que quer gerar o relatório visível?')) { return; }
    const tempForm = document.createElement('form');
    tempForm.method = 'post';
    tempForm.action = SCRIPT_URL;
    tempForm.target = 'hidden_iframe';
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'action';
    hiddenInput.value = 'generateReport';
    tempForm.appendChild(hiddenInput);
    document.body.appendChild(tempForm);
    tempForm.submit();
    setTimeout(() => document.body.removeChild(tempForm), 500);
    alert('Relatório gerado com sucesso na sua Google Sheet!');
}

/**
 * Triggers the email report generation in the backend.
 */
function emailReport() {
    if (!confirm('Tem a certeza que quer enviar o relatório por email?')) { return; }
    
    const tempForm = document.createElement('form');
    tempForm.method = 'post';
    tempForm.action = SCRIPT_URL;
    tempForm.target = 'hidden_iframe';
    
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'action';
    hiddenInput.value = 'emailReport';
    tempForm.appendChild(hiddenInput);
    
    document.body.appendChild(tempForm);
    tempForm.submit();
    setTimeout(() => document.body.removeChild(tempForm), 500);
    
    alert('A enviar o email... Por favor aguarde.');
}

/**
 * Sets up the Floating Action Button toggle.
 */
function setupFAB() {
    fabMain.addEventListener('click', () => { fabContainer.classList.toggle('active'); });
}

/**
 * Sets up the "Add Stop" modal window.
 */
function setupModal() {
    addRuaBtn.addEventListener('click', () => { addRuaModal.style.display = 'flex'; });
    modalCancelBtn.addEventListener('click', () => { addRuaModal.style.display = 'none'; });
    modalAddBtn.addEventListener('click', () => {
        addNewRua();
        addRuaModal.style.display = 'none';
    });
}

/**
 * Displays the saved data for the currently selected street.
 */
function displayDataForSelectedStreet() {
    const selectedRua = ruaSelect.value;
    const entry = sessionEntries[selectedRua];
    if (entry) {
        fields.forEach(field => { document.getElementById(field).value = entry[field] || 0; });
    } else {
        fields.forEach(field => { document.getElementById(field).value = 0; });
    }
}

/**
 * Displays the overall totals in the footer.
 * @param {object} totals The totals object from the script.
 */
function displayTotals(totals) {
    document.getElementById('totalUtentes').textContent = totals.utentes || 0;
    document.getElementById('totalKit').textContent = totals.kit || 0;
    document.getElementById('totalSopa').textContent = totals.sopa || 0;
    document.getElementById('totalCafe').textContent = totals.cafe || 0;
    document.getElementById('totalRoupa').textContent = totals.roupa || 0;
}

/**
 * Populates the street selection dropdown.
 * @param {string[]} ruas An array of street names.
 */
function populateRuaDropdown(ruas) {
    if (ruas.length > 0) {
        ruaSelect.innerHTML = ruas.map(rua => `<option value="${rua}">${rua}</option>`).join('');
        const lastSelectedRua = localStorage.getItem('lastSelectedRua');
        if (lastSelectedRua && ruas.includes(lastSelectedRua)) {
            ruaSelect.value = lastSelectedRua;
        }
    } else {
        ruaSelect.innerHTML = '<option>Add a stop</option>';
    }
}

/**
 * Sets up the plus/minus counter buttons.
 */
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

/**
 * Adds a new street to the list in Sheet2.
 */
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
    setTimeout(() => document.body.removeChild(tempForm), 500);
    const newOption = document.createElement('option');
    newOption.value = newRua;
    newOption.textContent = newRua;
    ruaSelect.appendChild(newOption);
    ruaSelect.value = newRua;
    newRuaInput.value = '';
    alert('New stop added successfully!');
}

/**
 * Archives the current round and clears the data sheet.
 */
function startNewRound() {
    if (!confirm('Are you sure you want to archive all data and start a new round?')) { return; }
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
    setTimeout(() => document.body.removeChild(tempForm), 500);
    localStorage.removeItem('lastSelectedRua');
    alert('New round starting... The page will now reload.');
    setTimeout(() => location.reload(), 1500);
}